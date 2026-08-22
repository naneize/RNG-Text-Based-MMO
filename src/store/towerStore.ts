// store/towerStore.ts
// Boss Tower — จัดการสถานะการไต่: checkpoint, ชั้นในรันปัจจุบัน, เลือดค้างระหว่างชั้น
// การต่อสู้ทุกอย่างยังเดินผ่าน battleStore ปกติ — tower แค่ "โคลนบอส คูณ stat แล้วส่งเข้าไป"

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Boss } from '../types/game';
import {
    generateTowerFloor,
    getTowerFloorRewards,
    FLOORS_PER_CHECKPOINT,
    PLAYER_HEAL_BETWEEN_FLOORS,
    type TowerFloor,
} from '../data/towerConfig';
import { useBattleStore } from './battleStore';
import { useGameStore } from './gameStore';
import { getTotalStats } from '../utils/combat';

interface TowerRunSummary {
    reachedFloor: number;       // ชั้นสูงสุดที่แตะ
    clearedFloors: number;      // จำนวนชั้นที่ผ่านในรันนี้
    cause: 'death' | 'exit';    // จบเพราะอะไร
}

interface TowerState {
    highestCleared: number;                 // ชั้นสูงสุดที่เคยผ่าน (persist)
    isActive: boolean;                      // มีรันกำลังดำเนินอยู่
    currentFloor: TowerFloor | null;        // ชั้นที่กำลังสู้อยู่
    runPlayerHpPercent: number;             // เลือดผู้เล่นค้างระหว่างชั้น (0-1)
    runStartFloor: number;                  // ชั้นที่เริ่มรันนี้
    floorsClearedThisRun: number;
    lastRunSummary: TowerRunSummary | null;
    lastFloorRewards: { id: string; amount: number }[] | null; // รางวัลชั้นล่าสุด (โชว์ตอนกด Next)

    getCheckpointStart: () => number;       // ชั้นเริ่มต้นตาม checkpoint ล่าสุด
    startRun: (fromCheckpoint: boolean) => void;
    nextFloor: () => void;                  // ขึ้นชั้นถัดไป (กดจาก BattleScreen)
    completeFloor: () => void;              // เรียกเมื่อชนะบอสในชั้นปัจจุบัน
    endRun: (cause: 'death' | 'exit') => void;
    dismissRunSummary: () => void;
}

export const useTowerStore = create<TowerState>()(
    persist(
        (set, get) => ({
            highestCleared: 0,
            isActive: false,
            currentFloor: null,
            runPlayerHpPercent: 1,
            runStartFloor: 1,
            floorsClearedThisRun: 0,
            lastRunSummary: null,
            lastFloorRewards: null,

            getCheckpointStart: () => {
                const cleared = get().highestCleared;
                return Math.floor(cleared / FLOORS_PER_CHECKPOINT) * FLOORS_PER_CHECKPOINT + 1;
            },

            startRun: (fromCheckpoint) => {
                const startFloor = fromCheckpoint
                    ? get().getCheckpointStart()
                    : 1;
                set({
                    isActive: true,
                    runStartFloor: startFloor,
                    runPlayerHpPercent: 1,
                    floorsClearedThisRun: 0,
                    lastRunSummary: null,
                    lastFloorRewards: null,
                });
                get().nextFloor();
            },

            nextFloor: () => {
                const { isActive, currentFloor, runPlayerHpPercent } = get();
                if (!isActive) return;

                const nextFloorNumber = currentFloor ? currentFloor.floor + 1 : get().runStartFloor;
                const floor = generateTowerFloor(nextFloorNumber);

                // ส่งบอสโคลนเข้าระบบต่อสู้เดิม แล้ว override เลือดเริ่มต้นตามที่ค้างไว้ในรัน
                const player = useGameStore.getState().player;
                const stats = getTotalStats(player);
                useBattleStore.getState().startBattle(floor.boss as Boss, stats, player.equippedItems);

                // เลือดเริ่มชั้น = เลือดค้างตอนจบชั้นก่อน (ชั้นแรกของรัน = เต็ม)
                const startHp = Math.max(
                    Math.floor(stats.maxHp * 0.1), // กันเข้าชั้นใหม่ด้วยเลือด 0
                    Math.floor(stats.maxHp * runPlayerHpPercent)
                );
                useBattleStore.setState({ playerHp: startHp });

                set({ currentFloor: floor });
            },

            completeFloor: () => {
                const { currentFloor, highestCleared, floorsClearedThisRun } = get();
                if (!currentFloor || !get().isActive) return;

                const { floor, rewardMultiplier } = currentFloor;
                const rewards = getTowerFloorRewards(floor, rewardMultiplier);
                rewards.forEach((r) => useGameStore.getState().addMaterial(r.id, r.amount));

                // 🎁 โชว์โบนัสวัสดุของ tower ใน Reward Modal ด้วย (append เข้า lastRewards)
                // — ให้ผู้เล่นเห็นว่าได้อะไรเพิ่มจาก tower ตอนนั้นเลย ไม่เข้ากระเป๋าเงียบ
                const battleForModal = useBattleStore.getState();
                useBattleStore.setState({
                    lastRewards: [
                        ...(battleForModal.lastRewards || []),
                        ...rewards.map((r) => ({ type: 'material' as const, id: r.id, amount: r.amount })),
                    ],
                });

                // เก็บเลือดปัจจุบันจาก battle + ฟื้นบางส่วนตามกฎ tower
                const battle = useBattleStore.getState();
                const maxHp = battle.finalStatsSnapshot?.maxHp || 1;
                const hpAfterBattle = battle.playerHp / maxHp;
                const healed = Math.min(1, hpAfterBattle + PLAYER_HEAL_BETWEEN_FLOORS);

                set({
                    highestCleared: Math.max(highestCleared, floor),
                    floorsClearedThisRun: floorsClearedThisRun + 1,
                    runPlayerHpPercent: healed,
                    lastFloorRewards: rewards,
                });
            },

            endRun: (cause) => {
                const { currentFloor, floorsClearedThisRun, isActive } = get();
                if (!isActive) return;
                set({
                    isActive: false,
                    lastRunSummary: {
                        reachedFloor: currentFloor?.floor ?? get().runStartFloor,
                        clearedFloors: floorsClearedThisRun,
                        cause,
                    },
                    currentFloor: null,
                });
            },

            dismissRunSummary: () => set({ lastRunSummary: null }),
        }),
        {
            name: 'tower-storage',
            partialize: (state) => ({ highestCleared: state.highestCleared }),
        }
    )
);
