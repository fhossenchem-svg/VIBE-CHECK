import { useState } from 'react';
import { AVATAR_PRESETS } from '../data/vibeData';

export function AvatarArt({
  presetId,
  avatarUrl,
  size = 'md',
}: {
  presetId: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const [imgError, setImgError] = useState(false);
  const preset = AVATAR_PRESETS.find((p) => p.id === presetId) ?? AVATAR_PRESETS[0];
  const dims =
    size === 'sm'
      ? 'w-8 h-8 text-sm'
      : size === 'md'
        ? 'w-11 h-11 text-base'
        : size === 'lg'
          ? 'w-16 h-16 text-2xl'
          : 'w-20 h-20 text-3xl';

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`${dims} rounded-2xl shrink-0 overflow-hidden border border-white/20 shadow-sm bg-slate-200 dark:bg-white/10`}
      >
        <img
          src={avatarUrl}
          alt="User avatar"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-2xl shrink-0 flex items-center justify-center text-white font-display font-bold shadow-sm select-none relative overflow-hidden`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/25" />
      <span className="relative z-10">{preset.glyph}</span>
    </div>
  );
}

export function HeroPrismArtwork({
  activeMoodName,
  activeMoodEmoji,
  activeMoodTitle,
  auraFrom,
  auraTo,
}: {
  activeMoodName: string;
  activeMoodEmoji: string;
  activeMoodTitle: string;
  auraFrom: string;
  auraTo: string;
}) {
  return (
    <div className="relative w-full h-full min-h-[360px] lg:min-h-[460px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-[#120E24] text-white shadow-xl">
      {/* Layered animated mesh gradient */}
      <div
        className="absolute inset-0 opacity-90 transition-all duration-500"
        style={{
          backgroundImage: `radial-gradient(circle at 18% 22%, ${auraFrom}cc 0%, transparent 52%), radial-gradient(circle at 84% 78%, ${auraTo}cc 0%, transparent 54%), radial-gradient(circle at 75% 18%, rgba(56,189,248,0.45) 0%, transparent 45%), linear-gradient(145deg, #16112B 0%, #0D0A18 100%)`,
        }}
      />

      {/* Geometric editorial prism SVG */}
      <svg
        viewBox="0 0 640 480"
        className="absolute inset-0 w-full h-full opacity-75 pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="prismGradA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="prismGradB" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <circle cx="480" cy="140" r="145" fill="url(#prismGradA)" />
        <circle cx="170" cy="340" r="170" fill="url(#prismGradB)" />
        <polygon
          points="320,56 540,390 100,390"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.5"
        />
        <polygon
          points="340,94 505,360 175,360"
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1"
        />
        <path
          d="M 40 240 Q 210 150 340 245 T 620 220"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1.25"
        />
      </svg>

      {/* Editorial overlay card content with measured scrim */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-t from-black/75 via-black/20 to-transparent">
        <div className="flex items-center justify-between text-xs text-white/80 font-medium">
          <span>Today&apos;s Aura Frame</span>
          <span className="font-mono tabular-nums">35mm Prism</span>
        </div>

        <div className="my-auto py-8 flex flex-col items-start gap-3">
          <span className="text-4xl sm:text-5xl" aria-hidden="true">
            {activeMoodEmoji}
          </span>
          <p className="text-xs uppercase tracking-[0.16em] text-violet-200 font-semibold">
            {activeMoodName}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white max-w-sm">
            {activeMoodTitle}
          </h2>
        </div>

        <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
          <span>Interactive Check-In · Confessions · Wrapped</span>
          <span className="font-mono">2026</span>
        </div>
      </div>
    </div>
  );
}
