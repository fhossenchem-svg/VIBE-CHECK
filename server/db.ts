import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AestheticId,
  CommunityDiscussion,
  Confession,
  ConfessionCategory,
  ConfessionReport,
  MediaAttachment,
  MoodCheckin,
  MoodName,
  ProfileThemeId,
  ReactionEmoji,
  SavedQuizResult,
  UserProfile,
} from '../src/types';

export interface StoredUser extends UserProfile {
  passwordHash: string;
  savedConfessionIds: string[];
}

export interface StoredConfession extends Omit<Confession, 'likedByMe' | 'savedByMe' | 'myReactions'> {
  likedBy: string[];
  reactionsByUser: Record<ReactionEmoji, string[]>;
  reports: ConfessionReport[];
}

export interface StoredDiscussion extends Omit<CommunityDiscussion, 'upvotedByMe'> {
  upvotedBy: string[];
}

export interface DatabaseSchema {
  users: StoredUser[];
  moodCheckins: MoodCheckin[];
  confessions: StoredConfession[];
  quizResults: (SavedQuizResult & { userId: string })[];
  quizPlays: Record<string, number>;
  discussions: StoredDiscussion[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'vibecheck-db.json');

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function daysAgoIso(daysAgo: number, hourOffset = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hourOffset, Math.floor(Math.random() * 50), 0, 0);
  return d.toISOString();
}

