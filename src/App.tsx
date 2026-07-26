import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CharacterDashboard } from './components/character/CharacterDashboard';
import { useGameStore } from './store/gameStore';
import { CollectionPage } from './components/collection/CollectionPage';
import { AdventurePage } from './pages/AdventureScreen';
import { AchievementPage } from './components/achievement/AchievementPage';
import { WorldChat } from './components/WorldChat';                      // ← 1. นำเข้า WorldChat Component
import { AchievementPopup } from './components/Modals/AchievementPopup';
import { useAuthStore, initAuthListener } from './store/authStore';
import { LoginPage } from './components/LoginPage';
import { UsernameSetupPage } from './pages/UsernameSetupPage';
import './utils/statSimulator';

function App() {
  const { currentPage, collectionData } = useGameStore();
  const { user, userProfile, isLoading } = useAuthStore();

  useEffect(() => {
    initAuthListener();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        Loading . . .
      </div>
    );
  }

  // 1. ถ้ายังไม่ล็อกอิน ให้ไปหน้า Login
  if (!user) {
    return <LoginPage />;
  }

  // 2. ถ้าล็อกอินแล้ว แต่ยังไม่มีข้อมูลชื่อตัวละครใน Firestore ให้บังคับมาหน้าตั้งชื่อก่อน
  if (!userProfile) {
    return <UsernameSetupPage />;
  }

  // 3. ถ้าล็อกอินและมีชื่อเรียบร้อยแล้ว เข้าสู่หน้าเกมปกติ
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