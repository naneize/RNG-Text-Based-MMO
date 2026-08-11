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
        rewardFrame: '/Icons/Frames/frame_01.png',
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
    'OVERKILL_10000': {
        id: 'OVERKILL_10000',
        title: 'Overkill',
        description: 'Deal over 10,000 damage with a single normal attack.',
        category: 'combat',
        rewardFrame: '/Icons/Frames/frame_03.png',
        rewardTitle: 'The Destroyer', // 🟢 ฉายาที่จะได้รับ
        reward: [
            { type: 'material', itemId: 'ancient_rune', amount: 5 },
            { type: 'material', itemId: 'void_essence', amount: 5 },
            { type: 'material', itemId: 'celestial_shard', amount: 5 }
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
        rewardTitle: 'Epic Seeker',
        rewardFrame: '/Icons/Frames/frame_02.png',
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
        rewardTitle: 'Legendary Hunter',
        rewardFrame: '/Icons/Frames/frame_06.png',
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

                    // 🟢 1. ตรวจสอบและแจก Reward ปกติใน Array (Material ฯลฯ)
                    if (current.reward && Array.isArray(current.reward)) {
                        current.reward.forEach((rew) => {
                            const { type, itemId, amount } = rew;
                            if (type === 'material' && itemId) {
                                useGameStore.getState().addMaterial(itemId, amount);
                                console.log(`Reward Claimed: Added ${amount} of ${itemId} to inventory.`);
                            }
                        });
                    }

                    // 🟢 2. เพิ่มเช็ครางวัลพิเศษ (rewardFrame) ตรงนี้
                    if (current.rewardFrame) {
                        // ตัวอย่าง: บันทึกลง Store ของผู้เล่นว่าปลดล็อก Frame นี้แล้ว
                        // (ปรับเปลี่ยนชื่อฟังก์ชันตาม Store ของคุณ เช่น unlockFrame หรืออัปเดต Profile)
                        // ตัวอย่างเช่น: useAuthStore.getState().unlockFrame(current.rewardFrame);
                        console.log(`Reward Claimed: Unlocked frame -> ${current.rewardFrame}`);
                    }

                    // 🟢 3. (แถม) เช็ค rewardTitle เผื่อระบบ Title ใช้เงื่อนไขเดียวกัน
                    if (current.rewardTitle) {
                        console.log(`Reward Claimed: Unlocked title -> ${current.rewardTitle}`);
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

                    // 🟢 เช็กเมื่อได้รับไอเทมระดับ Epic / Legendary
                    case 'OBTAIN_ITEM':
                        if (data?.rarity) {
                            const rarity = String(data.rarity).toLowerCase();

                            if (rarity === 'epic' && !state.achievements['FIRST_EPIC']?.isUnlocked) {
                                get().unlockAchievement('FIRST_EPIC');
                            }

                            if (rarity === 'legendary' && !state.achievements['FIRST_LEGENDARY']?.isUnlocked) {
                                get().unlockAchievement('FIRST_LEGENDARY');
                            }
                        }
                        break;

                    case 'DEAL_DAMAGE': {
                        // 🟢 ดึงค่า damage อย่างปลอดภัย (แก้อ่านค่า NaN)
                        const rawDamage = typeof data === 'object' && data !== null ? data.damage : data;
                        const damageVal = Number(rawDamage) || 0;

                        const overkillAch = state.achievements?.['OVERKILL_10000'];

                        if (damageVal >= 10000 && !overkillAch?.isUnlocked) {
                            get().unlockAchievement('OVERKILL_10000');
                        }
                        break;
                    }

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