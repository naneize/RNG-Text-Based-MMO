import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, Stats, Item, CollectionRecord, Boss } from '../types/game';
import { PITY_CONFIG } from '../types/game';
import { itemLibrary } from '../data/itemLibrary';
import { getTotalStats } from '../utils/combat';
import { TRANSFER_COSTS, PROTECTION_COSTS } from '../data/transferConfig';
import { calculateBossDrops } from '../utils/dropLogic';
import { useAchievementStore } from './achievementStore';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthStore } from './authStore';
import { useLeaderboardStore } from './leaderboardStore';
import { SALVAGE_MATERIALS, DEFAULT_SALVAGE_FALLBACK, rollMaterials } from '../data/salvageConfig';
import { getFullStatRanges, getSpecialBonusRange } from '../utils/statRanges';
import { ELEMENT_POOL, RACE_POOL } from '../utils/itemGenerator';
import {
    STAT_TO_MATERIAL, ELEMENT_BONUS_MATERIAL, RACE_BONUS_MATERIAL,
    UNIVERSAL_MATERIAL, calculateRerollCost, type RerollResult,
} from '../data/rerollConfig';



export interface SalvageRateConfig {
    rate: number;         // เช่น 0.9 (ใช้คำนวณ)
    displayRate: number;  // เช่น 90 (ใช้แสดงผล UI %)
    label: string;
    color: string;
}

export const SALVAGE_RATES: Record<string, SalvageRateConfig> = {
    common: {
        rate: 0.90,
        displayRate: 90,
        label: 'Common',
        color: 'text-slate-300 border-slate-600 bg-slate-800'
    },
    rare: {
        rate: 0.75,
        displayRate: 75,
        label: 'Rare',
        color: 'text-blue-300 border-blue-600/60 bg-blue-950/40'
    },
    epic: {
        rate: 0.45,
        displayRate: 45,
        label: 'Epic',
        color: 'text-purple-300 border-purple-600/60 bg-purple-950/40'
    },
    legendary: {
        rate: 0.35,
        displayRate: 35,
        label: 'Legendary',
        color: 'text-amber-300 border-amber-600/60 bg-amber-950/40'
    }
};


let isProcessing = false;
interface TransferResult {
    success: boolean;
    itemAName?: string;
    itemBName?: string;
    removedStatA?: string;
    removedValA?: number;
    gainedStatA?: string;
    gainedValA?: number;
    removedStatB?: string;
    removedValB?: number;
    protectedA?: boolean;
    protectedB?: boolean;
    gainedStatB?: string;
    gainedValB?: number;
    message: string;
}

interface GameState {
    currentPage: 'home' | 'adventure' | 'collection' | 'achievement' | 'marketplace';
    setCurrentPage: (page: 'home' | 'adventure' | 'collection' | 'achievement' | 'marketplace') => void;
    player: Player;
    addItem: (item: Item) => void;
    addMaterial: (name: string, amount: number) => void;
    setStats: (newStats: Stats) => void;
    totalOpens: number;
    addOpen: () => void;
    saveUserData: (forcedUid?: string) => Promise<void>;
    equipItem: (item: Item) => void;
    unequipItem: (item: Item) => void;
    removeItem: (uid: string) => void;
    removeMaterial: (name: string, amount: number) => void;
    resetGame: () => void;
    loadUserData: (uid: string) => Promise<void>;
    collectionData: CollectionRecord[];
    unlockItem: (item: Item) => void;
    updateInventoryItem: (uid: string, updatedItem: Item) => void;
    transferStats: (itemA: any, itemB: any, statA: string, statB: string, protectA?: boolean, protectB?: boolean) => TransferResult;
    handleBossDefeated: (boss: Boss) => { type: 'item' | 'material', id: string, amount?: number, itemData?: Item }[];
    isProcessingReward: boolean; // เพิ่มตัวนี้
    setProcessingReward: (status: boolean) => void;
    salvageItem: (uid: string) => { success: boolean; materialsGained: { id: string; amount: number }[]; message: string };
    salvageAllByRarity: (rarityToSalvage: string) => {
        success: boolean;
        totalSalvaged: number;
        successCount: number;
        summaryMaterials: { id: string; amount: number }[];
        // 🟢 เพิ่มบรรทัดนี้เข้าไปครับ
        detailedResults?: {
            itemName: string;
            itemIcon?: string;
            isSuccess: boolean;
            materials: { id: string; amount: number }[];
        }[];
        message: string;
    };


