import { MOODS, QUIZZES } from '../data/vibeData';
import type {
  AestheticId,
  CommunityDiscussion,
  Confession,
  ConfessionCategory,
  MediaAttachment,
  MoodCheckin,
  MoodName,
  ProfileThemeId,
  ReactionEmoji,
  SavedQuizResult,
  TrendingMoodStat,
  UserFullState,
  UserProfile,
  WrappedSummary,
} from '../types';

const STORE_KEY = 'vibecheck_static_store_v1';

interface StaticUser extends UserProfile {
  savedConfessionIds: string[];
}

interface StaticStore {
  users: StaticUser[];
  activeUserId: string | null;
  moodCheckins: MoodCheckin[];
  confessions: (Confession & { likedByGuest?: boolean })[];
  quizResults: (SavedQuizResult & { userId: string })[];
  quizPlays: Record<string, number>;
  discussions: CommunityDiscussion[];
}

function daysAgoIso(daysAgo: number, hourOffset = 14): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hourOffset, 15, 0, 0);
  return d.toISOString();
}

function createInitialStaticStore(): StaticStore {
  const lunaId = 'user_luna_demo';
  const users: StaticUser[] = [
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
      savedConfessionIds: ['conf_1', 'conf_3'],
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
      userId: null,
      username: 'anonymous',
      mood: 'Unbothered',
      note: 'Deleted three group chats and my skin cleared up.',
      isPublic: true,
      createdAt: daysAgoIso(0, 9),
    },
    {
      id: 'mc_9',
      userId: null,
      username: 'anonymous',
      mood: 'Chaotic',
      note: 'Booked concert tickets for a Tuesday in another city.',
      isPublic: true,
      createdAt: daysAgoIso(1, 20),
    },
  ];

  const confessions: Confession[] = [
    {
      id: 'conf_1',
      category: 'Love',
      moodTag: 'Delusional',
      text: 'I still check whether they listened to the playlist I made six months ago because I secretly slip one new song in every Sunday.',
      likes: 142,
      reactions: { '💜': 48, '😭': 61, '🔥': 8, '💀': 12, '🫶': 29 },
      myReactions: [],
      comments: [
        {
          id: 'cm_1',
          authorLabel: 'Anon #402',
          userId: null,
          text: 'Quietly adding tracks every Sunday is peak modern romance.',
          createdAt: daysAgoIso(0, 11),
        },
      ],
      reportCount: 0,
      status: 'active',
      createdAt: daysAgoIso(0, 9),
    },
    {
      id: 'conf_2',
      category: 'Friendship',
      moodTag: 'Overthinking',
      text: 'Sometimes I mute the main group chat for 48 hours not because I am mad, just because keeping up with 200 messages feels like a second job.',
      likes: 218,
      reactions: { '💜': 52, '😭': 41, '🔥': 24, '💀': 19, '🫶': 77 },
      myReactions: [],
      comments: [
        {
          id: 'cm_2',
          authorLabel: '@luna_vibes',
          userId: lunaId,
          text: 'Real friends respect airplane-mode weekends.',
          createdAt: daysAgoIso(1, 14),
        },
      ],
      reportCount: 0,
      status: 'active',
      createdAt: daysAgoIso(1, 12),
    },
    {
      id: 'conf_3',
      category: 'School',
      moodTag: 'Chaotic',
      text: 'I convinced my entire study table that I had everything under control while actively googling what chapter the midterm even covered.',
      likes: 304,
      reactions: { '💜': 19, '😭': 88, '🔥': 31, '💀': 145, '🫶': 12 },
      myReactions: [],
      comments: [],
      reportCount: 0,
      status: 'active',
      createdAt: daysAgoIso(1, 18),
    },
    {
      id: 'conf_4',
      category: 'Life',
      moodTag: 'Unbothered',
      text: 'Buying myself flowers every Monday morning did more for my mental clarity than any productivity app ever could.',
      likes: 189,
      reactions: { '💜': 94, '😭': 12, '🔥': 17, '💀': 3, '🫶': 63 },
      myReactions: [],
      comments: [],
      reportCount: 0,
      status: 'active',
      createdAt: daysAgoIso(2, 10),
    },
    {
      id: 'conf_5',
      category: 'Random',
      moodTag: 'Main Character Energy',
      text: 'I time my walk across campus crosswalks so the chorus hits right as the light turns green. Nobody knows I am directing a music video.',
      likes: 267,
      reactions: { '💜': 74, '😭': 15, '🔥': 91, '💀': 28, '🫶': 44 },
      myReactions: [],
      comments: [],
      reportCount: 0,
      status: 'active',
      createdAt: daysAgoIso(2, 16),
    },
  ];

  const quizResults: (SavedQuizResult & { userId: string })[] = [
    {
      id: 'qr_1',
      userId: lunaId,
      quizId: 'aesthetic-match',
      quizTitle: 'What aesthetic represents you?',
      outcomeKey: 'dreamcore',
      outcomeTitle: 'Dreamcore Lavender',
      outcomeSubtitle: 'Poetic haze, twilight skies, soft optimism.',
      shareQuote: 'My aesthetic: Dreamcore Lavender—twilight skies & soft prisms.',
      isFavorite: true,
      createdAt: daysAgoIso(4),
    },
    {
      id: 'qr_2',
      userId: lunaId,
      quizId: 'red-flag',
      quizTitle: 'Which red flag are you?',
      outcomeKey: 'delulu',
      outcomeTitle: 'The Hopeless Delulu Optimist',
      outcomeSubtitle: 'One eye-contact glance = cinematic trilogy.',
      shareQuote: 'My red flag is turning one polite smile into a three-season arc.',
      isFavorite: true,
      createdAt: daysAgoIso(8),
    },
  ];

  const quizPlays: Record<string, number> = {
    'red-flag': 1842,
    'main-character': 1530,
    'fictional-character': 1219,
    'relationship-personality': 986,
    'brain-chaos': 1674,
    'aesthetic-match': 1420,
  };

  const discussions: CommunityDiscussion[] = [
    {
      id: 'disc_1',
      topicTag: 'Internet Culture',
      title: 'What tiny habit immediately upgrades your whole week?',
      prompt: 'Mine is leaving my phone outside the bedroom until coffee is brewed.',
      authorHandle: '@luna_vibes',
      upvotes: 64,
      replies: [
        {
          id: 'rep_1',
          authorHandle: '@kai_orbit',
          avatarPreset: 'sky',
          text: '20-minute golden hour walk without checking notifications.',
          createdAt: daysAgoIso(0, 14),
        },
      ],
      createdAt: daysAgoIso(1, 10),
    },
    {
      id: 'disc_2',
      topicTag: 'Playlists',
      title: 'Songs that make a grocery run feel like an A24 movie',
      prompt: 'Drop the tracks you play when walking down the cereal aisle with headphones.',
      authorHandle: '@kai_orbit',
      upvotes: 51,
      replies: [],
      createdAt: daysAgoIso(2, 15),
    },
    {
      id: 'disc_3',
      topicTag: 'Hot Take',
      title: 'Leaving texts on delivered for 6 hours is self-care, not disrespect',
      prompt: 'We were never meant to be reachable 24/7. Agree or disagree?',
      authorHandle: '@soft_static',
      upvotes: 93,
      replies: [],
      createdAt: daysAgoIso(3, 19),
    },
  ];

  return {
    users,
    activeUserId: null,
    moodCheckins,
    confessions,
    quizResults,
    quizPlays,
    discussions,
  };
}

