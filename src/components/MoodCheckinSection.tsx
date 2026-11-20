import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Share2 } from 'lucide-react';
import { MOOD_MAP, MOODS } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type { MediaAttachment, MoodDefinition, MoodName, TrendingMoodStat } from '../types';
import { apiFetch } from '../utils/api';
import { downloadOrShareStoryCard } from '../utils/shareCard';
import { MediaDisplay, MediaUploader } from './MediaUploader';

export function MoodCheckinSection({
  onMoodChecked,
  selectedPreviewMood,
  onSelectPreviewMood,
}: {
  onMoodChecked?: (trending: TrendingMoodStat[], total: number) => void;
  selectedPreviewMood?: MoodName;
  onSelectPreviewMood?: (mood: MoodName) => void;
}) {
  const { userState, refreshUser, showToast, setAuthModalOpen } = useVibe();
  const [selectedMood, setSelectedMood] = useState<MoodName>(
    selectedPreviewMood ?? 'Main Character Energy'
  );
  const [note, setNote] = useState('');
  const [media, setMedia] = useState<MediaAttachment | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkedMoodCard, setCheckedMoodCard] = useState<{
    mood: MoodDefinition;
    note: string;
    media?: MediaAttachment;
    timestamp: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const activeMoodDef = MOOD_MAP[selectedMood];

  const handleSelectMood = (moodName: MoodName) => {
    setSelectedMood(moodName);
    onSelectPreviewMood?.(moodName);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<{
        checkin: { mood: MoodName; note: string; media?: MediaAttachment; createdAt: string };
        trending: TrendingMoodStat[];
        totalCheckins: number;
      }>('/api/moods/checkin', {
        method: 'POST',
        body: JSON.stringify({
          mood: selectedMood,
          note: note.trim(),
          media: media ?? undefined,
          isPublic,
        }),
      });
      setCheckedMoodCard({
        mood: MOOD_MAP[res.checkin.mood],
        note: res.checkin.note,
        media: res.checkin.media,
        timestamp: res.checkin.createdAt,
      });
      setNote('');
      setMedia(null);
      onMoodChecked?.(res.trending, res.totalCheckins);
      if (userState) {
        await refreshUser();
      }
      showToast(`Checked in as ${selectedMood}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save mood check-in.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cardToShow: {
    mood: MoodDefinition;
    note: string;
    media?: MediaAttachment;
    timestamp: string;
  } = checkedMoodCard ?? {
    mood: activeMoodDef,
    note: '',
    media: media ?? undefined,
    timestamp: new Date().toISOString(),
  };

  const handleShareCard = async () => {
    const result = await downloadOrShareStoryCard({
      kicker: `Daily Vibe Check  ·  ${cardToShow.mood.badgeText}`,
      title: `${cardToShow.mood.emoji} ${cardToShow.mood.name}`,
      subtitle: cardToShow.mood.vibeTitle,
      body: cardToShow.note
        ? `"${cardToShow.note}" — ${cardToShow.mood.affirmation}`
        : cardToShow.mood.affirmation,
      stats: [
        { label: 'Energy', value: `${cardToShow.mood.energyPercent}%` },
        { label: 'Chaos', value: `${cardToShow.mood.chaosPercent}%` },
        { label: 'Softness', value: `${cardToShow.mood.softnessPercent}%` },
      ],
      footerHandle: userState ? `@${userState.user.username}` : '@vibecheck',
      accentFrom: cardToShow.mood.auraPair[0],
      accentTo: cardToShow.mood.auraPair[1],
      fileName: `vibecheck-${cardToShow.mood.name.toLowerCase().replace(/\s+/g, '-')}.png`,
    });
    if (result === 'shared') {
      showToast('Mood card shared', 'success');
    } else if (result === 'downloaded') {
      showToast('Story card downloaded as PNG', 'success');
    } else {
      showToast('Could not export card image', 'error');
    }
  };

  const handleCopyText = async () => {
    const shareText = `My Vibe Check today: ${cardToShow.mood.emoji} ${cardToShow.mood.name} — "${cardToShow.mood.vibeTitle}". ${cardToShow.mood.affirmation}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      showToast('Copied mood card text', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Clipboard permission unavailable', 'error');
    }
  };

  return (
    <section id="mood-checkin" className="scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Mood Selector & Note Form */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                  Daily Mood Check-in
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1 text-balance">
                  Pick the frequency you are on right now
                </h2>
              </div>
              {!userState && (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                >
                  Sign in to track history
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MOODS.map((m) => {
                const isSelected = selectedMood === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => handleSelectMood(m.name)}
                    className={`min-h-[68px] px-3 py-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-violet-600 dark:border-violet-400 bg-violet-50/90 dark:bg-violet-500/20 text-slate-950 dark:text-white shadow-sm'
                        : 'border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-500/40'
                    }`}
                  >
                    <span className="text-xl leading-none" aria-hidden="true">
                      {m.emoji}
                    </span>
                    <span className="text-xs font-semibold leading-tight mt-2 line-clamp-2">
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCheckIn} className="mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10 space-y-4">
            <div>
              <label
                htmlFor="mood-note"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Optional Vibe Note (180 chars max)
              </label>
              <input
                id="mood-note"
                type="text"
                maxLength={180}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`What's fueling your ${selectedMood.toLowerCase()} era today?`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-950 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <p className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Attach Mood Snap (Photo or Video)
              </p>
              <MediaUploader value={media} onChange={setMedia} variant="compact" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600"
                />
                <span>Include in live community mood pulse</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
              >
                {submitting ? 'Logging Vibe...' : 'Lock In My Mood'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Personalized Mood Card */}
        <motion.div
          key={cardToShow.mood.name + (checkedMoodCard ? checkedMoodCard.timestamp : 'preview')}
          initial={{ opacity: 0.85, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-5 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-lg"
          style={{
            backgroundImage: `linear-gradient(145deg, ${cardToShow.mood.auraPair[0]}, ${cardToShow.mood.auraPair[1]} 65%, #1E1B4B 120%)`,
          }}
        >
          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between text-xs text-white/85 font-medium">
              <span>{checkedMoodCard ? 'Your Mood Card · Saved' : 'Live Mood Preview'}</span>
              <span className="font-mono">{cardToShow.mood.badgeText}</span>
            </div>

            <div>
              <span className="text-5xl block mb-3" aria-hidden="true">
                {cardToShow.mood.emoji}
              </span>
              <h3 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {cardToShow.mood.name}
              </h3>
              <p className="text-base font-medium text-white/90 mt-1">
                {cardToShow.mood.vibeTitle}
              </p>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-white/95 bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/15">
              {cardToShow.note
                ? `"${cardToShow.note}" — ${cardToShow.mood.affirmation}`
                : cardToShow.mood.affirmation}
            </p>

            {cardToShow.media && (
              <MediaDisplay
                media={cardToShow.media}
                alt={`${cardToShow.mood.name} mood snap`}
                compact
              />
            )}

            {/* Aura Breakdown Metrics */}
            <div className="space-y-2.5 pt-1">
              {[
                { label: 'Energy', val: cardToShow.mood.energyPercent },
                { label: 'Chaos', val: cardToShow.mood.chaosPercent },
                { label: 'Softness', val: cardToShow.mood.softnessPercent },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-white/90">
                    <span>{stat.label}</span>
                    <span className="font-mono tabular-nums font-semibold">{stat.val}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{ width: `${stat.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-white/85 font-medium">
              {cardToShow.mood.soundtrack}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3.5 py-2 min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareCard}
                className="px-4 py-2 min-h-[40px] rounded-xl bg-white text-slate-950 hover:bg-white/90 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Card</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