function createInitialSeed(): DatabaseSchema {
  const lunaId = 'user_luna_demo';
  const kaiId = 'user_kai_demo';

  const users: StoredUser[] = [
    {
      id: lunaId,
      username: 'luna_vibes',
      displayName: 'Luna',
      bio: 'Curating 2AM playlists, iced oat lattes, and mild delusions.',
      avatarPreset: 'aurora',
      favoriteAesthetic: 'Dreamcore Lavender',
      profileTheme: 'lavender-haze',
      isModerator: true,
      createdAt: daysAgoIso(45),
      passwordHash: hashPassword('vibecheck'),
      savedConfessionIds: ['conf_1', 'conf_3'],
    },
    {
      id: kaiId,
      username: 'kai_orbit',
      displayName: 'Kai',
      bio: 'Film grain enthusiast & certified overthinker.',
      avatarPreset: 'sky',
      favoriteAesthetic: 'Indie Main Character',
      profileTheme: 'midnight-sky',
      isModerator: false,
      createdAt: daysAgoIso(30),
      passwordHash: hashPassword('vibecheck'),
      savedConfessionIds: ['conf_2'],
    },
  ];

  const moodCheckins: MoodCheckin[] = [
    {
      id: 'mc_1',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Main Character Energy',
      note: 'Crosswalk beat drop hit right when my iced matcha arrived.',
      isPublic: true,
      createdAt: daysAgoIso(0, 10),
    },
    {
      id: 'mc_2',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Delusional',
      note: 'Convinced myself I can finish three creative projects before Friday.',
      isPublic: true,
      createdAt: daysAgoIso(1, 16),
    },
    {
      id: 'mc_3',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Romantic',
      note: 'Pink sky over the train tracks made me miss someone I have not met yet.',
      isPublic: true,
      createdAt: daysAgoIso(2, 18),
    },
    {
      id: 'mc_4',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Main Character Energy',
      note: 'Wearing oversized headphones in the rain.',
      isPublic: true,
      createdAt: daysAgoIso(3, 13),
    },
    {
      id: 'mc_5',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Productive',
      note: 'Inbox at zero for the first time since September.',
      isPublic: true,
      createdAt: daysAgoIso(5, 11),
    },
    {
      id: 'mc_6',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Overthinking',
      note: 'Did they mean "sounds good" or "sounds good."?',
      isPublic: true,
      createdAt: daysAgoIso(7, 22),
    },
    {
      id: 'mc_7',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Happy',
      note: 'Unexpected voice note from an old friend.',
      isPublic: true,
      createdAt: daysAgoIso(9, 15),
    },
    {
      id: 'mc_8',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Mentally on Vacation',
      note: 'Looking at coastal Italy flights during lecture.',
      isPublic: true,
      createdAt: daysAgoIso(11, 12),
    },
    {
      id: 'mc_9',
      userId: lunaId,
      username: 'luna_vibes',
      mood: 'Main Character Energy',
      note: 'Friday evening gallery walk solo.',
      isPublic: true,
      createdAt: daysAgoIso(14, 19),
    },
    {
      id: 'mc_10',
      userId: kaiId,
      username: 'kai_orbit',
      mood: 'Chaotic',
      note: 'Booked concert tickets for a Tuesday in another city.',
      isPublic: true,
      createdAt: daysAgoIso(0, 11),
    },
    {
      id: 'mc_11',
      userId: null,
      username: 'anonymous',
      mood: 'Unbothered',
      note: 'Deleted three group chats and my skin cleared up.',
      isPublic: true,
      createdAt: daysAgoIso(0, 9),
    },
    {
      id: 'mc_12',
      userId: null,
      username: 'anonymous',
      mood: 'Delusional',
      note: 'Starting a whole new hobby at 1:30 AM.',
      isPublic: true,
      createdAt: daysAgoIso(1, 20),
    },
    {
      id: 'mc_13',
      userId: null,
      username: 'anonymous',
      mood: 'Lonely',
      note: 'Quiet dorm room energy tonight, listening to vinyl.',
      isPublic: true,
      createdAt: daysAgoIso(1, 23),
    },
  ];

  const emptyReactions = (): Record<ReactionEmoji, number> => ({
    '💜': 0,
    '😭': 0,
    '🔥': 0,
    '💀': 0,
    '🫶': 0,
  });

  const emptyReactionsByUser = (): Record<ReactionEmoji, string[]> => ({
    '💜': [],
    '😭': [],
    '🔥': [],
    '💀': [],
    '🫶': [],
  });

  const confessions: StoredConfession[] = [
    {
      id: 'conf_1',
      category: 'Love',
      moodTag: 'Delusional',
      text: 'I still check whether they listened to the playlist I made six months ago because I secretly slip one new song in every Sunday.',
      likes: 142,
      likedBy: [kaiId],
      reactions: { ...emptyReactions(), '💜': 48, '😭': 61, '🫶': 29, '🔥': 8, '💀': 12 },
      reactionsByUser: { ...emptyReactionsByUser(), '😭': [lunaId] },
      comments: [
        {
          id: 'cm_1',
          authorLabel: 'Anon #402',
          userId: null,
          text: 'This is peak modern romance honestly.',
          createdAt: daysAgoIso(0, 12),
        },
        {
          id: 'cm_2',
          authorLabel: 'Anon #119',
          userId: null,
          text: 'Wait do playlists show recently added dates? Asking for a friend.',
          createdAt: daysAgoIso(0, 13),
        },
      ],
      reportCount: 0,
      reports: [],
      status: 'active',
      createdAt: daysAgoIso(0, 8),
    },
    {
      id: 'conf_2',
      category: 'School',
      moodTag: 'Chaotic',
      text: 'Submitted my 12-page capstone paper 14 seconds before midnight and immediately rewarded myself with cereal in a mixing bowl.',
      likes: 218,
      likedBy: [lunaId],
      reactions: { ...emptyReactions(), '💀': 94, '🔥': 71, '🫶': 18, '💜': 11, '😭': 24 },
      reactionsByUser: { ...emptyReactionsByUser(), '🔥': [lunaId] },
      comments: [
        {
          id: 'cm_3',
          authorLabel: 'Anon #882',
          userId: null,
          text: 'Mixing bowl cereal tastes 40% better after surviving a deadline.',
          createdAt: daysAgoIso(0, 10),
        },
      ],
      reportCount: 0,
      reports: [],
      status: 'active',
      createdAt: daysAgoIso(1, 23),
    },
    {
      id: 'conf_3',
      category: 'Friendship',
      moodTag: 'Happy',
      text: 'My best friend and I have an unspoken agreement where neither of us apologizes for replying 4 days late, we just pick up mid-sentence.',
      likes: 304,
      likedBy: [lunaId, kaiId],
      reactions: { ...emptyReactions(), '🫶': 132, '💜': 89, '🔥': 22, '😭': 14, '💀': 5 },
      reactionsByUser: { ...emptyReactionsByUser(), '🫶': [lunaId] },
      comments: [
        {
          id: 'cm_4',
          authorLabel: 'Anon #214',
          userId: null,
          text: 'Low-maintenance high-love friendships are the real flex.',
          createdAt: daysAgoIso(1, 14),
        },
      ],
      reportCount: 0,
      reports: [],
      status: 'active',
      createdAt: daysAgoIso(2, 15),
    },
    {
      id: 'conf_4',
      category: 'Life',
      moodTag: 'Overthinking',
      text: 'I rehearse ordering coffee in my head three times in line and still somehow say "you too" when the barista says enjoy your drink.',
      likes: 187,
      likedBy: [],
      reactions: { ...emptyReactions(), '😭': 88, '💀': 74, '💜': 19, '🫶': 16, '🔥': 4 },
      reactionsByUser: emptyReactionsByUser(),
      comments: [],
      reportCount: 0,
      reports: [],
      status: 'active',
      createdAt: daysAgoIso(2, 9),
    },
    {
      id: 'conf_5',
      category: 'Random',
      moodTag: 'Mentally on Vacation',
      text: 'Sometimes I put my phone on Do Not Disturb, light a candle, and pretend I live in a coastal studio apartment with zero emails.',
      likes: 164,
      likedBy: [],
      reactions: { ...emptyReactions(), '💜': 64, '🫶': 42, '🔥': 25, '😭': 9, '💀': 6 },
      reactionsByUser: emptyReactionsByUser(),
      comments: [],
      reportCount: 0,
      reports: [],
      status: 'active',
      createdAt: daysAgoIso(3, 17),
    },
    {
      id: 'conf_6',
      category: 'Love',
      moodTag: 'Romantic',
      text: 'We locked eyes on the subway twice and I spent the rest of the ride wondering if they liked my jacket.',
      likes: 96,
      likedBy: [],
      reactions: { ...emptyReactions(), '💜': 41, '🫶': 28, '😭': 19, '🔥': 7, '💀': 3 },
      reactionsByUser: emptyReactionsByUser(),
      comments: [],
      reportCount: 0,
      reports: [],
      status: 'active',
      createdAt: daysAgoIso(4, 18),
    },
  ];

  const quizResults: (SavedQuizResult & { userId: string })[] = [
    {
      id: 'qr_1',
      userId: lunaId,
      quizId: 'main-character',
      quizTitle: 'What is your main character energy?',
      outcomeKey: 'indie',
      outcomeTitle: 'A24 Coming-of-Age Lead',
      outcomeSubtitle: 'Golden hour shadows and effortless depth.',
      shareQuote: 'Currently starring in an A24 coming-of-age film with elite lighting.',
      isFavorite: true,
      createdAt: daysAgoIso(6, 17),
    },
    {
      id: 'qr_2',
      userId: lunaId,
      quizId: 'aesthetic-match',
      quizTitle: 'What aesthetic represents you?',
      outcomeKey: 'dreamcore',
      outcomeTitle: 'Dreamcore Lavender',
      outcomeSubtitle: 'Poetic haze, twilight skies, soft optimism.',
      shareQuote: 'My aesthetic: Dreamcore Lavender—twilight skies & soft prisms.',
      isFavorite: true,
      createdAt: daysAgoIso(12, 20),
    },
    {
      id: 'qr_3',
      userId: lunaId,
      quizId: 'red-flag',
      quizTitle: 'Which red flag are you?',
      outcomeKey: 'delulu',
      outcomeTitle: 'The Hopeless Delulu Optimist',
      outcomeSubtitle: 'One eye-contact glance = cinematic trilogy.',
      shareQuote: 'My red flag is turning one polite smile into a three-season arc.',
      isFavorite: false,
      createdAt: daysAgoIso(18, 15),
    },
  ];

  const quizPlays: Record<string, number> = {
    'red-flag': 1420,
    'main-character': 1185,
    'fictional-character': 890,
    'relationship-personality': 965,
    'brain-chaos': 1310,
    'aesthetic-match': 1042,
  };

  const discussions: StoredDiscussion[] = [
    {
      id: 'disc_1',
      topicTag: 'Internet Culture',
      title: 'Why does going offline for 24 hours feel like a full spa weekend?',
      prompt: 'Dropped my phone in a drawer all Sunday and came back feeling like a different species.',
      authorHandle: '@kai_orbit',
      upvotes: 84,
      upvotedBy: [lunaId],
      replies: [
        {
          id: 'dr_1',
          authorHandle: '@luna_vibes',
          avatarPreset: 'aurora',
          text: 'Grayscale mode after 9 PM changed my whole brain chemistry.',
          createdAt: daysAgoIso(0, 11),
        },
        {
          id: 'dr_2',
          authorHandle: '@milo_fm',
          avatarPreset: 'violet',
          text: 'Sunday walks without checking notifications once > everything.',
          createdAt: daysAgoIso(0, 12),
        },
      ],
      createdAt: daysAgoIso(1, 10),
    },
    {
      id: 'disc_2',
      topicTag: 'Playlists',
      title: 'Drop the one song that immediately puts you in Main Character mode',
      prompt: 'Bonus points if it hits differently on a rainy bus window.',
      authorHandle: '@luna_vibes',
      upvotes: 112,
      upvotedBy: [kaiId],
      replies: [
        {
          id: 'dr_3',
          authorHandle: '@nova_tape',
          avatarPreset: 'rose',
          text: 'Anything with warm synth bass and a chorus that opens up at 1:15.',
          createdAt: daysAgoIso(1, 19),
        },
      ],
      createdAt: daysAgoIso(2, 16),
    },
    {
      id: 'disc_3',
      topicTag: 'Campus & Work',
      title: 'Romanticizing boring Tuesday errands actually works—here is proof',
      prompt: 'Put on headphones, bring an iced drink, treat the grocery aisle like a film set.',
      authorHandle: '@solaris_mae',
      upvotes: 67,
      upvotedBy: [],
      replies: [],
      createdAt: daysAgoIso(3, 14),
    },
  ];

  return {
    users,
    moodCheckins,
    confessions,
    quizResults,
    quizPlays,
    discussions,
  };
}