    rerollStat: (uid: string, statKey: keyof Stats, useSafetyLock?: boolean, useUniversal?: boolean) => RerollResult;
    rerollSpecialBonus: (uid: string, bonusType: 'element' | 'race', useSafetyLock?: boolean, useUniversal?: boolean) => RerollResult;
    epicPity: number;
    legendPity: number;
    addEpicPity: () => void;
    resetEpicPity: () => void;
    addLegendPity: () => void;
    resetLegendPity: () => void;

    achievements: Record<string, { isUnlocked: boolean; progress?: number }>;
    unlockAchievement: (id: string) => void;
    subscribeToPlayer: (uid: string) => () => void;



}

const getUpdatedCollection = (currentCollection: CollectionRecord[], item: Item): CollectionRecord[] => {
    const exists = currentCollection.find(c => c.itemId === item.id);
    const itemStats = item.stats || {};

    if (exists) {
        return currentCollection.map(c => {
            if (c.itemId === item.id) {
                const newBestStats = { ...c.bestStats };
                Object.entries(itemStats).forEach(([k, v]) => {
                    const key = k as keyof Stats;
                    if (v !== undefined && ((newBestStats[key] as number) || 0) < (v as number)) {
                        newBestStats[key] = v;
                    }
                });
                return { ...c, isUnlocked: true, bestStats: newBestStats, foundCount: c.foundCount + 1 };
            }
            return c;
        });
    }
    return [...currentCollection, { itemId: item.id, isUnlocked: true, bestStats: itemStats, foundCount: 1 }];
};

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            currentPage: 'home',
            setCurrentPage: (page) => set({ currentPage: page }),
            collectionData: [],

            player: {
                name: 'Novice',
                level: 1,
                baseStats: {
                    maxHp: 100, str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0, hit: 0, flee: 0,
                    critRate: 0, critDmg: 0, atk: 0, def: 0, res: 0, mRes: 0
                },
                currentHp: 100,
                inventory: [],
                materials: {},
                equippedItems: {
                    weapon: null, armor: null, shield: null, cloak: null,
                    helmet: null, necklace: null, ring: null, boots: null,
                    skill1: null,
                    skill2: null
                },
                totalRolls: 0,
                epicPity: 0,     // ✅ ค่าเริ่มต้นพิตี้ Epic ในตัว player
                legendPity: 0,
            },
            totalOpens: 0,
            epicPity: 0,         // ✅ ค่าเริ่มต้นระดับ Store หลัก (ถ้าจำเป็นต้องใช้เรียกนอก player)
            legendPity: 0,


            isProcessingReward: false,
            setProcessingReward: (status) => set({ isProcessingReward: status }),


            // เพิ่ม ? string เข้าไป เพื่อให้รองรับการส่งค่าเข้ามาได้ และไม่บังคับ (Optional)
            saveUserData: async (forcedUid?: string) => {
                const uid = forcedUid || useAuthStore.getState().user?.uid || auth.currentUser?.uid;
                if (!uid) return;

                try {
                    const state = get();

                    if (!state.player || !state.player.name) {
                        console.warn("Aborting save: Player data looks empty.");
                        return;
                    }

                    const playerDocRef = doc(db, 'players', uid);

                    const rawData = {
                        player: state.player || {},
                        collectionData: state.collectionData || [],
                        totalOpens: state.totalOpens || 0,
                        epicPity: state.epicPity || 0,
                        legendPity: state.legendPity || 0,
                        updatedAt: new Date().toISOString()
                    };

                    // 🟢 ฟังก์ชัน recursive สำหรับกวาดล้างค่า undefined ออกให้เกลี้ยง (แปลงเป็น null แทน)
                    const removeUndefined = (obj: any): any => {
                        if (obj === undefined) return null;
                        if (obj === null || typeof obj !== 'object') return obj;
                        if (Array.isArray(obj)) {
                            return obj.map(removeUndefined);
                        }
                        const cleaned: Record<string, any> = {};
                        for (const key of Object.keys(obj)) {
                            const cleanedVal = removeUndefined(obj[key]);
                            if (cleanedVal !== undefined) {
                                cleaned[key] = cleanedVal;
                            }
                        }
                        return cleaned;
                    };

                    const cleanData = removeUndefined(rawData);

                    await setDoc(playerDocRef, cleanData, { merge: true });

                    console.log("Game data saved successfully for:", uid);
                } catch (error) {
                    console.error("Error saving user data to Firestore:", error);
                }
            },

            resetGame: () => set({
                currentPage: 'home',
                collectionData: [],
                totalOpens: 0,
                epicPity: 0,
                legendPity: 0,
                player: {
                    name: 'Novice',
                    level: 1,
                    baseStats: {
                        maxHp: 100, str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0, hit: 0, flee: 0,
                        critRate: 0, critDmg: 0, atk: 0, def: 0, res: 0, mRes: 0
                    },
                    currentHp: 100,
                    inventory: [],
                    materials: {},
                    equippedItems: {
                        weapon: null, armor: null, shield: null, cloak: null,
                        helmet: null, necklace: null, ring: null, boots: null,
                        skill1: null, skill2: null
                    },
                    totalRolls: 0,
                    epicPity: 0,
                    legendPity: 0,
                }
            }),



            // 📥 2. ฟังก์ชันโหลดข้อมูลเกมแยกตาม UID ของผู้ใช้จาก Firestore
            loadUserData: async (uid: string) => {
                try {
                    const docRef = doc(db, 'players', uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        set({
                            player: data.player || get().player,
                            collectionData: data.collectionData || [],
                            totalOpens: data.totalOpens || 0,
                            epicPity: data.epicPity || 0,
                            legendPity: data.legendPity || 0,
                            // 🟢 เพิ่มตรงนี้เพื่อโหลดสถานะ Achievement กลับมาด้วย
                            achievements: data.achievements || get().achievements,
                        });
                        console.log("Game data loaded successfully for:", uid);
                    }
                } catch (error) {
                    console.error("Error loading user data:", error);
                }
            },

            addEpicPity: () => set((state) => ({
                epicPity: Math.min(state.epicPity + 1, PITY_CONFIG.EPIC),
                player: {
                    ...state.player,
                    epicPity: Math.min(state.player.epicPity + 1, PITY_CONFIG.EPIC)
                }
            })),
            resetEpicPity: () => set((state) => ({
                epicPity: 0,
                player: { ...state.player, epicPity: 0 }
            })),

            addLegendPity: () => set((state) => ({
                legendPity: Math.min(state.legendPity + 1, PITY_CONFIG.LEGEND),
                player: {
                    ...state.player,
                    legendPity: Math.min(state.player.legendPity + 1, PITY_CONFIG.LEGEND)
                }
            })),
            resetLegendPity: () => set((state) => ({
                legendPity: 0,
                player: { ...state.player, legendPity: 0 }
            })),


            addOpen: () => set((state) => ({ totalOpens: state.totalOpens + 1 })),

            achievements: {},

            unlockAchievement: (id) => {
                const current = get().achievements[id];
                if (!current?.isUnlocked) {
                    set((state) => ({
                        achievements: {
                            ...state.achievements,
                            [id]: { ...state.achievements[id], isUnlocked: true }
                        }
                    }));
                    get().saveUserData(); // 🟢 บันทึกข้อมูลเมื่อปลดล็อก Achievement
                }
            },

            setStats: (newStats) => set((state) => ({
                player: { ...state.player, baseStats: newStats }
            })),

            unlockItem: (item: Item) => set((state) => ({
                collectionData: getUpdatedCollection(state.collectionData, item)
            })),

            addItem: (item: Item) => {
                set((state) => ({
                    player: {
                        ...state.player,
                        inventory: [...state.player.inventory, item]
                    },
                    collectionData: getUpdatedCollection(state.collectionData, item)
                }));
                get().saveUserData(); // 🟢 บันทึกข้อมูลเมื่อได้รับไอเทมใหม่
            },

            addMaterial: (idOrName: string, amount: number) => {
                set((state) => {
                    const normalizedId = idOrName.toLowerCase().replace(/ /g, '_');
                    const template = itemLibrary.find(i => i.id === normalizedId);
                    if (!template) return state;

                    const itemForCollection: Item = {
                        ...template,
                        uid: Math.random().toString(36).substr(2, 9),
                        rarity: 'Common' as any,
                        type: 'material',
                        slot: 'material',
                        stats: (template as any).stats || {},
                        statsLog: []
                    };

                    return {
                        player: {
                            ...state.player,
                            materials: {
                                ...state.player.materials,
                                [template.id]: (state.player.materials[template.id] || 0) + amount
                            }
                        },
                        collectionData: getUpdatedCollection(state.collectionData, itemForCollection)
                    };
                });
                get().saveUserData(); // 🟢 บันทึกข้อมูลเมื่อได้วัตถุดิบ
            },

            equipItem: (item: Item) => set((state) => {
                const { player } = state;
                let newInventory = player.inventory.filter(i => i.uid !== item.uid);
                let newEquipped = { ...player.equippedItems };

                // Handle skill items specially - fill skill1 first, then skill2
                if (item.type === 'skill') {
                    // เช็กก่อนว่าสกิลนี้ใส่อยู่ในช่องไหน 1 หรือ 2 แล้วหรือไม่
                    const isAlreadyInSkill1 = player.equippedItems.skill1?.uid === item.uid;
                    const isAlreadyInSkill2 = player.equippedItems.skill2?.uid === item.uid;

                    if (isAlreadyInSkill1 || isAlreadyInSkill2) {
                        // ถ้าเป็นสกิลอันเดิมที่ใส่อยู่แล้ว จะให้ข้ามหรือคืนค่า state เดิมก็ได้
                        return state;
                    }

                    if (!player.equippedItems.skill1) {
                        newEquipped.skill1 = item;
                    } else if (!player.equippedItems.skill2) {
                        newEquipped.skill2 = item;
                    } else {
                        // ถ้าเต็มทั้ง 2 ช่องแล้ว อยากให้ไปทับช่องไหน? 
                        // เปลี่ยนจากทับ skill1 เป็นทับ skill2 หรือสลับตามต้องการได้ครับ
                        newInventory.push(player.equippedItems.skill2!); // สมมติว่าอยากให้ไปทับช่อง 2 แทน
                        newEquipped.skill2 = item;
                    }
                } else {
                    const slot = item.slot as keyof typeof newEquipped;

                    const twoHandedTypes = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
                    const rangedTypes = ['bow', 'crossbow', 'sling', 'throwing'];

                    const isItemTwoHanded = item.weaponType ? twoHandedTypes.includes(item.weaponType) : false;
                    const isItemRanged = item.weaponType ? rangedTypes.includes(item.weaponType) : false;
                    const isItemHeavyOrRanged = isItemTwoHanded || isItemRanged;

                    const equippedWeapon = player.equippedItems['weapon'];
                    const isEquippedTwoHanded = equippedWeapon?.weaponType ? twoHandedTypes.includes(equippedWeapon.weaponType) : false;
                    const isEquippedRanged = equippedWeapon?.weaponType ? rangedTypes.includes(equippedWeapon.weaponType) : false;
                    const isEquippedHeavyOrRanged = isEquippedTwoHanded || isEquippedRanged;

                    if (item.slot === 'weapon' && isItemHeavyOrRanged && player.equippedItems['shield']) {
                        newInventory.push(player.equippedItems['shield']!);
                        newEquipped['shield'] = null;
                    }

                    // 3. ถ้าใส่โล่ แล้วช่องอาวุธหลักใส่อาวุธสองมือหรือระยะไกลอยู่ -> ถอดอาวุธเก็บเข้ากระเป๋า
                    if (item.slot === 'shield' && equippedWeapon && isEquippedHeavyOrRanged) {
                        newInventory.push(equippedWeapon);
                        newEquipped['weapon'] = null;
                    }

                    if (player.equippedItems[slot]) newInventory.push(player.equippedItems[slot]!);
                    newEquipped[slot] = item;
                }

                const nextPlayer = { ...player, inventory: newInventory, equippedItems: newEquipped };

                useAchievementStore.getState().checkCondition('CHECK_EQUIPPED_ITEMS', {
                    equippedItems: nextPlayer.equippedItems
                });


                console.group(`%c[Equip Event] Equipped: ${item.name}`, "color: #00ff00; font-weight: bold");
                console.table(item.stats);
                getTotalStats(nextPlayer);
                console.groupEnd();

                get().saveUserData();

                // 🟢 อัปเดต leaderboard ทุกครั้งที่ stat เปลี่ยนจาก equip
                const equipAuthUser = useAuthStore.getState().user;
                const equipAuthProfile = useAuthStore.getState().userProfile;
                if (equipAuthUser && equipAuthProfile) {
                    const finalStats = getTotalStats(nextPlayer);
                    useLeaderboardStore.getState().updateMyEntry(equipAuthUser.uid, equipAuthProfile.username, finalStats);
                }

                return { player: nextPlayer };
            }),

            unequipItem: (item: Item) => {
                let nextPlayer = { ...get().player };

                // Handle skill items specially
                if (item.type === 'skill') {
                    if (nextPlayer.equippedItems.skill1?.uid === item.uid) {
                        nextPlayer.inventory = [...nextPlayer.inventory, item];
                        nextPlayer.equippedItems = { ...nextPlayer.equippedItems, skill1: null };
                    } else if (nextPlayer.equippedItems.skill2?.uid === item.uid) {
                        nextPlayer.inventory = [...nextPlayer.inventory, item];
                        nextPlayer.equippedItems = { ...nextPlayer.equippedItems, skill2: null };
                    } else {
                        return; // ถ้าไม่ได้ใส่สกิลนี้ไว้ ให้จบการทำงาน
                    }
                } else {
                    // Handle regular equipment
                    const slot = item.slot as keyof typeof nextPlayer.equippedItems;
                    if (nextPlayer.equippedItems[slot]?.uid !== item.uid) return;

                    nextPlayer.inventory = [...nextPlayer.inventory, item];
                    nextPlayer.equippedItems = { ...nextPlayer.equippedItems, [slot]: null };
                }

                // อัปเดต State ใน Store
                set({ player: nextPlayer });

                // 💾 บันทึกข้อมูลลง Firestore ทันทีหลังถอดอุปกรณ์สำเร็จ
                get().saveUserData();

                // 🟢 อัปเดต leaderboard ทุกครั้งที่ stat เปลี่ยนจาก unequip
                const unequipAuthUser = useAuthStore.getState().user;
                const unequipAuthProfile = useAuthStore.getState().userProfile;
                if (unequipAuthUser && unequipAuthProfile) {
                    const finalStats = getTotalStats(nextPlayer);
                    useLeaderboardStore.getState().updateMyEntry(unequipAuthUser.uid, unequipAuthProfile.username, finalStats);
                }
            },

            salvageItem: (uid: string) => {
                const state = get();

                if (Object.values(state.player.equippedItems).some(i => i?.uid === uid)) {
                    return { success: false, materialsGained: [], message: "Cannot salvage equipped items!" };
                }

                const itemToSalvage = state.player.inventory.find(i => i.uid === uid);
                if (!itemToSalvage) {
                    return { success: false, materialsGained: [], message: "Item not found in inventory!" };
                }

                let materialsGained: { id: string; amount: number }[] = [];
                const rarity = itemToSalvage.rarity?.toLowerCase() || 'common';

                // 🎲 ดึงอัตราความสำเร็จจาก Config กลาง (ถ้าไม่เจอให้ใช้ default 0.80)
                const rateConfig = SALVAGE_RATES[rarity];
                const successRate = rateConfig ? rateConfig.rate : 0.80;

                const isSuccess = Math.random() < successRate;

                // ✅ ดึง material ที่ได้จาก SALVAGE_MATERIALS (config กลางเดียวกับที่ UI preview ใช้)
                // แทนที่ switch-case เดิมที่ hardcode ซ้ำกัน 2 ที่
                const table = SALVAGE_MATERIALS[rarity];
                const drops = isSuccess
                    ? (table?.success || DEFAULT_SALVAGE_FALLBACK)
                    : (table?.fail || DEFAULT_SALVAGE_FALLBACK);

                materialsGained = rollMaterials(drops);

                get().removeItem(uid);

                materialsGained.forEach(mat => {
                    get().addMaterial(mat.id, mat.amount);
                });

                get().saveUserData();

                return {
                    success: isSuccess,
                    materialsGained,
                    message: isSuccess
                        ? `Successfully salvaged ${itemToSalvage.name}!`
                        : `Salvage unstable! ${itemToSalvage.name} yielded only minor scraps.`
                };
            },

            salvageAllByRarity: (rarityToSalvage: string) => {
                const state = get();
                const targetRarity = rarityToSalvage.toLowerCase();

                const equippedUids = new Set(
                    Object.values(state.player.equippedItems)
                        .filter((item): item is Item => item !== null && item !== undefined)
                        .map(item => item.uid)
                );

                const itemsToSalvage = state.player.inventory.filter(item => {
                    const itemRarity = (item.rarity || 'common').toLowerCase();
                    return itemRarity === targetRarity && !equippedUids.has(item.uid);
                });

                if (itemsToSalvage.length === 0) {
                    return {
                        success: false,
                        totalSalvaged: 0,
                        successCount: 0,
                        summaryMaterials: [],
                        detailedResults: [], // 🟢 เพิ่มลิสต์รายละเอียด
                        message: `No unequipped ${targetRarity} items found to salvage!`
                    };
                }

                const summaryMap = new Map<string, number>();
                let successCount = 0;

                // 🟢 เก็บรายละเอียดของไอเทมแต่ละชิ้น
                const detailedResults: {
                    itemName: string;
                    itemIcon?: string;
                    isSuccess: boolean;
                    materials: { id: string; amount: number }[];
                }[] = [];

                itemsToSalvage.forEach(item => {
                    const result = get().salvageItem(item.uid);
                    if (result.success) {
                        successCount++;
                    }

                    // บันทึกลิสต์แยกตามไอเทม
                    detailedResults.push({
                        itemName: item.name,
                        itemIcon: item.icon,
                        isSuccess: result.success,
                        materials: result.materialsGained
                    });

                    // รวมยอดเพื่อแสดงผลสรุประดับภาพรวม
                    result.materialsGained.forEach(mat => {
                        const currentAmount = summaryMap.get(mat.id) || 0;
                        summaryMap.set(mat.id, currentAmount + mat.amount);
                    });
                });

                const summaryMaterials = Array.from(summaryMap.entries()).map(([id, amount]) => ({
                    id,
                    amount
                }));

                get().saveUserData();

                return {
                    success: true,
                    totalSalvaged: itemsToSalvage.length,
                    successCount,
                    summaryMaterials,
                    detailedResults, // 🟢 ส่งรายละเอียดกลับไปด้วย
                    message: `Salvaged ${itemsToSalvage.length} ${targetRarity} items (${successCount} successful)!`
                };


            },

            removeItem: (uid: string) => set((state) => {
                if (Object.values(state.player.equippedItems).some(i => i?.uid === uid)) return state;
                return {
                    player: {
                        ...state.player,
                        inventory: state.player.inventory.filter((item) => item.uid !== uid)
                    }
                };
            }),

            removeMaterial: (name, amount) => set((state) => ({
                player: {
                    ...state.player,
                    materials: { ...state.player.materials, [name]: Math.max(0, (state.player.materials[name] || 0) - amount) }
                }
            })),

            transferStats: (itemAInput, itemBInput, statA, statB, protectA = false, protectB = false) => {
                const itemA = get().player.inventory.find(i => i.uid === itemAInput.uid);
                const itemB = get().player.inventory.find(i => i.uid === itemBInput.uid);

                if (!itemA || !itemB) {
                    return { success: false, message: "Item not found" };
                }

                const costA = TRANSFER_COSTS[itemA.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS];
                const costB = TRANSFER_COSTS[itemB.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS];

                if (!costA || !costB) {
                    return { success: false, message: "Invalid rarity configuration" };
                }

                const selectedCost = (costA.materials[0]?.amount || 0) >= (costB.materials[0]?.amount || 0) ? costA : costB;
                const finalSuccessRate = Math.min(costA.successRate, costB.successRate);

                const protectionCostA = protectA ? (PROTECTION_COSTS[itemA.rarity.toLowerCase()] || []) : [];
                const protectionCostB = protectB ? (PROTECTION_COSTS[itemB.rarity.toLowerCase()] || []) : [];

                const allRequiredMaterials = new Map<string, number>();
                [...selectedCost.materials, ...protectionCostA, ...protectionCostB].forEach(mat => {
                    allRequiredMaterials.set(mat.id, (allRequiredMaterials.get(mat.id) || 0) + mat.amount);
                });

                const currentMaterials = get().player.materials || {};

                for (const [matId, amount] of allRequiredMaterials.entries()) {
                    const playerHas = currentMaterials[matId] || 0;
                    if (playerHas < amount) {
                        return {
                            success: false,
                            message: `Need ${matId} more ${amount - playerHas} pieces (have ${playerHas})`
                        };
                    }
                }

                for (const [matId, amount] of allRequiredMaterials.entries()) {
                    get().removeMaterial(matId, amount);
                }

                const isSuccess = Math.random() * 100 <= finalSuccessRate;

                // ✅ cast statA/statB เป็น keyof Stats ตรงนี้ครั้งเดียว ใช้ตัวแปรนี้ต่อทั้งฟังก์ชัน
                const statAKey = statA as keyof Stats;
                const statBKey = statB as keyof Stats;

                const valA = itemA.stats[statAKey] || 0;
                const valB = itemB.stats[statBKey] || 0;

                if (isSuccess) {
                    const newStatsA = { ...itemA.stats };
                    delete newStatsA[statAKey];
                    newStatsA[statBKey] = valB;

                    const newStatsB = { ...itemB.stats };
                    delete newStatsB[statBKey];
                    newStatsB[statAKey] = valA;

                    get().updateInventoryItem(itemA.uid, { ...itemA, stats: newStatsA });
                    get().updateInventoryItem(itemB.uid, { ...itemB, stats: newStatsB });

                    get().saveUserData();

                    return {
                        success: true,
                        itemAName: itemA.name,
                        itemBName: itemB.name,
                        removedStatA: statA, removedValA: valA,
                        gainedStatA: statB, gainedValA: valB,
                        removedStatB: statB, removedValB: valB,
                        gainedStatB: statA, gainedValB: valA,
                        message: "Transfer successful!"
                    };
                } else {
                    const newStatsA = { ...itemA.stats };
                    if (!protectA) {
                        delete newStatsA[statAKey];
                    }

                    const newStatsB = { ...itemB.stats };
                    if (!protectB) {
                        delete newStatsB[statBKey];
                    }

                    get().updateInventoryItem(itemA.uid, { ...itemA, stats: newStatsA });
                    get().updateInventoryItem(itemB.uid, { ...itemB, stats: newStatsB });

                    get().saveUserData();

                    const protectedMsgParts: string[] = [];
                    if (protectA) protectedMsgParts.push(itemA.name);
                    if (protectB) protectedMsgParts.push(itemB.name);
                    return {
                        success: false,
                        itemAName: itemA.name,
                        itemBName: itemB.name,
                        removedStatA: statA, removedValA: valA,
                        removedStatB: statB, removedValB: valB,
                        protectedA: protectA,
                        protectedB: protectB,
                        message: protectedMsgParts.length > 0
                            ? `Transfer failed! ${protectedMsgParts.join(' and ')} ${protectedMsgParts.length > 1 ? 'were' : 'was'} protected against loss.`
                            : "Transfer failed! Both stats lost."
                    };
                }
            },

            rerollStat: (uid, statKey, useSafetyLock = false, useUniversal = false) => {
                const state = get();
                const item = state.player.inventory.find(i => i.uid === uid);
                if (!item) return { success: false, message: 'Item not found in inventory.' };
                if (item.type !== 'equipment') return { success: false, message: 'Reroll can only be used on equipment.' };

                const currentVal = (item.stats as any)?.[statKey];
                if (!currentVal) return { success: false, message: `This item has no stat ${statKey}.` };

                const requiredMaterial = STAT_TO_MATERIAL[statKey];
                if (!requiredMaterial) return { success: false, message: `Stat ${statKey} does not support rerolling yet.` };

                const materialId = useUniversal ? UNIVERSAL_MATERIAL : requiredMaterial;
                const cost = calculateRerollCost(item.rarity, item.itemLevel ?? 1, useSafetyLock, useUniversal);
                const currentAmount = state.player.materials[materialId] || 0;

                if (currentAmount < cost) {
                    return { success: false, message: `Not enough ${materialId}. (Required: ${cost}, Have: ${currentAmount})` };
                }

                const ranges = getFullStatRanges({
                    slot: item.slot,
                    weaponType: item.weaponType,
                    rarity: item.rarity,
                    itemLevel: item.itemLevel ?? 1,
                });
                const range = ranges[statKey];
                if (!range) return { success: false, message: 'Valid stat range not found.' };

                const newVal = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

                get().removeMaterial(materialId, cost);

                let finalVal = newVal;
                let kept = false;
                if (useSafetyLock && newVal < currentVal) {
                    finalVal = currentVal;
                    kept = true;
                }

                const newStats = { ...item.stats, [statKey]: finalVal };
                const newStatsLog = (item.statsLog || []).map(log =>
                    log.statKey === statKey ? { ...log, value: finalVal } : log
                );

                get().updateInventoryItem(uid, { ...item, stats: newStats, statsLog: newStatsLog });
                get().saveUserData();

                const diff = finalVal - currentVal;
                const diffText = diff > 0 ? ` (+${diff})` : diff < 0 ? ` (${diff})` : ' (No change)';

                return {
                    success: true,
                    oldValue: currentVal,
                    newValue: finalVal,
                    kept,
                    message: kept
                        ? `New roll (${newVal}) was worse, Safety Lock kept the original value (${currentVal}).`
                        : `${String(statKey).toUpperCase()} changed from ${currentVal} to ${finalVal}${diffText}.`,
                };
            },

            rerollSpecialBonus: (uid, bonusType, useSafetyLock = false, useUniversal = false) => {
                const state = get();
                const item = state.player.inventory.find(i => i.uid === uid);
                if (!item) return { success: false, message: 'Item not found in inventory.' };

                const currentBonus = bonusType === 'element' ? item.elementBonus : item.raceBonus;
                if (!currentBonus) {
                    return { success: false, message: `This item has no ${bonusType === 'element' ? 'Element' : 'Race'} Bonus.` };
                }

                const requiredMaterial = bonusType === 'element' ? ELEMENT_BONUS_MATERIAL : RACE_BONUS_MATERIAL;
                const materialId = useUniversal ? UNIVERSAL_MATERIAL : requiredMaterial;
                const cost = calculateRerollCost(item.rarity, item.itemLevel ?? 1, useSafetyLock, useUniversal);
                const currentAmount = state.player.materials[materialId] || 0;

                if (currentAmount < cost) {
                    return { success: false, message: `Not enough ${materialId}. (Required: ${cost}, Have: ${currentAmount})` };
                }

                const range = getSpecialBonusRange(item.rarity);
                const newValue = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

                get().removeMaterial(materialId, cost);

                let finalBonus: any;

                if (bonusType === 'element') {
                    type ElementType = 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Dark' | 'Holy' | 'Neutral';
                    const pool = ELEMENT_POOL as readonly ElementType[];
                    const newType = pool[Math.floor(Math.random() * pool.length)];

                    finalBonus = { type: newType, value: newValue };
                    if (useSafetyLock && newValue < (currentBonus as { type: ElementType; value: number }).value) {
                        finalBonus = currentBonus;
                    }
                } else {
                    type RaceType = 'DemiHuman' | 'Plant' | 'Brute' | 'Undead' | 'Demon' | 'Angel' | 'Dragon';
                    const pool = RACE_POOL as readonly RaceType[];
                    const newType = pool[Math.floor(Math.random() * pool.length)];

                    finalBonus = { type: newType, value: newValue };
                    if (useSafetyLock && newValue < (currentBonus as { type: RaceType; value: number }).value) {
                        finalBonus = currentBonus;
                    }
                }

                const kept = useSafetyLock && newValue < currentBonus.value;

                const updatedItem = bonusType === 'element'
                    ? { ...item, elementBonus: finalBonus }
                    : { ...item, raceBonus: finalBonus };



                get().updateInventoryItem(uid, updatedItem);
                get().saveUserData();

                const diff = finalBonus.value - currentBonus.value;
                const diffText = diff > 0 ? ` (+${diff}%)` : diff < 0 ? ` (${diff}%)` : ' (No change)';

                return {
                    success: true,
                    oldBonus: currentBonus,
                    newBonus: finalBonus,
                    kept,
                    message: kept
                        ? `New roll (${finalBonus.type} +${finalBonus.value}%) was worse, Safety Lock kept the original (${currentBonus.type} +${currentBonus.value}%).`
                        : `Changed from ${currentBonus.type} +${currentBonus.value}% to ${finalBonus.type} +${finalBonus.value}%${diffText}.`,
                };
            },

            updateInventoryItem: (uid, updatedItem) => set((state) => ({
                player: {
                    ...state.player,
                    inventory: state.player.inventory.map(item => item.uid === uid ? updatedItem : item)
                }
            })),

            // ใน gameStore.ts
            handleBossDefeated: (boss: Boss) => {
                // 1. คำนวณรางวัลก่อนเลย (ไม่ต้องรอเช็ค Lock)
                const rewards = calculateBossDrops(boss, boss.level);

                // 2. ใช้ flag ป้องกันการ add ของเข้ากระเป๋าซ้ำเท่านั้น
                if (!isProcessing) {
                    isProcessing = true;
                    rewards.forEach(reward => {
                        if (reward.type === 'material' && reward.amount) {
                            get().addMaterial(reward.id, reward.amount);
                        } else if (reward.type === 'item' && reward.itemData) {
                            get().addItem(reward.itemData);
                        }
                    });

                    get().saveUserData();

                    setTimeout(() => { isProcessing = false; }, 1000);
                }

                // 3. คืนค่ารางวัลให้ UI ไปแสดงผลเสมอ ไม่ว่าเงื่อนไขจะเป็นยังไง
                return rewards;
            },

            subscribeToPlayer: (uid: string) => {
                const playerRef = doc(db, 'players', uid);
                const unsubscribe = onSnapshot(playerRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.player) {
                            set({ player: data.player });
                        }
                    }
                });
                return unsubscribe; // คืนค่าฟังก์ชัน unsubscribe สำหรับเอาไปใช้ใน useEffect cleanup
            },
        }),
        {
            name: 'game-storage',
            // เพิ่มส่วนนี้เพื่อบอกว่าเราต้องการเก็บ State ทั้งหมด หรือบางส่วน
            partialize: (state) => state,
        }
    )
);