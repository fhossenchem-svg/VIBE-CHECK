import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AESTHETICS, AVATAR_PRESETS } from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import { AvatarArt } from './AuraArtwork';

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, register, loginDemo } = useVibe();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreset, setAvatarPreset] = useState('aurora');
  const [favoriteAesthetic, setFavoriteAesthetic] = useState<string>(AESTHETICS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register({
          username,
          displayName,
          password,
          bio,
          avatarPreset,
          favoriteAesthetic,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginDemo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign into demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#151221] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-2xl font-bold text-slate-950 dark:text-white"
            >
              {mode === 'login' ? 'Sign in to VIBE CHECK' : 'Claim your handle'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Save mood history, favorite confessions, and unlock Monthly Vibe Wrapped.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close authentication modal"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-[#211C33] text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-[#211C33] text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-800 dark:text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sky_daydream"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How friends see you"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Bio
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="2AM playlists & iced matcha..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pick Profile Aura
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarPreset(preset.id)}
                      className={`p-1 rounded-2xl flex items-center justify-center transition-transform cursor-pointer ${
                        avatarPreset === preset.id
                          ? 'ring-2 ring-violet-600 dark:ring-violet-400 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <AvatarArt presetId={preset.id} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Favorite Aesthetic
                </label>
                <select
                  value={favoriteAesthetic}
                  onChange={(e) => setFavoriteAesthetic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1A2E] text-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  {AESTHETICS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 disabled:opacity-60 transition-all cursor-pointer"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create My Profile'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            disabled={submitting}
            onClick={handleDemo}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-violet-200 dark:border-violet-500/30 bg-violet-50/70 dark:bg-violet-500/10 text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors cursor-pointer"
          >
            Continue with Demo Account (@luna_vibes)
          </button>
        </div>
      </div>
    </div>
  );
}