class VibeDatabase {
  private data: DatabaseSchema;
  private writePending = false;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw) as DatabaseSchema;
      } catch {
        this.data = createInitialSeed();
        this.persistSync();
      }
    } else {
      this.data = createInitialSeed();
      this.persistSync();
    }
  }

  public get state(): DatabaseSchema {
    return this.data;
  }

  public persistSync(): void {
    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_PATH);
  }

  public save(): void {
    if (this.writePending) return;
    this.writePending = true;
    queueMicrotask(() => {
      try {
        this.persistSync();
      } finally {
        this.writePending = false;
      }
    });
  }
}

export const db = new VibeDatabase();

const BLOCKED_TERMS = [
  'kill yourself',
  'kys',
  'go die',
  'doxx',
  'slur_placeholder',
  'hate you die',
  'bomb threat',
  'self harm',
  'hurt yourself',
];

const PII_REGEX = /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/i;

export function checkContentSafety(text: string): { ok: true } | { ok: false; reason: string } {
  const normalized = text.trim().toLowerCase();
  if (normalized.length < 6) {
    return { ok: false, reason: 'Please write at least 6 characters so your thought lands clearly.' };
  }
  if (normalized.length > 500) {
    return { ok: false, reason: 'Keep it under 500 characters.' };
  }
  for (const term of BLOCKED_TERMS) {
    if (normalized.includes(term)) {
      return {
        ok: false,
        reason: 'Your message triggered our harassment & safety filter. Keep VIBE CHECK kind and safe.',
      };
    }
  }
  if (PII_REGEX.test(text)) {
    return {
      ok: false,
      reason: 'Do not post phone numbers, email addresses, or personal contact info.',
    };
  }
  return { ok: true };
}

