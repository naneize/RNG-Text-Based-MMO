import type { Item, Stats, WeaponType } from '../types/game';
import { itemLibrary } from '../data/itemLibrary';
import { SKILL_POOL } from '../data/skills';

export const rarityConfig = [
    { name: 'Common', count: [1, 2], mult: 1, weight: 83 }, // 75
    { name: 'Rare', count: [2, 3], mult: 2, weight: 15 }, // 15
    { name: 'Epic', count: [3, 4], mult: 3, weight: 1.9 }, // 1.9
    { name: 'Legendary', count: [5, 7], mult: 5, weight: 0.1 }, // 0.1
];

const ELEMENT_POOL = ['Fire', 'Water', 'Earth', 'Wind', 'Dark', 'Holy', 'Neutral'];
const RACE_POOL = ['DemiHuman', 'Plant', 'Brute', 'Undead', 'Demon', 'Angel'];

const getRandomRarity = (forcedRarity?: string) => {
    if (forcedRarity) return rarityConfig.find(r => r.name === forcedRarity) || rarityConfig[0];

    const totalWeight = rarityConfig.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    return rarityConfig.find(r => {
        random -= r.weight;
        return random <= 0;
    }) || rarityConfig[0];
};

export const generateRandomSkill = (): Item => {
    const template = SKILL_POOL[Math.floor(Math.random() * SKILL_POOL.length)];
    const config = getRandomRarity();

    return {
        id: (template as any).id,
        uid: Math.random().toString(36).substr(2, 9),
        name: `${config.name} ${template.name}`,
        slot: 'skill',
        type: 'skill',
        icon: template.icon,
        rarity: config.name as any,
        stats: {},
        statsLog: [],
        effectPower: template.effectPower ? Math.floor(template.effectPower * config.mult) : undefined,
        effectChance: template.effectChance || 0
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

    const twoHandedTypes: WeaponType[] = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
    const rangedTypes: WeaponType[] = ['bow', 'crossbow', 'sling', 'throwing'];

    // นำมาปรับใช้กับทุก Slot
    if (template.slot === 'weapon') {
        // เช็คว่าใช่อาวุธสองมือ หรือ ระยะไกลไหม
        const isTwoHanded = template.weaponType ? twoHandedTypes.includes(template.weaponType) : false;
        const isRanged = template.weaponType ? rangedTypes.includes(template.weaponType) : false;
        const isHeavyOrRanged = isTwoHanded || isRanged;

        // คำนวณ Stat พื้นฐาน (ได้ค่ากลางออกมา)
        const baseAtk = getStat(isHeavyOrRanged ? 38 : 25, baseMult, itemLevel, 5);
        const randomVariation = Math.floor(Math.random() * 11) - 5; // จะได้ค่า -5 ถึง +5
        stats.atk = Math.max(1, baseAtk + randomVariation);
        baseStatsSet.add('atk'); // FIX: lock atk ไว้ ไม่ให้โดนสุ่มซ้ำ

        const baseHit = getStat(isHeavyOrRanged ? 15 : 25, baseMult, itemLevel, 1); // สมมติให้ scale เลเวลเพิ่มขึ้นทีละ 1 ต่อเลเวล
        const hitVariation = Math.floor(Math.random() * 11) - 5; // จะได้ค่า -5 ถึง +5
        stats.hit = Math.max(1, baseHit + hitVariation);
        baseStatsSet.add('hit'); // FIX: lock hit ไว้ ไม่ให้โดนสุ่มซ้ำ

        // ให้โบนัสสเตตตามประเภท
        if (isTwoHanded || isRanged) {
            const baseStr = getStat(7, baseMult, itemLevel, 3); // ใช้ base เป็น 5, scale เป็น 3 (หรือปรับตามต้องการ)
            const strVariation = Math.floor(Math.random() * 11) - 5; // สุ่มแกว่ง -5 ถึง +5
            stats.str = Math.max(1, baseStr + strVariation);
            baseStatsSet.add('str'); // FIX: lock str ไว้ เฉพาะกรณีอาวุธหนัก/ระยะไกล
        }

    } else if (['necklace', 'ring'].includes(template.slot)) {
        stats.atk = getStat(12, baseMult, itemLevel, 1);
        stats.hit = Math.floor(7 * baseMult);
        baseStatsSet.add('atk'); // FIX
        baseStatsSet.add('hit'); // FIX
    }
    else if (template.slot === 'helm') {
        stats.def = getStat(15, baseMult, itemLevel, 2);
        stats.maxHp = getStat(100, baseMult, itemLevel, 10);
        stats.hit = Math.floor(7 * baseMult);
        baseStatsSet.add('def');   // FIX
        baseStatsSet.add('maxHp'); // FIX
        baseStatsSet.add('hit');   // FIX
    }
    else if (['armor', 'shield'].includes(template.slot)) {
        stats.def = getStat(15, baseMult, itemLevel, 2);
        stats.maxHp = getStat(100, baseMult, itemLevel, 3);
        baseStatsSet.add('def');   // FIX
        baseStatsSet.add('maxHp'); // FIX
    }
    else if (template.slot === 'boots') {
        stats.def = getStat(10, baseMult, itemLevel, 1);
        stats.flee = getStat(10, baseMult, itemLevel, 1);
        baseStatsSet.add('def');  // FIX
        baseStatsSet.add('flee'); // FIX
    }
    else if (template.slot === 'cloak') {
        stats.int = getStat(12, baseMult, itemLevel, 1);
        stats.def = getStat(10, baseMult, itemLevel, 1);
        baseStatsSet.add('int'); // FIX
        baseStatsSet.add('def'); // FIX
    }

    // DEBUG: ดูว่า stat ไหนถูก lock เป็นค่าเบสไปแล้วบ้างสำหรับไอเทมชิ้นนี้
    console.log(`[generateRandomItem] slot=${template.slot} rarity=${config.name} baseStatsSet=`, [...baseStatsSet]);

    const ALL_STATS: (keyof Stats)[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk', 'maxHp',
        'hit', 'flee', 'critRate', 'critDmg', 'res', 'mRes', 'def', 'atk'];


    const isWeapon = template.slot === 'weapon';

    const STAT_CAPS: Record<string, number> = {
        critRate: 10,  // จำกัดไว้ไม่เกิน 50%
        critDmg: 80,  // จำกัดไว้ไม่เกิน 200%
        hit: 80,
        flee: 80
    };
    const PERCENT_STATS = new Set(['critRate', 'critDmg', 'hit', 'flee']);

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

    const bonusMult = Math.sqrt(config.mult) * (1 + Math.log10(itemLevel + 1));

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
        let isRareRoll = Math.random() < 0.04;

        // ถ้าสุ่มได้ Rare แต่ไม่มี Stat เหลือใน Rare Pool แล้ว ให้ไปสุ่ม Common แทน
        if (isRareRoll && availableRare.length === 0) isRareRoll = false;
        // ถ้าสุ่มได้ Common แต่ไม่มี Stat เหลือใน Common Pool แล้ว ให้ไปสุ่ม Rare แทน
        if (!isRareRoll && availableCommon.length === 0) isRareRoll = true;

        const targetPool = isRareRoll ? availableRare : availableCommon;
        const stat = targetPool[Math.floor(Math.random() * targetPool.length)];

        // 3. เพิ่มเข้า rolledStats เพื่อไม่ให้ซ้ำในรอบถัดไป
        rolledStats.add(stat);

        // 4. คำนวณค่า
        const isCrit = stat === 'critRate' || stat === 'critDmg';
        const isHp = stat === 'maxHp';

        const minVal = isCrit ? 2 : (isHp ? 100 : 10);
        const rangeVal = isCrit ? 4 : (isHp ? 150 : 30);

        const val = Math.round((Math.random() * rangeVal + minVal) * bonusMult);

        // 5. อัปเดต Stats
        stats[stat] = (stats[stat] || 0) + val;
        statsLog.push({ statKey: stat, value: val });

        // DEBUG: log ทุก bonus stat ที่สุ่มได้ พร้อมเช็คว่าไปชนกับ baseStatsSet ไหม (ไม่ควรชนอีกต่อไปหลังแก้)
        console.log(
            `[generateRandomItem] bonus #${i}: stat=${stat} val=${val}`,
            baseStatsSet.has(stat) ? '⚠️ ชนกับ base stat! (ไม่ควรเกิดขึ้นแล้วหลัง fix)' : '(ok, แยกจาก base)'
        );
    }

    // Clamp รอบสุดท้าย — ครอบคลุมทั้ง base stat (ที่ตั้งก่อน loop เช่น stats.hit ของ weapon)
    // และ stat ที่ได้จาก bonus loop ด้านบน ป้องกันไม่ให้ค่าไหนหลุด cap ไปได้เลย
    for (const stat of PERCENT_STATS) {
        if (stats[stat] !== undefined) {
            const cap = STAT_CAPS[stat] ?? 100;
            stats[stat] = Math.min(stats[stat], cap);
        }
    }

    // DEBUG: สรุปผลลัพธ์สุดท้ายของไอเทมชิ้นนี้
    console.log(`[generateRandomItem] ผลลัพธ์สุดท้าย:`, {
        name: `${config.name} ${template.name}`,
        slot: template.slot,
        stats,
        statsLog
    });

    // ... ส่วนที่เหลือ (elementBonus/raceBonus + return) เหมือนเดิมทุกประการ ไม่ต้องแก้อะไรเพิ่ม


    // 6. สุ่ม Bonus พิเศษ (Element/Race)
    let elementBonus, raceBonus;
    if (['Rare', 'Epic', 'Legendary'].includes(config.name)) {
        const isWeapon = template.slot === 'weapon';
        const isArmor = ['helm', 'armor', 'shield', 'boots', 'cloak'].includes(template.slot);

        // โอกาสติดในแต่ละช่อง
        const elementChance = isWeapon ? 0.4 : 0.2;
        const raceChance = isArmor ? 0.4 : 0.2;

        // สุ่ม Element
        if (Math.random() < elementChance) {
            const generateVal = (m: number) => Math.floor(Math.random() * (Math.round(2 * m * 1.5) - Math.round(2 * m * 0.5) + 1)) + Math.round(2 * m * 0.5);
            elementBonus = {
                type: ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)],
                value: generateVal(config.mult * (isWeapon ? 1.2 : 1))
            };
        }

        // สุ่ม Race
        if (Math.random() < raceChance) {
            const generateVal = (m: number) => Math.floor(Math.random() * (Math.round(2 * m * 1.5) - Math.round(2 * m * 0.5) + 1)) + Math.round(2 * m * 0.5);
            raceBonus = {
                type: RACE_POOL[Math.floor(Math.random() * RACE_POOL.length)],
                value: generateVal(config.mult * (isArmor ? 1.2 : 1))
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
        itemLevel,        // <--- เพิ่มข้อมูลเลเวลลงไป
        elementBonus,
        raceBonus,
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

    const twoHandedTypes: WeaponType[] = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
    const rangedTypes: WeaponType[] = ['bow', 'crossbow', 'sling', 'throwing'];

    if (template.slot === 'weapon') {
        const isTwoHanded = template.weaponType ? twoHandedTypes.includes(template.weaponType) : false;
        const isRanged = template.weaponType ? rangedTypes.includes(template.weaponType) : false;
        const isHeavyOrRanged = isTwoHanded || isRanged;

        const baseAtk = getStat(isHeavyOrRanged ? 38 : 25, baseMult, itemLevel, 5);
        const randomVariation = Math.floor(Math.random() * 11) - 5;
        stats.atk = Math.max(1, baseAtk + randomVariation);
        baseStatsSet.add('atk'); // FIX

        const baseHit = getStat(isHeavyOrRanged ? 15 : 25, baseMult, itemLevel, 1);
        const hitVariation = Math.floor(Math.random() * 11) - 5;
        stats.hit = Math.max(1, baseHit + hitVariation);
        baseStatsSet.add('hit'); // FIX

        if (isTwoHanded || isRanged) {
            const baseStr = getStat(5, baseMult, itemLevel, 3);
            const strVariation = Math.floor(Math.random() * 11) - 5;
            stats.str = Math.max(1, baseStr + strVariation);
            baseStatsSet.add('str'); // FIX
        }

    } else if (['necklace', 'ring'].includes(template.slot)) {
        stats.atk = getStat(12, baseMult, itemLevel, 1);
        stats.hit = Math.floor(7 * baseMult);
        baseStatsSet.add('atk'); // FIX
        baseStatsSet.add('hit'); // FIX
    }
    else if (template.slot === 'helm') {
        stats.def = getStat(15, baseMult, itemLevel, 2);
        stats.maxHp = getStat(100, baseMult, itemLevel, 10);
        stats.hit = Math.floor(7 * baseMult);
        baseStatsSet.add('def');   // FIX
        baseStatsSet.add('maxHp'); // FIX
        baseStatsSet.add('hit');   // FIX
    }
    else if (['armor', 'shield'].includes(template.slot)) {
        stats.def = getStat(15, baseMult, itemLevel, 2);
        stats.maxHp = getStat(100, baseMult, itemLevel, 3);
        baseStatsSet.add('def');   // FIX
        baseStatsSet.add('maxHp'); // FIX
    }
    else if (template.slot === 'boots') {
        stats.def = getStat(10, baseMult, itemLevel, 1);
        stats.flee = getStat(10, baseMult, itemLevel, 1);
        baseStatsSet.add('def');  // FIX
        baseStatsSet.add('flee'); // FIX
    }
    else if (template.slot === 'cloak') {
        stats.int = getStat(12, baseMult, itemLevel, 1);
        stats.def = getStat(10, baseMult, itemLevel, 1);
        baseStatsSet.add('int'); // FIX
        baseStatsSet.add('def'); // FIX
    }

    console.log(`[generateRandomItemSpecific] slot=${template.slot} rarity=${config.name} baseStatsSet=`, [...baseStatsSet]);

    const ALL_STATS: (keyof Stats)[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk', 'maxHp',
        'hit', 'flee', 'critRate', 'critDmg', 'res', 'mRes', 'def', 'atk'];

    const isWeapon = template.slot === 'weapon';

    const STAT_CAPS: Record<string, number> = {
        critRate: 10,
        critDmg: 80,
        hit: 80,
        flee: 80
    };
    const PERCENT_STATS = new Set(['critRate', 'critDmg', 'hit', 'flee']);

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

    const bonusMult = Math.sqrt(config.mult) * (1 + Math.log10(itemLevel + 1));

    for (let i = 0; i < numBonus; i++) {
        const availableCommon = COMMON_POOL.filter(s => !rolledStats.has(s));
        const availableRare = RARE_POOL.filter(s => !rolledStats.has(s));

        if (availableCommon.length === 0 && availableRare.length === 0) {
            console.log(`[generateRandomItemSpecific] pool หมดที่ bonus index ${i}/${numBonus} หยุดสุ่ม`);
            break;
        }

        let isRareRoll = Math.random() < 0.04;
        if (isRareRoll && availableRare.length === 0) isRareRoll = false;
        if (!isRareRoll && availableCommon.length === 0) isRareRoll = true;

        const targetPool = isRareRoll ? availableRare : availableCommon;
        const stat = targetPool[Math.floor(Math.random() * targetPool.length)];

        rolledStats.add(stat);

        const isCrit = stat === 'critRate' || stat === 'critDmg';
        const isHp = stat === 'maxHp';

        const minVal = isCrit ? 2 : (isHp ? 100 : 10);
        const rangeVal = isCrit ? 4 : (isHp ? 150 : 30);

        const val = Math.round((Math.random() * rangeVal + minVal) * bonusMult);

        stats[stat] = (stats[stat] || 0) + val;
        statsLog.push({ statKey: stat, value: val });

        console.log(
            `[generateRandomItemSpecific] bonus #${i}: stat=${stat} val=${val}`,
            baseStatsSet.has(stat) ? '⚠️ ชนกับ base stat!' : '(ok)'
        );
    }

    for (const stat of PERCENT_STATS) {
        if (stats[stat] !== undefined) {
            const cap = STAT_CAPS[stat] ?? 100;
            stats[stat] = Math.min(stats[stat], cap);
        }
    }

    console.log(`[generateRandomItemSpecific] ผลลัพธ์สุดท้าย:`, {
        name: `${config.name} ${template.name}`,
        slot: template.slot,
        stats,
        statsLog
    });

    let elementBonus, raceBonus;
    if (['Rare', 'Epic', 'Legendary'].includes(config.name)) {
        const isArmor = ['helm', 'armor', 'shield', 'boots', 'cloak'].includes(template.slot);
        if (Math.random() < (isWeapon ? 0.4 : 0.2)) {
            elementBonus = { type: ELEMENT_POOL[Math.floor(Math.random() * ELEMENT_POOL.length)], value: Math.floor(Math.random() * (Math.round(2 * config.mult * (isWeapon ? 1.2 : 1) * 1.5) - Math.round(2 * config.mult * (isWeapon ? 1.2 : 1) * 0.5) + 1)) + Math.round(2 * config.mult * (isWeapon ? 1.2 : 1) * 0.5) };
        }
        if (Math.random() < (isArmor ? 0.4 : 0.2)) {
            raceBonus = { type: RACE_POOL[Math.floor(Math.random() * RACE_POOL.length)], value: Math.floor(Math.random() * (Math.round(2 * config.mult * (isArmor ? 1.2 : 1) * 1.5) - Math.round(2 * config.mult * (isArmor ? 1.2 : 1) * 0.5) + 1)) + Math.round(2 * config.mult * (isArmor ? 1.2 : 1) * 0.5) };
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
        elementBonus,
        raceBonus,
        type: 'equipment'
    };
};