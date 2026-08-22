import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AchievementProgress } from '../types/achievement';
import { useGameStore } from './gameStore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { generateRandomItem } from '../utils/itemGenerator';
import { itemLibrary } from '../data/itemLibrary';

interface AchievementState {
    achievements: Record<string, AchievementProgress>;
    unlockAchievement: (id: string) => void;
    claimReward: (id: string) => void;
    checkCondition: (conditionKey: string, data?: any) => void;
    resetAchievements: () => void;
    loadAchievements: (uid: string) => Promise<void>; // ✅ เพิ่ม
    saveAchievements: (uid: string) => Promise<void>;  // ✅ เพิ่ม
}

const INITIAL_ACHIEVEMENTS: Record<string, AchievementProgress> = {
    'FIRST_EQUIP': {
        id: 'FIRST_EQUIP',
        title: 'First Step into Adventure',
        description: 'Roll and obtain your first equipment item.',
        category: 'starter',
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
        category: 'starter',
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
        rewardFrame: '/Icons/Frames/frame_10.png',
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
        category: 'starter',
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
        category: 'starter',
        rewardTitle: 'Legendary Hunter',
        rewardFrame: '/Icons/Frames/frame_06.png',
        reward: [
            { type: 'material', itemId: 'ancient_rune', amount: 5 },
            { type: 'material', itemId: 'primordial_essence', amount: 3 }
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    // 🟢 Starter Quest Chain — เพิ่มใหม่ทั้งหมด
    'QUEST_ROLL_10': {
        id: 'QUEST_ROLL_10',
        title: 'Keep Rolling',
        description: 'Roll for loot 10 times.',
        category: 'starter',
        reward: [
            // 🟢 เปลี่ยนจากของเดิมที่เป็น Material มาเป็นไอเทมอาวุธ Legendary เลเวล 300
            {
                type: 'equipment',
                itemId: 'spear',      // 🟢 เลือก itemId ของอาวุธจาก itemLibrary ที่ต้องการแจก
                rarity: 'Legendary',       // 🟢 ล็อกความหายากเป็น Legendary
                itemLevel: 300             // 🟢 กำหนดเลเวล 300 ตามต้องการ
            }
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'QUEST_SALVAGE_FIRST': {
        id: 'QUEST_SALVAGE_FIRST',
        title: 'First Salvage',
        description: 'Salvage an item you no longer need.',
        category: 'starter',
        reward: [
            { type: 'material', itemId: 'leather', amount: 10 },
            { type: 'material', itemId: 'steel_ingot', amount: 10 },
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'QUEST_REROLL_FIRST': {
        id: 'QUEST_REROLL_FIRST',
        title: 'Master of Change',
        description: 'Reroll an equipment stat or bonus for the first time.',
        category: 'starter',
        reward: [
            { type: 'material', itemId: 'magic_dust', amount: 10 },
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'QUEST_TRANSFER_FIRST': {
        id: 'QUEST_TRANSFER_FIRST',
        title: 'Essence Transfer',
        description: 'Successfully transfer a stat between equipment for the first time.',
        category: 'starter',
        reward: [
            { type: 'material', itemId: 'magic_dust', amount: 15 },
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'QUEST_READY_FOR_BOSS': {
        id: 'QUEST_READY_FOR_BOSS',
        title: 'Ready for Battle',
        description: "Reach the recommended Combat Power for your first boss.",
        category: 'starter',
        reward: [
            { type: 'material', itemId: 'magic_dust', amount: 20 },
            { type: 'material', itemId: 'mithril', amount: 10 },
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'QUEST_FIRST_BATTLE': {
        id: 'QUEST_FIRST_BATTLE',
        title: 'Into the Fray',
        description: "Enter a boss battle for the first time.",
        category: 'starter',
        reward: [
            { type: 'material', itemId: 'magic_dust', amount: 15 },
        ],
        isUnlocked: false,
        isClaimed: false,
    },
    'QUEST_FIRST_BOSS_KILL': {
        id: 'QUEST_FIRST_BOSS_KILL',
        title: 'First Blood',
        description: 'Defeat your very first boss.',
        category: 'starter',
        rewardTitle: 'Boss Slayer',
        rewardFrame: '/Icons/Frames/frame_07.png',
        reward: [
            { type: 'material', itemId: 'ancient_rune', amount: 10 },
            { type: 'material', itemId: 'primordial_essence', amount: 5 },
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

                    // ✅ save อัตโนมัติถ้า login จริง (guest = auth.currentUser เป็น null อยู่แล้ว ข้ามไปเฉยๆ)
                    const uid = auth.currentUser?.uid;
                    if (uid) get().saveAchievements(uid);
                }
            },

            resetAchievements: () => {
                set({ achievements: INITIAL_ACHIEVEMENTS });
                console.log('Achievements have been reset for a new account.');
            },

            // ✅ เพิ่มใหม่ — โหลด achievement ของ uid นี้จาก Firestore (เหมือน gameStore.loadUserData)
            // ถ้าไม่เคยมีข้อมูลเลย (account ใหม่จริงๆ) จะได้ INITIAL_ACHIEVEMENTS โดยอัตโนมัติ
            loadAchievements: async (uid: string) => {
                try {
                    const docRef = doc(db, 'players', uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && docSnap.data().achievements) {
                        // รวมกับ INITIAL_ACHIEVEMENTS เผื่อมี quest ใหม่ที่ผู้เล่นเก่ายังไม่มีในเซฟ (เหมือน migrate เดิม)
                        set({
                            achievements: {
                                ...INITIAL_ACHIEVEMENTS,
                                ...docSnap.data().achievements,
                            }
                        });
                    } else {
                        set({ achievements: INITIAL_ACHIEVEMENTS });
                    }
                } catch (err) {
                    console.error('Error loading achievements:', err);
                    set({ achievements: INITIAL_ACHIEVEMENTS });
                }
            },

            // ✅ เพิ่มใหม่ — บันทึก achievement ปัจจุบันลง Firestore (players/{uid}) เหมือน field อื่นๆ ที่ gameStore เก็บอยู่แล้ว
            saveAchievements: async (uid: string) => {
                try {
                    const docRef = doc(db, 'players', uid);
                    await setDoc(docRef, { achievements: get().achievements }, { merge: true });
                } catch (err) {
                    console.error('Error saving achievements:', err);
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

                    // 1. แจก Reward (รองรับทั้ง Material และ Equipment)
                    if (current.reward && Array.isArray(current.reward)) {
                        current.reward.forEach((rew) => {
                            const { type, itemId, amount, rarity, itemLevel } = rew;

                            // เคสที่ 1: แจก Material
                            if (type === 'material' && itemId) {
                                useGameStore.getState().addMaterial(itemId, amount ?? 1);
                            }

                            // เคสที่ 2: แจก Equipment (ล็อกไอเทมตรงเป๊ะด้วย itemId)
                            else if (type === 'equipment' && itemId) {
                                const targetLevel = Number(itemLevel) || 300;
                                const targetRarity = rarity || 'Legendary';

                                // 🟢 เรียกใช้ generateRandomItem พร้อมส่ง itemId ไปล็อกประเภทตั้งแต่ต้นทาง
                                const generatedItem = generateRandomItem(targetRarity, targetLevel, itemId);

                                if (generatedItem) {
                                    // เพิ่มเข้ากระเป๋าผู้เล่นได้ทันที
                                    useGameStore.getState().addItem(generatedItem);
                                    console.log(`Reward Claimed: Added ${generatedItem.name} (Level ${generatedItem.itemLevel}) to inventory.`);
                                }
                            }
                        });
                    }

                    // 2. รางวัลพิเศษ (Frame/Title)
                    if (current.rewardFrame) {
                        console.log(`Unlocked frame -> ${current.rewardFrame}`);
                    }
                    if (current.rewardTitle) {
                        console.log(`Unlocked title -> ${current.rewardTitle}`);
                    }

                    // 3. บันทึกลง Firestore อัตโนมัติทันทีที่กดรับรางวัล
                    const uid = auth.currentUser?.uid;
                    if (uid) {
                        get().saveAchievements(uid);
                        console.log("Achievements auto-saved to Firestore.");
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

                    // ✅ เพิ่มใหม่ — เช็คจำนวน roll สะสม (เรียกทุกครั้งที่ roll สำเร็จ)
                    case 'ROLL_COUNT':
                        if (!state.achievements['QUEST_ROLL_10']?.isUnlocked && data?.totalOpens >= 10) {
                            get().unlockAchievement('QUEST_ROLL_10');
                        }
                        break;

                    // ✅ เพิ่มใหม่ — เช็คว่า salvage สำเร็จอย่างน้อย 1 ครั้ง
                    case 'SALVAGE_ITEM':
                        if (!state.achievements['QUEST_SALVAGE_FIRST']?.isUnlocked) {
                            get().unlockAchievement('QUEST_SALVAGE_FIRST');
                        }
                        break;

                    // ✅ เพิ่มใหม่ — เช็คว่า CP ถึงเกณฑ์บอสตัวแรกหรือยัง
                    case 'CHECK_CP_READY':
                        if (!state.achievements['QUEST_READY_FOR_BOSS']?.isUnlocked && data?.playerCP >= data?.requiredCP) {
                            get().unlockAchievement('QUEST_READY_FOR_BOSS');
                        }
                        break;

                    case 'CHECK_FIRST_BATTLE':
                        if (!state.achievements['QUEST_FIRST_BATTLE']?.isUnlocked) {
                            get().unlockAchievement('QUEST_FIRST_BATTLE');
                        }
                        break;

                    // ✅ เพิ่มใหม่ — ชนะบอสครั้งแรก
                    case 'BOSS_DEFEATED':
                        if (!state.achievements['QUEST_FIRST_BOSS_KILL']?.isUnlocked) {
                            get().unlockAchievement('QUEST_FIRST_BOSS_KILL');
                        }
                        break;

                    // ✅ เช็คว่าทำการ Reroll สำเร็จแล้วอย่างน้อย 1 ครั้ง
                    case 'REROLL_FIRST':
                        if (!state.achievements['QUEST_REROLL_FIRST']?.isUnlocked) {
                            get().unlockAchievement('QUEST_REROLL_FIRST');
                        }
                        break;

                    // ✅ เช็คว่าทำการ Transfer Stats สำเร็จแล้วอย่างน้อย 1 ครั้ง
                    case 'TRANSFER_FIRST':
                        if (!state.achievements['QUEST_TRANSFER_FIRST']?.isUnlocked) {
                            get().unlockAchievement('QUEST_TRANSFER_FIRST');
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
            name: 'achievement-storage',
            version: 6, // 🟢 1. ขยับเวอร์ชันเป็น 6
            migrate: (persistedState: any, version: number) => {
                console.log("Migrating state, version:", version, "Current state:", persistedState);

                if (!persistedState) {
                    return { achievements: INITIAL_ACHIEVEMENTS };
                }

                let newState = persistedState;

                // 🟢 2. ปรับเป็น version < 6 เพื่อให้บล็อกนี้ทำงานกับผู้เล่นที่ค้างอยู่เวอร์ชัน 5
                if (version < 6) {
                    const existingAchievements = persistedState?.achievements || {};

                    return {
                        ...persistedState,
                        achievements: {
                            ...INITIAL_ACHIEVEMENTS, // เอาค่าตั้งต้นใหม่ทั้งหมดก่อน (รวมรางวัลอาวุธเลเวล 300)
                            ...existingAchievements, // เอาเซฟเก่ามาทับ
                            // 🟢 3. บังคับอัปเดตเฉพาะเควส QUEST_ROLL_10 ให้ใช้รางวัลใหม่ชัวร์ๆ (แม้ในเซฟเก่าจะกดรับไปแล้วหรือยัง)
                            QUEST_ROLL_10: {
                                ...INITIAL_ACHIEVEMENTS['QUEST_ROLL_10'],
                                isUnlocked: existingAchievements['QUEST_ROLL_10']?.isUnlocked ?? false,
                                isClaimed: existingAchievements['QUEST_ROLL_10']?.isClaimed ?? false,
                            }
                        }
                    };
                }

                return newState;
            },
        }
    )
);