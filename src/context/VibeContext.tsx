import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserFullState } from '../types';
import { apiFetch, getAuthToken, setAuthToken } from '../utils/api';

export type NavTab = 'home' | 'discover' | 'confessions' | 'quizzes' | 'profile';
export type ThemeMode = 'light' | 'dark';

export interface ToastItem {
  id: string;
  message: string;
  tone: 'default' | 'success' | 'error';
}

interface RegisterPayload {
  username: string;
  displayName: string;
  password: string;
  bio: string;
  avatarPreset: string;
  favoriteAesthetic: string;
}

interface VibeContextValue {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  userState: UserFullState | null;
  authLoading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  wrappedModalOpen: boolean;
  setWrappedModalOpen: (open: boolean) => void;
  showToast: (message: string, tone?: 'default' | 'success' | 'error') => void;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: Partial<UserFullState['user']>) => Promise<void>;
}

const VibeContext = createContext<VibeContextValue | null>(null);

const THEME_STORAGE_KEY = 'vibecheck_theme';

export function VibeProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [userState, setUserState] = useState<UserFullState | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [wrappedModalOpen, setWrappedModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const showToast = useCallback((message: string, tone: 'default' | 'success' | 'error' = 'default') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) {
      setAuthLoading(false);
      return;
    }
    try {
      const data = await apiFetch<UserFullState>('/api/auth/me');
      setUserState(data);
    } catch {
      setAuthToken(null);
      setUserState(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await apiFetch<UserFullState & { token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAuthToken(data.token);
      setUserState({
        user: data.user,
        moodHistory: data.moodHistory,
        savedConfessions: data.savedConfessions,
        quizResults: data.quizResults,
      });
      setAuthModalOpen(false);
      showToast(`Welcome back, @${data.user.username}`, 'success');
    },
    [showToast]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await apiFetch<UserFullState & { token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(data.token);
      setUserState({
        user: data.user,
        moodHistory: data.moodHistory,
        savedConfessions: data.savedConfessions,
        quizResults: data.quizResults,
      });
      setAuthModalOpen(false);
      showToast(`Account created for @${data.user.username}`, 'success');
    },
    [showToast]
  );

  const loginDemo = useCallback(async () => {
    const data = await apiFetch<UserFullState & { token: string }>('/api/auth/demo', {
      method: 'POST',
    });
    setAuthToken(data.token);
    setUserState({
      user: data.user,
      moodHistory: data.moodHistory,
      savedConfessions: data.savedConfessions,
      quizResults: data.quizResults,
    });
    setAuthModalOpen(false);
    showToast(`Signed in as @${data.user.username}`, 'success');
  }, [showToast]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthToken(null);
    setUserState(null);
    showToast('Signed out');
  }, [showToast]);

  const updateProfile = useCallback(
    async (patch: Partial<UserFullState['user']>) => {
      const updated = await apiFetch<UserFullState>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setUserState(updated);
      showToast('Profile updated', 'success');
    },
    [showToast]
  );

  return (
    <VibeContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        userState,
        authLoading,
        authModalOpen,
        setAuthModalOpen,
        wrappedModalOpen,
        setWrappedModalOpen,
        showToast,
        login,
        register,
        loginDemo,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
      {/* Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg border backdrop-blur-md transition-all ${
              t.tone === 'error'
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                : t.tone === 'success'
                  ? 'bg-violet-50/95 dark:bg-violet-950/90 border-violet-200 dark:border-violet-800 text-violet-950 dark:text-violet-100'
                  : 'bg-white/95 dark:bg-[#191626]/95 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </VibeContext.Provider>
  );
}

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) throw new Error('useVibe must be used within VibeProvider');
  return ctx;
}
