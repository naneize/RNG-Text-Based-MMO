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


export const useCharacterDashboard = () => {
    const { player, equipItem, unequipItem, epicPity, legendPity } = useGameStore();

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
        // 1. คำนวณ maxLevel ตามเดิม
        const maxLevel = totalOpens < 1000
            ? 1 + Math.floor(totalOpens / 10) * 5
            : 500 + Math.floor((totalOpens - 1000) / 100) * 5;

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
            newItem = generateRandomItem('legendary', randomLevel);
            resetLegendPity();
            resetEpicPity();
        } else if (currentEpicPity >= PITY_CONFIG.EPIC) {
            newItem = generateRandomItem('epic', randomLevel);
            resetEpicPity();
            addLegendPity(); // ขยับ Legend Pity ต่อเมื่อการันตี Epic
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

    const transferItemStat = (itemA: Item, itemB: Item, statA: string, statB: string) => {
        const valFromA = itemA.stats[statA];

        // 1. สร้าง Object Stats ใหม่สำหรับ B
        const newStatsB = { ...itemB.stats };

        // ลบ Key เก่าออก (เช่น DEX)
        delete newStatsB[statB];

        // เพิ่ม Key ใหม่เข้าไปพร้อมค่าที่โอนมา (เช่น AGI: 130)
        newStatsB[statA] = valFromA;

        const updatedItemB = {
            ...itemB,
            stats: newStatsB
        };

        // 2. อัปเดต Item A (ลบค่าที่โอนออกไปแล้ว)
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

    const equippedInSlot = selectedItem ? player.equippedItems[selectedItem.slot] : null;



    return {
        player, finalStats, selectedItem, setSelectedItem, selectedMaterial, setSelectedMaterial, statBreakdown,
        lootedItem, epicPity, legendPity, setLootedItem, filter, setFilter, showCombine, setShowCombine,
        showBonusModal, setShowBonusModal, isLooting, progress, synergyBonusList,
        getCombinedBonuses, getDropChance, handleLoot, slots, filterOptions,
        filteredInventory, getRarityColor, equippedItem: equippedInSlot, equipItem, unequipItem,
        transferItemStat,
        isAutoActive,
        setIsAutoActive,
        // 🟢 เพิ่ม toggleAutoLoot ออกไปให้ UI ผูกเข้ากับปุ่มกด Auto Roll ครับ
        toggleAutoLoot
    };
};