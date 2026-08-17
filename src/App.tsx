import { useEffect, useState, useRef } from 'react';
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
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MarketplacePage } from './components/Marketplace/MarketplacePage';
import { PlayerProfile } from './components/character/PlayerProfile';
import { getTotalStatsWithBreakdown } from './utils/combat';
import './utils/statSimulator';
import { useCharacterDashboard } from './hooks/useCharacterDashboard';
import { LoadingScreen } from './components/LoadingScreen';
import { GlobalAnnouncement } from './components/GlobalAnnouncement';
import { AdminPanel } from './components/AdminPanel';


function App() {
  const { currentPage, collectionData, player } = useGameStore();
  const { user, userProfile, isLoading: isAuthLoading } = useAuthStore();
  const { subscribeToChat } = useChatStore();

  const [isGameReady, setIsGameReady] = useState(false);

  // 🎵 Ref สำหรับควบคุม BGM
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { finalStats, breakdown: statBreakdown } = getTotalStatsWithBreakdown(player);
  const { totalOpens } = useCharacterDashboard();

  useEffect(() => {
    initAuthListener();
  }, []);

  // 🎵 เล่นเพลง (เฉพาะตอนที่ยังอยู่ 3 หน้าแรก)
  const playBGM = () => {
    if (!isGameReady && audioRef.current && audioRef.current.paused) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch((err) => {
        console.log("Audio waiting for user click:", err);
      });
    }
  };

  // 🔇 สั่งหยุดเพลงทันทีเมื่อเข้าสู่หน้า Main Game
  useEffect(() => {
    if (isGameReady && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // รีเซ็ตเพลงกลับไปเริ่มต้น
    }
  }, [isGameReady]);

  useEffect(() => {
    if (userProfile) {
      const unsubscribe = subscribeToChat();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [userProfile, subscribeToChat]);

  // Heartbeat Effect
  useEffect(() => {
    if (!userProfile?.uid || !user || userProfile.uid.startsWith('guest_')) {
      return;
    }

    const userPresenceRef = doc(db, 'presences', userProfile.uid);
    const updatePresence = async () => {
      try {
        await setDoc(userPresenceRef, {
          uid: userProfile.uid,
          username: userProfile.username || 'ผู้เล่น',
          lastActive: Date.now(),
        }, { merge: true });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 20000);
    return () => clearInterval(interval);
  }, [userProfile, user]);

  return (
    <div onClick={playBGM}>
      {/* 🎶 เครื่องเล่น BGM (จะเล่นเฉพาะ Login, Setup, Loading) */}
      <audio ref={audioRef} src="/Audio/Forgotten_Throne.mp3" loop preload="auto" />

      {isAuthLoading ? (
        <LoadingScreen onFinished={() => setIsGameReady(true)} />
      ) : !user && !userProfile ? (
        <LoginPage />
      ) : !userProfile ? (
        <UsernameSetupPage />
      ) : !isGameReady ? (
        <LoadingScreen onFinished={() => setIsGameReady(true)} />
      ) : (
        /* 🎮 เข้าสู่ตัวเกมหลัก (จะไม่มีเสียง BGM แล้ว เงียบสงบ) */
        <div className="flex bg-slate-950 min-h-screen text-white relative">
          <GlobalAnnouncement />
          <AdminPanel />

          <Sidebar />

          <main className="flex-1 p-8">
            {currentPage === 'home' && <CharacterDashboard />}
            {currentPage === 'profile' && <PlayerProfile player={player} finalStats={finalStats} statBreakdown={statBreakdown} totalOpens={totalOpens} />}
            {currentPage === 'collection' && <CollectionPage collectionData={collectionData} />}
            {currentPage === 'adventure' && <AdventurePage />}
            {currentPage === 'achievement' && <AchievementPage />}
            {currentPage === 'marketplace' && <MarketplacePage />}
          </main>

          <AchievementPopup />

        </div>
      )}
    </div>
  );
}

export default App;