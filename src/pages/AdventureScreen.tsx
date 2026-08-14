// src/pages/AdventurePage.tsx (หรือไฟล์หน้า Lobby ของคุณ)
import { useEffect } from 'react';
import { useCharacterDashboard } from '../hooks/useCharacterDashboard';
import { AdventureLobby } from '../adventure/AdventureLobby';
import { BattleScreen } from '../adventure/BattleScreen';
import { useGameStore } from '../store/gameStore';
import { useBattleStore } from '../store/battleStore';
import { calculateCombatPower } from '../utils/combatPower';

export const AdventurePage = () => {
    const { finalStats } = useCharacterDashboard();
    const playerCP = calculateCombatPower(finalStats);
    const selectedBoss = useBattleStore((s) => s.selectedBoss);
    const clearRewards = useBattleStore((s) => s.clearRewards); // 👈 ดึงฟังก์ชัน clearRewards มา

    // 🟢 เคลียร์รางวัลค้างเก่าทันทีที่เข้ามาหน้า Lobby
    useEffect(() => {
        clearRewards();
    }, [clearRewards]);

    return (
        <div className="p-6">
            {!selectedBoss ? (
                <AdventureLobby
                    playerCP={playerCP}
                    onSelectBoss={(boss) => {
                        useBattleStore.getState().startBattle(boss, finalStats, useGameStore.getState().player.equippedItems);
                    }}
                />
            ) : (
                <BattleScreen />
            )}
        </div>
    );
};