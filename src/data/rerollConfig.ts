// data/rerollConfig.ts
import type { Stats } from '../types/game';

// จับคู่ stat แต่ละตัวกับแร่ที่รับผิดชอบ reroll กลุ่มนั้น (ไม่ทับซ้อนกันเลย)
export const STAT_TO_MATERIAL: Partial<Record<keyof Stats, string>> = {
    atk: 'dragon_scale',    // ย้าย ATK ไปใช้แร่หายาก (เช่น เกล็ดมังกร) จะได้ไม่เกลื่อนเกินไป
    def: 'iron_ore',        // Iron Ore ใช้กับ DEF แทน
    hit: 'steel_ingot',
    flee: 'steel_ingot',
    maxHp: 'leather',
    str: 'magic_dust',
    agi: 'magic_dust',
    vit: 'magic_dust',
    int: 'magic_dust',
    dex: 'magic_dust',
    luk: 'magic_dust',
    res: 'iron_ore',        // ใช้ Iron Ore ร่วมกับ DEF ได้
    mRes: 'mithril',
    critRate: 'dark_crystal',
    critDmg: 'dragon_scale',
};

// แร่พิเศษสำหรับ reroll elementBonus / raceBonus (ไม่ใช่ Stats key ปกติ)
export const ELEMENT_BONUS_MATERIAL = 'void_essence';
export const RACE_BONUS_MATERIAL = 'celestial_shard';

// แร่ premium ที่ใช้แทนแร่อื่นได้ทุกชนิด (แลกด้วยจำนวนแพงกว่าหลายเท่า)
export const UNIVERSAL_MATERIAL = 'primordial_essence';
export const UNIVERSAL_COST_MULTIPLIER = 4;

// ต้นทุนพื้นฐานต่อ 1 ครั้ง reroll ตาม rarity (ก่อนคูณด้วย itemLevel)
export const REROLL_BASE_COST: Record<string, number> = {
    common: 5,
    rare: 10,
    epic: 20,
    legendary: 50,
};

// ทุก 100 itemLevel ต้นทุน +15%
export const getLevelCostMultiplier = (itemLevel: number): number => {
    return 1 + Math.floor(itemLevel / 100) * 0.15;
};

// จ่ายเพิ่มถ้าอยากล็อกค่าเดิมไว้ กันได้ค่าแย่กว่าเดิม
export const SAFETY_LOCK_MULTIPLIER = 3;

export const calculateRerollCost = (
    rarity: string,
    itemLevel: number,
    useSafetyLock: boolean,
    useUniversal: boolean
): number => {
    const base = REROLL_BASE_COST[rarity?.toLowerCase()] || REROLL_BASE_COST.common;
    const levelMult = getLevelCostMultiplier(itemLevel);
    let cost = Math.ceil(base * levelMult);
    if (useSafetyLock) cost *= SAFETY_LOCK_MULTIPLIER;
    if (useUniversal) cost *= UNIVERSAL_COST_MULTIPLIER;
    return cost;
};

export interface RerollResult {
    success: boolean;
    message: string;
    oldValue?: number;
    newValue?: number;
    oldBonus?: { type: string; value: number };
    newBonus?: { type: string; value: number };
    kept?: boolean;
}