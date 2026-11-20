import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { MOODS, QUIZZES } from './src/data/vibeData';
import type { MoodName, ReactionEmoji } from './src/types';
import {
  checkContentSafety,
  computeTrendingMoods,
  db,
  hashPassword,
  sanitizeConfession,
  sanitizeUser,
  validateAesthetic,
  validateCategory,
  validateMediaAttachment,
  validateProfileTheme,
  verifyPassword,
} from './server/db';

const PORT = 3000;
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(process.cwd() + '_vibecheck_secret_v1').digest('hex');

const VALID_MOOD_NAMES = new Set<string>(MOODS.map((m) => m.name));
const VALID_REACTIONS = new Set<string>(['💜', '😭', '🔥', '💀', '🫶']);

function signToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string | undefined): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { uid?: string };
    return parsed.uid ?? null;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
  }
  return out;
}

function getAuthenticatedUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const uid = verifyToken(authHeader.slice(7).trim());
    if (uid) return uid;
  }
  const cookies = parseCookies(req.headers.cookie);
  return verifyToken(cookies['vc_session']);
}

function getViewerActorId(req: Request): string {
  const authUid = getAuthenticatedUserId(req);
  if (authUid) return authUid;
  const deviceHeader = req.headers['x-vibe-device'];
  if (typeof deviceHeader === 'string' && /^[a-zA-Z0-9_-]{6,64}$/.test(deviceHeader)) {
    return `guest_${deviceHeader}`;
  }
  return 'guest_anon';
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie('vc_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function buildUserFullState(userId: string) {
  const user = db.state.users.find((u) => u.id === userId);
  if (!user) return null;
  const moodHistory = db.state.moodCheckins
    .filter((m) => m.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const savedConfessions = db.state.confessions
    .filter((c) => user.savedConfessionIds.includes(c.id) && c.status !== 'removed')
    .map((c) => sanitizeConfession(c, userId, user.savedConfessionIds));
  const quizResults = db.state.quizResults
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    user: sanitizeUser(user),
    moodHistory,
    savedConfessions,
    quizResults,
  };
}

async function startServer() {
  const app = express();
  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  const MIME_EXT_MAP: Record<string, { ext: string; mediaType: 'image' | 'video'; maxBytes: number }> = {
    'image/png': { ext: 'png', mediaType: 'image', maxBytes: 10 * 1024 * 1024 },
    'image/jpeg': { ext: 'jpg', mediaType: 'image', maxBytes: 10 * 1024 * 1024 },
    'image/jpg': { ext: 'jpg', mediaType: 'image', maxBytes: 10 * 1024 * 1024 },
    'image/webp': { ext: 'webp', mediaType: 'image', maxBytes: 10 * 1024 * 1024 },
    'image/gif': { ext: 'gif', mediaType: 'image', maxBytes: 10 * 1024 * 1024 },
    'video/mp4': { ext: 'mp4', mediaType: 'video', maxBytes: 25 * 1024 * 1024 },
    'video/webm': { ext: 'webm', mediaType: 'video', maxBytes: 25 * 1024 * 1024 },
    'video/quicktime': { ext: 'mov', mediaType: 'video', maxBytes: 25 * 1024 * 1024 },
  };

  app.post(
    '/api/media/upload',
    express.raw({
      type: Object.keys(MIME_EXT_MAP),
      limit: '26mb',
    }),
    (req, res) => {
      const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const spec = MIME_EXT_MAP[contentType];
      if (!spec) {
        res.status(400).json({
          error: 'Unsupported file type. Upload PNG, JPG, WEBP, GIF, MP4, WEBM, or MOV.',
        });
        return;
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: 'Empty file upload.' });
        return;
      }
      if (req.body.length > spec.maxBytes) {
        const mb = Math.round(spec.maxBytes / (1024 * 1024));
        res.status(413).json({
          error: `${spec.mediaType === 'image' ? 'Photos' : 'Videos'} must be ${mb}MB or smaller.`,
        });
        return;
      }
      const filename = `${crypto.randomUUID()}.${spec.ext}`;
      const targetPath = path.join(uploadsDir, filename);
      fs.writeFileSync(targetPath, req.body);
      res.status(201).json({
        url: `/uploads/${filename}`,
        mediaType: spec.mediaType,
      });
    }
  );

  app.use(express.json({ limit: '256kb' }));

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', (req, res) => {
    const { username, displayName, password, bio, avatarPreset, favoriteAesthetic } = req.body ?? {};
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
      res.status(400).json({ error: 'Username must be 3–24 characters (letters, numbers, underscores).' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const cleanUsername = username.trim().toLowerCase();
    if (db.state.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      res.status(409).json({ error: 'That username is already claimed.' });
      return;
    }

    const cleanBio = typeof bio === 'string' ? bio.trim().slice(0, 160) : 'New to VIBE CHECK.';
    if (cleanBio.length >= 6) {
      const safe = checkContentSafety(cleanBio);
      if (!safe.ok) {
        res.status(400).json({ error: safe.reason });
        return;
      }
    }

    const newUser = {
      id: `user_${crypto.randomUUID().slice(0, 10)}`,
      username: cleanUsername,
      displayName:
        typeof displayName === 'string' && displayName.trim().length > 0
          ? displayName.trim().slice(0, 32)
          : cleanUsername,
      bio: cleanBio,
      avatarPreset: typeof avatarPreset === 'string' ? avatarPreset : 'aurora',
      favoriteAesthetic:
        typeof favoriteAesthetic === 'string' && validateAesthetic(favoriteAesthetic)
          ? favoriteAesthetic
          : ('Dreamcore Lavender' as const),
      profileTheme: 'lavender-haze' as const,
      isModerator: false,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
      savedConfessionIds: [],
    };

    db.state.users.push(newUser);
    db.save();

    const token = signToken(newUser.id);
    setSessionCookie(res, token);
    res.status(201).json({ token, ...buildUserFullState(newUser.id) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }
    const user = db.state.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }
    const token = signToken(user.id);
    setSessionCookie(res, token);
    res.json({ token, ...buildUserFullState(user.id) });
  });

  app.post('/api/auth/demo', (_req, res) => {
    const demoUser = db.state.users.find((u) => u.username === 'luna_vibes') ?? db.state.users[0];
    if (!demoUser) {
      res.status(404).json({ error: 'Demo user unavailable.' });
      return;
    }
    const token = signToken(demoUser.id);
    setSessionCookie(res, token);
    res.json({ token, ...buildUserFullState(demoUser.id) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('vc_session', { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    const uid = getAuthenticatedUserId(req);
    if (!uid) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const full = buildUserFullState(uid);
    if (!full) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }
    res.json(full);
  });

  app.patch('/api/auth/profile', (req, res) => {
    const uid = getAuthenticatedUserId(req);
    if (!uid) {
      res.status(401).json({ error: 'Sign in to edit your profile.' });
      return;
    }
    const user = db.state.users.find((u) => u.id === uid);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const { displayName, bio, avatarPreset, avatarUrl, favoriteAesthetic, profileTheme, username } = req.body ?? {};
    if (typeof username === 'string' && username.trim().toLowerCase() !== user.username) {
      const nextUsername = username.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(nextUsername)) {
        res.status(400).json({ error: 'Username must be 3–24 characters (letters, numbers, underscores).' });
        return;
      }
      if (db.state.users.some((u) => u.id !== uid && u.username.toLowerCase() === nextUsername)) {
        res.status(409).json({ error: 'Username already taken.' });
        return;
      }
      user.username = nextUsername;
      db.state.moodCheckins.forEach((mc) => {
        if (mc.userId === uid) mc.username = nextUsername;
      });
    }
    if (typeof displayName === 'string' && displayName.trim().length > 0) {
      user.displayName = displayName.trim().slice(0, 32);
    }
    if (typeof bio === 'string') {
      const trimmed = bio.trim().slice(0, 160);
      if (trimmed.length >= 6) {
        const safe = checkContentSafety(trimmed);
        if (!safe.ok) {
          res.status(400).json({ error: safe.reason });
          return;
        }
      }
      user.bio = trimmed;
    }
    if (typeof avatarPreset === 'string' && avatarPreset.length <= 24) {
      user.avatarPreset = avatarPreset;
    }
    if (avatarUrl === '' || avatarUrl === null) {
      user.avatarUrl = undefined;
    } else if (typeof avatarUrl === 'string' && /^\/uploads\/[a-zA-Z0-9._-]+$/.test(avatarUrl) && !avatarUrl.includes('..')) {
      user.avatarUrl = avatarUrl;
    }
    if (typeof favoriteAesthetic === 'string' && validateAesthetic(favoriteAesthetic)) {
      user.favoriteAesthetic = favoriteAesthetic;
    }
    if (typeof profileTheme === 'string' && validateProfileTheme(profileTheme)) {
      user.profileTheme = profileTheme;
    }

    db.save();
    res.json(buildUserFullState(uid));
  });

  // --- MOODS ROUTES ---
  app.get('/api/moods/trending', (_req, res) => {
    const trending = computeTrendingMoods();
    const recentPulses = db.state.moodCheckins
      .filter((m) => m.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    res.json({
      totalCheckins: db.state.moodCheckins.length,
      trending,
      recentPulses,
    });
  });

  app.post('/api/moods/checkin', (req, res) => {
    const uid = getAuthenticatedUserId(req);
    const user = uid ? db.state.users.find((u) => u.id === uid) : null;
    const { mood, note, isPublic, media } = req.body ?? {};
    if (typeof mood !== 'string' || !VALID_MOOD_NAMES.has(mood)) {
      res.status(400).json({ error: 'Please select a valid mood.' });
      return;
    }
    const cleanNote = typeof note === 'string' ? note.trim().slice(0, 180) : '';
    if (cleanNote.length > 0) {
      if (cleanNote.length >= 6) {
        const safe = checkContentSafety(cleanNote);
        if (!safe.ok) {
          res.status(400).json({ error: safe.reason });
          return;
        }
      }
    }

    const validMedia = validateMediaAttachment(media);

    const checkin = {
      id: `mc_${crypto.randomUUID().slice(0, 10)}`,
      userId: user ? user.id : null,
      username: user ? user.username : 'anonymous',
      mood: mood as MoodName,
      note: cleanNote,
      media: validMedia,
      isPublic: typeof isPublic === 'boolean' ? isPublic : true,
      createdAt: new Date().toISOString(),
    };

    db.state.moodCheckins.unshift(checkin);
    db.save();

    res.status(201).json({
      checkin,
      trending: computeTrendingMoods(),
      totalCheckins: db.state.moodCheckins.length,
    });
  });

  // --- CONFESSIONS ROUTES ---
  app.get('/api/confessions', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const viewerId = getViewerActorId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;
    const savedIds = user?.savedConfessionIds ?? [];

    const category = typeof req.query.category === 'string' ? req.query.category : 'All';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'trending';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const includeFlagged = req.query.includeFlagged === 'true' && user?.isModerator;

    let list = db.state.confessions.filter((c) => {
      if (c.status === 'removed') return false;
      if (c.status === 'flagged' && !includeFlagged) return false;
      if (category !== 'All' && c.category !== category) return false;
      if (q && !c.text.toLowerCase().includes(q) && !c.moodTag.toLowerCase().includes(q)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const scoreA = a.likes + a.comments.length * 3;
      const scoreB = b.likes + b.comments.length * 3;
      return scoreB - scoreA;
    });

    const flaggedCount = db.state.confessions.filter((c) => c.status === 'flagged').length;

    res.json({
      confessions: list.map((c) => sanitizeConfession(c, viewerId, savedIds)),
      flaggedCount,
    });
  });

  app.post('/api/confessions', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const viewerId = getViewerActorId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;

    const { category, moodTag, text, media } = req.body ?? {};
    if (typeof category !== 'string' || !validateCategory(category)) {
      res.status(400).json({ error: 'Choose a valid category.' });
      return;
    }
    const cleanMood: MoodName =
      typeof moodTag === 'string' && VALID_MOOD_NAMES.has(moodTag)
        ? (moodTag as MoodName)
        : 'Chaotic';

    if (typeof text !== 'string') {
      res.status(400).json({ error: 'Confession text is required.' });
      return;
    }

    const safety = checkContentSafety(text);
    if (!safety.ok) {
      res.status(400).json({ error: safety.reason });
      return;
    }

    const validMedia = validateMediaAttachment(media);

    const newConfession = {
      id: `conf_${crypto.randomUUID().slice(0, 10)}`,
      category,
      moodTag: cleanMood,
      text: text.trim(),
      media: validMedia,
      likes: 1,
      likedBy: [viewerId],
      reactions: { '💜': 0, '😭': 0, '🔥': 0, '💀': 0, '🫶': 0 },
      reactionsByUser: { '💜': [], '😭': [], '🔥': [], '💀': [], '🫶': [] },
      comments: [],
      reportCount: 0,
      reports: [],
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    db.state.confessions.unshift(newConfession);
    db.save();

    res.status(201).json({
      confession: sanitizeConfession(newConfession, viewerId, user?.savedConfessionIds ?? []),
    });
  });

  app.post('/api/confessions/:id/like', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const viewerId = getViewerActorId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;

    const conf = db.state.confessions.find((c) => c.id === req.params.id && c.status !== 'removed');
    if (!conf) {
      res.status(404).json({ error: 'Confession not found.' });
      return;
    }
    const idx = conf.likedBy.indexOf(viewerId);
    if (idx >= 0) {
      conf.likedBy.splice(idx, 1);
      conf.likes = Math.max(0, conf.likes - 1);
    } else {
      conf.likedBy.push(viewerId);
      conf.likes += 1;
    }
    db.save();
    res.json({ confession: sanitizeConfession(conf, viewerId, user?.savedConfessionIds ?? []) });
  });

  app.post('/api/confessions/:id/react', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const viewerId = getViewerActorId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;
    const { emoji } = req.body ?? {};

    if (typeof emoji !== 'string' || !VALID_REACTIONS.has(emoji)) {
      res.status(400).json({ error: 'Invalid emoji reaction.' });
      return;
    }

    const conf = db.state.confessions.find((c) => c.id === req.params.id && c.status !== 'removed');
    if (!conf) {
      res.status(404).json({ error: 'Confession not found.' });
      return;
    }

    const reactionKey = emoji as ReactionEmoji;
    const bucket = conf.reactionsByUser[reactionKey] ?? [];
    const idx = bucket.indexOf(viewerId);
    if (idx >= 0) {
      bucket.splice(idx, 1);
      conf.reactions[reactionKey] = Math.max(0, (conf.reactions[reactionKey] ?? 0) - 1);
    } else {
      bucket.push(viewerId);
      conf.reactions[reactionKey] = (conf.reactions[reactionKey] ?? 0) + 1;
    }
    conf.reactionsByUser[reactionKey] = bucket;
    db.save();

    res.json({ confession: sanitizeConfession(conf, viewerId, user?.savedConfessionIds ?? []) });
  });

  app.post('/api/confessions/:id/comments', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const viewerId = getViewerActorId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;
    const { text, anonymous } = req.body ?? {};

    if (typeof text !== 'string') {
      res.status(400).json({ error: 'Comment text is required.' });
      return;
    }
    const safety = checkContentSafety(text);
    if (!safety.ok) {
      res.status(400).json({ error: safety.reason });
      return;
    }

    const conf = db.state.confessions.find((c) => c.id === req.params.id && c.status !== 'removed');
    if (!conf) {
      res.status(404).json({ error: 'Confession not found.' });
      return;
    }

    const anonNum = Math.floor(100 + Math.random() * 899);
    conf.comments.push({
      id: `cm_${crypto.randomUUID().slice(0, 8)}`,
      authorLabel: user && !anonymous ? `@${user.username}` : `Anon #${anonNum}`,
      userId: user ? user.id : null,
      text: text.trim().slice(0, 280),
      createdAt: new Date().toISOString(),
    });
    db.save();

    res.status(201).json({ confession: sanitizeConfession(conf, viewerId, user?.savedConfessionIds ?? []) });
  });

  app.post('/api/confessions/:id/save', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    if (!authUid) {
      res.status(401).json({ error: 'Sign in to save confessions to your profile.' });
      return;
    }
    const user = db.state.users.find((u) => u.id === authUid);
    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }
    const conf = db.state.confessions.find((c) => c.id === req.params.id && c.status !== 'removed');
    if (!conf) {
      res.status(404).json({ error: 'Confession not found.' });
      return;
    }

    const idx = user.savedConfessionIds.indexOf(conf.id);
    if (idx >= 0) {
      user.savedConfessionIds.splice(idx, 1);
    } else {
      user.savedConfessionIds.unshift(conf.id);
    }
    db.save();

    res.json({
      saved: idx < 0,
      confession: sanitizeConfession(conf, authUid, user.savedConfessionIds),
    });
  });

  app.post('/api/confessions/:id/report', (req, res) => {
    const viewerId = getViewerActorId(req);
    const { reason, details } = req.body ?? {};
    const allowedReasons = ['Harassment', 'Harmful Content', 'Spam', 'Personal Info'];
    if (typeof reason !== 'string' || !allowedReasons.includes(reason)) {
      res.status(400).json({ error: 'Choose a valid report reason.' });
      return;
    }
    const conf = db.state.confessions.find((c) => c.id === req.params.id && c.status !== 'removed');
    if (!conf) {
      res.status(404).json({ error: 'Confession not found.' });
      return;
    }
    if (conf.reports.some((r) => r.reporterId === viewerId)) {
      res.status(409).json({ error: 'You already reported this confession.' });
      return;
    }

    conf.reports.push({
      id: `rep_${crypto.randomUUID().slice(0, 8)}`,
      reason: reason as 'Harassment' | 'Harmful Content' | 'Spam' | 'Personal Info',
      details: typeof details === 'string' ? details.trim().slice(0, 200) : '',
      reporterId: viewerId,
      createdAt: new Date().toISOString(),
    });
    conf.reportCount = conf.reports.length;
    // Automatically quarantine at 2 reports for immediate community protection
    if (conf.reportCount >= 2) {
      conf.status = 'flagged';
    }
    db.save();

    res.json({
      ok: true,
      quarantined: conf.status === 'flagged',
      reportCount: conf.reportCount,
    });
  });

  app.post('/api/confessions/:id/moderate', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;
    if (!user || !user.isModerator) {
      res.status(403).json({ error: 'Moderator access required.' });
      return;
    }
    const { action } = req.body ?? {};
    const conf = db.state.confessions.find((c) => c.id === req.params.id);
    if (!conf) {
      res.status(404).json({ error: 'Confession not found.' });
      return;
    }
    if (action === 'approve') {
      conf.status = 'active';
      conf.reports = [];
      conf.reportCount = 0;
    } else if (action === 'remove') {
      conf.status = 'removed';
    } else {
      res.status(400).json({ error: 'Invalid moderation action.' });
      return;
    }
    db.save();
    res.json({ ok: true, status: conf.status });
  });

  // --- QUIZZES ROUTES ---
  app.get('/api/quizzes', (_req, res) => {
    const enriched = QUIZZES.map((quiz) => ({
      ...quiz,
      playsCount: db.state.quizPlays[quiz.id] ?? 0,
    })).sort((a, b) => (b.playsCount ?? 0) - (a.playsCount ?? 0));
    res.json({ quizzes: enriched });
  });

  app.post('/api/quizzes/:id/submit', (req, res) => {
    const quiz = QUIZZES.find((q) => q.id === req.params.id);
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }
    const { answers } = req.body ?? {};
    if (!Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ error: 'Quiz answers are required.' });
      return;
    }

    const tally: Record<string, number> = {};
    for (const outcomeKey of answers) {
      if (typeof outcomeKey === 'string' && quiz.outcomes[outcomeKey]) {
        tally[outcomeKey] = (tally[outcomeKey] ?? 0) + 1;
      }
    }
    const topKey =
      Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? Object.keys(quiz.outcomes)[0];
    const outcome = quiz.outcomes[topKey];

    db.state.quizPlays[quiz.id] = (db.state.quizPlays[quiz.id] ?? 0) + 1;

    const authUid = getAuthenticatedUserId(req);
    let savedResult = null;
    if (authUid) {
      savedResult = {
        id: `qr_${crypto.randomUUID().slice(0, 10)}`,
        userId: authUid,
        quizId: quiz.id,
        quizTitle: quiz.title,
        outcomeKey: outcome.key,
        outcomeTitle: outcome.title,
        outcomeSubtitle: outcome.subtitle,
        shareQuote: outcome.shareQuote,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };
      db.state.quizResults.unshift(savedResult);
    }

    db.save();
    res.json({
      outcome,
      playsCount: db.state.quizPlays[quiz.id],
      savedResult,
    });
  });

  app.post('/api/quizzes/results/:resultId/favorite', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    if (!authUid) {
      res.status(401).json({ error: 'Sign in to favorite quiz results.' });
      return;
    }
    const result = db.state.quizResults.find(
      (r) => r.id === req.params.resultId && r.userId === authUid
    );
    if (!result) {
      res.status(404).json({ error: 'Quiz result not found.' });
      return;
    }
    result.isFavorite = !result.isFavorite;
    db.save();
    res.json({ result });
  });

  // --- DISCOVER & COMMUNITY DISCUSSIONS ---
  app.get('/api/discover', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const viewerId = getViewerActorId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;
    const savedIds = user?.savedConfessionIds ?? [];
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    const discussions = db.state.discussions
      .filter(
        (d) =>
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.prompt.toLowerCase().includes(q) ||
          d.topicTag.toLowerCase().includes(q)
      )
      .sort((a, b) => b.upvotes - a.upvotes)
      .map((d) => ({
        id: d.id,
        topicTag: d.topicTag,
        title: d.title,
        prompt: d.prompt,
        media: d.media,
        authorHandle: d.authorHandle,
        upvotes: d.upvotes,
        upvotedByMe: d.upvotedBy.includes(viewerId),
        replies: d.replies,
        createdAt: d.createdAt,
      }));

    const trendingConfessions = db.state.confessions
      .filter(
        (c) =>
          c.status === 'active' &&
          (!q || c.text.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      )
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6)
      .map((c) => sanitizeConfession(c, viewerId, savedIds));

    const trendingQuizzes = QUIZZES.map((quiz) => ({
      ...quiz,
      playsCount: db.state.quizPlays[quiz.id] ?? 0,
    }))
      .filter(
        (quiz) =>
          !q ||
          quiz.title.toLowerCase().includes(q) ||
          quiz.category.toLowerCase().includes(q)
      )
      .sort((a, b) => (b.playsCount ?? 0) - (a.playsCount ?? 0));

    res.json({
      trendingMoods: computeTrendingMoods(),
      totalMoodCheckins: db.state.moodCheckins.length,
      discussions,
      trendingConfessions,
      trendingQuizzes,
    });
  });

  app.post('/api/discussions', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const viewerId = getViewerActorId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;

    const { topicTag, title, prompt, media } = req.body ?? {};
    if (typeof title !== 'string' || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Title and prompt are required.' });
      return;
    }
    const titleSafe = checkContentSafety(title);
    if (!titleSafe.ok) {
      res.status(400).json({ error: titleSafe.reason });
      return;
    }
    const promptSafe = checkContentSafety(prompt);
    if (!promptSafe.ok) {
      res.status(400).json({ error: promptSafe.reason });
      return;
    }

    const validMedia = validateMediaAttachment(media);

    const discussion = {
      id: `disc_${crypto.randomUUID().slice(0, 10)}`,
      topicTag: typeof topicTag === 'string' && topicTag.trim() ? topicTag.trim().slice(0, 28) : 'Open Mic',
      title: title.trim().slice(0, 140),
      prompt: prompt.trim().slice(0, 280),
      media: validMedia,
      authorHandle: user ? `@${user.username}` : '@guest_vibe',
      upvotes: 1,
      upvotedBy: [viewerId],
      replies: [],
      createdAt: new Date().toISOString(),
    };
    db.state.discussions.unshift(discussion);
    db.save();

    res.status(201).json({
      discussion: {
        ...discussion,
        upvotedByMe: true,
      },
    });
  });

  app.post('/api/discussions/:id/upvote', (req, res) => {
    const viewerId = getViewerActorId(req);
    const disc = db.state.discussions.find((d) => d.id === req.params.id);
    if (!disc) {
      res.status(404).json({ error: 'Discussion not found.' });
      return;
    }
    const idx = disc.upvotedBy.indexOf(viewerId);
    if (idx >= 0) {
      disc.upvotedBy.splice(idx, 1);
      disc.upvotes = Math.max(0, disc.upvotes - 1);
    } else {
      disc.upvotedBy.push(viewerId);
      disc.upvotes += 1;
    }
    db.save();
    res.json({ upvotes: disc.upvotes, upvotedByMe: idx < 0 });
  });

  app.post('/api/discussions/:id/reply', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const user = authUid ? db.state.users.find((u) => u.id === authUid) : null;
    const { text } = req.body ?? {};
    if (typeof text !== 'string') {
      res.status(400).json({ error: 'Reply text is required.' });
      return;
    }
    const safe = checkContentSafety(text);
    if (!safe.ok) {
      res.status(400).json({ error: safe.reason });
      return;
    }
    const disc = db.state.discussions.find((d) => d.id === req.params.id);
    if (!disc) {
      res.status(404).json({ error: 'Discussion not found.' });
      return;
    }
    const reply = {
      id: `dr_${crypto.randomUUID().slice(0, 8)}`,
      authorHandle: user ? `@${user.username}` : `@anon_${Math.floor(100 + Math.random() * 899)}`,
      avatarPreset: user?.avatarPreset ?? 'sky',
      text: text.trim().slice(0, 240),
      createdAt: new Date().toISOString(),
    };
    disc.replies.push(reply);
    db.save();
    res.status(201).json({ reply });
  });

  // --- MONTHLY VIBE WRAPPED ---
  app.get('/api/wrapped', (req, res) => {
    const authUid = getAuthenticatedUserId(req);
    const targetUser = authUid
      ? db.state.users.find((u) => u.id === authUid)
      : db.state.users.find((u) => u.username === 'luna_vibes') ?? db.state.users[0];

    const isPreview = !authUid;
    const checkins = targetUser
      ? db.state.moodCheckins.filter((m) => m.userId === targetUser.id)
      : db.state.moodCheckins;

    const effectiveCheckins = checkins.length > 0 ? checkins : db.state.moodCheckins;

    const counts = new Map<MoodName, number>();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    for (const c of effectiveCheckins) {
      counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
      const dayLabel = dayNames[new Date(c.createdAt).getDay()] ?? 'Mon';
      dayCounts[dayLabel] = (dayCounts[dayLabel] ?? 0) + 1;
    }

    const total = effectiveCheckins.length || 1;
    const moodBreakdown = Array.from(counts.entries())
      .map(([mood, count]) => ({
        mood,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const topMood = moodBreakdown[0]?.mood ?? 'Main Character Energy';
    const topMoodPercent = moodBreakdown[0]?.percent ?? 100;

    const personalityByMood: Record<MoodName, { title: string; desc: string }> = {
      Happy: {
        title: 'Solar-Powered Curator',
        desc: 'You turned ordinary weekdays into shared serotonin for everyone around you.',
      },
      Romantic: {
        title: 'Velvet Daydreamer',
        desc: 'Your month felt like a 35mm montage scored by late-night indie ballads.',
      },
      Delusional: {
        title: 'Vision-Board Alchemist',
        desc: 'You manifested boldly, romanticized small wins, and stayed allergic to cynicism.',
      },
      Productive: {
        title: 'Deep-Flow Architect',
        desc: 'Calm focus, clean momentum, and quiet pride in crossing things off your list.',
      },
      Lonely: {
        title: 'Midnight Stargazer',
        desc: 'A reflective month full of honest check-ins, quiet nights, and gentle self-knowledge.',
      },
      Chaotic: {
        title: 'Plot-Twist Dynamo',
        desc: 'Zero filler days. You kept everyone guessing and turned detours into lore.',
      },
      Unbothered: {
        title: 'Noise-Cancelling Icon',
        desc: 'You protected your peace ruthlessly and let drama scroll right past.',
      },
      Overthinking: {
        title: 'Deep-Dive Analyst',
        desc: 'Forty-seven open thoughts, massive empathy, and sharp emotional intuition.',
      },
      'Main Character Energy': {
        title: 'Headphone Cinema Lead',
        desc: 'You walked through this month with opening-credits energy and unstoppable presence.',
      },
      'Mentally on Vacation': {
        title: 'Perpetual Sunset Escape',
        desc: 'Body at your desk, spirit parked near salt water with an iced drink.',
      },
    };

    const vibeInfo = personalityByMood[topMood];
    const userQuizResults = targetUser
      ? db.state.quizResults.filter((r) => r.userId === targetUser.id)
      : [];
    const favoriteQuizResults = userQuizResults.filter((r) => r.isFavorite);
    const displayQuizResults =
      favoriteQuizResults.length > 0 ? favoriteQuizResults : userQuizResults.slice(0, 2);

    const mostActiveDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      count: dayCounts[day] ?? 0,
    }));
    const busiestDay = [...mostActiveDays].sort((a, b) => b.count - a.count)[0]?.day ?? 'Fri';

    const uniqueDays = new Set(
      effectiveCheckins.map((c) => new Date(c.createdAt).toISOString().slice(0, 10))
    ).size;

    const highlights = [
      `Checked in ${effectiveCheckins.length} times across ${uniqueDays} distinct days`,
      `${topMood} led your aura at ${topMoodPercent}% of your check-ins`,
      `${busiestDay}s were your peak vibe check-in day`,
      displayQuizResults[0]
        ? `Top quiz match: ${displayQuizResults[0].outcomeTitle}`
        : 'Ready for your first personality quiz badge',
    ];

    const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    res.json({
      monthLabel,
      handle: targetUser ? `@${targetUser.username}` : '@you',
      isPreview,
      totalCheckins: checkins.length,
      streakDays: Math.min(uniqueDays, 14),
      topMood,
      topMoodPercent,
      moodBreakdown,
      vibePersonality: vibeInfo.title,
      vibePersonalityDescription: vibeInfo.desc,
      mostActiveDays,
      favoriteQuizResults: displayQuizResults,
      highlights,
    });
  });

  // Vite middleware in development, static dist in production
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIBE CHECK server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VIBE CHECK server:', err);
  process.exit(1);
});
