import React, { useState } from 'react';
import { useCharacterDashboard } from '../hooks/useCharacterDashboard';
import { AdventureLobby } from './AdventureLobby';
import { BattleScreen } from './BattleScreen';
import { useGameStore } from '../store/gameStore';

export const AdventurePage = () => {
    const { finalStats } = useCharacterDashboard();
    const [view, setView] = useState<'lobby' | 'battle' | 'home'>('lobby');
    const [selectedBoss, setSelectedBoss] = useState(null);

    return (
        <div className="p-6">
            {view === 'lobby' ? (
                <AdventureLobby onSelectBoss={(boss) => {
                    setSelectedBoss(boss);
                    setView('battle');
                }} />
            ) : (
                <BattleScreen
                    player={useGameStore.getState().player}
                    selectedBoss={selectedBoss}
                    finalStats={finalStats}
                    onBack={() => setView('lobby')}
                    onGameOver={() => setView('home')} // เพิ่ม prop นี้
                />
            )}
        </div>
    );
};