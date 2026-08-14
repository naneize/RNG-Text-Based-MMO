import React, { useState } from 'react';
import { useCharacterDashboard } from '../hooks/useCharacterDashboard';
import { AdventureLobby } from './AdventureLobby';
import { BattleScreen } from './BattleScreen';
import { useGameStore } from '../store/gameStore';
import { calculateCombatPower } from '../utils/combatPower'; // 👈 นำเข้าฟังก์ชันคำนวณ CP (ปรับ path ตามโครงสร้างโปรเจกต์)

export const AdventurePage = () => {
    const { finalStats } = useCharacterDashboard();
    const [view, setView] = useState<'lobby' | 'battle' | 'home'>('lobby');
    const [selectedBoss, setSelectedBoss] = useState(null);

    // 1. คำนวณค่า CP จาก finalStats
    const playerCP = calculateCombatPower(finalStats);

    return (
        <div className="p-6">
            {view === 'lobby' ? (
                <AdventureLobby
                    playerCP={playerCP} // 👈 2. ส่ง playerCP ไปที่ AdventureLobby
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
                    onGameOver={() => setView('home')}
                />
            )}
        </div>
    );
};