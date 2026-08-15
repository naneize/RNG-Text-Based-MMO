import type { Item, Stats, WeaponType } from '../types/game';
import { itemLibrary } from '../data/itemLibrary';
import { SKILL_POOL } from '../data/skills';
import { rollWithVariation } from './statVariation';
import { getRandomWeaponAbility } from '../data/weaponAbilities';


export const rarityConfig = [
    { name: 'Common', count: [1, 2], mult: 1, weight: 81 },
    { name: 'Rare', count: [2, 3], mult: 2, weight: 15 },
    { name: 'Epic', count: [3, 4], mult: 3, weight: 3 },
    { name: 'Legendary', count: [5, 7], mult: 5, weight: 1 },
];

export const ELEMENT_POOL = ['Fire', 'Water', 'Earth', 'Wind', 'Dark', 'Holy', 'Neutral'];
export const RACE_POOL = ['DemiHuman', 'Plant', 'Brute', 'Undead', 'Demon', 'Angel', 'Dragon'];

const getRandomRarity = (forcedRarity?: string) => {
    if (forcedRarity) {
        return rarityConfig.find(r => r.name.toLowerCase() === forcedRarity.toLowerCase()) || rarityConfig[0];
    }

    const totalWeight = rarityConfig.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    return rarityConfig.find(r => {
        random -= r.weight;
        return random <= 0;
    }) || rarityConfig[0];
};

export const generateRandomSkill = (): Item => {
    const template = SKILL_POOL[Math.floor(Math.random() * SKILL_POOL.length)];
    const config = getRandomRarity(); // ได้สุ่มเรนิตี้ (Common, Rare, Epic, Legendary)

    let skillCondition: any = undefined;

    // 🟢 กฎข้อที่ 1: ถ้าเป็น Common จะไม่มี skillCondition เลย (สะอาดและสมดุล)
    // จะเริ่มสุ่มออฟชันเสริมเฉพาะ Rare ขึ้นไปเท่านั้น
    if (['Rare', 'Epic', 'Legendary'].includes(config.name)) {
        const elementPool = ['Fire', 'Water', 'Earth', 'Wind', 'Dark', 'Holy', 'Neutral'] as const;
        const racePool = ['DemiHuman', 'Plant', 'Brute', 'Undead', 'Demon', 'Angel', 'Dragon'] as const;
        const statPool = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;
        const damageTypes = ['physical', 'magic'] as const;

        const enhancedCondition: any = {};
        enhancedCondition.damageType = damageTypes[Math.floor(Math.random() * damageTypes.length)];

        // กำหนดจำนวนออฟชันเสริมขั้นต่ำตาม Rarity
        let minAffixes = 1;
        if (config.name === 'Rare') minAffixes = 2;
        if (config.name === 'Epic') minAffixes = 3;
        if (config.name === 'Legendary') minAffixes = 4;

        // สร้างลิสต์ออฟชันทั้งหมดที่มีโอกาสสุ่มได้
        // สร้างลิสต์ออฟชันทั้งหมดที่มีโอกาสสุ่มได้ (ปรับให้เรนต์เปอร์เซ็นต์สเกลตาม Rarity)
        const possibleAffixes = [
            // 1. ธาตุ (Element)
            () => {
                enhancedCondition.elementBonusAgainst = elementPool[Math.floor(Math.random() * elementPool.length)];

                // 📌 ปรับเรนต์ตาม Rarity
                if (config.name === 'Legendary') {
                    enhancedCondition.elementBonusPercent = Math.floor(Math.random() * 16) + 15; // 15% - 30%
                } else if (config.name === 'Epic') {
                    enhancedCondition.elementBonusPercent = Math.floor(Math.random() * 11) + 10; // 10% - 20%
                } else {
                    enhancedCondition.elementBonusPercent = Math.floor(Math.random() * 6) + 5;   // 5% - 10% (Rare)
                }
            },
            // 2. เผ่า (Race)
            () => {
                enhancedCondition.raceBonusAgainst = racePool[Math.floor(Math.random() * racePool.length)];

                // 📌 ปรับเรนต์ตาม Rarity
                if (config.name === 'Legendary') {
                    enhancedCondition.raceBonusPercent = Math.floor(Math.random() * 16) + 15; // 15% - 30%
                } else if (config.name === 'Epic') {
                    enhancedCondition.raceBonusPercent = Math.floor(Math.random() * 11) + 10; // 10% - 20%
                } else {
                    enhancedCondition.raceBonusPercent = Math.floor(Math.random() * 6) + 5;   // 5% - 10% (Rare)
                }
            },
            // 3. สเกลสเตตัส (Scaling Stat)
            () => {
                enhancedCondition.scalingStat = statPool[Math.floor(Math.random() * statPool.length)];

                // 📌 ปรับตัวคูณตาม Rarity ด้วยก็ได้เพื่อให้เข้ากัน
                if (config.name === 'Legendary') {
                    enhancedCondition.scalingMultiplier = Number((Math.random() * 0.3 + 0.5).toFixed(2)); // 0.50 - 0.80
                } else if (config.name === 'Epic') {
                    enhancedCondition.scalingMultiplier = Number((Math.random() * 0.2 + 0.3).toFixed(2)); // 0.30 - 0.50
                } else {
                    enhancedCondition.scalingMultiplier = Number((Math.random() * 0.2 + 0.2).toFixed(2)); // 0.20 - 0.40
                }
            },
            // 4. เงื่อนไขเลือดต่ำ (Low HP Bonus)
            () => {
                enhancedCondition.requiresLowHp = true;
                enhancedCondition.hpThreshold = Math.floor(Math.random() * 31) + 20; // 20% - 50% (อันนี้ปล่อยไว้หรือปรับให้เลือดสูงขึ้นเพื่อให้เงื่อนไขง่ายขึ้นก็ได้ครับ)
            }
        ];
        // สุ่มหยิบออฟชันมาใส่ให้ครบตามจำนวนขั้นต่ำ (และมีโอกาสสุ่มเพิ่มได้อีกตามดวง)
        // สลับตำแหน่งอาเรย์เพื่อความสุ่ม
        const shuffled = possibleAffixes.sort(() => 0.5 - Math.random());

        shuffled.forEach((affixFunc, index) => {
            // ถ้ายังไม่ครบจำนวนขั้นต่ำ หรือ ดวงดีสุ่มติดเพิ่ม
            if (index < minAffixes || Math.random() < 0.3) {
                affixFunc();
            }
        });

        skillCondition = enhancedCondition;
    }

    return {
        id: template.id,
        uid: Math.random().toString(36).substr(2, 9),
        name: `${config.name} ${template.name}`,
        slot: 'skill',
        type: 'skill',
        icon: template.icon,
        rarity: config.name as any,
        stats: {},
        statsLog: [],
        // เอฟเฟกต์พาวเวอร์คูณตามเรนิตี้ config.mult ปกติ
        effectPower: template.effectPower ? Math.floor(template.effectPower * config.mult) : undefined,
        effectChance: template.effectChance || 0,
        skillCondition
    };
};


