import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUp, MessageSquare, Plus, Search } from 'lucide-react';
import { MOOD_MAP } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type {
  CommunityDiscussion,
  Confession,
  MediaAttachment,
  QuizDefinition,
  TrendingMoodStat,
} from '../types';
import { apiFetch } from '../utils/api';
import { AvatarArt } from './AuraArtwork';
import { MediaDisplay, MediaUploader } from './MediaUploader';

interface DiscoverPayload {
  trendingMoods: TrendingMoodStat[];
  totalMoodCheckins: number;
  discussions: CommunityDiscussion[];
  trendingConfessions: Confession[];
  trendingQuizzes: QuizDefinition[];
}

export function DiscoverPage({
  onLaunchQuiz,
}: {
  onLaunchQuiz: (quizId: string) => void;
}) {
  const { setActiveTab, showToast } = useVibe();
  const [data, setData] = useState<DiscoverPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New discussion composer
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [topicTag, setTopicTag] = useState('Internet Culture');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [topicMedia, setTopicMedia] = useState<MediaAttachment | null>(null);
  const [creating, setCreating] = useState(false);

  // Discussion replies
  const [openDiscId, setOpenDiscId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const loadDiscover = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
      const res = await apiFetch<DiscoverPayload>(`/api/discover${qs}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load discover feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDiscover(searchQuery);
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery, loadDiscover]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiFetch<{ discussion: CommunityDiscussion }>('/api/discussions', {
        method: 'POST',
        body: JSON.stringify({ topicTag, title, prompt, media: topicMedia ?? undefined }),
      });
      setData((prev) =>
        prev ? { ...prev, discussions: [res.discussion, ...prev.discussions] } : prev
      );
      setTitle('');
      setPrompt('');
      setTopicMedia(null);
      setShowNewTopic(false);
      showToast('Topic started', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not start topic.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const res = await apiFetch<{ upvotes: number; upvotedByMe: boolean }>(
        `/api/discussions/${id}/upvote`,
        { method: 'POST' }
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              discussions: prev.discussions.map((d) =>
                d.id === id ? { ...d, upvotes: res.upvotes, upvotedByMe: res.upvotedByMe } : d
              ),
            }
          : prev
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not upvote.', 'error');
    }
  };

  const handleReply = async (id: string) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text) return;
    try {
      const res = await apiFetch<{ reply: CommunityDiscussion['replies'][number] }>(
        `/api/discussions/${id}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        }
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              discussions: prev.discussions.map((d) =>
                d.id === id ? { ...d, replies: [...d.replies, res.reply] } : d
              ),
            }
          : prev
      );
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }));
      showToast('Reply added', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not reply.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-12">
      {/* Header + Live Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400">
            Discover Feed
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mt-1 text-balance">
            What the internet is feeling today
          </h1>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, confessions, quizzes..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141120] text-sm text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141120] animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-8 text-center">
          <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Community Discussions & Trending Confessions */}
          <div className="lg:col-span-8 space-y-10">
            {/* Community Discussions */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                    Community discussions
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Hot takes, playlists, and late-night thoughts from the feed
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewTopic((v) => !v)}
                  className="px-4 py-2.5 min-h-[40px] rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showNewTopic ? 'Close Form' : 'Start Topic'}</span>
                </button>
              </div>

              {showNewTopic && (
                <form
                  onSubmit={handleCreateTopic}
                  className="rounded-3xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-[#141120] p-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={topicTag}
                      onChange={(e) => setTopicTag(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1A2E] text-sm text-slate-900 dark:text-white"
                    >
                      <option value="Internet Culture">Internet Culture</option>
                      <option value="Playlists">Playlists</option>
                      <option value="Campus & Work">Campus & Work</option>
                      <option value="Dating">Dating</option>
                      <option value="Hot Take">Hot Take</option>
                    </select>
                    <input
                      type="text"
                      required
                      maxLength={140}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Discussion headline..."
                      className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-950 dark:text-white"
                    />
                  </div>
                  <textarea
                    rows={2}
                    required
                    maxLength={280}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Give people a prompt to riff on..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-950 dark:text-white resize-none"
                  />
                  <MediaUploader value={topicMedia} onChange={setTopicMedia} variant="compact" />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      {creating ? 'Posting...' : 'Publish Topic'}
                    </button>
                  </div>
                </form>
              )}

              {data.discussions.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141120] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No discussions matched your search.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.discussions.map((disc) => {
                    const isOpen = openDiscId === disc.id;
                    return (
                      <article
                        key={disc.id}
                        className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-violet-700 dark:text-violet-300">
                                {disc.topicTag}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{disc.authorHandle}</span>
                            </div>
                            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
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

                          <button
                            type="button"
                            onClick={() => handleUpvote(disc.id)}
                            className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex flex-col items-center min-w-[52px] transition-colors cursor-pointer tabular-nums ${
                              disc.upvotedByMe
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200'
                                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-violet-300'
                            }`}
                          >
                            <ArrowUp className="w-4 h-4" />
                            <span>{disc.upvotes}</span>
                          </button>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setOpenDiscId(isOpen ? null : disc.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 cursor-pointer tabular-nums"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>
                              {disc.replies.length}{' '}
                              {disc.replies.length === 1 ? 'reply' : 'replies'}
                            </span>
                          </button>
                        </div>

                        {isOpen && (
                          <div className="space-y-3 pt-2">
                            {disc.replies.map((r) => (
                              <div
                                key={r.id}
                                className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] p-3.5"
                              >
                                <AvatarArt presetId={r.avatarPreset} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    {r.authorHandle}
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                                    {r.text}
                                  </p>
                                </div>
                              </div>
                            ))}

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength={240}
                                value={replyDrafts[disc.id] || ''}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({
                                    ...prev,
                                    [disc.id]: e.target.value,
                                  }))
                                }
                                placeholder="Join the thread..."
                                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-950 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleReply(disc.id)}
                                className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Trending Confessions Preview */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                  Interesting confessions
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('confessions');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                >
                  Open Confessions →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.trendingConfessions.slice(0, 4).map((conf) => (
                  <div
                    key={conf.id}
                    className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-5 space-y-2.5"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-pink-600 dark:text-pink-400">
                        {conf.category}
                      </span>{' '}
                      · {MOOD_MAP[conf.moodTag]?.emoji} {conf.moodTag}
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed line-clamp-3">
                      &ldquo;{conf.text}&rdquo;
                    </p>
                    <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {conf.likes} likes · {conf.comments.length} replies
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Rail: Popular Moods + Trending Quizzes */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Popular Moods */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                  Popular moods
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  Based on {data.totalMoodCheckins} community check-ins
                </p>
              </div>

              <div className="space-y-3.5">
                {data.trendingMoods.slice(0, 6).map((stat) => {
                  const meta = MOOD_MAP[stat.mood];
                  return (
                    <div key={stat.mood} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {meta?.emoji} {stat.mood}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {stat.percent}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(stat.percent, 6)}%`,
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
            </div>

            {/* Trending Quizzes */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                  Trending quizzes
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('quizzes');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                >
                  All quizzes
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/10">
                {data.trendingQuizzes.slice(0, 4).map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onLaunchQuiz(q.id)}
                    className="w-full py-3.5 text-left flex items-start justify-between gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-mono text-slate-400">0{idx + 1}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                        {q.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {(q.playsCount ?? 0).toLocaleString()} plays
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-300 shrink-0 mt-1">
                      Play →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
