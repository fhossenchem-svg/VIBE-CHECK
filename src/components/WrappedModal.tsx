import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, Share2, X } from 'lucide-react';
import { MOOD_MAP } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type { WrappedSummary } from '../types';
import { apiFetch } from '../utils/api';
import { downloadOrShareStoryCard } from '../utils/shareCard';

const SLIDE_GRADIENTS = [
  'linear-gradient(155deg, #7C3AED 0%, #EC4899 58%, #1E1B4B 115%)',
  'linear-gradient(155deg, #A78BFA 0%, #38BDF8 62%, #1E1B4B 115%)',
  'linear-gradient(155deg, #EC4899 0%, #8B5CF6 55%, #0F172A 115%)',
  'linear-gradient(155deg, #4F46E5 0%, #C084FC 58%, #0B0A10 115%)',
  'linear-gradient(155deg, #7C3AED 0%, #F472B6 50%, #38BDF8 100%)',
];

export function WrappedModal() {
  const { wrappedModalOpen, setWrappedModalOpen, setAuthModalOpen, showToast } = useVibe();
  const [summary, setSummary] = useState<WrappedSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!wrappedModalOpen) return;
    setSlide(0);
    setLoading(true);
    apiFetch<WrappedSummary>('/api/wrapped')
      .then((res) => setSummary(res))
      .catch(() => showToast('Could not load Vibe Wrapped.', 'error'))
      .finally(() => setLoading(false));
  }, [wrappedModalOpen, showToast]);

  if (!wrappedModalOpen) return null;

  const totalSlides = 5;
  const topMoodMeta = summary ? MOOD_MAP[summary.topMood] : MOOD_MAP['Main Character Energy'];

  const handleShareStory = async () => {
    if (!summary) return;
    const res = await downloadOrShareStoryCard({
      kicker: `VIBE WRAPPED  ·  ${summary.monthLabel}`,
      title: summary.vibePersonality,
      subtitle: `Top Mood: ${topMoodMeta?.emoji ?? ''} ${summary.topMood} (${summary.topMoodPercent}%)`,
      body: summary.highlights.join('  •  '),
      stats: [
        { label: 'Check-ins', value: String(Math.max(summary.totalCheckins, summary.moodBreakdown.reduce((s, b) => s + b.count, 0))) },
        { label: 'Streak', value: `${summary.streakDays}d` },
        { label: 'Top Aura', value: `${summary.topMoodPercent}%` },
      ],
      footerHandle: summary.handle,
      accentFrom: topMoodMeta?.auraPair[0] ?? '#7C3AED',
      accentTo: topMoodMeta?.auraPair[1] ?? '#EC4899',
      fileName: `vibe-wrapped-${summary.monthLabel.toLowerCase().replace(/\s+/g, '-')}.png`,
    });
    if (res === 'shared') showToast('Vibe Wrapped shared!', 'success');
    else if (res === 'downloaded') showToast('9:16 Story PNG downloaded!', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Monthly Vibe Wrapped"
    >
      <div
        className="w-full max-w-[440px] min-h-[600px] max-h-[92vh] rounded-[32px] text-white relative overflow-hidden flex flex-col justify-between p-6 sm:p-7 shadow-2xl border border-white/20"
        style={{ backgroundImage: SLIDE_GRADIENTS[slide % SLIDE_GRADIENTS.length] }}
      >
        {/* Top Story Progress Bars + Close */}
        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Jump to slide ${idx + 1}`}
                onClick={() => setSlide(idx)}
                className="h-1.5 rounded-full overflow-hidden bg-white/25 cursor-pointer"
              >
                <div
                  className={`h-full rounded-full bg-white transition-all duration-300 ${
                    idx <= slide ? 'w-full' : 'w-0'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-white/85">
            <span>
              VIBE WRAPPED · {summary?.monthLabel ?? 'This Month'}
            </span>
            <button
              type="button"
              onClick={() => setWrappedModalOpen(false)}
              aria-label="Close Vibe Wrapped"
              className="w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="relative z-10 my-auto py-6">
          {loading || !summary ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 w-36 bg-white/20 rounded-xl" />
              <div className="h-24 w-full bg-white/20 rounded-2xl" />
            </div>
          ) : (
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              {summary.isPreview && (
                <div className="rounded-2xl bg-black/25 border border-white/15 px-3.5 py-2 text-xs flex items-center justify-between gap-2">
                  <span>Previewing @luna_vibes</span>
                  <button
                    type="button"
                    onClick={() => {
                      setWrappedModalOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="underline font-semibold cursor-pointer"
                  >
                    Sign in for yours
                  </button>
                </div>
              )}

              {slide === 0 && (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/80 font-semibold">
                    Chapter 01 · Monthly Pulse
                  </p>
                  <h2 className="font-display text-4xl font-extrabold leading-tight">
                    You showed up for your feelings.
                  </h2>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-2xl bg-black/25 border border-white/15 p-4">
                      <p className="text-xs text-white/75">Check-ins Logged</p>
                      <p className="font-display text-4xl font-extrabold mt-1 tabular-nums">
                        {summary.moodBreakdown.reduce((s, b) => s + b.count, 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-black/25 border border-white/15 p-4">
                      <p className="text-xs text-white/75">Active Days</p>
                      <p className="font-display text-4xl font-extrabold mt-1 tabular-nums">
                        {summary.streakDays}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {slide === 1 && (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/80 font-semibold">
                    Chapter 02 · Dominant Mood
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{topMoodMeta?.emoji}</span>
                    <div>
                      <h2 className="font-display text-3xl font-extrabold leading-tight">
                        {summary.topMood}
                      </h2>
                      <p className="text-sm text-white/85 tabular-nums">
                        {summary.topMoodPercent}% of your entire month
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2.5 pt-2">
                    {summary.moodBreakdown.slice(0, 4).map((m) => (
                      <div key={m.mood} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span>
                            {MOOD_MAP[m.mood]?.emoji} {m.mood}
                          </span>
                          <span className="font-mono tabular-nums">{m.percent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white"
                            style={{ width: `${Math.max(m.percent, 8)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {slide === 2 && (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/80 font-semibold">
                    Chapter 03 · Vibe Archetype
                  </p>
                  <h2 className="font-display text-4xl font-extrabold leading-tight">
                    {summary.vibePersonality}
                  </h2>
                  <p className="text-base text-white/90 leading-relaxed bg-black/25 rounded-2xl p-4 border border-white/15">
                    {summary.vibePersonalityDescription}
                  </p>
                </div>
              )}

              {slide === 3 && (
                <div className="space-y-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/80 font-semibold">
                    Chapter 04 · Peak Rhythm & Quiz DNA
                  </p>
                  <div className="rounded-2xl bg-black/25 border border-white/15 p-4 space-y-3">
                    <p className="text-xs font-semibold text-white/80">Most Active Days</p>
                    <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
                      {summary.mostActiveDays.map((d) => {
                        const max = Math.max(...summary.mostActiveDays.map((x) => x.count), 1);
                        const hPct = Math.max(18, Math.round((d.count / max) * 100));
                        return (
                          <div key={d.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                            <div
                              className="w-full rounded-md bg-white/85"
                              style={{ height: `${hPct}%` }}
                            />
                            <span className="text-[10px] font-mono text-white/80">{d.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {summary.favoriteQuizResults[0] && (
                    <div className="rounded-2xl bg-black/25 border border-white/15 p-4">
                      <p className="text-xs text-white/75">Signature Quiz Result</p>
                      <p className="font-display text-lg font-bold mt-0.5">
                        {summary.favoriteQuizResults[0].outcomeTitle}
                      </p>
                      <p className="text-xs text-white/80 mt-0.5">
                        {summary.favoriteQuizResults[0].quizTitle}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {slide === 4 && (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/80 font-semibold">
                    Monthly Highlights · {summary.handle}
                  </p>
                  <h2 className="font-display text-3xl font-extrabold leading-tight">
                    Ready for your story.
                  </h2>
                  <ul className="space-y-2.5 text-sm text-white/95 bg-black/25 border border-white/15 rounded-2xl p-4">
                    {summary.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <span aria-hidden="true">✦</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleShareStory}
                    className="w-full py-3.5 rounded-2xl bg-white text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save 9:16 Instagram Story Card</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Slide Navigation Controls */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/15">
          <button
            type="button"
            disabled={slide === 0}
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            className="px-3.5 py-2 rounded-xl bg-black/25 hover:bg-black/40 disabled:opacity-35 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleShareStory}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {slide < totalSlides - 1 ? (
            <button
              type="button"
              onClick={() => setSlide((s) => Math.min(totalSlides - 1, s + 1))}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setWrappedModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
