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
        rewardTitle: 'First Adventurer',
        reward: [
            { type: 'material', itemId: 'iron_ore', amount: 10 },
            { type: 'material', itemId: 'steel_ingot', amount: 5 }
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'EQUIP_FIVE_COMMONS': {
        id: 'EQUIP_FIVE_COMMONS',
        title: 'Common Collector',
        description: 'Equip at least 5 Common items.',
        category: 'collection',
        rewardTitle: 'Novice Collector',
        reward: [
            { type: 'material', itemId: 'iron_ore', amount: 10 },
            { type: 'material', itemId: 'leather', amount: 5 }
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'OVERKILL_1000': {
        id: 'OVERKILL_1000',
        title: 'Overkill',
        description: 'Deal over 1,000 damage in a single turn.',
        category: 'combat',
        rewardTitle: 'The Destroyer', // 🟢 ฉายาที่จะได้รับ
        reward: [
            { type: 'material', itemId: 'steel_ingot', amount: 10 },
            { type: 'material', itemId: 'magic_dust', amount: 5 }
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    // 🟢 เพิ่มเควสต์ Epic แรก
    'FIRST_EPIC': {
        id: 'FIRST_EPIC',
        title: 'Epic Discovery',
        description: 'Obtain your first Epic item.',
        category: 'collection',
        reward: [
            { type: 'material', itemId: 'celestial_shard', amount: 5 },
            { type: 'material', itemId: 'void_essence', amount: 3 }
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    // 🟢 เพิ่มเควสต์ Legendary แรก
    'FIRST_LEGENDARY': {
        id: 'FIRST_LEGENDARY',
        title: 'Legend of the Realm',
        description: 'Obtain your first Legendary item.',
        category: 'collection',
        reward: [
            { type: 'material', itemId: 'ancient_rune', amount: 5 },
            { type: 'material', itemId: 'primordial_essence', amount: 3 }
        ],
        isUnlocked: false,
        isClaimed: false,
    },

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

                    // 🟢 ตรวจสอบว่ามีรางวัลและเป็น Array หรือไม่
                    if (current.reward && Array.isArray(current.reward)) {
                        // 🟢 วนลูปแจกรางวัลทีละชิ้น
                        current.reward.forEach((rew) => {
                            const { type, itemId, amount } = rew;
                            if (type === 'material' && itemId) {
                                useGameStore.getState().addMaterial(itemId, amount);
                                console.log(`Reward Claimed: Added ${amount} of ${itemId} to inventory.`);
                            }
                            // รองรับประเภทอื่น ๆ เพิ่มเติมได้ตรงนี้ (เช่น type === 'item' หรือ 'stat')
                        });
                    }
                }
            },

            // --- สเตปที่ 1: เขียน Logic เช็กเงื่อนไขตรงนี้ ---
            checkCondition: (conditionKey, data) => {
                const state = get();

                switch (conditionKey) {
                    case 'FIRST_EQUIP':
                        if (!state.achievements['FIRST_EQUIP']?.isUnlocked) {
                            get().unlockAchievement('FIRST_EQUIP');
                        }
                        break;

                    case 'CHECK_EQUIPPED_ITEMS':
                        if (!state.achievements['EQUIP_FIVE_COMMONS']?.isUnlocked && data?.equippedItems) {
                            const commonCount = Object.values(data.equippedItems).filter(
                                (item: any) => item && item.rarity?.toLowerCase() === 'common'
                            ).length;

                            if (commonCount >= 5) {
                                get().unlockAchievement('EQUIP_FIVE_COMMONS');
                            }
                        }
                        break;

                    // 🟢 เช็กเมื่อได้รับไอเทมระดับ Epic (ส่ง data.rarity หรือ data.item มาเช็ก)
                    case 'OBTAIN_ITEM':
                        if (data?.rarity) {
                            const rarity = data.rarity.toLowerCase();

                            if (rarity === 'epic' && !state.achievements['FIRST_EPIC']?.isUnlocked) {
                                get().unlockAchievement('FIRST_EPIC');
                            }

                            if (rarity === 'legendary' && !state.achievements['FIRST_LEGENDARY']?.isUnlocked) {
                                get().unlockAchievement('FIRST_LEGENDARY');
                            }
                        }
                        break;

                    case 'DEAL_DAMAGE':
                        if (data?.damage >= 1000 && !state.achievements['OVERKILL_1000']?.isUnlocked) {
                            get().unlockAchievement('OVERKILL_1000');
                        }
                        break;

                    default:
                        break;
                }
            }
        }),
        {
            name: 'achievement-storage', // ชื่อ key เดิม

            // 👉 เอาโค้ด 3 บรรทัดนี้มาแปะไว้ตรงนี้ครับ
            version: 2,
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    return { achievements: INITIAL_ACHIEVEMENTS };
                }
                return persistedState;
            },
        }
    )
);