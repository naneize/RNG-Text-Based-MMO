// src/store/utils/dropLogic.ts
import type { Boss, DropItem, Item, Stats } from '../types/game';
import { itemLibrary } from '../data/itemLibrary';
import { materialLibrary } from '../data/materialLibrary';
import { generateRandomItemSpecific, generateRandomSkillSpecific } from './itemGenerator';

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

// หมายเหตุ: ฟังก์ชันนี้ยังไม่มีจุดไหนใน calculateBossDrops เรียกใช้
// ถ้ามีไฟล์อื่น (เช่น RewardModal) เรียกอยู่ ให้คงไว้ ถ้าไม่มีที่ไหนใช้เลยพิจารณาลบทิ้งได้
export const spawnItem = (
    itemId: string,
    statRanges: Partial<Record<keyof Stats, { min: number; max: number }>>,
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
): Item | null => {
    const template = itemLibrary.find(i => i.id === itemId);
    if (!template) {
        console.warn(`[spawnItem] ไม่พบ template สำหรับ itemId="${itemId}" ใน itemLibrary`);
        return null;
    }

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
        // แต่ละรายการใน dropTable เช็คโอกาสดรอปแยกกันอิสระ
        // ไม่ใช่ pool แบบสุ่มเลือกได้ทีละ 1 — ผู้เล่นมีสิทธิ์ได้หลายรายการพร้อมกันในการฆ่าครั้งเดียว
        if (Math.random() <= drop.dropChance) {

            if (drop.type === 'material') {
                const materialTemplate = materialLibrary.find(m => m.id === drop.itemId);

                // DEBUG: เช็คว่า itemId จาก bossLibrary (materialTiers) ตรงกับ id ใน materialLibrary จริงไหม
                if (!materialTemplate) {
                    console.warn(
                        `[calculateBossDrops] ไม่พบ material template สำหรับ itemId="${drop.itemId}" ใน materialLibrary — เช็คว่า id ใน bossLibrary.ts (materialTiers) ตรงกับ materialLibrary.ts จริงไหม`
                    );
                }

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
                // ค้นหา template จาก itemId ที่กำหนดใน dropTable (มาจาก elementItems ใน bossLibrary.ts)
                const template = itemLibrary.find(i => i.id === drop.itemId);

                if (template) {
                    const newItem = generateRandomItemSpecific(template, drop.fixedRarity, bossLevel);

                    rewards.push({
                        type: 'item',
                        id: drop.itemId,
                        itemData: newItem,
                        icon: newItem.icon
                    });
                } else {
                    // DEBUG: จุดสำคัญ — bossLibrary.ts (elementItems) ใช้ id แบบ 'mace'/'axe'/'sword' ทั่วไป
                    // แต่ itemLibrary.ts ใช้ id เฉพาะแบบ 'iron_sword'/'steel_dagger'
                    // ถ้า id สองฝั่งไม่ตรงกัน จะเข้ามาที่นี่เสมอและไม่มีการดรอป item ให้เลย
                    console.warn(
                        `[calculateBossDrops] ไม่พบ item template สำหรับ itemId="${drop.itemId}" ใน itemLibrary — ` +
                        `เช็คว่า elementItems ใน bossLibrary.ts ใช้ id ตรงกับ itemLibrary.ts จริงไหม (เช่น 'sword' vs 'iron_sword')`
                    );
                }
            }
            else if (drop.type === 'skill') {
                const newSkill = generateRandomSkillSpecific(drop.itemId, drop.fixedRarity, drop.statRanges);

                if (newSkill) {
                    rewards.push({
                        type: 'item',
                        id: drop.itemId,
                        itemData: newSkill,
                        icon: newSkill.icon
                    });
                } else {
                    // DEBUG: เช่นเดียวกับ item — เช็คว่า elementSkills ใน bossLibrary.ts
                    // ใช้ id ตรงกับที่ generateRandomSkillSpecific คาดหวังไหม
                    console.warn(
                        `[calculateBossDrops] generateRandomSkillSpecific คืนค่า null/undefined สำหรับ itemId="${drop.itemId}"`
                    );
                }
            }
        }
    });

    return rewards;
};