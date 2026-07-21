// src/store/utils/dropLogic.ts
import type { Boss, DropItem, Item, Stats } from '../types/game';
import { itemLibrary } from '../data/itemLibrary';
import { materialLibrary } from '../data/materialLibrary';
import { generateRandomItemSpecific } from './itemGenerator';

// กำหนด Interface สำหรับ Reward เพื่อให้เอาไปใช้ใน RewardModal ได้ง่าย
export interface RewardResult {
    type: 'item' | 'material';
    id: string;
    amount?: number;
    itemData?: Item;
    icon?: string;
}

const getRandomValue = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const spawnItem = (
    itemId: string,
    statRanges: Partial<Record<keyof Stats, { min: number; max: number }>>,
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
): Item | null => {
    const template = itemLibrary.find(i => i.id === itemId);
    if (!template) return null;

    const generatedStats: Partial<Stats> = {};
    for (const [key, range] of Object.entries(statRanges)) {
        generatedStats[key as keyof Stats] = getRandomValue(range.min, range.max);
    }

    return {
        ...template,
        uid: crypto.randomUUID(),
        rarity,
        stats: generatedStats,
        statsLog: Object.entries(generatedStats).map(([key, val]) => ({
            statKey: key as keyof Stats,
            value: val as number
        })),
        type: 'equipment'
    };
};

export const calculateBossDrops = (boss: Boss, bossLevel: number = 1): RewardResult[] => {
    const rewards: RewardResult[] = [];

    boss.dropTable.forEach((drop: DropItem) => {
        if (Math.random() <= drop.dropChance) {

            if (drop.type === 'material') {
                const materialTemplate = materialLibrary.find(m => m.id === drop.itemId);
                const min = drop.amountRange?.min || 1;
                const max = drop.amountRange?.max || 1;

                rewards.push({
                    type: 'material',
                    id: drop.itemId,
                    amount: getRandomValue(min, max),
                    icon: materialTemplate?.icon
                });
            }
            else if (drop.type === 'item') {
                // 1. ค้นหา template จาก itemId ที่เรากำหนดใน dropTable เท่านั้น
                const template = itemLibrary.find(i => i.id === drop.itemId);

                if (template) {
                    // 2. เรียกใช้ฟังก์ชันสุ่ม Stat (แบบเดิมที่มันทำงานถูกต้อง) 
                    // หรือถ้าจะใช้ตัวเลเวลบอสด้วย คุณต้องสร้างฟังก์ชันสุ่ม Stat ที่รับ template เข้าไปด้วย
                    const newItem = generateRandomItemSpecific(template, drop.fixedRarity, bossLevel);

                    rewards.push({
                        type: 'item',
                        id: drop.itemId,
                        itemData: newItem,
                        icon: newItem.icon
                    });
                }
            }
        }
    });

    return rewards;
};