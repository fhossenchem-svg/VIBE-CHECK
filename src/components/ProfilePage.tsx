import React, { useRef, useState } from 'react';
import { Edit3, ImagePlus, LogOut, Sparkles, Star, X } from 'lucide-react';
import {
  AESTHETICS,
  AVATAR_PRESETS,
  MOOD_MAP,
  PROFILE_THEMES,
} from '../data/vibeData';
import { useVibe } from '../context/VibeContext';
import type { AestheticId, ProfileThemeId } from '../types';
import { apiFetch, uploadMediaFile } from '../utils/api';
import { AvatarArt } from './AuraArtwork';
import { MediaDisplay } from './MediaUploader';
import { MoodTrendChart } from './MoodTrendChart';

export function ProfilePage() {
  const {
    userState,
    authLoading,
    setAuthModalOpen,
    loginDemo,
    logout,
    updateProfile,
    setWrappedModalOpen,
    refreshUser,
    showToast,
    setActiveTab,
  } = useVibe();

  const [profileTab, setProfileTab] = useState<'moods' | 'saved' | 'quizzes'>('moods');
  const [editing, setEditing] = useState(false);

  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('aurora');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | undefined>(undefined);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [editAesthetic, setEditAesthetic] = useState<AestheticId>('Dreamcore Lavender');
  const [editTheme, setEditTheme] = useState<ProfileThemeId>('lavender-haze');
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditor = () => {
    if (!userState) return;
    setEditUsername(userState.user.username);
    setEditDisplayName(userState.user.displayName);
    setEditBio(userState.user.bio);
    setEditAvatar(userState.user.avatarPreset);
    setEditAvatarUrl(userState.user.avatarUrl);
    setEditAesthetic(userState.user.favoriteAesthetic);
    setEditTheme(userState.user.profileTheme);
    setEditing(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadMediaFile(file);
      if (uploaded.mediaType !== 'image') {
        showToast('Please select an image file for your profile picture.', 'error');
        return;
      }
      setEditAvatarUrl(uploaded.url);
      showToast('Profile photo ready — save changes to apply', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Photo upload failed.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await updateProfile({
        username: editUsername,
        displayName: editDisplayName,
        bio: editBio,
        avatarPreset: editAvatar,
        avatarUrl: editAvatarUrl ?? '',
        favoriteAesthetic: editAesthetic,
        profileTheme: editTheme,
      });
      setEditing(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update profile.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleQuizFavorite = async (resultId: string) => {
    try {
      await apiFetch(`/api/quizzes/results/${resultId}/favorite`, { method: 'POST' });
      await refreshUser();
      showToast('Updated favorite quiz results', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update favorite.', 'error');
    }
  };

  const handleUnsaveConfession = async (confId: string) => {
    try {
      await apiFetch(`/api/confessions/${confId}/save`, { method: 'POST' });
      await refreshUser();
      showToast('Removed from saved confessions');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update saved item.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="h-64 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141120] animate-pulse" />
      </div>
    );
  }

  if (!userState) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-8 sm:p-12 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-400 flex items-center justify-center text-white text-2xl font-display font-bold">
            ✦
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="font-display text-3xl font-extrabold text-slate-950 dark:text-white">
              Your corner of the internet
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Create an account to track your daily mood history, save favorite confessions and
              quizzes, customize your profile aura, and unlock your Monthly Vibe Wrapped.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 text-white text-sm font-semibold hover:brightness-110 cursor-pointer"
            >
              Sign In or Create Account
            </button>
            <button
              type="button"
              onClick={loginDemo}
              className="px-5 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              Explore Demo Profile (@luna_vibes)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, moodHistory, savedConfessions, quizResults } = userState;
  const activeTheme =
    PROFILE_THEMES.find((t) => t.id === user.profileTheme) ?? PROFILE_THEMES[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      {/* Profile Hero Banner */}
      <div
        className={`rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br ${activeTheme.gradient} bg-white dark:bg-[#141120] p-6 sm:p-8`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <AvatarArt presetId={user.avatarPreset} avatarUrl={user.avatarUrl} size="xl" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-mono">@{user.username}</span>
                <span aria-hidden="true">·</span>
                <span>{user.favoriteAesthetic}</span>
                {user.isModerator && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-violet-700 dark:text-violet-300">
                      Community Moderator
                    </span>
                  </>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
                {user.displayName}
              </h1>
              <p className="text-sm text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                {user.bio || 'No bio added yet.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setWrappedModalOpen(true)}
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:brightness-110 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Monthly Vibe Wrapped</span>
            </button>

            <button
              type="button"
              onClick={openEditor}
              className="px-4 py-2.5 min-h-[42px] rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white dark:hover:bg-white/15 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>

            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              className="px-3.5 py-2.5 min-h-[42px] rounded-xl border border-slate-200 dark:border-white/15 bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 hover:text-rose-600 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        {/* Clean Unboxed Stats Strip */}
        <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-white/10 grid grid-cols-3 gap-4 max-w-md">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mood Check-ins</p>
            <p className="font-display text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
              {moodHistory.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Saved Posts</p>
            <p className="font-display text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
              {savedConfessions.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quiz Results</p>
            <p className="font-display text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
              {quizResults.length}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Panel */}
      {editing && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-3xl border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-[#141120] p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              Customize Profile & Theme
            </h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bio
            </label>
            <input
              type="text"
              maxLength={160}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-950 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Profile Picture (Upload Photo or Choose Aura)
              </label>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <AvatarArt presetId={editAvatar} avatarUrl={editAvatarUrl} size="md" />
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => avatarFileRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 hover:border-violet-400 cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                </button>
                {editAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setEditAvatarUrl(undefined)}
                    className="px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Photo</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setEditAvatar(p.id);
                      setEditAvatarUrl(undefined);
                    }}
                    className={`p-1 rounded-2xl cursor-pointer transition-transform ${
                      !editAvatarUrl && editAvatar === p.id
                        ? 'ring-2 ring-violet-600 dark:ring-violet-400 scale-105'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <AvatarArt presetId={p.id} size="md" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Favorite Aesthetic
              </label>
              <select
                value={editAesthetic}
                onChange={(e) => setEditAesthetic(e.target.value as AestheticId)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1E1A2E] text-sm text-slate-950 dark:text-white"
              >
                {AESTHETICS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Profile Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PROFILE_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditTheme(t.id)}
                  className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                    editTheme === t.id
                      ? 'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-500/20 text-slate-950 dark:text-white'
                      : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className="block w-full h-3 rounded-full mb-2"
                    style={{ backgroundColor: t.accent }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingEdit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-semibold cursor-pointer"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Weekly Mood Trends & Vibe Consistency Line Graph */}
      <MoodTrendChart moodHistory={moodHistory} onCheckVibe={() => setActiveTab('home')} />

      {/* Profile Content Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'moods' as const, label: `Mood History (${moodHistory.length})` },
          { id: 'saved' as const, label: `Saved Confessions (${savedConfessions.length})` },
          { id: 'quizzes' as const, label: `Quiz Results (${quizResults.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setProfileTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              profileTab === tab.id
                ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {profileTab === 'moods' && (
        <div className="space-y-3">
          {moodHistory.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141120] p-10 text-center space-y-3">
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                No mood check-ins logged yet
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Head to Home to log today&apos;s mood and start building your Monthly Vibe Wrapped.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
              >
                Check My Vibe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moodHistory.map((item) => {
                const meta = MOOD_MAP[item.mood];
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-5 flex items-start gap-4"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-2xl text-white"
                      style={{
                        backgroundImage: meta
                          ? `linear-gradient(135deg, ${meta.auraPair[0]}, ${meta.auraPair[1]})`
                          : undefined,
                      }}
                    >
                      {meta?.emoji}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display font-bold text-slate-950 dark:text-white">
                          {item.mood}
                        </p>
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.note || meta?.vibeTitle}
                      </p>
                      {item.media && (
                        <div className="pt-2">
                          <MediaDisplay media={item.media} alt={`${item.mood} snap`} compact />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {profileTab === 'saved' && (
        <div className="space-y-4">
          {savedConfessions.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141120] p-10 text-center space-y-3">
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                No saved confessions yet
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tap Save on any confession to bookmark it here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('confessions')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
              >
                Browse Confessions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedConfessions.map((conf) => (
                <div
                  key={conf.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-violet-700 dark:text-violet-300">
                        {conf.category}
                      </span>{' '}
                      · {MOOD_MAP[conf.moodTag]?.emoji} {conf.moodTag}
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                      &ldquo;{conf.text}&rdquo;
                    </p>
                    {conf.media && (
                      <div className="pt-1">
                        <MediaDisplay media={conf.media} alt="Saved confession media" compact />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-white/10">
                    <span className="tabular-nums">{conf.likes} likes</span>
                    <button
                      type="button"
                      onClick={() => handleUnsaveConfession(conf.id)}
                      className="font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {profileTab === 'quizzes' && (
        <div className="space-y-4">
          {quizResults.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141120] p-10 text-center space-y-3">
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                No quiz results saved yet
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Take any personality quiz and your result will appear here automatically.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('quizzes')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
              >
                Take a Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizResults.map((qr) => (
                <div
                  key={qr.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141120] p-5 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        {qr.quizTitle}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleToggleQuizFavorite(qr.id)}
                        aria-label="Toggle favorite quiz result"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            qr.isFavorite
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white mt-1">
                      {qr.outcomeTitle}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {qr.outcomeSubtitle}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    &ldquo;{qr.shareQuote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
