import { useEffect } from 'react';
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // 🟢 1. นำเข้า Firebase tools สำหรับทำระบบออนไลน์
import { db } from './firebase'; // 🟢 2. นำเข้า db ของคุณ (เช็ค path ให้ตรงกับโปรเจกต์)
import './utils/statSimulator';

function App() {
  const { currentPage, collectionData } = useGameStore();
  const { user, userProfile, isLoading } = useAuthStore();
  const { subscribeToChat } = useChatStore();

  useEffect(() => {
    initAuthListener();
  }, []);

  // ระบบฟังแชทแบบ Real-time
  useEffect(() => {
    if (userProfile) {
      const unsubscribe = subscribeToChat();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [userProfile, subscribeToChat]);

  // 🟢 3. เพิ่ม Heartbeat Effect สำหรับอัปเดตสถานะออนไลน์ของผู้เล่นคนนี้
  useEffect(() => {
    if (!userProfile?.uid) return;

    const userPresenceRef = doc(db, 'presences', userProfile.uid);

    const updatePresence = async () => {
      try {
        await setDoc(userPresenceRef, {
          uid: userProfile.uid,
          username: userProfile.username || 'ผู้เล่น',
          lastActive: Date.now(), // 🟢 บันทึกเป็นตัวเลขมิลลิวินาทีตรงๆ ไปเลย จะได้เทียบง่ายและแม่นยำ
        }, { merge: true });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };

    // อัปเดตทันทีเมื่อเข้าเกม
    updatePresence();

    // วนลูปอัปเดตทุกๆ 20 วินาที เพื่อบอกเซิร์ฟเวอร์ว่ายังออนไลน์อยู่
    const interval = setInterval(updatePresence, 20000);

    return () => {
      clearInterval(interval);
    };
  }, [userProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        Loading . . .
      </div>
    );
  }

  if (!user && !userProfile) {
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