// Generate skill with specific stats (for boss drops)
export const generateRandomSkillSpecific = (
    skillId: string,
    forcedRarity?: string,
    statRanges?: Partial<Record<keyof Stats, { min: number; max: number }>>
): Item | null => {
    const template = SKILL_POOL.find(s => s.id === skillId);
    if (!template) return null;

    const config = getRandomRarity(forcedRarity);

    // Generate stats from ranges if provided
    const stats: Partial<Stats> = {};
    const statsLog: { statKey: keyof Stats; value: number }[] = [];

    if (statRanges) {
        for (const [key, range] of Object.entries(statRanges)) {
            const value = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            stats[key as keyof Stats] = value;
            statsLog.push({ statKey: key as keyof Stats, value });
        }
    }

    // 🟢 ปรับใหม่: ให้สุ่มสร้าง skillCondition ตามเรนิตี้ แทนการก๊อปปี้ตรงๆ จาก Template
    let skillCondition: any = undefined;

    if (['Rare', 'Epic', 'Legendary'].includes(config.name)) {
        const elementPool = ['Fire', 'Water', 'Earth', 'Wind', 'Dark', 'Holy', 'Neutral'] as const;
        const racePool = ['DemiHuman', 'Plant', 'Brute', 'Undead', 'Demon', 'Angel', 'Dragon'] as const;
        const statPool = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;
        const damageTypes = ['physical', 'magic'] as const;

        const enhancedCondition: any = {};
        enhancedCondition.damageType = damageTypes[Math.floor(Math.random() * damageTypes.length)];

        // กำหนดจำนวนออฟชันเสริมขั้นต่ำตาม Rarity
        let minAffixes = 1;
        if (config.name === 'Rare') minAffixes = 2;
        if (config.name === 'Epic') minAffixes = 3;
        if (config.name === 'Legendary') minAffixes = 4;

        // สร้างลิสต์ออฟชันทั้งหมดที่มีโอกาสสุ่มได้ (ปรับให้เรนต์เปอร์เซ็นต์สเกลตาม Rarity)
        const possibleAffixes = [
            // 1. ธาตุ (Element)
            () => {
                enhancedCondition.elementBonusAgainst = elementPool[Math.floor(Math.random() * elementPool.length)];

                // 📌 ปรับเรนต์ตาม Rarity
                if (config.name === 'Legendary') {
                    enhancedCondition.elementBonusPercent = Math.floor(Math.random() * 16) + 15; // 15% - 30%
                } else if (config.name === 'Epic') {
                    enhancedCondition.elementBonusPercent = Math.floor(Math.random() * 11) + 10; // 10% - 20%
                } else {
                    enhancedCondition.elementBonusPercent = Math.floor(Math.random() * 6) + 5;   // 5% - 10% (Rare)
                }
            },
            // 2. เผ่า (Race)
            () => {
                enhancedCondition.raceBonusAgainst = racePool[Math.floor(Math.random() * racePool.length)];

                // 📌 ปรับเรนต์ตาม Rarity
                if (config.name === 'Legendary') {
                    enhancedCondition.raceBonusPercent = Math.floor(Math.random() * 16) + 15; // 15% - 30%
                } else if (config.name === 'Epic') {
                    enhancedCondition.raceBonusPercent = Math.floor(Math.random() * 11) + 10; // 10% - 20%
                } else {
                    enhancedCondition.raceBonusPercent = Math.floor(Math.random() * 6) + 5;   // 5% - 10% (Rare)
                }
            },
            // 3. สเกลสเตตัส (Scaling Stat)
            () => {
                enhancedCondition.scalingStat = statPool[Math.floor(Math.random() * statPool.length)];

                // 📌 ปรับตัวคูณตาม Rarity ด้วยก็ได้เพื่อให้เข้ากัน
                if (config.name === 'Legendary') {
                    enhancedCondition.scalingMultiplier = Number((Math.random() * 0.3 + 0.5).toFixed(2)); // 0.50 - 0.80
                } else if (config.name === 'Epic') {
                    enhancedCondition.scalingMultiplier = Number((Math.random() * 0.2 + 0.3).toFixed(2)); // 0.30 - 0.50
                } else {
                    enhancedCondition.scalingMultiplier = Number((Math.random() * 0.2 + 0.2).toFixed(2)); // 0.20 - 0.40
                }
            },
            // 4. เงื่อนไขเลือดต่ำ (Low HP Bonus)
            () => {
                enhancedCondition.requiresLowHp = true;
                enhancedCondition.hpThreshold = Math.floor(Math.random() * 31) + 20; // 20% - 50% (อันนี้ปล่อยไว้หรือปรับให้เลือดสูงขึ้นเพื่อให้เงื่อนไขง่ายขึ้นก็ได้ครับ)
            }
        ];

        // สุ่มหยิบออฟชันมาใส่ให้ครบตามจำนวนขั้นต่ำ (และมีโอกาสสุ่มเพิ่มได้อีกตามดวง)
        // สลับตำแหน่งอาเรย์เพื่อความสุ่ม
        const shuffled = possibleAffixes.sort(() => 0.5 - Math.random());

        shuffled.forEach((affixFunc, index) => {
            // ถ้ายังไม่ครบจำนวนขั้นต่ำ หรือ ดวงดีสุ่มติดเพิ่ม
            if (index < minAffixes || Math.random() < 0.3) {
                affixFunc();
            }
        });

        skillCondition = enhancedCondition;
    }

    return {
        id: template.id,
        uid: Math.random().toString(36).substr(2, 9),
        name: `${config.name} ${template.name}`,
        slot: 'skill',
        type: 'skill',
        icon: template.icon,
        rarity: config.name as any,
        stats,
        statsLog,
        effectPower: template.effectPower ? Math.floor(template.effectPower * config.mult) : undefined,
        effectChance: template.effectChance || 0,
        skillCondition
    };
};


