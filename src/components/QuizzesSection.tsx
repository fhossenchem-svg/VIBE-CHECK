import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, RotateCcw, Share2, Star } from 'lucide-react';
import { QUIZZES } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type { QuizDefinition, QuizOutcome, SavedQuizResult } from '../types';
import { apiFetch } from '../utils/api';
import { downloadOrShareStoryCard } from '../utils/shareCard';

export function QuizzesSection({
  compact = false,
  initialQuizId,
  onClearInitialQuiz,
}: {
  compact?: boolean;
  initialQuizId?: string | null;
  onClearInitialQuiz?: () => void;
}) {
  const { userState, refreshUser, showToast, setActiveTab } = useVibe();
  const [quizzes, setQuizzes] = useState<QuizDefinition[]>(QUIZZES);
  const [activeQuiz, setActiveQuiz] = useState<QuizDefinition | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const [savedRecord, setSavedRecord] = useState<SavedQuizResult | null>(null);

  useEffect(() => {
    apiFetch<{ quizzes: QuizDefinition[] }>('/api/quizzes')
      .then((res) => setQuizzes(res.quizzes))
      .catch(() => {
        // fallback to local quiz list
      });
  }, []);

  useEffect(() => {
    if (initialQuizId) {
      const found = quizzes.find((q) => q.id === initialQuizId);
      if (found) {
        startQuiz(found);
      }
      onClearInitialQuiz?.();
    }
  }, [initialQuizId, quizzes, onClearInitialQuiz]);

  const startQuiz = (quiz: QuizDefinition) => {
    setActiveQuiz(quiz);
    setStepIndex(0);
    setAnswers([]);
    setOutcome(null);
    setSavedRecord(null);
  };

  const handleChoose = async (outcomeKey: string) => {
    if (!activeQuiz) return;
    const nextAnswers = [...answers];
    nextAnswers[stepIndex] = outcomeKey;
    setAnswers(nextAnswers);

    if (stepIndex + 1 < activeQuiz.questions.length) {
      setStepIndex(stepIndex + 1);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{
        outcome: QuizOutcome;
        playsCount: number;
        savedResult: SavedQuizResult | null;
      }>(`/api/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: nextAnswers }),
      });
      setOutcome(res.outcome);
      setSavedRecord(res.savedResult);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === activeQuiz.id ? { ...q, playsCount: res.playsCount } : q))
      );
      if (userState) {
        await refreshUser();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not compute result.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!savedRecord) return;
    try {
      const res = await apiFetch<{ result: SavedQuizResult }>(
        `/api/quizzes/results/${savedRecord.id}/favorite`,
        { method: 'POST' }
      );
      setSavedRecord(res.result);
      await refreshUser();
      showToast(
        res.result.isFavorite ? 'Starred to your favorite quiz results' : 'Removed favorite star',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update favorite.', 'error');
    }
  };

  const handleShareResult = async () => {
    if (!activeQuiz || !outcome) return;
    const res = await downloadOrShareStoryCard({
      kicker: activeQuiz.title,
      title: outcome.title,
      subtitle: outcome.subtitle,
      body: outcome.shareQuote,
      stats: [
        { label: 'Match', value: `${outcome.matchPercent}%` },
        { label: 'Trait', value: outcome.traits[0]?.split(' ')[0] ?? 'Iconic' },
      ],
      footerHandle: userState ? `@${userState.user.username}` : '@vibecheck',
      accentFrom: outcome.accentFrom,
      accentTo: outcome.accentTo,
      fileName: `vibecheck-${activeQuiz.slug}.png`,
    });
    if (res === 'shared') showToast('Quiz result shared', 'success');
    else if (res === 'downloaded') showToast('Result card saved as PNG', 'success');
  };

  const displayedQuizzes = compact ? quizzes.slice(0, 3) : quizzes;

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
            Personality Quizzes
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1 text-balance">
            {compact ? 'Popular personality quizzes' : 'Decode your energy in 2 minutes'}
          </h2>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('quizzes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer self-start md:self-auto"
          >
            Explore all 6 quizzes →
          </button>
        )}
      </div>

      {/* Interactive Quiz Modal / Inline Arena */}
      {activeQuiz && (
        <div className="rounded-3xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-[#141120] p-6 sm:p-8 shadow-lg">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/10">
            <div>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">
                {activeQuiz.category} · {activeQuiz.durationLabel}
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white mt-0.5">
                {activeQuiz.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveQuiz(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              Close Quiz
            </button>
          </div>

          {!outcome ? (
            <div className="pt-6 space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  <span>
                    Question {stepIndex + 1} of {activeQuiz.questions.length}
                  </span>
                  <span>
                    {Math.round(((stepIndex + 1) / activeQuiz.questions.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-400 transition-all duration-300"
                    style={{
                      width: `${((stepIndex + 1) / activeQuiz.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <motion.div
                key={activeQuiz.questions[stepIndex].id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h4 className="font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                  {activeQuiz.questions[stepIndex].prompt}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeQuiz.questions[stepIndex].choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleChoose(choice.outcomeKey)}
                      className="p-4 min-h-[60px] rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.04] hover:border-violet-500 dark:hover:border-violet-400 hover:bg-violet-50/70 dark:hover:bg-violet-500/15 text-left text-sm font-medium text-slate-900 dark:text-slate-100 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <span>{choice.label}</span>
                      <ArrowRight className="w-4 h-4 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous question</span>
                </button>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="mt-6 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, ${outcome.accentFrom}, ${outcome.accentTo} 65%, #1E1B4B 115%)`,
              }}
            >
              <div className="space-y-5 max-w-2xl">
                <div className="flex items-center gap-3 text-xs font-mono text-white/85">
                  <span>Your Result</span>
                  <span>·</span>
                  <span className="tabular-nums">{outcome.matchPercent}% Match</span>
                </div>

                <div>
                  <h4 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                    {outcome.title}
                  </h4>
                  <p className="text-base font-medium text-white/90 mt-1">{outcome.subtitle}</p>
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-white/95">
                  {outcome.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/90">
                  {outcome.traits.map((trait, idx) => (
                    <span key={trait} className="inline-flex items-center gap-2">
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span>{trait}</span>
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/20 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="px-5 py-2.5 min-h-[42px] rounded-xl bg-white text-slate-950 font-semibold text-xs inline-flex items-center gap-2 hover:bg-white/90 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Result Card</span>
                  </button>

                  {savedRecord && (
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className="px-4 py-2.5 min-h-[42px] rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${savedRecord.isFavorite ? 'fill-amber-300 text-amber-300' : ''}`}
                      />
                      <span>{savedRecord.isFavorite ? 'Favorited' : 'Save Favorite'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startQuiz(activeQuiz)}
                    className="px-4 py-2.5 min-h-[42px] rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedQuizzes.map((quiz) => {
          const firstOutcome = Object.values(quiz.outcomes)[0];
          return (
            <article
              key={quiz.id}
              className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div>
                <div
                  className="h-2.5 w-16 rounded-full mb-5"
                  style={{
                    backgroundImage: `linear-gradient(90deg, ${firstOutcome.accentFrom}, ${firstOutcome.accentTo})`,
                  }}
                />
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-semibold text-violet-700 dark:text-violet-300">
                    {quiz.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{quiz.durationLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {(quiz.playsCount ?? 0).toLocaleString()} plays
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white leading-snug">
                  {quiz.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {quiz.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {quiz.questions.length} questions
                </span>
                <button
                  type="button"
                  onClick={() => startQuiz(quiz)}
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Take Quiz
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
