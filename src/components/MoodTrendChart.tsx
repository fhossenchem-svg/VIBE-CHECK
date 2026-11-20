import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MOOD_MAP } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type { MoodCheckin, MoodName } from '../types';

type TimeRange = '7d' | '4w';

interface TrendPoint {
  label: string;
  fullDate: string;
  energy: number | null;
  softness: number | null;
  consistency: number;
  checkinsCount: number;
  dominantMood: MoodName | null;
  moodEmoji: string;
}

function getLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeVibeConsistency(checkins: MoodCheckin[], windowDays = 7): {
  overallPercent: number;
  label: string;
  activeDaysThisWeek: number;
  totalThisWeek: number;
  dominantMood: MoodName | null;
} {
  if (checkins.length === 0) {
    return {
      overallPercent: 0,
      label: 'No data yet',
      activeDaysThisWeek: 0,
      totalThisWeek: 0,
      dominantMood: null,
    };
  }

  const now = new Date();
  const weekDayKeys = new Set<string>();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    weekDayKeys.add(getLocalDayKey(d));
  }

  const recent = checkins.filter((c) => weekDayKeys.has(getLocalDayKey(new Date(c.createdAt))));
  const activeDaysSet = new Set(recent.map((c) => getLocalDayKey(new Date(c.createdAt))));
  const activeDaysThisWeek = activeDaysSet.size;

  // Cadence component (0-50): how consistently the user checks in across the 7-day window
  const cadenceScore = Math.min(1, activeDaysThisWeek / 5) * 50;

  // Emotional steadiness component (0-50): inverse of average step-to-step mood shift across recent check-ins
  const sample = (recent.length >= 2 ? recent : checkins).slice(0, 14);
  let steadinessScore = 40;
  if (sample.length >= 2) {
    const sorted = [...sample].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let totalDelta = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = MOOD_MAP[sorted[i - 1].mood];
      const curr = MOOD_MAP[sorted[i].mood];
      if (prev && curr) {
        const energyDiff = Math.abs(curr.energyPercent - prev.energyPercent);
        const chaosDiff = Math.abs(curr.chaosPercent - prev.chaosPercent);
        totalDelta += (energyDiff + chaosDiff) / 2;
      }
    }
    const avgDelta = totalDelta / (sorted.length - 1);
    steadinessScore = Math.max(12, Math.min(50, Math.round(50 - avgDelta * 0.45)));
  }

  const overallPercent = Math.max(10, Math.min(100, Math.round(cadenceScore + steadinessScore)));

  let label = 'Free-Spirited';
  if (overallPercent >= 80) label = 'Locked-In Rhythm';
  else if (overallPercent >= 62) label = 'Steady Frequency';
  else if (overallPercent >= 42) label = 'Dynamic Waves';

  // Dominant mood in recent week (fallback to overall history)
  const tallyTarget = recent.length > 0 ? recent : checkins;
  const counts = new Map<MoodName, number>();
  for (const c of tallyTarget) {
    counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
  }
  let dominantMood: MoodName | null = null;
  let maxCount = -1;
  for (const [mood, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantMood = mood;
    }
  }

  return {
    overallPercent,
    label,
    activeDaysThisWeek,
    totalThisWeek: recent.length,
    dominantMood,
  };
}

function buildWeeklySeries(checkins: MoodCheckin[]): TrendPoint[] {
  const byDay = new Map<string, MoodCheckin[]>();
  for (const item of checkins) {
    const key = getLocalDayKey(new Date(item.createdAt));
    const list = byDay.get(key) ?? [];
    list.push(item);
    byDay.set(key, list);
  }

  const now = new Date();
  const points: TrendPoint[] = [];

  // Rolling baseline for consistency trajectory over the 7-day window
  let rollingStreak = 0;

  for (let offset = 6; offset >= 0; offset--) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const key = getLocalDayKey(day);
    const dayItems = byDay.get(key) ?? [];

    if (dayItems.length > 0) {
      rollingStreak = Math.min(7, rollingStreak + 1);
    } else {
      rollingStreak = Math.max(0, rollingStreak - 0.5);
    }

    let energy: number | null = null;
    let softness: number | null = null;
    let dominantMood: MoodName | null = null;
    let moodEmoji = '';

    if (dayItems.length > 0) {
      let eSum = 0;
      let sSum = 0;
      const moodCounts = new Map<MoodName, number>();
      for (const entry of dayItems) {
        const def = MOOD_MAP[entry.mood];
        eSum += def?.energyPercent ?? 60;
        sSum += def?.softnessPercent ?? 60;
        moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1);
      }
      energy = Math.round(eSum / dayItems.length);
      softness = Math.round(sSum / dayItems.length);

      let topCount = -1;
      for (const [m, count] of moodCounts.entries()) {
        if (count > topCount) {
          topCount = count;
          dominantMood = m;
        }
      }
      if (dominantMood) {
        moodEmoji = MOOD_MAP[dominantMood]?.emoji ?? '';
      }
    }

    // Consistency curve combining active cadence & calm balance
    const daySteadiness =
      energy !== null && softness !== null
        ? Math.round(100 - Math.abs(energy - softness) * 0.35)
        : 55;
    const cadenceBonus = Math.round((rollingStreak / 5) * 45);
    const consistency = Math.max(
      18,
      Math.min(100, Math.round(cadenceBonus + daySteadiness * 0.55))
    );

    const shortDay =
      offset === 0
        ? 'Today'
        : day.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDate = day.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    points.push({
      label: shortDay,
      fullDate,
      energy,
      softness,
      consistency,
      checkinsCount: dayItems.length,
      dominantMood,
      moodEmoji,
    });
  }

  return points;
}