function loadStore(): StaticStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      return JSON.parse(raw) as StaticStore;
    }
  } catch {
    // ignore storage parse failure
  }
  const initial = createInitialStaticStore();
  saveStore(initial);
  return initial;
}

function saveStore(store: StaticStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota limits
  }
}

function computeTrending(checkins: MoodCheckin[]): TrendingMoodStat[] {
  const counts = new Map<MoodName, number>();
  for (const m of MOODS) counts.set(m.name, 0);
  for (const c of checkins) {
    if (c.isPublic) {
      counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
    }
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(counts.entries())
    .map(([mood, count]) => ({
      mood,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildUserFullState(store: StaticStore, userId: string): UserFullState | null {
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  const moodHistory = store.moodCheckins
    .filter((m) => m.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const savedConfessions = store.confessions
    .filter((c) => user.savedConfessionIds.includes(c.id) && c.status !== 'removed')
    .map((c) => ({ ...c, savedByMe: true }));
  const quizResults = store.quizResults
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const { savedConfessionIds: _, ...cleanUser } = user;
  return {
    user: cleanUser,
    moodHistory,
    savedConfessions,
    quizResults,
  };
}

export async function handleStaticApiFallback<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const store = loadStore();
  const method = (options.method || 'GET').toUpperCase();
  const [pathname, queryStr] = url.split('?');
  const params = new URLSearchParams(queryStr || '');
  const body = options.body ? (JSON.parse(String(options.body)) as Record<string, unknown>) : {};
  const activeUser = store.activeUserId
    ? store.users.find((u) => u.id === store.activeUserId) ?? null
    : null;

  // --- AUTH ---
  if (pathname === '/api/auth/me' && method === 'GET') {
    const uid = store.activeUserId;
    const state = uid ? buildUserFullState(store, uid) : null;
    if (!state) throw new Error('Not authenticated');
    return state as T;
  }

  if (pathname === '/api/auth/demo' && method === 'POST') {
    const demo = store.users[0];
    store.activeUserId = demo.id;
    saveStore(store);
    return { token: `static_${demo.id}`, ...buildUserFullState(store, demo.id)! } as T;
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const username = String(body.username || '').trim().toLowerCase();
    const found =
      store.users.find((u) => u.username.toLowerCase() === username) ?? store.users[0];
    store.activeUserId = found.id;
    saveStore(store);
    return { token: `static_${found.id}`, ...buildUserFullState(store, found.id)! } as T;
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const clean = String(body.username || 'vibe_user').trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'vibe_user';
    const newUser: StaticUser = {
      id: `user_${Math.random().toString(36).slice(2, 10)}`,
      username: clean,
      displayName: String(body.displayName || clean),
      bio: String(body.bio || 'New to VIBE CHECK.'),
      avatarPreset: String(body.avatarPreset || 'aurora'),
      favoriteAesthetic: (body.favoriteAesthetic as AestheticId) || 'Dreamcore Lavender',
      profileTheme: 'lavender-haze',
      isModerator: false,
      createdAt: new Date().toISOString(),
      savedConfessionIds: [],
    };
    store.users.push(newUser);
    store.activeUserId = newUser.id;
    saveStore(store);
    return { token: `static_${newUser.id}`, ...buildUserFullState(store, newUser.id)! } as T;
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    store.activeUserId = null;
    saveStore(store);
    return { ok: true } as T;
  }

  if (pathname === '/api/auth/profile' && method === 'PATCH') {
    if (!activeUser) throw new Error('Sign in required');
    if (typeof body.username === 'string' && body.username.trim()) {
      activeUser.username = body.username.trim().toLowerCase();
    }
    if (typeof body.displayName === 'string' && body.displayName.trim()) {
      activeUser.displayName = body.displayName.trim();
    }
    if (typeof body.bio === 'string') {
      activeUser.bio = body.bio.trim();
    }
    if (typeof body.avatarPreset === 'string') {
      activeUser.avatarPreset = body.avatarPreset;
    }
    if (typeof body.avatarUrl === 'string') {
      activeUser.avatarUrl = body.avatarUrl || undefined;
    }
    if (typeof body.favoriteAesthetic === 'string') {
      activeUser.favoriteAesthetic = body.favoriteAesthetic as AestheticId;
    }
    if (typeof body.profileTheme === 'string') {
      activeUser.profileTheme = body.profileTheme as ProfileThemeId;
    }
    saveStore(store);
    return buildUserFullState(store, activeUser.id) as T;
  }

  // --- MOODS ---
  if (pathname === '/api/moods/trending' && method === 'GET') {
    const trending = computeTrending(store.moodCheckins);
    const recentPulses = store.moodCheckins
      .filter((m) => m.isPublic)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    return {
      totalCheckins: store.moodCheckins.length,
      trending,
      recentPulses,
    } as T;
  }

  if (pathname === '/api/moods/checkin' && method === 'POST') {
    const checkin: MoodCheckin = {
      id: `mc_${Math.random().toString(36).slice(2, 10)}`,
      userId: activeUser?.id ?? null,
      username: activeUser?.username ?? 'anonymous',
      mood: body.mood as MoodName,
      note: String(body.note || ''),
      media: body.media as MediaAttachment | undefined,
      isPublic: body.isPublic !== false,
      createdAt: new Date().toISOString(),
    };
    store.moodCheckins.unshift(checkin);
    saveStore(store);
    return {
      checkin,
      trending: computeTrending(store.moodCheckins),
      totalCheckins: store.moodCheckins.length,
    } as T;
  }

  // --- CONFESSIONS ---
  if (pathname === '/api/confessions' && method === 'GET') {
    const category = params.get('category') || 'All';
    const sort = params.get('sort') || 'trending';
    const q = (params.get('q') || '').trim().toLowerCase();
    const includeFlagged = params.get('includeFlagged') === 'true';

    let list = store.confessions.filter((c) =>
      includeFlagged ? c.status !== 'removed' : c.status === 'active'
    );
    if (category !== 'All') {
      list = list.filter((c) => c.category === category);
    }
    if (q) {
      list = list.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.moodTag.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) =>
      sort === 'recent'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : b.likes - a.likes
    );
    const savedSet = new Set(activeUser?.savedConfessionIds ?? []);
    return {
      confessions: list.map((c) => ({ ...c, savedByMe: savedSet.has(c.id) })),
      flaggedCount: store.confessions.filter((c) => c.status === 'flagged').length,
    } as T;
  }

  if (pathname === '/api/confessions' && method === 'POST') {
    const text = String(body.text || '').trim();
    if (text.length < 6) {
      throw new Error('Confession must be at least 6 characters.');
    }
    const conf: Confession = {
      id: `conf_${Math.random().toString(36).slice(2, 10)}`,
      category: (body.category as ConfessionCategory) || 'Life',
      moodTag: (body.moodTag as MoodName) || 'Chaotic',
      text,
      likes: 1,
      likedByMe: true,
      reactions: { '💜': 0, '😭': 0, '🔥': 0, '💀': 0, '🫶': 0 },
      myReactions: [],
      comments: [],
      media: body.media as MediaAttachment | undefined,
      reportCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    store.confessions.unshift(conf);
    saveStore(store);
    return { confession: conf } as T;
  }

  const confMatch = pathname.match(/^\/api\/confessions\/([^/]+)\/(like|react|save|comments|report|moderate)$/);
  if (confMatch && method === 'POST') {
    const [, id, action] = confMatch;
    const target = store.confessions.find((c) => c.id === id);
    if (!target) throw new Error('Confession not found.');

    if (action === 'like') {
      target.likedByMe = !target.likedByMe;
      target.likes = Math.max(0, target.likes + (target.likedByMe ? 1 : -1));
      saveStore(store);
      return { confession: target } as T;
    }
    if (action === 'react') {
      const emoji = body.emoji as ReactionEmoji;
      const mine = new Set(target.myReactions ?? []);
      if (mine.has(emoji)) {
        mine.delete(emoji);
        target.reactions[emoji] = Math.max(0, (target.reactions[emoji] ?? 0) - 1);
      } else {
        mine.add(emoji);
        target.reactions[emoji] = (target.reactions[emoji] ?? 0) + 1;
      }
      target.myReactions = Array.from(mine);
      saveStore(store);
      return { confession: target } as T;
    }
    if (action === 'save') {
      if (!activeUser) throw new Error('Sign in required');
      const idx = activeUser.savedConfessionIds.indexOf(id);
      let saved = false;
      if (idx >= 0) {
        activeUser.savedConfessionIds.splice(idx, 1);
      } else {
        activeUser.savedConfessionIds.push(id);
        saved = true;
      }
      saveStore(store);
      return { saved, confession: { ...target, savedByMe: saved } } as T;
    }
    if (action === 'comments') {
      const text = String(body.text || '').trim();
      target.comments.push({
        id: `cm_${Math.random().toString(36).slice(2, 10)}`,
        authorLabel: activeUser && !body.anonymous ? `@${activeUser.username}` : 'Anon #904',
        userId: activeUser?.id ?? null,
        text,
        createdAt: new Date().toISOString(),
      });
      saveStore(store);
      return { confession: target } as T;
    }
    if (action === 'report') {
      target.reportCount += 1;
      target.status = 'flagged';
      saveStore(store);
      return { ok: true, quarantined: true } as T;
    }
    if (action === 'moderate') {
      target.status = body.action === 'approve' ? 'active' : 'removed';
      saveStore(store);
      return { ok: true } as T;
    }
  }

  // --- QUIZZES ---
  if (pathname === '/api/quizzes' && method === 'GET') {
    return {
      quizzes: QUIZZES.map((q) => ({ ...q, playsCount: store.quizPlays[q.id] ?? 1000 })),
    } as T;
  }

  const quizSubmitMatch = pathname.match(/^\/api\/quizzes\/([^/]+)\/submit$/);
  if (quizSubmitMatch && method === 'POST') {
    const quiz = QUIZZES.find((q) => q.id === quizSubmitMatch[1]);
    if (!quiz) throw new Error('Quiz not found.');
    const answers = Array.isArray(body.answers) ? (body.answers as string[]) : [];
    const tally = new Map<string, number>();
    for (const a of answers) tally.set(a, (tally.get(a) ?? 0) + 1);
    const winningKey =
      Array.from(tally.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      Object.keys(quiz.outcomes)[0];
    const outcome = quiz.outcomes[winningKey] ?? Object.values(quiz.outcomes)[0];
    store.quizPlays[quiz.id] = (store.quizPlays[quiz.id] ?? 1000) + 1;

    let savedResult: SavedQuizResult | null = null;
    if (activeUser) {
      const rec: SavedQuizResult & { userId: string } = {
        id: `qr_${Math.random().toString(36).slice(2, 10)}`,
        userId: activeUser.id,
        quizId: quiz.id,
        quizTitle: quiz.title,
        outcomeKey: outcome.key,
        outcomeTitle: outcome.title,
        outcomeSubtitle: outcome.subtitle,
        shareQuote: outcome.shareQuote,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };
      store.quizResults.unshift(rec);
      savedResult = rec;
    }
    saveStore(store);
    return { outcome, playsCount: store.quizPlays[quiz.id], savedResult } as T;
  }

  const quizFavMatch = pathname.match(/^\/api\/quizzes\/results\/([^/]+)\/favorite$/);
  if (quizFavMatch && method === 'POST') {
    const rec = store.quizResults.find((r) => r.id === quizFavMatch[1]);
    if (!rec) throw new Error('Quiz result not found.');
    rec.isFavorite = !rec.isFavorite;
    saveStore(store);
    return { result: rec } as T;
  }

  // --- DISCOVER & DISCUSSIONS ---
  if (pathname === '/api/discover' && method === 'GET') {
    const q = (params.get('q') || '').trim().toLowerCase();
    const discussions = q
      ? store.discussions.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.prompt.toLowerCase().includes(q) ||
            d.topicTag.toLowerCase().includes(q)
        )
      : store.discussions;
    const trendingConfessions = store.confessions
      .filter((c) => c.status === 'active')
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6);
    const trendingQuizzes = QUIZZES.map((qz) => ({
      ...qz,
      playsCount: store.quizPlays[qz.id] ?? 1000,
    }));
    return {
      trendingMoods: computeTrending(store.moodCheckins),
      totalMoodCheckins: store.moodCheckins.length,
      discussions,
      trendingConfessions,
      trendingQuizzes,
    } as T;
  }

  if (pathname === '/api/discussions' && method === 'POST') {
    const disc: CommunityDiscussion = {
      id: `disc_${Math.random().toString(36).slice(2, 10)}`,
      topicTag: String(body.topicTag || 'Internet Culture'),
      title: String(body.title || '').trim(),
      prompt: String(body.prompt || '').trim(),
      authorHandle: activeUser ? `@${activeUser.username}` : '@anonymous_vibe',
      upvotes: 1,
      upvotedByMe: true,
      media: body.media as MediaAttachment | undefined,
      replies: [],
      createdAt: new Date().toISOString(),
    };
    store.discussions.unshift(disc);
    saveStore(store);
    return { discussion: disc } as T;
  }

  const discMatch = pathname.match(/^\/api\/discussions\/([^/]+)\/(upvote|reply)$/);
  if (discMatch && method === 'POST') {
    const [, id, action] = discMatch;
    const disc = store.discussions.find((d) => d.id === id);
    if (!disc) throw new Error('Discussion not found.');
    if (action === 'upvote') {
      disc.upvotedByMe = !disc.upvotedByMe;
      disc.upvotes = Math.max(0, disc.upvotes + (disc.upvotedByMe ? 1 : -1));
      saveStore(store);
      return { upvotes: disc.upvotes, upvotedByMe: disc.upvotedByMe } as T;
    }
    const reply = {
      id: `rep_${Math.random().toString(36).slice(2, 10)}`,
      authorHandle: activeUser ? `@${activeUser.username}` : '@anon_guest',
      avatarPreset: activeUser?.avatarPreset || 'sky',
      text: String(body.text || '').trim(),
      createdAt: new Date().toISOString(),
    };
    disc.replies.push(reply);
    saveStore(store);
    return { reply } as T;
  }

  // --- WRAPPED ---
  if (pathname === '/api/wrapped' && method === 'GET') {
    const target = activeUser ?? store.users[0];
    const checkins = store.moodCheckins.filter((m) => m.userId === target.id);
    const effective = checkins.length > 0 ? checkins : store.moodCheckins.slice(0, 6);
    const counts = new Map<MoodName, number>();
    for (const c of effective) counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
    const total = effective.length || 1;
    const moodBreakdown: TrendingMoodStat[] = Array.from(counts.entries())
      .map(([mood, count]) => ({ mood, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
    const topMood = moodBreakdown[0]?.mood ?? 'Main Character Energy';
    const topMoodPercent = moodBreakdown[0]?.percent ?? 42;
    const uniqueDays = new Set(effective.map((c) => new Date(c.createdAt).toISOString().slice(0, 10))).size;

    const summary: WrappedSummary = {
      monthLabel: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      handle: `@${target.username}`,
      isPreview: !activeUser,
      totalCheckins: checkins.length,
      streakDays: Math.min(uniqueDays, 14),
      topMood,
      topMoodPercent,
      moodBreakdown,
      vibePersonality: 'Headphone Cinema Lead',
      vibePersonalityDescription:
        'You walked through this month with opening-credits energy and unstoppable presence.',
      mostActiveDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => ({
        day,
        count: (idx % 3) + 1,
      })),
      favoriteQuizResults: store.quizResults.filter((r) => r.userId === target.id).slice(0, 2),
      highlights: [
        `Checked in ${effective.length} times across ${uniqueDays} distinct days`,
        `${topMood} led your aura at ${topMoodPercent}% of your check-ins`,
        'Fridays were your peak vibe check-in day',
      ],
    };
    return summary as T;
  }

  throw new Error('Unsupported static route');
}

export function readFileAsStaticMedia(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  const mediaType: 'image' | 'video' = file.type.toLowerCase().startsWith('video')
    ? 'video'
    : 'image';

  return new Promise((resolve, reject) => {
    // For larger videos in static mode, object URL plays immediately without inflating localStorage
    if (mediaType === 'video' || file.size > 1.5 * 1024 * 1024) {
      onProgress?.(65);
      const url = URL.createObjectURL(file);
      setTimeout(() => {
        onProgress?.(100);
        resolve({ url, mediaType });
      }, 150);
      return;
    }

    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.min(95, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    reader.onload = () => {
      onProgress?.(100);
      resolve({ url: String(reader.result || ''), mediaType });
    };
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(file);
  });
}
