import { useEffect, useState } from 'react';
import { ArrowUp, Moon, Sparkles, Sun, User } from 'lucide-react';
import { MOOD_MAP } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type {
  CommunityDiscussion,
  MoodCheckin,
  MoodName,
  TrendingMoodStat,
} from '../types';
import { apiFetch } from '../utils/api';
import { HeroPrismArtwork } from './AuraArtwork';
import { ConfessionsSection } from './ConfessionsSection';
import { MediaDisplay } from './MediaUploader';
import { MoodCheckinSection } from './MoodCheckinSection';
import { QuizzesSection } from './QuizzesSection';

export function HomePage({
  onLaunchQuiz,
}: {
  onLaunchQuiz: (quizId: string) => void;
}) {
  const {
    theme,
    toggleTheme,
    userState,
    setAuthModalOpen,
    setWrappedModalOpen,
    setActiveTab,
    showToast,
  } = useVibe();

  const [previewMood, setPreviewMood] = useState<MoodName>('Main Character Energy');
  const [trendingMoods, setTrendingMoods] = useState<TrendingMoodStat[]>([]);
  const [recentPulses, setRecentPulses] = useState<MoodCheckin[]>([]);
  const [totalCheckins, setTotalCheckins] = useState<number>(0);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);

  useEffect(() => {
    apiFetch<{
      totalCheckins: number;
      trending: TrendingMoodStat[];
      recentPulses: MoodCheckin[];
    }>('/api/moods/trending')
      .then((res) => {
        setTrendingMoods(res.trending);
        setRecentPulses(res.recentPulses);
        setTotalCheckins(res.totalCheckins);
      })
      .catch(() => {
        // handled silently on first paint
      });

    apiFetch<{ discussions: CommunityDiscussion[] }>('/api/discover')
      .then((res) => setDiscussions(res.discussions.slice(0, 3)))
      .catch(() => {});
  }, []);

  const activeMoodDef = MOOD_MAP[previewMood];

  const scrollToMoodCheckin = () => {
    const el = document.getElementById('mood-checkin');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickUpvote = async (id: string) => {
    try {
      const res = await apiFetch<{ upvotes: number; upvotedByMe: boolean }>(
        `/api/discussions/${id}/upvote`,
        { method: 'POST' }
      );
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, upvotes: res.upvotes, upvotedByMe: res.upvotedByMe } : d
        )
      );
    } catch {
      showToast('Could not upvote right now', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-20">
      {/* 1. Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between py-2 space-y-8">
          {/* Sub-header Utility Controls (Theme, Wrapped, Account) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
              Your mood. Your people. Your internet.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle dark or light mode"
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  userState ? setActiveTab('profile') : setAuthModalOpen(true)
                }
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{userState ? `@${userState.user.username}` : 'Sign In'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <h1 className="font-display text-[clamp(2.5rem,5vw,4.35rem)] font-extrabold leading-[1.04] tracking-tight text-slate-950 dark:text-white text-balance">
              What&apos;s your{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">
                vibe
              </span>{' '}
              today?
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Log your daily mood aura, drop anonymous confessions without the noise, take sharp
              personality quizzes, and unwrap your Monthly Vibe Wrapped.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={scrollToMoodCheckin}
                className="px-7 py-3.5 min-h-[48px] rounded-2xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
              >
                Check My Vibe
              </button>

              <button
                type="button"
                onClick={() => setWrappedModalOpen(true)}
                className="px-5 py-3.5 min-h-[48px] rounded-2xl text-sm font-semibold border border-slate-200 dark:border-white/15 bg-white dark:bg-[#141120] text-slate-900 dark:text-white hover:border-violet-400 dark:hover:border-violet-400/50 inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-fuchsia-500" />
                <span>Monthly Vibe Wrapped</span>
              </button>
            </div>
          </div>

          {/* Proof / Live Community Pulse Metrics (clean unboxed grid) */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-3 gap-6 max-w-lg">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Moods Logged</p>
              <p className="font-display text-2xl font-bold text-slate-950 dark:text-white tabular-nums mt-0.5">
                {totalCheckins || 13}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Vibe Quizzes</p>
              <p className="font-display text-2xl font-bold text-slate-950 dark:text-white tabular-nums mt-0.5">
                6
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Anonymous Safe</p>
              <p className="font-display text-2xl font-bold text-slate-950 dark:text-white tabular-nums mt-0.5">
                100%
              </p>
            </div>
          </div>
        </div>

        {/* Hero Right Visual Frame */}
        <div className="lg:col-span-5">
          <HeroPrismArtwork
            activeMoodName={activeMoodDef.name}
            activeMoodEmoji={activeMoodDef.emoji}
            activeMoodTitle={activeMoodDef.vibeTitle}
            auraFrom={activeMoodDef.auraPair[0]}
            auraTo={activeMoodDef.auraPair[1]}
          />
        </div>
      </section>

      {/* 2. Interactive Mood Selection Section */}
      <MoodCheckinSection
        selectedPreviewMood={previewMood}
        onSelectPreviewMood={setPreviewMood}
        onMoodChecked={(trending, total) => {
          setTrendingMoods(trending);
          setTotalCheckins(total);
        }}
      />

      {/* 3. Trending Moods Among Users */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400">
              Live Mood Radar
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1 text-balance">
              Trending moods right now
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Aggregated across {totalCheckins} real check-ins
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 space-y-4">
            {(trendingMoods.length > 0 ? trendingMoods.slice(0, 5) : []).map((item) => {
              const meta = MOOD_MAP[item.mood];
              return (
                <div key={item.mood} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {meta?.emoji} {item.mood}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {item.count} check-ins · {item.percent}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(item.percent, 8)}%`,
                        backgroundImage: meta
                          ? `linear-gradient(90deg, ${meta.auraPair[0]}, ${meta.auraPair[1]})`
                          : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Recent check-in notes
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {recentPulses
                .filter((p) => p.note || p.media)
                .slice(0, 4)
                .map((pulse) => (
                  <div key={pulse.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-violet-700 dark:text-violet-300">
                        {pulse.username === 'anonymous' ? 'Anonymous' : `@${pulse.username}`}
                      </span>{' '}
                      · {MOOD_MAP[pulse.mood]?.emoji} {pulse.mood}
                    </p>
                    {pulse.note && (
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
                        &ldquo;{pulse.note}&rdquo;
                      </p>
                    )}
                    {pulse.media && (
                      <MediaDisplay media={pulse.media} alt={`${pulse.mood} pulse`} compact />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trending Confessions */}
      <ConfessionsSection compact />

      {/* 5. Popular Personality Quizzes */}
      <QuizzesSection compact />

      {/* 6. What People Are Talking About */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-600 dark:text-fuchsia-400">
              Open Threads
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1 text-balance">
              What people are talking about
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('discover');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer self-start sm:self-auto"
          >
            Join all discussions →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {discussions.map((disc) => (
            <article
              key={disc.id}
              className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-violet-700 dark:text-violet-300">
                    {disc.topicTag}
                  </span>{' '}
                  · {disc.authorHandle}
                </p>
                <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white leading-snug">
                  {disc.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {disc.prompt}
                </p>
                {disc.media && (
                  <div className="pt-2">
                    <MediaDisplay media={disc.media} alt={disc.title} compact />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickUpvote(disc.id)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold inline-flex items-center gap-1 cursor-pointer tabular-nums ${
                    disc.upvotedByMe
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>{disc.upvotes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('discover');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 cursor-pointer tabular-nums"
                >
                  {disc.replies.length} replies · Open →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
