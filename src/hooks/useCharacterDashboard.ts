import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Item, EquipmentSlot } from '../types/game';
import { generateRandomItem, rarityConfig } from '../utils/itemGenerator';
import { getSynergyInfo } from '../utils/synergy';
import { getEffectiveStatsInfo } from '../utils/combat';
import { getTotalStatsWithBreakdown } from '../utils/combat';
import { useAchievementStore } from '../store/achievementStore';

export const useCharacterDashboard = () => {
    const { player, addItem, equipItem, unequipItem } = useGameStore();

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<{ name: string, amount: number } | null>(null);
    const [lootedItem, setLootedItem] = useState<Item | null>(null);
    const [filter, setFilter] = useState<EquipmentSlot | 'all' | 'skill'>('all');
    const [showCombine, setShowCombine] = useState(false);
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [isLooting, setIsLooting] = useState(false);
    const [progress, setProgress] = useState(0);
    const synergyBonusList = [...getEffectiveStatsInfo(), ...getSynergyInfo()];

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

    const handleLoot = () => {
        if (isLooting) return;

        // ดึงสถานะปัจจุบันจาก Store
        const store = useGameStore.getState();
        const { addOpen, totalOpens } = store;

        setIsLooting(true);
        setProgress(0);

        const duration = 1000;
        const interval = 20;
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            setProgress((currentStep / steps) * 100);

            if (currentStep >= steps) {
                clearInterval(timer);

                // คำนวณเลเวลไอเทมตามจำนวนครั้งที่เปิด (Progression System)
                // เพดานสูงสุด 50, เพิ่มเพดานทีละ 5 เลเวล ทุกๆ 10 ครั้งที่เปิด
                const maxLevel = totalOpens < 1000
                    ? 1 + Math.floor(totalOpens / 10) * 5
                    : 500 + Math.floor((totalOpens - 1000) / 100) * 5;
                const randomLevel = Math.floor(Math.pow(Math.random(), 2) * maxLevel) + 1;

                // เพิ่มสถิติจำนวนครั้งที่เปิดเข้าไปใน Store
                addOpen();

                // สร้างไอเทมโดยส่ง randomLevel เข้าไป
                const newItem = generateRandomItem(undefined, randomLevel);

                if (newItem.type === 'material') {
                    useGameStore.getState().addMaterial(newItem.name, 1);
                } else {
                    addItem(newItem);

                    // 🏆 สั่งปลดล็อก achievement ทันทีเมื่อสุ่มได้อุปกรณ์
                    useAchievementStore.getState().checkCondition('FIRST_EQUIP');
                }

                setLootedItem(newItem);
                setIsLooting(false);
                setTimeout(() => setLootedItem(null), 1500);
            }
        }, interval);
    };

    const slots: EquipmentSlot[] = ['weapon', 'shield', 'helm', 'armor', 'boots', 'cloak', 'ring', 'necklace'];
    const filterOptions: ('all' | EquipmentSlot | 'skill')[] = ['all', ...slots, 'skill'];

    const filteredInventory = (filter === 'all'
        ? player.inventory
        : filter === 'skill'
            ? player.inventory.filter(item => item.type === 'skill')
            : player.inventory.filter(item => item.slot === filter)
    ).filter(item => item.type !== 'material');

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
        lootedItem, setLootedItem, filter, setFilter, showCombine, setShowCombine,
        showBonusModal, setShowBonusModal, isLooting, progress, synergyBonusList,
        getCombinedBonuses, getDropChance, handleLoot, slots, filterOptions,
        filteredInventory, getRarityColor, equippedItem: equippedInSlot, equipItem, unequipItem,
        transferItemStat // เพิ่มตรงนี้ครับ
    };
};