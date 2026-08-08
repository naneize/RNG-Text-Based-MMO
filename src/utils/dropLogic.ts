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

// 🟢 ปรับได้: item level ของไอเทมที่ดรอปจากบอส
// ขั้นต่ำ = level บอสพอดี (ห้ามต่ำกว่า) / สูงสุด = level บอส x 3
const MIN_ITEM_LEVEL_MULT = 1;
const MAX_ITEM_LEVEL_MULT = 5;

const getRandomItemLevel = (bossLevel: number): number => {
    const minLevel = Math.max(1, Math.floor(bossLevel * MIN_ITEM_LEVEL_MULT));
    const maxLevel = Math.floor(bossLevel * MAX_ITEM_LEVEL_MULT);
    return getRandomValue(minLevel, maxLevel);
};


export const calculateBossDrops = (boss: Boss, bossLevel: number = 1): RewardResult[] => {
    const rewards: RewardResult[] = [];

    const pushRewardFromDrop = (drop: DropItem) => {
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
            const template = itemLibrary.find(i => i.id === drop.itemId);

            if (template) {
                // 🟢 สุ่ม item level ในช่วง [bossLevel, bossLevel x MAX_ITEM_LEVEL_MULT]
                // แทนที่จะ fix เป็น bossLevel ตรงๆ — ทำให้ได้ของแรงกว่า level บอสได้ แต่ไม่มีทางอ่อนกว่า
                const rolledItemLevel = getRandomItemLevel(bossLevel);
                const newItem = generateRandomItemSpecific(template, drop.fixedRarity, rolledItemLevel);

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
            // หมายเหตุ: skill ไม่ใช้ itemLevel เลย ใช้ statRanges ที่ fix ไว้ตาม fixedRarity ใน bossLibrary.ts แทน
            const newSkill = generateRandomSkillSpecific(drop.itemId, drop.fixedRarity, drop.statRanges);

            if (newSkill) {
                rewards.push({
                    type: 'item',
                    id: drop.itemId,
                    itemData: newSkill,
                    icon: newSkill.icon
                });
            } else {
                console.warn(
                    `[calculateBossDrops] generateRandomSkillSpecific คืนค่า null/undefined สำหรับ itemId="${drop.itemId}"`
                );
            }
        }
    };

    // material ไม่ต้องจัดกลุ่ม เพราะมีแค่ entry เดียวต่อชนิด ไม่ได้แยก rarity tier
    const materialDrops = boss.dropTable.filter(d => d.type === 'material');

    // item/skill จัดกลุ่มตาม itemId เดียวกัน (เพราะแต่ละ itemId มี 4 entry ซ้อนกันตาม rarity tier)
    const rollableDrops = boss.dropTable.filter(d => d.type !== 'material');
    const groups = new Map<string, DropItem[]>();
    rollableDrops.forEach(drop => {
        const key = `${drop.type}:${drop.itemId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(drop);
    });

    // 🟢 แก้บั๊ก: เดิมแต่ละ rarity tier (Common/Rare/Epic/Legendary) เช็ค Math.random() แยกกันอิสระ
    // ทำให้มีสิทธิ์ได้ item เดียวกันซ้อนกันหลาย rarity ในการฆ่าครั้งเดียว (ไม่ตั้งใจ)
    // ตอนนี้แต่ละกลุ่ม (itemId เดียวกัน) สุ่มแค่ครั้งเดียว แล้วไล่เช็คแบบสะสม (cumulative)
    // ว่า roll ตกอยู่ช่วง tier ไหน — ได้ไม่เกิน 1 tier ต่อ item slot ต่อการฆ่า 1 ครั้งเท่านั้น
    // ถ้า roll เกินผลรวมทั้งหมด แปลว่า "พลาด ไม่ได้อะไรเลย" สำหรับ slot นั้น
    groups.forEach((tiers) => {
        const roll = Math.random();
        let cumulative = 0;
        for (const drop of tiers) {
            cumulative += drop.dropChance;
            if (roll <= cumulative) {
                pushRewardFromDrop(drop);
                break;
            }
        }
    });

    materialDrops.forEach(drop => {
        if (Math.random() <= drop.dropChance) {
            pushRewardFromDrop(drop);
        }
    });

    return rewards;
};