export const generateRandomItem = (forcedRarity?: string, itemLevel: number = 1): Item => {
    const roll = Math.random();

    if (roll < 0.1) return generateRandomSkill();

    if (roll < 0.15) {
        const materials = itemLibrary.filter(i => i.type === 'material');
        const template = materials[Math.floor(Math.random() * materials.length)];

        const materialItem: Item = {
            ...template,
            uid: Math.random().toString(36).substr(2, 9),
            rarity: 'Common',
            stats: {} as any, // กำหนด stats ว่างเปล่า
            type: 'material',
            slot: 'material'
        } as Item;

        return materialItem;
    }

    const equipments = itemLibrary.filter(i => i.type === 'equipment');
    const template = equipments[Math.floor(Math.random() * equipments.length)];
    const config = getRandomRarity(forcedRarity);
    const baseMult = config.mult;


    const stats: Stats = {
        str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0,
        critRate: 0, critDmg: 0, atk: 0, def: 0, maxHp: 0, hit: 0, flee: 0, res: 0, mRes: 0
    };

    const statsLog: { statKey: keyof Stats, value: number }[] = [];

    // ===== FIX #1: เก็บว่า stat ตัวไหนถูกตั้งค่าเบสไปแล้วบ้าง =====
    // ตัวนี้คือหัวใจของการแก้บั๊ก: ทุกครั้งที่มีการ set ค่าเบสให้ stats.xxx
    // จะต้อง .add('xxx') เข้ามาที่นี่ด้วย เพื่อกันไม่ให้ loop bonus ข้างล่าง
    // สุ่มโดน stat ตัวเดิมซ้ำแล้วบวกทับ (double-dip)
    const baseStatsSet = new Set<keyof Stats>();

    // ฟังก์ชันคำนวณมาตรฐาน (ใช้ตัวนี้ตัวเดียวจบ)
    const getStat = (base: number, rarityMult: number, level: number, levelScale: number) => {
        return Math.floor((base + (level * levelScale)) * rarityMult);
    };

    const getStatWithVariation = (base: number, rarityMult: number, level: number, levelScale: number) => {
        return rollWithVariation(getStat(base, rarityMult, level, levelScale));
    };

    const twoHandedTypes: WeaponType[] = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
    const rangedTypes: WeaponType[] = ['bow', 'crossbow', 'sling', 'throwing'];

    // นำมาปรับใช้กับทุก Slot
    let weaponAbilityId: string | undefined;

    if (template.slot === 'weapon') {
        const isTwoHanded = template.weaponType ? twoHandedTypes.includes(template.weaponType) : false;
        const isRanged = template.weaponType ? rangedTypes.includes(template.weaponType) : false;
        const isHeavyOrRanged = isTwoHanded || isRanged;

        stats.atk = getStatWithVariation(isHeavyOrRanged ? 25 : 18, baseMult, itemLevel, 2);
        baseStatsSet.add('atk');

        stats.hit = getStatWithVariation(isHeavyOrRanged ? 10 : 20, baseMult, itemLevel, 0.5);
        baseStatsSet.add('hit');

        if (isTwoHanded || isRanged) {
            stats.str = getStatWithVariation(3, baseMult, itemLevel, 1);
            baseStatsSet.add('str');
        }

        // 🟢 เปลี่ยนจาก Record<Item['rarity'], number> เป็น Record<string, number>
        const ABILITY_CHANCE_BY_RARITY: Record<string, number> = {
            Common: 0.15,
            Rare: 0.40,
            Epic: 0.65,
            Legendary: 1.0,
        };

        // ตอนนี้ใช้ config.name ได้โดยไม่ต้อง Cast Type แล้ว
        const traitChance = ABILITY_CHANCE_BY_RARITY[config.name] ?? 0.25;

        if (Math.random() < traitChance) {
            const ability = getRandomWeaponAbility(config.name);
            weaponAbilityId = ability?.id;
        }

    } else if (['necklace', 'ring'].includes(template.slot)) {
        stats.atk = getStatWithVariation(8, baseMult, itemLevel, 1);
        stats.hit = getStatWithVariation(5, baseMult, itemLevel, 0.5); // level ไม่ scale hit ของ necklace/ring เดิม แต่ยังสุ่มดวงได้
        baseStatsSet.add('atk');
        baseStatsSet.add('hit');
    }
    else if (template.slot === 'helm') {
        stats.def = getStatWithVariation(10, baseMult, itemLevel, 1.5);
        stats.maxHp = getStatWithVariation(80, baseMult, itemLevel, 3);
        stats.hit = getStatWithVariation(7, baseMult, itemLevel, 0.5);
        baseStatsSet.add('def');
        baseStatsSet.add('maxHp');
        baseStatsSet.add('hit');
    }
    else if (['armor', 'shield'].includes(template.slot)) {
        stats.def = getStatWithVariation(15, baseMult, itemLevel, 1.5);
        stats.maxHp = getStatWithVariation(100, baseMult, itemLevel, 2);
        baseStatsSet.add('def');
        baseStatsSet.add('maxHp');
    }
    else if (template.slot === 'boots') {
        stats.def = getStatWithVariation(6, baseMult, itemLevel, 0.5);
        stats.flee = getStatWithVariation(6, baseMult, itemLevel, 0.2);
        baseStatsSet.add('def');
        baseStatsSet.add('flee');
    }
    else if (template.slot === 'cloak') {
        stats.int = getStatWithVariation(8, baseMult, itemLevel, 1);
        stats.def = getStatWithVariation(5, baseMult, itemLevel, 0.5);
        baseStatsSet.add('int');
        baseStatsSet.add('def');
    }

    // DEBUG: ดูว่า stat ไหนถูก lock เป็นค่าเบสไปแล้วบ้างสำหรับไอเทมชิ้นนี้
    const baseStatsValues = Array.from(baseStatsSet).reduce((acc, statKey) => {
        acc[statKey] = stats[statKey]!;
        return acc;
    }, {} as Record<string, number>);

    console.log(`[generateRandomItem] slot=${template.slot} rarity=${config.name} itemLevel=${itemLevel} baseStatsValues=`, baseStatsValues);


    const ALL_STATS: (keyof Stats)[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk', 'maxHp',
        'hit', 'flee', 'critRate', 'critDmg', 'res', 'mRes', 'def', 'atk'];


    const isWeapon = template.slot === 'weapon';





    // ===== FIX #2: เพิ่มเงื่อนไข !baseStatsSet.has(s) =====
    // เดิมกรองแค่ critRate/critDmg และ def/res/mRes (เฉพาะอาวุธ)
    // แต่ไม่เคยกัน atk/hit/str (อาวุธ) หรือ def/maxHp/hit/flee/int (armor-type slot อื่นๆ)
    // ที่ถูกตั้งค่าเบสไปแล้ว ทำให้โดนสุ่มซ้ำและบวกทับ (สาเหตุของ atk 407 ที่สูงผิดปกติ)
    const COMMON_POOL = ALL_STATS.filter(s => {
        if (s === 'critRate' || s === 'critDmg') return false; // อยู่ RARE_POOL แยกต่างหาก
        if (isWeapon && ['def', 'res', 'mRes'].includes(s)) return false; // อาวุธไม่ควรมี def-side stats
        if (baseStatsSet.has(s)) return false; // FIX หลัก: กัน stat ที่ตั้งเบสไปแล้วไม่ให้สุ่มซ้ำ
        return true;
    });

    const RARE_POOL: (keyof Stats)[] = ['critRate', 'critDmg'];

    const rolledStats = new Set<keyof Stats>();
    const [minBonus, maxBonus] = config.count;
    const numBonus = Math.floor(Math.random() * (maxBonus - minBonus + 1)) + minBonus;


    // สุ่ม Bonus แบบถ่วงน้ำหนัก
    // ลูปสุ่ม Bonus ที่ปลอดภัยและกระจายตัวดี
    for (let i = 0; i < numBonus; i++) {
        // 1. กรอง Stat ที่ยังไม่ได้สุ่มออกจาก Pool
        const availableCommon = COMMON_POOL.filter(s => !rolledStats.has(s));
        const availableRare = RARE_POOL.filter(s => !rolledStats.has(s));

        // ถ้าไม่มี Stat เหลือให้สุ่มแล้ว ให้หยุดทำงาน
        if (availableCommon.length === 0 && availableRare.length === 0) {
            console.log(`[generateRandomItem] pool หมดที่ bonus index ${i}/${numBonus} หยุดสุ่ม`);
            break;
        }

        // 2. เลือก Pool ที่จะสุ่ม
        let isRareRoll = Math.random() < 0.01;

        // ถ้าสุ่มได้ Rare แต่ไม่มี Stat เหลือใน Rare Pool แล้ว ให้ไปสุ่ม Common แทน
        if (isRareRoll && availableRare.length === 0) isRareRoll = false;
        // ถ้าสุ่มได้ Common แต่ไม่มี Stat เหลือใน Common Pool แล้ว ให้ไปสุ่ม Rare แทน
        if (!isRareRoll && availableCommon.length === 0) isRareRoll = true;

        const targetPool = isRareRoll ? availableRare : availableCommon;
        const stat = targetPool[Math.floor(Math.random() * targetPool.length)];

        // 3. เพิ่มเข้า rolledStats เพื่อไม่ให้ซ้ำในรอบถัดไป
        rolledStats.add(stat);

        const isCrit = stat === 'critRate' || stat === 'critDmg';

        let val: number;
        if (isCrit) {
            if (stat === 'critRate') {
                // Crit Rate: สุ่มชิ้นละ 8% ถึง 15% (รวม 8 ชิ้น มีโอกาสไต่ไปถึง ~95% พอดีกับ Cap)
                val = Math.floor(Math.random() * 8) + 8;
            } else {
                // ฐานกลางอยู่ที่ 30, ผันผวน ±15 (จะได้เรนจ์ประมาณ 15 - 45 ต่อชิ้น)
                const baseCritDmg = Math.floor(itemLevel * 0.05) + 30;
                const variation = Math.floor(Math.random() * 31) - 15; // ผันผวน ±15
                val = Math.max(10, baseCritDmg + variation);
            }
        } else {
            // สเตตัสปกติ: ใช้สูตรฐานเดียวกัน แต่ขยายช่วงความผันผวน (Spread) ให้กว้างขึ้นตามเลเวล
            const baseBonusVal = Math.floor((8 + itemLevel * 0.15) * config.mult);

            // 🟢 เปลี่ยนจาก 0.20 (20%) เป็น 0.35 หรือ 0.40 (35-40%) เพื่อให้เรนจ์กว้างและลุ้นสนุกขึ้น
            const spread = Math.floor(baseBonusVal * 0.35);
            const variation = Math.floor(Math.random() * (spread * 2 + 1)) - spread;

            val = Math.max(1, baseBonusVal + variation);
        }

        stats[stat] = (stats[stat] || 0) + val;
        statsLog.push({ statKey: stat, value: val });

        console.log(
            `[generateRandomItemSpecific] bonus #${i}: stat=${stat} val=${val}`,
            baseStatsSet.has(stat) ? '⚠️ ชนกับ base stat!' : '(ok)'
        );
    }


    // DEBUG: สรุปผลลัพธ์สุดท้ายของไอเทมชิ้นนี้
    console.log(`[generateRandomItem] ผลลัพธ์สุดท้าย:`, {
        name: `${config.name} ${template.name}`,
        slot: template.slot,
        itemLevel,
        stats,
        statsLog
    });

    // ... ส่วนที่เหลือ (elementBonus/raceBonus + return) เหมือนเดิมทุกประการ ไม่ต้องแก้อะไรเพิ่ม

    const getMinMaxByTier = (tier: string) => {
        switch (tier) {
            case 'Legendary': return { min: 20, max: 35 };
            case 'Epic': return { min: 12, max: 22 };
            case 'Rare': return { min: 6, max: 12 };
            default: return { min: 3, max: 8 };
        }
    };


    // 6. สุ่ม Bonus พิเศษ (Element/Race)
    let elementBonus, raceBonus;
    if (['Rare', 'Epic', 'Legendary'].includes(config.name)) {
        const isWeapon = template.slot === 'weapon';
        const isArmor = ['helm', 'armor', 'shield', 'boots', 'cloak'].includes(template.slot);

        const elementChance = isWeapon ? 0.4 : 0.2;
        const raceChance = isArmor ? 0.4 : 0.2;

        // เรียกใช้งานตรงนี้ได้เลยครับ
        const tierRange = getMinMaxByTier(config.name);
        const generateVal = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

        if (Math.random() < elementChance) {
            elementBonus = {
                type: ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)],
                value: generateVal(tierRange.min, tierRange.max)
            };
        }

        if (Math.random() < raceChance) {
            raceBonus = {
                type: RACE_POOL[Math.floor(Math.random() * RACE_POOL.length)],
                value: generateVal(tierRange.min, tierRange.max)
            };
        }
    }


    return {
        ...template,
        uid: Math.random().toString(36).substr(2, 9),
        name: `${config.name} ${template.name}`,
        rarity: config.name as any,
        stats,
        statsLog,
        itemLevel,
        elementBonus: elementBonus as { type: "Fire" | "Water" | "Earth" | "Wind" | "Dark" | "Holy" | "Neutral"; value: number; } | undefined,
        raceBonus: raceBonus as { type: "DemiHuman" | "Plant" | "Brute" | "Undead" | "Demon" | "Angel" | "Dragon"; value: number; } | undefined,
        weaponAbilityId,
        type: 'equipment'
    };
}; // generateRandomItemSpecific

