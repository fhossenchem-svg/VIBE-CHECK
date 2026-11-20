import { Moon, Sun } from 'lucide-react';
import { type NavTab, useVibe } from '../context/VibeContext';

export function Footer() {
  const { setActiveTab, theme, toggleTheme, userState, setAuthModalOpen, setWrappedModalOpen } =
    useVibe();

  const jump = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0E0C16]/80 backdrop-blur-md pb-20 md:pb-12 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-200/80 dark:border-white/10">
          <div className="md:col-span-5 space-y-3">
            <p className="font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              VIBE CHECK
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
              Your mood. Your people. Your internet. Built for honest daily check-ins, unfiltered
              confessions, playful quizzes, and monthly reflection.
            </p>
          </div>

          <div className="md:col-span-4 grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2.5">
              <p className="font-semibold text-slate-900 dark:text-white">Explore</p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => jump('home')}
                    className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => jump('discover')}
                    className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    Discover
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => jump('confessions')}
                    className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    Confessions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => jump('quizzes')}
                    className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    Quizzes
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-semibold text-slate-900 dark:text-white">Your Space</p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => jump('profile')}
                    className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    My Profile
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setWrappedModalOpen(true)}
                    className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    Monthly Wrapped
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer"
                  >
                    {userState ? `@${userState.user.username}` : 'Sign In'}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col items-start md:items-end justify-between gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400 md:text-right">
              Community-moderated space · Zero toxic engagement traps
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} VIBE CHECK. Your mood. Your people. Your internet.</p>
          <p>Privacy-first anonymous confessions · Real-time mood telemetry</p>
        </div>
      </div>
    </footer>
  );
}
