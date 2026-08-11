import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Item, EquipmentSlot } from '../types/game';
import { generateRandomItem, rarityConfig } from '../utils/itemGenerator';
import { getSynergyInfo } from '../utils/synergy';
import { getEffectiveStatsInfo } from '../utils/combat';
import { getTotalStatsWithBreakdown } from '../utils/combat';
import { useAchievementStore } from '../store/achievementStore';
import { PITY_CONFIG } from '../types/game';
import { MAX_INVENTORY_SLOTS } from '../types/game';
import { useChatStore } from '../store/chatStore';
import type { Stats } from '../types/game';


export const useCharacterDashboard = () => {
    const { player, equipItem, unequipItem, epicPity, legendPity, totalOpens } = useGameStore();

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<{ name: string, amount: number } | null>(null);
    const [lootedItem, setLootedItem] = useState<Item | null>(null);
    const [filter, setFilter] = useState<EquipmentSlot | 'all' | 'skill' | 'material'>('all');
    const [showCombine, setShowCombine] = useState(false);
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [isLooting, setIsLooting] = useState(false);
    const [progress, setProgress] = useState(0);
    const synergyBonusList = [...getEffectiveStatsInfo(), ...getSynergyInfo()];
    const [isAutoActive, setIsAutoActive] = useState(false);
    const isAutoRef = useRef(isAutoActive);
    const workerRef = useRef<Worker | null>(null);

    const executeSingleRoll = async () => {
        // ดึงสถานะและฟังก์ชันทั้งหมดจาก Store (รวมถึงระบบ Pity)
        const store = useGameStore.getState();
        const {
            addOpen,
            totalOpens,
            addEpicPity,
            resetEpicPity,
            addLegendPity,
            resetLegendPity,
            addItem
        } = store;

        // 1. คำนวณเลเวลไอเทมตามจำนวนครั้งที่เปิด (Progression System)

        const ROLL_MAX_ITEM_LEVEL = 300; // ✅ ต่ำกว่า boss loot ceiling (1,000) พอสมควร ให้บอสยังคงเป็นแหล่งของแรงสุด

        const rawMaxLevel = totalOpens < 1000
            ? 1 + Math.floor(totalOpens / 10) * 5
            : 500 + Math.floor((totalOpens - 1000) / 100) * 5;

        const maxLevel = Math.min(rawMaxLevel, ROLL_MAX_ITEM_LEVEL);

        // 2. กำหนดให้สุ่มอยู่ในช่วง 70% ถึง 100% ของ maxLevel ปัจจุบัน 
        // (หรือจะปรับสัดส่วน 0.7 ตามความเหมาะสมได้เลยครับ เพื่อไม่ให้เจอของเวล 1 ตอนช่วงท้ายๆ)
        const minLevel = Math.max(1, Math.floor(maxLevel * 0.7));
        const randomLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

        // เพิ่มสถิติจำนวนครั้งที่เปิดเข้าไปใน Store
        addOpen();

        let newItem;
        const currentEpicPity = useGameStore.getState().epicPity;
        const currentLegendPity = useGameStore.getState().legendPity;

        // 3. ตรวจสอบเงื่อนไข Pity แบบป้องกันการเลยเพดาน
        if (currentLegendPity >= PITY_CONFIG.LEGEND) {
            // บังคับสุ่มเฉพาะอุปกรณ์ระดับ Legendary
            newItem = generateRandomItem('legendary', randomLevel);
            // ✅ เพิ่มเงื่อนไขดักประเภท skill เข้าไป (และประเภทอื่นที่ไม่ต้องการ)
            while (newItem.type === 'material' || newItem.type === 'skill') {
                newItem = generateRandomItem('legendary', randomLevel);
            }
            resetLegendPity();
            resetEpicPity();
        } else if (currentEpicPity >= PITY_CONFIG.EPIC) {
            // บังคับสุ่มเฉพาะอุปกรณ์ระดับ Epic
            newItem = generateRandomItem('epic', randomLevel);
            // ✅ เพิ่มเงื่อนไขดักประเภท skill เข้าไปเช่นกัน
            while (newItem.type === 'material' || newItem.type === 'skill') {
                newItem = generateRandomItem('epic', randomLevel);
            }
            resetEpicPity();
            addLegendPity();
        } else {
            newItem = generateRandomItem(undefined, randomLevel);

            // เช็คผลลัพธ์จากการสุ่มปกติ
            if (newItem.rarity === 'Legendary') {
                resetLegendPity();
                resetEpicPity();
            } else if (newItem.rarity === 'Epic') {
                resetEpicPity();
                addLegendPity();
            } else {
                // ถ้าได้เกลือ (Common/Rare ปกติ) ถึงจะบวก Pity ทีละ 1 และล็อกไม่ให้เกินเพดาน
                if (currentLegendPity < PITY_CONFIG.LEGEND) addLegendPity();
                if (currentEpicPity < PITY_CONFIG.EPIC) addEpicPity();
            }
        }

        if (newItem.type === 'material') {
            useGameStore.getState().addMaterial(newItem.name, 1);
        } else {
            addItem(newItem);
            useAchievementStore.getState().checkCondition('FIRST_EQUIP');
        }

        if (newItem && newItem.rarity) {
            useAchievementStore.getState().checkCondition('OBTAIN_ITEM', { rarity: newItem.rarity });
        }

        if (newItem && newItem.rarity === 'Legendary') {
            useChatStore.getState().sendMessage(
                `Server Broadcast: A Legendary item has been unleashed!`,
                newItem
            ).catch((error) => {
                console.error("Failed to send legendary announcement to chat:", error);
            });
        }
        return newItem;
    };

    useEffect(() => {
        // 1. สร้าง Worker ขึ้นมา
        const worker = new Worker(
            new URL('../workers/lootWorker.ts', import.meta.url),
            { type: 'module' }
        );
        workerRef.current = worker;

        // 2. 🟢 เช็คและกำหนด onmessage ด้วย optional chaining (?.) เพื่อป้องกัน Error ตอนที่ ref เป็น null
        worker.onmessage = async (e: MessageEvent) => {
            if (e.data.action === 'PROGRESS') {
                setProgress(e.data.progress);
                setIsLooting(true);
            }

            if (e.data.action === 'TICK_ROLL') {
                const currentInventory = useGameStore.getState().player.inventory;

                if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
                    setIsAutoActive(false);
                    setIsLooting(false);
                    setProgress(0);
                    isAutoRef.current = false;
                    workerRef.current?.postMessage({ action: 'STOP_AUTO' });
                    return;
                }

                await executeSingleRoll();
                setProgress(0);
            }
        };

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    const { finalStats, breakdown: statBreakdown } = getTotalStatsWithBreakdown(player);

    // Logic คำนวณโบนัสรวม
    const getCombinedBonuses = (equipment: Record<string, Item | null>) => {
        const elements: Record<string, number> = {};
        const races: Record<string, number> = {};
        Object.values(equipment).forEach(item => {
            if (item) {
                if ((item as any).elementBonus) {
                    const b = (item as any).elementBonus;
                    elements[b.type] = (elements[b.type] || 0) + b.value;
                }
                if ((item as any).raceBonus) {
                    const b = (item as any).raceBonus;
                    races[b.type] = (races[b.type] || 0) + b.value;
                }
            }
        });
        return {
            elements: Object.entries(elements).map(([type, value]) => ({ type, value })),
            races: Object.entries(races).map(([type, value]) => ({ type, value }))
        };
    };

    const transferItemStat = (itemA: Item, itemB: Item, statA: keyof Stats, statB: keyof Stats) => {
        // 1. ดึงค่าจาก A
        const valFromA = itemA.stats[statA];

        // ถ้า A ไม่มีค่านี้ หรือค่าเป็น undefined ให้หยุดทำงาน
        if (valFromA === undefined) return;

        // 2. สร้าง Object Stats ใหม่สำหรับ B
        const newStatsB = { ...itemB.stats };

        // ลบ Key เก่าออก (ใช้ as keyof Stats เพื่อความปลอดภัยทาง Type)
        delete newStatsB[statB];

        // เพิ่ม Key ใหม่เข้าไปพร้อมค่าที่โอนมา (ใช้ as any หรือทำการ Cast type เพื่อป้องกัน TypeScript เตือนเรื่อง Index signature)
        (newStatsB as Record<string, any>)[statA] = valFromA;

        const updatedItemB = {
            ...itemB,
            stats: newStatsB
        };

        // 3. อัปเดต Item A (ลบค่าที่โอนออกไปแล้ว)
        const newStatsA = { ...itemA.stats };
        delete newStatsA[statA]; // ลบ statA ออกจาก A

        const updatedItemA = {
            ...itemA,
            stats: newStatsA
        };

        // บันทึกผลลัพธ์
        useGameStore.getState().updateInventoryItem(itemB.uid, updatedItemB);
        useGameStore.getState().updateInventoryItem(itemA.uid, updatedItemA);
    };

    const getDropChance = (rarity: string) => {
        const totalWeight = rarityConfig.reduce((sum, item) => sum + item.weight, 0);
        const item = rarityConfig.find(r => r.name === rarity);
        return item ? ((item.weight / totalWeight) * 100).toFixed(1) : "0.0";
    };

    // 🛒 เพิ่มฟังก์ชันสำหรับส่งข้อมูลการขายไอเทมไปยัง Store
    const handleSellItem = async (itemUid: string, price: number, currencyType: string) => {
        try {
            // สมมติว่าใน gameStore (หรือ marketplaceStore) ของคุณมีฟังก์ชันสำหรับลงขาย
            const store = useGameStore.getState();

            // ตัวอย่างการเรียกใช้ฟังก์ชันขายใน Store (ปรับชื่อฟังก์ชันให้ตรงกับ Store จริงของคุณครับ)
            if (typeof (store as any).listItem === 'function') {
                return await (store as any).listItem(itemUid, price, currencyType);
            } else {
                console.error("listItem function not found in useGameStore");
                return { success: false, message: "Store function not found" };
            }
        } catch (error) {
            console.error("Failed to sell item:", error);
            return { success: false, message: "Failed to sell item" };
        }
    };

    const handleLoot = async (isAuto = false) => {
        const currentInventory = useGameStore.getState().player.inventory;

        if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
            if (isAuto) {
                setIsAutoActive(false);
                workerRef.current?.postMessage({ action: 'STOP_AUTO' });
            }
            return;
        }

        // ถ้ากำลังสุ่มอยู่แล้ว ไม่ให้กดซ้ำ
        if (isLooting) return;

        setIsLooting(true);
        setProgress(0);

        // ✨ ถ้าเป็นการกดมือ (Manual) ให้ใช้ setInterval จำลองหลอดวิ่ง 1 วินาที
        if (!isAuto) {
            const duration = 1000;
            const interval = 20;
            const steps = duration / interval;
            let currentStep = 0;

            const timer = setInterval(async () => {
                currentStep++;
                setProgress((currentStep / steps) * 100);

                if (currentStep >= steps) {
                    clearInterval(timer);

                    // สุ่มไอเทมหลังจากหลอดวิ่งครบ 1 วินาที
                    const newItem = await executeSingleRoll();

                    setIsLooting(false);
                    setLootedItem(newItem); // เด้ง Modal เฉพาะตอนกดมือ
                }
            }, interval);
        } else {
            // กรณีถ้าเป็น Auto จะวิ่งผ่าน Worker (ไม่ใช้ก้อนนี้)
            await executeSingleRoll();
            setIsLooting(false);
        }
    };

    const toggleAutoLoot = () => {
        // ใช้ Functional update ป้องกัน Stale State
        setIsAutoActive((prev) => {
            const nextState = !prev;

            // 🟢 อัปเดตค่าลง Ref ทันทีแบบ Synchronous 
            isAutoRef.current = nextState;

            if (nextState) {
                // เช็คกระเป๋าก่อนเริ่ม Auto
                const currentInventory = useGameStore.getState().player.inventory;
                if (currentInventory.length >= MAX_INVENTORY_SLOTS) {
                    isAutoRef.current = false; // ถ้าเปิดไม่ได้ ให้รีเซ็ต Ref กลับด้วย
                    return false; // ไม่เปิดถ้ากระเป๋าเต็ม
                }

                setIsLooting(true);
                workerRef.current?.postMessage({ action: 'START_AUTO', duration: 2500 });
            } else {
                setIsLooting(false);
                setProgress(0);
                workerRef.current?.postMessage({ action: 'STOP_AUTO' });
            }

            return nextState;
        });
    };

    const slots: EquipmentSlot[] = ['weapon', 'shield', 'helm', 'armor', 'boots', 'cloak', 'ring', 'necklace'];

    // 🟢 แก้ไขเพิ่ม 'material' เข้าไปให้ครบ
    const filterOptions: ('all' | EquipmentSlot | 'skill')[] = ['all', ...slots, 'skill'];

    const filteredInventory = filter === 'all'
        ? player.inventory
        : filter === 'skill'
            ? player.inventory.filter(item => item.type === 'skill')
            : player.inventory.filter(item => item.slot === filter);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
            case 'Epic': return 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
            case 'Rare': return 'border-blue-500';
            default: return 'border-slate-700';
        }
    };

    const slotKey = selectedItem?.slot === 'skill' ? 'skill1' : selectedItem?.slot;
    const equippedInSlot = (selectedItem && slotKey) ? player.equippedItems[slotKey as keyof typeof player.equippedItems] : null;


    return {
        player, finalStats, selectedItem, setSelectedItem, selectedMaterial, setSelectedMaterial, statBreakdown,
        lootedItem, epicPity, legendPity, setLootedItem, filter, setFilter, showCombine, setShowCombine,
        showBonusModal, setShowBonusModal, isLooting, progress, synergyBonusList,
        getCombinedBonuses, getDropChance, handleLoot, slots, filterOptions,
        filteredInventory, getRarityColor, equippedItem: equippedInSlot, equipItem, unequipItem,
        transferItemStat,
        isAutoActive,
        setIsAutoActive,
        toggleAutoLoot,
        totalOpens, handleSellItem
    };
};