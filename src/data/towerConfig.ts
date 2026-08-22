// data/towerConfig.ts
// หัวใจของ Boss Tower — สเกลความยากต่อชั้น, ระบบ Modifier 3 ระดับ, และตัวสร้างชั้น
// ออกแบบให้ "บอสเดิม + ตัวคูณ" เพื่อไม่ต้องแตะ combat.ts เลย: แค่โคลนบอส คูณ Stats แล้ว
// ส่งเข้า battleStore.startBattle ตามปกติ ระบบ battle/trait/log ทั้งหมดใช้ของเดิม

import type { Boss, Stats } from '../types/game';
import { BOSS_LIBRARY } from './bossLibrary';

// ---------- ตัวคูณสเกลต่อชั้น (จูนความยากที่นี่ที่เดียว) ----------
// stat ต่อสู้หลักสเกลเร็ว ส่วน stat หลัก 6 ตัว (str/agi/...) สเกลช้ากว่า (0.10)
// เพราะ getEffectiveStats จะแปลง stat หลักบวกเข้า stat ต่อสู้อีกชั้น — ถ้าคูณเท่ากัน
// จะเกิด compound ซ้อนจนแรงเกินไป สเกลหลัก 6 ตัวไว้เพื่อให้ conversion (vit→HP, agi→FLEE)
// และ critRate ของ modifier โตตามชั้นอย่างสม่ำเสมอ
export const TOWER_SCALING = {
    maxHp: 0.18,   // เลือดบอส
    atk: 0.12,     // พลังโจมตี
    def: 0.10,     // เกราะ
    res: 0.06,     // ต้านทานรวม
    mRes: 0.06,
    flee: 0.05,
    hit: 0.05,
    str: 0.10, agi: 0.10, vit: 0.10, int: 0.10, dex: 0.10, luk: 0.10,
} as const;

// ---------- กฎการไต่ ----------
export const FLOORS_PER_CHECKPOINT = 10;   // หมุดหมากทุก 10 ชั้น (ตายแล้วเริ่มจากหมุดล่าสุด)
export const PLAYER_HEAL_BETWEEN_FLOORS = 0.25; // ฟื้นเลือด 25% ของ maxHp ต่อชั้นที่ผ่าน

// ---------- Modifier ----------
export type ModifierTier = 'light' | 'medium' | 'heavy';

export interface TowerModifier {
    id: string;
    name: string;
    description: string;
    tier: ModifierTier;
    // ตัวคูณ stat ของบอส (1 = ไม่เปลี่ยน) — PR1 ใช้เฉพาะกลุ่มนี้ (แบบมี trait/regen ไว้ PR3)
    statMultipliers: Partial<Record<keyof Stats, number>>;
}

export const TOWER_MODIFIERS: TowerModifier[] = [
    // ----- เบา (ชั้น 1-29) -----
    { id: 'thick_hide', name: 'Thick Hide', description: 'Boss DEF and RES greatly increased.', tier: 'light', statMultipliers: { def: 2.0, res: 1.5 } },
    { id: 'frenzied', name: 'Frenzied', description: 'Boss ATK increased.', tier: 'light', statMultipliers: { atk: 1.3 } },
    { id: 'colossal', name: 'Colossal', description: 'Boss Max HP greatly increased.', tier: 'light', statMultipliers: { maxHp: 1.4 } },
    { id: 'evasive', name: 'Evasive', description: 'Boss FLEE increased — expect more misses.', tier: 'light', statMultipliers: { flee: 1.8 } },
    { id: 'keen', name: 'Keen Eye', description: 'Boss HIT increased — dodging becomes harder.', tier: 'light', statMultipliers: { hit: 1.6 } },
    // ----- กลาง (ชั้น 30-59) -----
    { id: 'iron_wall', name: 'Iron Wall', description: 'Boss DEF massively increased.', tier: 'medium', statMultipliers: { def: 2.5, mRes: 1.5 } },
    { id: 'bloodthirst', name: 'Bloodthirst', description: 'Boss ATK and Crit Rate increased.', tier: 'medium', statMultipliers: { atk: 1.45, critRate: 1.4 } },
    { id: 'undying_flesh', name: 'Undying Flesh', description: 'Boss Max HP massively increased.', tier: 'medium', statMultipliers: { maxHp: 1.7 } },
    { id: 'phantom_step', name: 'Phantom Step', description: 'Boss FLEE greatly increased.', tier: 'medium', statMultipliers: { flee: 2.2 } },
    // ----- หนัก (ชั้น 60+) -----
    { id: 'titans_bane', name: "Titan's Bane", description: 'All boss stats greatly increased.', tier: 'heavy', statMultipliers: { atk: 1.4, def: 1.6, maxHp: 1.3 } },
    { id: 'arcane_ward', name: 'Arcane Ward', description: 'Boss RES and M.RES massively increased.', tier: 'heavy', statMultipliers: { res: 2.2, mRes: 2.2 } },
    { id: 'perfect_predator', name: 'Perfect Predator', description: 'Boss HIT and FLEE massively increased.', tier: 'heavy', statMultipliers: { hit: 2.0, flee: 2.0 } },
];

const tierForFloor = (floor: number): ModifierTier =>
    floor >= 60 ? 'heavy' : floor >= 30 ? 'medium' : 'light';

