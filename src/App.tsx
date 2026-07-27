import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CharacterDashboard } from './components/character/CharacterDashboard';
import { useGameStore } from './store/gameStore';
import { CollectionPage } from './components/collection/CollectionPage';
import { AdventurePage } from './pages/AdventureScreen';
import { AchievementPage } from './components/achievement/AchievementPage';
import { AchievementPopup } from './components/Modals/AchievementPopup';
import { useAuthStore, initAuthListener } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { LoginPage } from './components/LoginPage';
import { UsernameSetupPage } from './pages/UsernameSetupPage';
import './utils/statSimulator';

function App() {
  const { currentPage, collectionData } = useGameStore();
  const { user, userProfile, isLoading } = useAuthStore();
  const { subscribeToChat } = useChatStore();
  // 🟢 2. เพิ่ม State สำหรับควบคุมการเปิด-ปิดตลาดกลาง


  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    if (user && userProfile) {
      const unsubscribe = subscribeToChat();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user, userProfile, subscribeToChat]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        Loading . . .
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!userProfile) {
    return <UsernameSetupPage />;
  }

  return (
    <div className="flex bg-slate-950 min-h-screen text-white relative">
      <Sidebar />

      <main className="flex-1 p-8">
        {currentPage === 'home' && <CharacterDashboard />}
        {currentPage === 'collection' && <CollectionPage collectionData={collectionData} />}
        {currentPage === 'adventure' && <AdventurePage />}
        {currentPage === 'achievement' && <AchievementPage />}
      </main>

      <AchievementPopup />


    </div>
  );
}

export default App;