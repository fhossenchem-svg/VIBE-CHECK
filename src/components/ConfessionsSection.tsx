import React, { useCallback, useEffect, useState } from 'react';
import {
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { CONFESSION_CATEGORIES, MOOD_MAP, MOODS, REACTION_EMOJIS } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type {
  Confession,
  ConfessionCategory,
  MediaAttachment,
  MoodName,
  ReactionEmoji,
} from '../types';
import { apiFetch } from '../utils/api';
import { MediaDisplay, MediaUploader } from './MediaUploader';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ConfessionsSection({ compact = false }: { compact?: boolean }) {
  const { userState, showToast, setAuthModalOpen, refreshUser, setActiveTab } = useVibe();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'All' | ConfessionCategory>('All');
  const [sortBy, setSortBy] = useState<'trending' | 'recent'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [showModerationQueue, setShowModerationQueue] = useState(false);

  // Composer state
  const [newCategory, setNewCategory] = useState<ConfessionCategory>('Life');
  const [newMoodTag, setNewMoodTag] = useState<MoodName>('Chaotic');
  const [newText, setNewText] = useState('');
  const [newMedia, setNewMedia] = useState<MediaAttachment | null>(null);
  const [posting, setPosting] = useState(false);

  // Expanded comments & comment drafts
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentingId, setCommentingId] = useState<string | null>(null);

  // Local muted posts + report modal
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<
    'Harassment' | 'Harmful Content' | 'Spam' | 'Personal Info'
  >('Harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);

  const loadConfessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        category: categoryFilter,
        sort: sortBy,
      });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (showModerationQueue && userState?.user.isModerator) {
        params.set('includeFlagged', 'true');
      }
      const data = await apiFetch<{ confessions: Confession[]; flaggedCount: number }>(
        `/api/confessions?${params.toString()}`
      );
      setConfessions(data.confessions);
      setFlaggedCount(data.flaggedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load confessions.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, sortBy, searchQuery, showModerationQueue, userState?.user.isModerator]);

  useEffect(() => {
    loadConfessions();
  }, [loadConfessions]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setPosting(true);
    try {
      const res = await apiFetch<{ confession: Confession }>('/api/confessions', {
        method: 'POST',
        body: JSON.stringify({
          category: newCategory,
          moodTag: newMoodTag,
          text: newText.trim(),
          media: newMedia ?? undefined,
        }),
      });
      setConfessions((prev) => [res.confession, ...prev]);
      setNewText('');
      setNewMedia(null);
      showToast('Confession posted anonymously', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not post confession.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const res = await apiFetch<{ confession: Confession }>(`/api/confessions/${id}/like`, {
        method: 'POST',
      });
      setConfessions((prev) => prev.map((c) => (c.id === id ? res.confession : c)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not like confession.', 'error');
    }
  };

  const handleReact = async (id: string, emoji: ReactionEmoji) => {
    try {
      const res = await apiFetch<{ confession: Confession }>(`/api/confessions/${id}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      setConfessions((prev) => prev.map((c) => (c.id === id ? res.confession : c)));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not react.', 'error');
    }
  };

  const handleSave = async (id: string) => {
    if (!userState) {
      setAuthModalOpen(true);
      showToast('Sign in to save confessions to your profile');
      return;
    }
    try {
      const res = await apiFetch<{ saved: boolean; confession: Confession }>(
        `/api/confessions/${id}/save`,
        { method: 'POST' }
      );
      setConfessions((prev) => prev.map((c) => (c.id === id ? res.confession : c)));
      await refreshUser();
      showToast(res.saved ? 'Saved to your profile' : 'Removed from saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save confession.', 'error');
    }
  };

  const handleAddComment = async (id: string) => {
    const text = (commentDrafts[id] || '').trim();
    if (!text) return;
    setCommentingId(id);
    try {
      const res = await apiFetch<{ confession: Confession }>(`/api/confessions/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text, anonymous: !userState }),
      });
      setConfessions((prev) => prev.map((c) => (c.id === id ? res.confession : c)));
      setCommentDrafts((prev) => ({ ...prev, [id]: '' }));
      showToast('Comment posted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not post comment.', 'error');
    } finally {
      setCommentingId(null);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetId) return;
    setReporting(true);
    try {
      const res = await apiFetch<{ ok: boolean; quarantined: boolean }>(
        `/api/confessions/${reportTargetId}/report`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: reportReason, details: reportDetails }),
        }
      );
      setMutedIds((prev) => [...prev, reportTargetId]);
      setReportTargetId(null);
      setReportDetails('');
      if (res.quarantined) {
        loadConfessions();
      }
      showToast('Report submitted and hidden from your feed. Thank you for keeping VIBE CHECK safe.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Report failed.', 'error');
    } finally {
      setReporting(false);
    }
  };

  const handleModerate = async (id: string, action: 'approve' | 'remove') => {
    try {
      await apiFetch(`/api/confessions/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      showToast(action === 'approve' ? 'Confession restored' : 'Confession removed', 'success');
      loadConfessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Moderation failed.', 'error');
    }
  };

  const visibleConfessions = confessions
    .filter((c) => !mutedIds.includes(c.id))
    .slice(0, compact ? 3 : confessions.length);

  return (
    <section className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pink-600 dark:text-pink-400">
            Anonymous Confessions
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1 text-balance">
            {compact ? 'Trending confessions right now' : 'Unfiltered thoughts, zero judgment'}
          </h2>
        </div>

        {compact ? (
          <button
            type="button"
            onClick={() => {
              setActiveTab('confessions');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer self-start md:self-auto"
          >
            View all confessions →
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {userState?.user.isModerator && (
              <button
                type="button"
                onClick={() => setShowModerationQueue((v) => !v)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  showModerationQueue
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Moderation Queue ({flaggedCount})
                </span>
              </button>
            )}

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setSortBy('trending')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  sortBy === 'trending'
                    ? 'bg-white dark:bg-[#211C33] text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Trending
              </button>
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-white dark:bg-[#211C33] text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Newest
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full page controls: Composer + Category Tabs + Search */}
      {!compact && (
        <div className="space-y-6">
          {/* Submit Anonymous Confession Card */}
          <form
            onSubmit={handlePost}
            className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 sm:p-7 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Drop an anonymous confession
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Safety-moderated · Never reveals your account
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={500}
              required
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Say what you have been holding back about love, school, friendship, or life..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-950 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />

            <MediaUploader value={newMedia} onChange={setNewMedia} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  aria-label="Confession category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ConfessionCategory)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1A2E] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {CONFESSION_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      Category: {c}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Confession mood"
                  value={newMoodTag}
                  onChange={(e) => setNewMoodTag(e.target.value as MoodName)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1A2E] text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {MOODS.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.emoji} {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {newText.length}/500
                </span>
                <button
                  type="submit"
                  disabled={posting || newText.trim().length < 6}
                  className="px-5 py-2.5 min-h-[42px] rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {posting ? 'Posting...' : 'Post Anonymously'}
                </button>
              </div>
            </div>
          </form>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', ...CONFESSION_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search confessions..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141120] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feed States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-56 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141120] p-6 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-6 text-center space-y-3">
          <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
          <button
            type="button"
            onClick={loadConfessions}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : visibleConfessions.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-12 text-center space-y-3">
          <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Quiet in this corner
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            No confessions match your current filter. Try switching categories or drop the first
            thought anonymously.
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-3' : 'lg:grid-cols-2'} gap-5`}>
          {visibleConfessions.map((conf) => {
            const moodMeta = MOOD_MAP[conf.moodTag];
            const commentsOpen = openCommentsId === conf.id;
            return (
              <article
                key={conf.id}
                className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div>
                  {/* Clean unboxed metadata row */}
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-violet-700 dark:text-violet-300">
                        {conf.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {moodMeta?.emoji} {conf.moodTag}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{timeAgo(conf.createdAt)}</span>
                      {conf.status === 'flagged' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            Flagged ({conf.reportCount})
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setReportTargetId(conf.id)}
                      aria-label="Report confession"
                      title="Report harmful content"
                      className="min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Confession body */}
                  <p className="text-[15px] sm:text-base leading-relaxed text-slate-900 dark:text-slate-100 font-medium">
                    &ldquo;{conf.text}&rdquo;
                  </p>

                  {conf.media && (
                    <div className="mt-4">
                      <MediaDisplay media={conf.media} alt="Confession attachment" compact={compact} />
                    </div>
                  )}

                  {/* Moderation controls if flagged */}
                  {conf.status === 'flagged' && userState?.user.isModerator && (
                    <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                        Moderator Action Needed
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleModerate(conf.id, 'approve')}
                          className="px-3 py-1 rounded-lg bg-white dark:bg-white/10 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerate(conf.id, 'remove')}
                          className="px-3 py-1 rounded-lg bg-rose-600 text-xs font-semibold text-white cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reactions & Action Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 space-y-3">
                  {/* Emoji Reactions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {REACTION_EMOJIS.map((emoji) => {
                      const active = conf.myReactions?.includes(emoji);
                      const count = conf.reactions?.[emoji] ?? 0;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReact(conf.id, emoji)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer tabular-nums ${
                            active
                              ? 'bg-violet-100 dark:bg-violet-500/25 text-violet-900 dark:text-violet-100 border border-violet-300 dark:border-violet-400/40'
                              : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-white/15'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Like, Comment, Save */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleLike(conf.id)}
                        className={`inline-flex items-center gap-1.5 min-h-[36px] transition-colors cursor-pointer tabular-nums ${
                          conf.likedByMe
                            ? 'text-pink-600 dark:text-pink-400'
                            : 'hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${conf.likedByMe ? 'fill-current' : ''}`}
                        />
                        <span>{conf.likes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentsId(commentsOpen ? null : conf.id)
                        }
                        className="inline-flex items-center gap-1.5 min-h-[36px] hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer tabular-nums"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{conf.comments.length} replies</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave(conf.id)}
                      className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-lg transition-colors cursor-pointer ${
                        conf.savedByMe
                          ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15'
                          : 'hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${conf.savedByMe ? 'fill-current' : ''}`}
                      />
                      <span>{conf.savedByMe ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>

                  {/* Expandable Comments */}
                  {commentsOpen && (
                    <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-3">
                      {conf.comments.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No replies yet. Be the first to share a kind thought.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {conf.comments.map((cm) => (
                            <div
                              key={cm.id}
                              className="rounded-xl bg-slate-50 dark:bg-white/[0.04] px-3.5 py-2.5 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {cm.authorLabel}
                                </span>
                                <span>{timeAgo(cm.createdAt)}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                                {cm.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={280}
                          value={commentDrafts[conf.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [conf.id]: e.target.value }))
                          }
                          placeholder="Write a supportive reply..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                          type="button"
                          disabled={
                            commentingId === conf.id ||
                            !(commentDrafts[conf.id] || '').trim()
                          }
                          onClick={() => handleAddComment(conf.id)}
                          className="px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportTargetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSubmitReport}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#151221] border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                Report Confession
              </h3>
              <button
                type="button"
                onClick={() => setReportTargetId(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Help keep VIBE CHECK safe. Reports immediately hide the post from your feed and flag
              it for community moderation.
            </p>
            <div className="space-y-2">
              {(['Harassment', 'Harmful Content', 'Spam', 'Personal Info'] as const).map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer text-sm text-slate-800 dark:text-slate-200"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="accent-violet-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <textarea
              rows={2}
              maxLength={200}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Optional context..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTargetId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reporting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
