import { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { ConfessionsSection } from './components/ConfessionsSection';
import { DiscoverPage } from './components/DiscoverPage';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ProfilePage } from './components/ProfilePage';
import { QuizzesSection } from './components/QuizzesSection';
import { WrappedModal } from './components/WrappedModal';
import { useVibe, VibeProvider } from './context/VibeContext';

function VibeShell() {
  const { activeTab, setActiveTab } = useVibe();
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(null);

  const handleCheckVibe = () => {
    setActiveTab('home');
    setTimeout(() => {
      const el = document.getElementById('mood-checkin');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleLaunchQuiz = (quizId: string) => {
    setPendingQuizId(quizId);
    setActiveTab('quizzes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip bg-[#FAFAFC] dark:bg-[#0B0A10] text-[#110E1B] dark:text-[#F5F3FF]">
      {/* Subtle Ambient Animated Aura Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="animate-vibe-a absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-violet-300/30 dark:bg-violet-700/15 blur-3xl" />
        <div className="animate-vibe-b absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-pink-300/25 dark:bg-fuchsia-700/15 blur-3xl" />
        <div className="animate-vibe-a absolute bottom-0 left-1/3 w-[440px] h-[440px] rounded-full bg-sky-300/25 dark:bg-sky-700/10 blur-3xl" />
      </div>

      <Header onCheckVibe={handleCheckVibe} />

      <main className="relative z-10 flex-1">
        {activeTab === 'home' && <HomePage onLaunchQuiz={handleLaunchQuiz} />}
        {activeTab === 'discover' && <DiscoverPage onLaunchQuiz={handleLaunchQuiz} />}
        {activeTab === 'confessions' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <ConfessionsSection />
          </div>
        )}
        {activeTab === 'quizzes' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <QuizzesSection
              initialQuizId={pendingQuizId}
              onClearInitialQuiz={() => setPendingQuizId(null)}
            />
          </div>
        )}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      <div className="relative z-10">
        <Footer />
      </div>

      <AuthModal />
      <WrappedModal />
    </div>
  );
}

export default function App() {
  return (
    <VibeProvider>
      <VibeShell />
    </VibeProvider>
  );
}
