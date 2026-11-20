import { Compass, Home, MessageSquareHeart, Sparkles, User } from 'lucide-react';
import { type NavTab, useVibe } from '../context/VibeContext';

const NAV_ITEMS: { id: NavTab; label: string; mobileLabel: string }[] = [
  { id: 'home', label: 'Home', mobileLabel: 'Home' },
  { id: 'discover', label: 'Discover', mobileLabel: 'Discover' },
  { id: 'confessions', label: 'Confessions', mobileLabel: 'Confess' },
  { id: 'quizzes', label: 'Quizzes', mobileLabel: 'Quizzes' },
  { id: 'profile', label: 'My Profile', mobileLabel: 'Profile' },
];

export function Header({ onCheckVibe }: { onCheckVibe: () => void }) {
  const { activeTab, setActiveTab } = useVibe();

  const handleNav = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 dark:border-white/10 bg-[#FAFAFC]/85 dark:bg-[#0B0A10]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="font-display text-xl font-extrabold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-md px-1"
          >
            VIBE CHECK
          </button>

          {/* Zone 2: 5 clean single-line navigation links */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`relative py-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded ${
                    isActive
                      ? 'text-violet-700 dark:text-violet-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onCheckVibe}
              className="px-5 py-2.5 min-h-[40px] rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shadow-violet-600/20 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Check My Vibe
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (keeps combined sticky height <= 15% of mobile viewport) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 border-t border-slate-200/90 dark:border-white/10 bg-white/92 dark:bg-[#110E1B]/92 backdrop-blur-md"
      >
        <div className="grid grid-cols-5 h-full">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon =
              item.id === 'home'
                ? Home
                : item.id === 'discover'
                  ? Compass
                  : item.id === 'confessions'
                    ? MessageSquareHeart
                    : item.id === 'quizzes'
                      ? Sparkles
                      : User;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-300 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