export function sanitizeUser(user: StoredUser): UserProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarPreset: user.avatarPreset,
    avatarUrl: user.avatarUrl,
    favoriteAesthetic: user.favoriteAesthetic,
    profileTheme: user.profileTheme,
    isModerator: user.isModerator,
    createdAt: user.createdAt,
  };
}

export function sanitizeConfession(
  c: StoredConfession,
  viewerId: string | null,
  savedIds: string[]
): Confession {
  const myReactions: ReactionEmoji[] = [];
  if (viewerId) {
    (Object.keys(c.reactionsByUser) as ReactionEmoji[]).forEach((emoji) => {
      if (c.reactionsByUser[emoji]?.includes(viewerId)) {
        myReactions.push(emoji);
      }
    });
  }
  return {
    id: c.id,
    category: c.category,
    moodTag: c.moodTag,
    text: c.text,
    media: c.media,
    likes: c.likes,
    likedByMe: viewerId ? c.likedBy.includes(viewerId) : false,
    savedByMe: savedIds.includes(c.id),
    reactions: c.reactions,
    myReactions,
    comments: c.comments,
    reportCount: c.reportCount,
    status: c.status,
    createdAt: c.createdAt,
  };
}

export function computeTrendingMoods(): { mood: MoodName; count: number; percent: number }[] {
  const counts = new Map<MoodName, number>();
  for (const checkin of db.state.moodCheckins) {
    counts.set(checkin.mood, (counts.get(checkin.mood) ?? 0) + 1);
  }
  const total = db.state.moodCheckins.length || 1;
  return Array.from(counts.entries())
    .map(([mood, count]) => ({
      mood,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function validateCategory(cat: string): cat is ConfessionCategory {
  return ['Love', 'Friendship', 'School', 'Life', 'Random'].includes(cat);
}

export function validateAesthetic(val: string): val is AestheticId {
  return [
    'Dreamcore Lavender',
    'Indie Main Character',
    'Y2K Cyber Pop',
    'Soft Minimalist',
    'Midnight Coquette',
    'Solaris Clean',
  ].includes(val);
}

export function validateProfileTheme(val: string): val is ProfileThemeId {
  return ['lavender-haze', 'electric-violet', 'bubblegum-pop', 'midnight-sky'].includes(val);
}

export function validateMediaAttachment(raw: unknown): MediaAttachment | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const candidate = raw as { url?: unknown; mediaType?: unknown };
  if (typeof candidate.url !== 'string') return undefined;
  const url = candidate.url.trim();
  if (!/^\/uploads\/[a-zA-Z0-9._-]+$/.test(url) || url.includes('..')) {
    return undefined;
  }
  if (candidate.mediaType !== 'image' && candidate.mediaType !== 'video') {
    return undefined;
  }
  return { url, mediaType: candidate.mediaType };
}
