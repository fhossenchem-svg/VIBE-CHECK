export type MoodName =
  | 'Happy'
  | 'Romantic'
  | 'Delusional'
  | 'Productive'
  | 'Lonely'
  | 'Chaotic'
  | 'Unbothered'
  | 'Overthinking'
  | 'Main Character Energy'
  | 'Mentally on Vacation';

export type ConfessionCategory = 'Love' | 'Friendship' | 'School' | 'Life' | 'Random';

export type ReactionEmoji = '💜' | '😭' | '🔥' | '💀' | '🫶';

export type ProfileThemeId =
  | 'lavender-haze'
  | 'electric-violet'
  | 'bubblegum-pop'
  | 'midnight-sky';

export type AestheticId =
  | 'Dreamcore Lavender'
  | 'Indie Main Character'
  | 'Y2K Cyber Pop'
  | 'Soft Minimalist'
  | 'Midnight Coquette'
  | 'Solaris Clean';

export interface MoodDefinition {
  name: MoodName;
  emoji: string;
  vibeTitle: string;
  affirmation: string;
  soundtrack: string;
  auraPair: [string, string];
  badgeText: string;
  energyPercent: number;
  chaosPercent: number;
  softnessPercent: number;
}

export interface MediaAttachment {
  url: string;
  mediaType: 'image' | 'video';
}

export interface MoodCheckin {
  id: string;
  userId: string | null;
  username: string;
  mood: MoodName;
  note: string;
  media?: MediaAttachment;
  isPublic: boolean;
  createdAt: string;
}

export interface ConfessionComment {
  id: string;
  authorLabel: string;
  userId: string | null;
  text: string;
  createdAt: string;
}

export interface ConfessionReport {
  id: string;
  reason: 'Harassment' | 'Harmful Content' | 'Spam' | 'Personal Info';
  details: string;
  reporterId: string;
  createdAt: string;
}

export interface Confession {
  id: string;
  category: ConfessionCategory;
  moodTag: MoodName;
  text: string;
  likes: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  reactions: Record<ReactionEmoji, number>;
  myReactions?: ReactionEmoji[];
  comments: ConfessionComment[];
  media?: MediaAttachment;
  reportCount: number;
  status: 'active' | 'flagged' | 'removed';
  createdAt: string;
}

export interface QuizChoice {
  id: string;
  label: string;
  outcomeKey: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: QuizChoice[];
}

export interface QuizOutcome {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  traits: string[];
  matchPercent: number;
  accentFrom: string;
  accentTo: string;
  shareQuote: string;
}

export interface QuizDefinition {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  durationLabel: string;
  questions: QuizQuestion[];
  outcomes: Record<string, QuizOutcome>;
  playsCount?: number;
}

export interface SavedQuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  outcomeKey: string;
  outcomeTitle: string;
  outcomeSubtitle: string;
  shareQuote: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface DiscussionReply {
  id: string;
  authorHandle: string;
  avatarPreset: string;
  text: string;
  createdAt: string;
}

export interface CommunityDiscussion {
  id: string;
  topicTag: string;
  title: string;
  prompt: string;
  authorHandle: string;
  upvotes: number;
  upvotedByMe?: boolean;
  media?: MediaAttachment;
  replies: DiscussionReply[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarPreset: string;
  avatarUrl?: string;
  favoriteAesthetic: AestheticId;
  profileTheme: ProfileThemeId;
  isModerator?: boolean;
  createdAt: string;
}

export interface UserFullState {
  user: UserProfile;
  moodHistory: MoodCheckin[];
  savedConfessions: Confession[];
  quizResults: SavedQuizResult[];
}

export interface TrendingMoodStat {
  mood: MoodName;
  count: number;
  percent: number;
}

export interface WrappedSummary {
  monthLabel: string;
  handle: string;
  isPreview: boolean;
  totalCheckins: number;
  streakDays: number;
  topMood: MoodName;
  topMoodPercent: number;
  moodBreakdown: TrendingMoodStat[];
  vibePersonality: string;
  vibePersonalityDescription: string;
  mostActiveDays: { day: string; count: number }[];
  favoriteQuizResults: SavedQuizResult[];
  highlights: string[];
}