export const generateRandomItemSpecific = (template: any, forcedRarity?: string, itemLevel: number = 1): Item => {
    const config = getRandomRarity(forcedRarity);
    const baseMult = config.mult;

    const stats: Stats = {
        str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0,
        critRate: 0, critDmg: 0, atk: 0, def: 0, maxHp: 0, hit: 0, flee: 0, res: 0, mRes: 0
    };

    const statsLog: { statKey: keyof Stats, value: number }[] = [];

    // ===== FIX #1: เก็บว่า stat ตัวไหนถูกตั้งค่าเบสไปแล้วบ้าง =====
    const baseStatsSet = new Set<keyof Stats>();

    const getStat = (base: number, rarityMult: number, level: number, levelScale: number) => {
        return Math.floor((base + (level * levelScale)) * rarityMult);
    };

    const getStatWithVariation = (base: number, rarityMult: number, level: number, levelScale: number) => {
        return rollWithVariation(getStat(base, rarityMult, level, levelScale));
    };

    const twoHandedTypes: WeaponType[] = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
    const rangedTypes: WeaponType[] = ['bow', 'crossbow', 'sling', 'throwing'];

    let weaponAbilityId: string | undefined;

    if (template.slot === 'weapon') {
        const isTwoHanded = template.weaponType ? twoHandedTypes.includes(template.weaponType) : false;
        const isRanged = template.weaponType ? rangedTypes.includes(template.weaponType) : false;
        const isHeavyOrRanged = isTwoHanded || isRanged;

        stats.atk = getStatWithVariation(isHeavyOrRanged ? 25 : 18, baseMult, itemLevel, 2);
        baseStatsSet.add('atk');

        stats.hit = getStatWithVariation(isHeavyOrRanged ? 10 : 20, baseMult, itemLevel, 0.5);
        baseStatsSet.add('hit');

        if (isTwoHanded || isRanged) {
            stats.str = getStatWithVariation(3, baseMult, itemLevel, 1);
            baseStatsSet.add('str');
        }

        // 🟢 เปลี่ยนจาก Record<Item['rarity'], number> เป็น Record<string, number>
        const ABILITY_CHANCE_BY_RARITY: Record<string, number> = {
            Common: 0.15,
            Rare: 0.40,
            Epic: 0.65,
            Legendary: 1.0,
        };

        // ตอนนี้ใช้ config.name ได้โดยไม่ต้อง Cast Type แล้ว
        const traitChance = ABILITY_CHANCE_BY_RARITY[config.name] ?? 0.25;

        if (Math.random() < traitChance) {
            const ability = getRandomWeaponAbility(config.name);
            weaponAbilityId = ability?.id;
        }

    } else if (['necklace', 'ring'].includes(template.slot)) {
        stats.atk = getStatWithVariation(8, baseMult, itemLevel, 1);
        stats.hit = getStatWithVariation(5, baseMult, itemLevel, 0.5); // level ไม่ scale hit ของ necklace/ring เดิม แต่ยังสุ่มดวงได้
        baseStatsSet.add('atk');
        baseStatsSet.add('hit');
    }
    else if (template.slot === 'helm') {
        stats.def = getStatWithVariation(10, baseMult, itemLevel, 1.5);
        stats.maxHp = getStatWithVariation(80, baseMult, itemLevel, 3);
        stats.hit = getStatWithVariation(7, baseMult, itemLevel, 0.5);
        baseStatsSet.add('def');
        baseStatsSet.add('maxHp');
        baseStatsSet.add('hit');
    }
    else if (['armor', 'shield'].includes(template.slot)) {
        stats.def = getStatWithVariation(15, baseMult, itemLevel, 1.5);
        stats.maxHp = getStatWithVariation(100, baseMult, itemLevel, 2);
        baseStatsSet.add('def');
        baseStatsSet.add('maxHp');
    }
    else if (template.slot === 'boots') {
        stats.def = getStatWithVariation(6, baseMult, itemLevel, 0.5);
        stats.flee = getStatWithVariation(6, baseMult, itemLevel, 0.2);
        baseStatsSet.add('def');
        baseStatsSet.add('flee');
    }
    else if (template.slot === 'cloak') {
        stats.int = getStatWithVariation(8, baseMult, itemLevel, 1);
        stats.def = getStatWithVariation(5, baseMult, itemLevel, 0.5);
        baseStatsSet.add('int');
        baseStatsSet.add('def');
    }

    console.log(`[generateRandomItemSpecific] slot=${template.slot} rarity=${config.name} itemLevel=${itemLevel} baseStatsSet=`, [...baseStatsSet]);

    const ALL_STATS: (keyof Stats)[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk', 'maxHp',
        'hit', 'flee', 'critRate', 'critDmg', 'res', 'mRes', 'def', 'atk'];

    const isWeapon = template.slot === 'weapon';



    // ===== FIX #2: เพิ่มเงื่อนไข !baseStatsSet.has(s) =====
    const COMMON_POOL = ALL_STATS.filter(s => {
        if (s === 'critRate' || s === 'critDmg') return false;
        if (isWeapon && ['def', 'res', 'mRes'].includes(s)) return false;
        if (baseStatsSet.has(s)) return false; // FIX หลัก
        return true;
    });

    const RARE_POOL: (keyof Stats)[] = ['critRate', 'critDmg'];

    const rolledStats = new Set<keyof Stats>();
    const [minBonus, maxBonus] = config.count;
    const numBonus = Math.floor(Math.random() * (maxBonus - minBonus + 1)) + minBonus;


    for (let i = 0; i < numBonus; i++) {
        const availableCommon = COMMON_POOL.filter(s => !rolledStats.has(s));
        const availableRare = RARE_POOL.filter(s => !rolledStats.has(s));

        if (availableCommon.length === 0 && availableRare.length === 0) {
            console.log(`[generateRandomItemSpecific] pool หมดที่ bonus index ${i}/${numBonus} หยุดสุ่ม`);
            break;
        }

        let isRareRoll = Math.random() < 0.01;
        if (isRareRoll && availableRare.length === 0) isRareRoll = false;
        if (!isRareRoll && availableCommon.length === 0) isRareRoll = true;

        const targetPool = isRareRoll ? availableRare : availableCommon;
        const stat = targetPool[Math.floor(Math.random() * targetPool.length)];

        rolledStats.add(stat);

        const isCrit = stat === 'critRate' || stat === 'critDmg';

        let val: number;
        if (isCrit) {
            if (stat === 'critRate') {
                // Crit Rate: สุ่มชิ้นละ 8% ถึง 15% (รวม 8 ชิ้น มีโอกาสไต่ไปถึง ~95% พอดีกับ Cap)
                val = Math.floor(Math.random() * 8) + 8;
            } else {
                // ฐานกลางอยู่ที่ 30, ผันผวน ±15 (จะได้เรนจ์ประมาณ 15 - 45 ต่อชิ้น)
                const baseCritDmg = Math.floor(itemLevel * 0.05) + 30;
                const variation = Math.floor(Math.random() * 31) - 15; // ผันผวน ±15
                val = Math.max(10, baseCritDmg + variation);
            }
        } else {
            // สเตตัสปกติ: ใช้สูตรฐานเดียวกัน แต่ขยายช่วงความผันผวน (Spread) ให้กว้างขึ้นตามเลเวล
            const baseBonusVal = Math.floor((8 + itemLevel * 0.15) * config.mult);

            // 🟢 เปลี่ยนจาก 0.20 (20%) เป็น 0.35 หรือ 0.40 (35-40%) เพื่อให้เรนจ์กว้างและลุ้นสนุกขึ้น
            const spread = Math.floor(baseBonusVal * 0.35);
            const variation = Math.floor(Math.random() * (spread * 2 + 1)) - spread;

            val = Math.max(1, baseBonusVal + variation);
        }

        stats[stat] = (stats[stat] || 0) + val;
        statsLog.push({ statKey: stat, value: val });

        console.log(
            `[generateRandomItemSpecific] bonus #${i}: stat=${stat} val=${val}`,
            baseStatsSet.has(stat) ? '⚠️ ชนกับ base stat!' : '(ok)'
        );
    }


    console.log(`[generateRandomItemSpecific] ผลลัพธ์สุดท้าย:`, {
        name: `${config.name} ${template.name}`,
        slot: template.slot,
        itemLevel,        // ✅ เพิ่มบรรทัดนี้
        stats,
        statsLog
    });

    const getMinMaxByTier = (tier: string) => {
        switch (tier) {
            case 'Legendary': return { min: 20, max: 35 };
            case 'Epic': return { min: 12, max: 22 };
            case 'Rare': return { min: 6, max: 12 };
            default: return { min: 3, max: 8 };
        }
    };


    // 6. สุ่ม Bonus พิเศษ (Element/Race)
    let elementBonus, raceBonus;
    if (['Rare', 'Epic', 'Legendary'].includes(config.name)) {
        const isWeapon = template.slot === 'weapon';
        const isArmor = ['helm', 'armor', 'shield', 'boots', 'cloak'].includes(template.slot);

        const elementChance = isWeapon ? 0.4 : 0.2;
        const raceChance = isArmor ? 0.4 : 0.2;

        // เรียกใช้งานตรงนี้ได้เลยครับ
        const tierRange = getMinMaxByTier(config.name);
        const generateVal = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

        if (Math.random() < elementChance) {
            elementBonus = {
                type: ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)],
                value: generateVal(tierRange.min, tierRange.max)
            };
        }

        if (Math.random() < raceChance) {
            raceBonus = {
                type: RACE_POOL[Math.floor(Math.random() * RACE_POOL.length)],
                value: generateVal(tierRange.min, tierRange.max)
            };
        }
    }

    return {
        ...template,
        uid: Math.random().toString(36).substr(2, 9),
        name: `${config.name} ${template.name}`,
        rarity: config.name as any,
        stats,
        statsLog,
        itemLevel,
        elementBonus: elementBonus as { type: "Fire" | "Water" | "Earth" | "Wind" | "Dark" | "Holy" | "Neutral"; value: number; } | undefined,
        raceBonus: raceBonus as { type: "DemiHuman" | "Plant" | "Brute" | "Undead" | "Demon" | "Angel" | "Dragon"; value: number; } | undefined,
        weaponAbilityId,
        type: 'equipment'
    };
};