function buildFourWeekSeries(checkins: MoodCheckin[]): TrendPoint[] {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const points: TrendPoint[] = [];

  for (let w = 3; w >= 0; w--) {
    const end = new Date(now);
    end.setDate(now.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const bucket = checkins.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const activeDays = new Set(bucket.map((c) => getLocalDayKey(new Date(c.createdAt)))).size;

    let energy: number | null = null;
    let softness: number | null = null;
    let dominantMood: MoodName | null = null;
    let moodEmoji = '';

    if (bucket.length > 0) {
      let eSum = 0;
      let sSum = 0;
      const counts = new Map<MoodName, number>();
      for (const c of bucket) {
        const def = MOOD_MAP[c.mood];
        eSum += def?.energyPercent ?? 60;
        sSum += def?.softnessPercent ?? 60;
        counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
      }
      energy = Math.round(eSum / bucket.length);
      softness = Math.round(sSum / bucket.length);
      let top = -1;
      for (const [m, count] of counts.entries()) {
        if (count > top) {
          top = count;
          dominantMood = m;
        }
      }
      if (dominantMood) moodEmoji = MOOD_MAP[dominantMood]?.emoji ?? '';
    }

    const consistency =
      bucket.length === 0
        ? 15
        : Math.max(20, Math.min(100, Math.round((activeDays / 5) * 65 + 35)));

    const rangeLabel = `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    points.push({
      label: w === 0 ? 'This Week' : `${w}w ago`,
      fullDate: rangeLabel,
      energy,
      softness,
      consistency,
      checkinsCount: bucket.length,
      dominantMood,
      moodEmoji,
    });
  }

  return points;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number | null;
    payload?: TrendPoint;
  }>;
}

function MoodChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#171326]/95 backdrop-blur-md px-4 py-3 shadow-xl text-xs space-y-2 min-w-[190px]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-950 dark:text-white">{point.fullDate}</span>
        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {point.checkinsCount} {point.checkinsCount === 1 ? 'log' : 'logs'}
        </span>
      </div>

      {point.dominantMood ? (
        <p className="font-medium text-violet-700 dark:text-violet-300">
          {point.moodEmoji} {point.dominantMood}
        </p>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">No mood logged</p>
      )}

      <div className="pt-1.5 border-t border-slate-100 dark:border-white/10 space-y-1 font-mono tabular-nums">
        {point.energy !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 dark:text-slate-300">Vibe Energy</span>
            <span className="font-semibold text-violet-600 dark:text-violet-300">
              {point.energy}%
            </span>
          </div>
        )}
        {point.softness !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600 dark:text-slate-300">Softness</span>
            <span className="font-semibold text-pink-600 dark:text-pink-400">
              {point.softness}%
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600 dark:text-slate-300">Consistency</span>
          <span className="font-semibold text-sky-600 dark:text-sky-400">
            {point.consistency}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function MoodTrendChart({
  moodHistory,
  onCheckVibe,
}: {
  moodHistory: MoodCheckin[];
  onCheckVibe: () => void;
}) {
  const { theme } = useVibe();
  const [range, setRange] = useState<TimeRange>('7d');
  const [visibleSeries, setVisibleSeries] = useState({
    energy: true,
    softness: true,
    consistency: true,
  });

  const stats = useMemo(() => computeVibeConsistency(moodHistory, 7), [moodHistory]);

  const chartData = useMemo(
    () => (range === '7d' ? buildWeeklySeries(moodHistory) : buildFourWeekSeries(moodHistory)),
    [range, moodHistory]
  );

  const toggleSeries = (key: 'energy' | 'softness' | 'consistency') => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.energy && !next.softness && !next.consistency) {
        return prev;
      }
      return next;
    });
  };

  const gridStroke = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)';
  const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';
  const dominantMeta = stats.dominantMood ? MOOD_MAP[stats.dominantMood] : null;

  return (
    <section
      aria-label="Weekly mood trends and vibe consistency"
      className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-6 sm:p-8 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
            Mood Analytics
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white mt-0.5 text-balance">
            Weekly mood trends &amp; vibe consistency
          </h2>
        </div>

        {/* Range Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRange('7d')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              range === '7d'
                ? 'bg-white dark:bg-[#211C33] text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            This Week (7d)
          </button>
          <button
            type="button"
            onClick={() => setRange('4w')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              range === '4w'
                ? 'bg-white dark:bg-[#211C33] text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            4-Week Pace
          </button>
        </div>
      </div>

      {moodHistory.length === 0 ? (
        <div className="py-10 text-center space-y-3 border-t border-slate-100 dark:border-white/10">
          <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Your weekly mood curve starts with one check-in
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Log how you feel today to chart your energy, softness, and overall vibe consistency over
            the week.
          </p>
          <button
            type="button"
            onClick={onCheckVibe}
            className="px-5 py-2.5 min-h-[40px] rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-semibold cursor-pointer"
          >
            Check My Vibe
          </button>
        </div>
      ) : (
        <>
          {/* Clean Unboxed KPI Strip + Interactive Line Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-slate-100 dark:border-white/10">
            <div className="grid grid-cols-3 gap-6 sm:gap-10">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vibe Consistency</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                    {stats.overallPercent}%
                  </span>
                  <span className="text-xs font-medium text-sky-600 dark:text-sky-400 hidden sm:inline">
                    {stats.label}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">7-Day Cadence</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                    {stats.activeDaysThisWeek}/7
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline tabular-nums">
                    {stats.totalThisWeek} logs
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Leading Frequency</p>
                <p className="font-display text-base sm:text-lg font-bold text-slate-950 dark:text-white mt-1.5 truncate max-w-[180px]">
                  {dominantMeta ? `${dominantMeta.emoji} ${stats.dominantMood}` : '—'}
                </p>
              </div>
            </div>

            {/* Interactive Series Filter Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSeries('energy')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  visibleSeries.energy
                    ? 'border-violet-400/60 bg-violet-50 dark:bg-violet-500/15 text-violet-900 dark:text-violet-200'
                    : 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="w-2.5 h-0.5 rounded-full bg-violet-500" aria-hidden="true" />
                <span>Vibe Energy</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('softness')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  visibleSeries.softness
                    ? 'border-pink-400/60 bg-pink-50 dark:bg-pink-500/15 text-pink-900 dark:text-pink-200'
                    : 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="w-2.5 h-0.5 rounded-full bg-pink-500" aria-hidden="true" />
                <span>Softness</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('consistency')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  visibleSeries.consistency
                    ? 'border-sky-400/60 bg-sky-50 dark:bg-sky-500/15 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className="w-2.5 h-0.5 rounded-full bg-sky-500" aria-hidden="true" />
                <span>Consistency</span>
              </button>
            </div>
          </div>

          {/* Recharts Line Graph */}
          <div className="w-full min-w-0 h-[270px] sm:h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 14, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 4" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fill: tickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<MoodChartTooltip />}
                  cursor={{
                    stroke: theme === 'dark' ? 'rgba(167,139,250,0.35)' : 'rgba(124,58,237,0.25)',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 4',
                  }}
                />

                {visibleSeries.energy && (
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Vibe Energy"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    connectNulls
                    dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: theme === 'dark' ? '#141120' : '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                )}

                {visibleSeries.softness && (
                  <Line
                    type="monotone"
                    dataKey="softness"
                    name="Softness"
                    stroke="#EC4899"
                    strokeWidth={2.5}
                    connectNulls
                    dot={{ r: 4, fill: '#EC4899', strokeWidth: 2, stroke: theme === 'dark' ? '#141120' : '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#EC4899', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                )}

                {visibleSeries.consistency && (
                  <Line
                    type="monotone"
                    dataKey="consistency"
                    name="Consistency"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 3.5, fill: '#38BDF8', strokeWidth: 2, stroke: theme === 'dark' ? '#141120' : '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#38BDF8', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