const rollModifier = (floor: number, excludeIds: string[]): TowerModifier => {
    const tier = tierForFloor(floor);
    const pool = TOWER_MODIFIERS.filter((m) => m.tier === tier && !excludeIds.includes(m.id));
    // กัน pool แคบจนสุ่มชน id ที่แยกไว้ — ตัด filter ออกถ้าไม่เหลือ
    const finalPool = pool.length > 0 ? pool : TOWER_MODIFIERS.filter((m) => m.tier === tier);
    return finalPool[Math.floor(Math.random() * finalPool.length)];
};

// ---------- ชั้นของ tower ----------
export interface TowerFloor {
    floor: number;
    boss: Boss;                 // บอสโคลนที่คูณ stat แล้ว (พร้อมส่งเข้า startBattle)
    modifiers: TowerModifier[];
    isBossFloor: boolean;       // ทุกชั้นที่ 10 — แรงกว่า + รางวัลคูณ
    rewardMultiplier: number;
}

const applyMult = (stats: Stats, key: keyof Stats, mult: number, floor: number): number => {
    const base = (stats[key] || 0) as number;
    const floorScale = 1 + (TOWER_SCALING as any)[key] * floor;
    return Math.floor(base * floorScale * mult);
};

export const generateTowerFloor = (floor: number): TowerFloor => {
    const isBossFloor = floor % FLOORS_PER_CHECKPOINT === 0;

    // เลือกบอสแบบ "ไล่เลเวลขึ้นตามชั้น": เรียงจากอ่อนไปแกร่ง แล้วหมุนเวียน
    // ทุกครบรอบ (ครบทุกตัวใน library) บอสกลับมาตัวแรกแต่ +10 เลเวล — ความยากจึงไต่ขึ้นเสมอ
    // ไม่สุ่มเปล่า ๆ เพราะจะเกิด "ชั้น 1 เจอเลเวล 200 ชั้น 2 เจอ 120" ที่อ่านไม่รู้เรื่อง
    const sortedLibrary = BOSS_LIBRARY.slice().sort((a, b) => a.level - b.level);
    const cycle = Math.floor((floor - 1) / sortedLibrary.length);
    const base = sortedLibrary[(floor - 1) % sortedLibrary.length];
    const bossLevel = Math.min(990, base.level + cycle * 10); // เผื่อไว้ไม่ให้ drop iLv ล้น 1000

    // จำนวน modifier: ปกติ 1 ตัว / boss floor และชั้น 30+ ได้ 2 ตัว
    const modCount = isBossFloor || floor >= 30 ? 2 : 1;
    const modifiers: TowerModifier[] = [];
    const usedIds: string[] = [];
    for (let i = 0; i < modCount; i++) {
        const mod = rollModifier(floor, usedIds);
        usedIds.push(mod.id);
        modifiers.push(mod);
    }

    // รวมตัวคูณของทุก modifier เข้าเป็นตัวเดียวต่อ stat
    const combined: Partial<Record<keyof Stats, number>> = {};
    modifiers.forEach((m) => {
        Object.entries(m.statMultipliers).forEach(([key, mult]) => {
            combined[key as keyof Stats] = (combined[key as keyof Stats] || 1) * (mult as number);
        });
    });

    // Boss Floor แรงเพิ่มอีกรอบ
    const bossFloorHpMult = isBossFloor ? 1.5 : 1;

    const scaledStats: Stats = { ...base.stats };
    (Object.keys(TOWER_SCALING) as Array<keyof typeof TOWER_SCALING>).forEach((key) => {
        scaledStats[key] = applyMult(
            base.stats,
            key,
            (combined[key] || 1) * (key === 'maxHp' ? bossFloorHpMult : 1),
            floor
        ) as any;
    });
    // stat นอกตาราง scaling (str/agi/vit/int/dex/luk/critDmg) คูณตาม modifier ถ้ามี
    Object.entries(combined).forEach(([key, mult]) => {
        if (!(key in TOWER_SCALING)) {
            scaledStats[key as keyof Stats] = Math.floor(((base.stats[key as keyof Stats] || 0) as number) * (mult as number)) as any;
        }
    });

    const boss: Boss = {
        ...base,
        name: `${base.name}`,
        level: bossLevel,
        stats: scaledStats,
        currentHp: undefined,
        isDead: false,
    };

    return {
        floor,
        boss,
        modifiers,
        isBossFloor,
        rewardMultiplier: isBossFloor ? 2 : 1,
    };
};

// ---------- รางวัลวัสดุต่อชั้น (PR1: วัสดุล้วน — set piece จะมาใน PR2) ----------
export interface TowerMaterialReward {
    id: string;
    amount: number;
}

export const getTowerFloorRewards = (floor: number, rewardMultiplier: number): TowerMaterialReward[] => {
    const rewards: TowerMaterialReward[] = [
        { id: 'magic_dust', amount: Math.floor((3 + floor * 0.6) * rewardMultiplier) },
    ];
    if (floor >= 10) {
        rewards.push({ id: 'dark_crystal', amount: Math.floor((1 + floor / 10) * rewardMultiplier) });
    }
    if (floor >= 30) {
        rewards.push({ id: 'celestial_shard', amount: Math.floor((1 + floor / 20) * rewardMultiplier) });
    }
    if (floor % FLOORS_PER_CHECKPOINT === 0) {
        rewards.push({ id: 'ancient_rune', amount: Math.max(2, Math.floor(floor / 10)) });
        if (floor >= 30) {
            rewards.push({ id: 'primordial_essence', amount: Math.max(1, Math.floor(floor / 30)) });
        }
    }
    return rewards;
};
