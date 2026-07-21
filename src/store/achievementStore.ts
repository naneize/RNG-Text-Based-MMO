import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AchievementProgress } from '../types/achievement';
import { useGameStore } from './gameStore';

interface AchievementState {
    achievements: Record<string, AchievementProgress>;
    unlockAchievement: (id: string) => void;
    claimReward: (id: string) => void;
    checkCondition: (conditionKey: string, data?: any) => void; // <--- ปรับให้รองรับข้อมูลส่งเข้ามาเช็ก
}

const INITIAL_ACHIEVEMENTS: Record<string, AchievementProgress> = {
    'FIRST_EQUIP': {
        id: 'FIRST_EQUIP',
        title: 'First Step into Adventure',
        description: 'Obtain your first equipment item.',
        category: 'collection',
        reward: {
            type: 'material',
            itemId: 'iron_ore',
            amount: 10
        },
        isUnlocked: false,
        isClaimed: false,
    },
    'EQUIP_FIVE_COMMONS': {
        id: 'EQUIP_FIVE_COMMONS',
        title: 'Common Collector',
        description: 'Equip at least 5 Common items.',
        category: 'collection',
        reward: {
            type: 'material',
            itemId: 'iron_ore',
            amount: 10
        },
        isUnlocked: false,
        isClaimed: false,
    },
    'KILL_RARE': {
        id: 'KILL_RARE',
        title: 'Rare Hunter',
        description: 'Defeat a boss while equipped entirely with Rare items.',
        category: 'challenge',
        reward: {
            type: 'material',
            itemId: 'iron_ore',
            amount: 100
        },
        isUnlocked: false,
        isClaimed: false,
    },
    'NO_DAMAGE': {
        id: 'NO_DAMAGE',
        title: 'Untouchable',
        description: 'Defeat a boss without taking any damage.',
        category: 'challenge',
        reward: { type: 'material', amount: 500 },
        isUnlocked: false,
        isClaimed: false,
    },
    'SPEED_RUN': {
        id: 'SPEED_RUN',
        title: 'Lightning Strike',
        description: 'Defeat a boss within 3 turns (or seconds).',
        category: 'challenge',
        reward: { type: 'material', amount: 300 },
        isUnlocked: false,
        isClaimed: false,
    }
};

export const useAchievementStore = create<AchievementState>()(
    persist(
        (set, get) => ({
            achievements: INITIAL_ACHIEVEMENTS,

            unlockAchievement: (id) => {
                const current = get().achievements[id];
                if (current && !current.isUnlocked) {
                    set((state) => ({
                        achievements: {
                            ...state.achievements,
                            [id]: { ...state.achievements[id], isUnlocked: true }
                        }
                    }));
                    console.log(`Achievement Unlocked: ${current.title}!`);
                }
            },

            claimReward: (id) => {
                const current = get().achievements[id];
                if (current && current.isUnlocked && !current.isClaimed) {
                    set((state) => ({
                        achievements: {
                            ...state.achievements,
                            [id]: { ...state.achievements[id], isClaimed: true }
                        }
                    }));

                    if (current.reward) {
                        const { type, itemId, amount } = current.reward;
                        if (type === 'material' && itemId) {
                            useGameStore.getState().addMaterial(itemId, amount);
                            console.log(`Reward Claimed: Added ${amount} of ${itemId} to inventory.`);
                        }
                    }
                }
            },

            // --- สเตปที่ 1: เขียน Logic เช็กเงื่อนไขตรงนี้ ---
            checkCondition: (conditionKey, data) => {
                const state = get();

                switch (conditionKey) {
                    case 'FIRST_EQUIP':
                        // เช็กว่ายังไม่เคยปลดล็อก และ (อาจจะมี data ส่งมาเช็กเพิ่มว่ามีอุปกรณ์จริงๆ)
                        if (!state.achievements['FIRST_EQUIP']?.isUnlocked) {
                            get().unlockAchievement('FIRST_EQUIP');
                        }
                        break;

                    case 'KILL_RARE':
                        if (!state.achievements['KILL_RARE']?.isUnlocked && data?.isAllRare) {
                            get().unlockAchievement('KILL_RARE');
                        }
                        break;

                    case 'CHECK_EQUIPPED_ITEMS':
                        if (!state.achievements['EQUIP_FIVE_COMMONS']?.isUnlocked && data?.equippedItems) {
                            // กรองนับจำนวนไอเทมที่สวมใส่อยู่ที่มี rarity เป็น 'common'
                            const commonCount = Object.values(data.equippedItems).filter(
                                (item: any) => item && item.rarity?.toLowerCase() === 'common'
                            ).length;

                            console.log("Current Common Items Count:", commonCount);
                            console.log("Equipped Data:", data.equippedItems);

                            if (commonCount >= 5) {
                                get().unlockAchievement('EQUIP_FIVE_COMMONS');
                            }
                        }
                        break;

                    default:
                        break;
                }
            }
        }),
        { name: 'player-achievements' }
    )
);