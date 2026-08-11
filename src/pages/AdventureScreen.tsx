import React, { useState } from 'react';
import { useCharacterDashboard } from '../hooks/useCharacterDashboard';
import { AdventureLobby } from '../adventure/AdventureLobby';
import { BattleScreen } from '../adventure/BattleScreen';
import { useGameStore } from '../store/gameStore';
import { calculateCombatPower } from '../utils/combatPower'; // ✅ เพิ่มบรรทัดนี้

export const AdventurePage = () => {
    // 1. ดึงมาแค่ finalStats พอ ไม่ต้องดึง player มา
    const { finalStats } = useCharacterDashboard();
    const { setCurrentPage } = useGameStore();
    const [view, setView] = useState<'lobby' | 'battle'>('lobby'); // ไม่ต้องมี 'home' ในนี้แล้ว
    const [selectedBoss, setSelectedBoss] = useState(null);
    const playerCP = calculateCombatPower(finalStats);

    return (
        <div className="p-6">
            {view === 'lobby' ? (
                <AdventureLobby
                    playerCP={playerCP}
                    onSelectBoss={(boss) => {
                        setSelectedBoss(boss);
                        setView('battle');
                    }}
                />
            ) : (
                <BattleScreen
                    player={useGameStore.getState().player}
                    selectedBoss={selectedBoss}
                    finalStats={finalStats}
                    onBack={() => setView('lobby')}
                    onGameOver={() => setCurrentPage('home')} // สั่งเปลี่ยนหน้าหลักของ App ไปที่ 'home'
                />
            )}
        </div>
    );
};