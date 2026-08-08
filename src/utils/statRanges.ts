import type { Stats, WeaponType } from '../types/game';
import { rarityConfig } from './itemGenerator';
import { getVariationRange } from './statVariation';

export type StatRange = { min: number; max: number };

const twoHandedTypes: WeaponType[] = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
const rangedTypes: WeaponType[] = ['bow', 'crossbow', 'sling', 'throwing'];

const calcBase = (base: number, mult: number, level: number, scale: number) =>
    Math.floor((base + level * scale) * mult);

const withVariation = getVariationRange;

/** ช่วงของ base stat ตาม slot — บาง stat แกว่ง ±5, บาง stat ค่าตายตัว (ไม่มีสุ่ม) */
export function getBaseStatRanges(
    slot: string,
    weaponType: WeaponType | undefined,
    rarityMult: number,
    itemLevel: number
): Partial<Record<keyof Stats, StatRange>> {
    const r: Partial<Record<keyof Stats, StatRange>> = {};
    const heavy = weaponType
        ? twoHandedTypes.includes(weaponType) || rangedTypes.includes(weaponType)
        : false;

    if (slot === 'weapon') {
        r.atk = withVariation(calcBase(heavy ? 25 : 18, rarityMult, itemLevel, 2));
        r.hit = withVariation(calcBase(heavy ? 10 : 20, rarityMult, itemLevel, 0.5));
        if (heavy) {
            r.str = withVariation(calcBase(3, rarityMult, itemLevel, 1));
        }
    } else if (['necklace', 'ring'].includes(slot)) {
        r.atk = withVariation(calcBase(8, rarityMult, itemLevel, 1));
        r.hit = withVariation(calcBase(5, rarityMult, itemLevel, 0.5));
    } else if (slot === 'helm') {
        r.def = withVariation(calcBase(10, rarityMult, itemLevel, 1.5));
        r.maxHp = withVariation(calcBase(80, rarityMult, itemLevel, 10));
        r.hit = withVariation(calcBase(7, rarityMult, itemLevel, 0.5));
    } else if (['armor', 'shield'].includes(slot)) {
        r.def = withVariation(calcBase(15, rarityMult, itemLevel, 1.5));
        r.maxHp = withVariation(calcBase(100, rarityMult, itemLevel, 2));
    } else if (slot === 'boots') {
        r.def = withVariation(calcBase(6, rarityMult, itemLevel, 0.5));
        r.flee = withVariation(calcBase(6, rarityMult, itemLevel, 0.2));
    } else if (slot === 'cloak') {
        r.int = withVariation(calcBase(8, rarityMult, itemLevel, 1));
        r.def = withVariation(calcBase(5, rarityMult, itemLevel, 0.5));
    }
    return r;

}



/** ช่วงของ bonus stat ที่สุ่มมาจาก pool (ใช้ก็ต่อเมื่อ stat นั้นถูกเลือกมาจริง) */
export function getBonusStatRange(
    statKey: keyof Stats,
    rarityMult: number,
    itemLevel: number
): StatRange {
    if (statKey === 'critRate') {
        // Crit Rate: ล้อตามสูตรสุ่มจริง (8% ถึง 15%)
        return { min: 8, max: 15 };
    }

    if (statKey === 'critDmg') {
        const baseCritDmg = Math.floor(itemLevel * 0.05) + 30;
        return {
            min: Math.max(10, baseCritDmg - 15),
            max: Math.max(10, baseCritDmg + 15),
        };
    }

    // สเตตัสโบนัสอื่นๆ ใช้สูตรคำนวณที่ขยายเรนจ์ให้กว้างขึ้น
    const baseVal = Math.floor((8 + itemLevel * 0.15) * rarityMult);

    // 🟢 เปลี่ยนจาก 0.20 เป็น 0.35 (หรือ 35%) เพื่อให้เรนจ์ Min-Max กว้างและสอดคล้องกับตอนสุ่มจริง
    const spread = Math.floor(baseVal * 0.35);

    return {
        min: Math.max(1, baseVal - spread),
        max: Math.max(1, baseVal + spread),
    };
}

/** ช่วงของ elementBonus / raceBonus ผูกกับ tier เท่านั้น */
export function getSpecialBonusRange(rarityName: string): StatRange {
    switch (rarityName) {
        case 'Legendary': return { min: 20, max: 35 };
        case 'Epic': return { min: 12, max: 22 };
        case 'Rare': return { min: 6, max: 12 };
        default: return { min: 3, max: 8 };
    }
}

/** ช่วงของ skillCondition affix (คงที่ ไม่ขึ้นกับ rarity/level) */
export const SKILL_AFFIX_RANGES = {
    elementBonusPercent: { min: 5, max: 15 },
    raceBonusPercent: { min: 5, max: 15 },
    scalingMultiplier: { min: 0.2, max: 0.5 },
    hpThreshold: { min: 20, max: 50 },
} as const;

/** helper รวม: ใส่ item เข้าไป ได้ range ของทุก stat ที่มีสิทธิ์ปรากฏบนไอเทมนั้น */
export function getFullStatRanges(item: {
    slot: string;
    weaponType?: WeaponType;
    rarity: string;
    itemLevel?: number;
}): Partial<Record<keyof Stats, StatRange>> {
    const config = rarityConfig.find(r => r.name === item.rarity) ?? rarityConfig[0];
    const level = item.itemLevel ?? 1;
    const base = getBaseStatRanges(item.slot, item.weaponType, config.mult, level);

    const allStats: (keyof Stats)[] = [
        'str', 'agi', 'vit', 'int', 'dex', 'luk', 'maxHp', 'hit', 'flee',
        'critRate', 'critDmg', 'res', 'mRes', 'def', 'atk',
    ];

    const result: Partial<Record<keyof Stats, StatRange>> = { ...base };
    for (const s of allStats) {
        if (result[s]) continue; // เป็น base stat ไปแล้ว ข้าม (จะไม่ถูกสุ่มซ้ำในฝั่ง bonus อยู่แล้วตามโค้ดจริง)
        result[s] = getBonusStatRange(s, config.mult, level);
    }
    return result;
}