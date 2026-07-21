import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, Stats, Item, CollectionRecord, Boss } from '../types/game';
import { itemLibrary } from '../data/itemLibrary';
import { getTotalStats } from '../utils/combat';
import { TRANSFER_COSTS } from '../data/transferConfig';
import { calculateBossDrops } from '../utils/dropLogic';
import { useAchievementStore } from './achievementStore';


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
    gainedStatB?: string;
    gainedValB?: number;
    message: string;
}

interface GameState {
    currentPage: 'home' | 'adventure' | 'collection' | 'achievement';
    setCurrentPage: (page: 'home' | 'adventure' | 'collection' | 'achievement') => void;
    player: Player;
    addItem: (item: Item) => void;
    addMaterial: (name: string, amount: number) => void;
    setStats: (newStats: Stats) => void;
    totalOpens: number;
    addOpen: () => void;
    equipItem: (item: Item) => void;
    unequipItem: (item: Item) => void;
    removeItem: (uid: string) => void;
    removeMaterial: (name: string, amount: number) => void;
    collectionData: CollectionRecord[];
    unlockItem: (item: Item) => void;
    updateInventoryItem: (uid: string, updatedItem: Item) => void;
    transferStats: (itemA: any, itemB: any, statA: string, statB: string) => TransferResult;
    handleBossDefeated: (boss: Boss) => { type: 'item' | 'material', id: string, amount?: number, itemData?: Item }[];
    isProcessingReward: boolean; // เพิ่มตัวนี้
    setProcessingReward: (status: boolean) => void;

    achievements: Record<string, { isUnlocked: boolean; progress?: number }>;
    unlockAchievement: (id: string) => void;

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
                    skill: null
                },
            },
            totalOpens: 0,

            isProcessingReward: false,
            setProcessingReward: (status) => set({ isProcessingReward: status }),



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
                }
            },

            setStats: (newStats) => set((state) => ({
                player: { ...state.player, baseStats: newStats }
            })),
            unlockItem: (item: Item) => set((state) => ({
                collectionData: getUpdatedCollection(state.collectionData, item)
            })),
            addItem: (item: Item) => set((state) => ({
                player: {
                    ...state.player,
                    inventory: [...state.player.inventory, item]
                },
                collectionData: getUpdatedCollection(state.collectionData, item)
            })),
            addMaterial: (idOrName: string, amount: number) => set((state) => {
                const normalizedId = idOrName.toLowerCase().replace(/ /g, '_');
                const template = itemLibrary.find(i => i.id === normalizedId);
                if (!template) return state;
                const itemForCollection: Item = {
                    ...template,
                    uid: Math.random().toString(36).substr(2, 9),
                    rarity: 'Common' as any,
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
            }),

            equipItem: (item: Item) => set((state) => {
                const { player } = state;
                let newInventory = player.inventory.filter(i => i.uid !== item.uid);
                let newEquipped = { ...player.equippedItems };
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

                const nextPlayer = { ...player, inventory: newInventory, equippedItems: newEquipped };

                useAchievementStore.getState().checkCondition('CHECK_EQUIPPED_ITEMS', {
                    equippedItems: nextPlayer.equippedItems
                });


                console.group(`%c[Equip Event] Equipped: ${item.name}`, "color: #00ff00; font-weight: bold");
                console.table(item.stats);
                getTotalStats(nextPlayer);
                console.groupEnd();


                return { player: nextPlayer };
            }),

            unequipItem: (item: Item) => set((state) => {
                if (state.player.equippedItems[item.slot]?.uid !== item.uid) return state;
                return {
                    player: {
                        ...state.player,
                        inventory: [...state.player.inventory, item],
                        equippedItems: { ...state.player.equippedItems, [item.slot]: null }
                    }
                };
            }),

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

            transferStats: (itemAInput, itemBInput, statA, statB) => {
                const itemA = get().player.inventory.find(i => i.uid === itemAInput.uid);
                const itemB = get().player.inventory.find(i => i.uid === itemBInput.uid);

                if (!itemA || !itemB) {
                    return { success: false, message: "ไม่พบไอเทม" };
                }

                const costA = TRANSFER_COSTS[itemA.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS];
                const costB = TRANSFER_COSTS[itemB.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS];

                if (!costA || !costB) {
                    return { success: false, message: "Invalid rarity configuration" };
                }

                const cost = costA.amount >= costB.amount ? costA : costB;
                const finalSuccessRate = Math.min(costA.successRate, costB.successRate);

                const currentMaterials = get().player.materials || {};
                if ((currentMaterials[cost.materialId] || 0) < cost.amount) {
                    return { success: false, message: `ต้องการ ${cost.materialId} เพิ่มอีก ${cost.amount - (currentMaterials[cost.materialId] || 0)} ชิ้น` };
                }

                get().removeMaterial(cost.materialId, cost.amount);

                const isSuccess = Math.random() * 100 <= finalSuccessRate;
                const valA = itemA.stats[statA] || 0;
                const valB = itemB.stats[statB] || 0;

                if (isSuccess) {
                    const newStatsA = { ...itemA.stats };
                    delete newStatsA[statA];
                    newStatsA[statB] = valB;

                    const newStatsB = { ...itemB.stats };
                    delete newStatsB[statB];
                    newStatsB[statA] = valA;

                    get().updateInventoryItem(itemA.uid, { ...itemA, stats: newStatsA });
                    get().updateInventoryItem(itemB.uid, { ...itemB, stats: newStatsB });

                    return {
                        success: true,
                        itemAName: itemA.name,
                        itemBName: itemB.name,
                        // ฝั่ง A: เสีย statA (valA) ได้ statB (valB) มาแทน
                        removedStatA: statA, removedValA: valA,
                        gainedStatA: statB, gainedValA: valB,
                        // ฝั่ง B: เสีย statB (valB) ได้ statA (valA) มาแทน
                        removedStatB: statB, removedValB: valB,
                        gainedStatB: statA, gainedValB: valA,
                        message: "Transfer successful!"
                    };
                } else {
                    const newStatsA = { ...itemA.stats };
                    delete newStatsA[statA];
                    const newStatsB = { ...itemB.stats };
                    delete newStatsB[statB];

                    get().updateInventoryItem(itemA.uid, { ...itemA, stats: newStatsA });
                    get().updateInventoryItem(itemB.uid, { ...itemB, stats: newStatsB });

                    return {
                        success: false,
                        itemAName: itemA.name,
                        itemBName: itemB.name,
                        removedStatA: statA, removedValA: valA,
                        removedStatB: statB, removedValB: valB,
                        message: "Transfer failed! Both stats lost."
                    };
                }
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
                    setTimeout(() => { isProcessing = false; }, 1000);
                }

                // 3. คืนค่ารางวัลให้ UI ไปแสดงผลเสมอ ไม่ว่าเงื่อนไขจะเป็นยังไง
                return rewards;
            },
        }),
        {
            name: 'game-storage',
            // เพิ่มส่วนนี้เพื่อบอกว่าเราต้องการเก็บ State ทั้งหมด หรือบางส่วน
            partialize: (state) => state,
        }
    )
);