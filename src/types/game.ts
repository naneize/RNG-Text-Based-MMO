
export type ItemType = 'equipment' | 'skill' | 'material';

export type WeaponType = 'sword' | 'two-hand sword' | 'bow' | 'crossbow'
    | 'dagger' | 'staff' | 'mace' | 'spear' | 'axe' | 'sling' | 'throwing' | 'hammer' | 'fist';

export type EquipmentSlot =
    | 'weapon' | 'armor' | 'shield' | 'cloak'
    | 'helm' | 'necklace' | 'ring' | 'boots'
    | 'skill'
    | 'material';

export interface Stats {
    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;
    critRate: number;
    critDmg: number;
    atk: number;
    def: number;
    maxHp: number;
    hit: number;
    flee: number;
    res: number;
    mRes: number;
    skillPower?: number;
}

// --- 2. Item Interfaces (จัดการให้ไม่ซ้ำซ้อน) ---

// Template คือพิมพ์เขียวของไอเทม (ไม่มี UID/Stats)

export interface BonusEffect {
    type: string;
    value: number;
}

export interface CollectionRecord {
    itemId: string;
    isUnlocked: boolean;
    bestStats: Partial<Stats>; // อ้างอิงจาก Stats interface ของคุณ
    foundCount: number;
    bestElementBonus?: BonusEffect;
    bestRaceBonus?: BonusEffect;
}

export interface ItemTemplate {
    id: string;
    name: string;
    slot: EquipmentSlot;
    icon: string;
    type: ItemType;
    weaponType?: WeaponType;
}

// Item คือไอเทมที่เกิดขึ้นจริง (Instance) ซึ่งขยายมาจาก Template
export interface SkillCondition {
    // ธาตุที่สกิลโจมตีแรงขึ้น (เช่น Water = +20% damage vs Water)
    elementBonusAgainst?: 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Dark' | 'Holy' | 'Neutral';
    elementBonusPercent?: number; // เปอร์เซ็นต์โบนัส (เช่น 20 = 20%)

    // เผ่าพันธุ์ที่สกิลโจมตีแรงขึ้น
    raceBonusAgainst?: 'DemiHuman' | 'Plant' | 'Brute' | 'Undead' | 'Demon' | 'Angel';
    raceBonusPercent?: number;

    // Stat ที่ใช้คำนวณความแรงสกิล (เช่น INT จะเพิ่ม damage)
    scalingStat?: keyof Stats;
    scalingMultiplier?: number; // คูณกับ stat (เช่น 0.5 = 50% ของ INT)

    // ประเภทดาเมจของสกิล
    damageType?: 'physical' | 'magic';

    // เงื่อนไขพิเศษอื่นๆ
    requiresLowHp?: boolean; // ทำงานเมื่อ HP ต่ำ
    requiresHighHp?: boolean; // ทำงานเมื่อ HP สูง
    hpThreshold?: number; // เปอร์เซ็นต์ HP (เช่น 30 = 30%)
}

export interface Item extends ItemTemplate {
    uid: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    stats: Partial<Stats>;
    statsLog: { statKey: keyof Stats, value: number }[];
    itemLevel?: number;

    description?: string;
    effectChance?: number;
    effectPower?: number;

    // เงื่อนไขพิเศษสำหรับสกิล
    skillCondition?: SkillCondition;

    elementBonus?: {
        type: 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Dark' | 'Holy' | 'Neutral';
        value: number
    };
    raceBonus?: {
        type: 'DemiHuman' | 'Plant' | 'Brute' | 'Undead' | 'Demon' | 'Angel' | 'Dragon';
        value: number
    };
}

// --- 3. Player, Boss, Dungeon ---

export interface Player {
    name: string;
    level: number;
    baseStats: Stats;
    currentHp: number;
    maxHp?: number;
    inventory: Item[];
    materials: Record<string, number>;
    totalRolls: number;
    epicPity: number;     // ✅ เพิ่มเข้ามาใหม่
    legendPity: number;
    equippedItems: {
        weapon: Item | null;
        armor: Item | null;
        shield: Item | null;
        cloak: Item | null;
        helmet: Item | null; // ตรวจสอบให้ตรงกับที่ใช้งานใน GameStore
        necklace: Item | null;
        ring: Item | null;
        boots: Item | null;
        skill1: Item | null;
        skill2: Item | null;
    };
}

export const PITY_CONFIG = {
    EPIC: 30,     // 👈 เปลี่ยนตรงนี้ที่เดียวจบ
    LEGEND: 70   // 👈 เปลี่ยนตรงนี้ที่เดียวจบ
};

export const WEAKNESS_BONUS_RATE = 0.2;

export interface Boss {
    id: string;
    name: string;
    level: number;
    hp: number;
    isDead?: boolean;

    // Stats เหมือนผู้เล่นเป๊ะ ทำให้ใช้สูตรคำนวณเดียวกันได้
    stats: Stats;
    currentHp: number | undefined;

    // ข้อมูลจำเพาะของบอส
    element: 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Dark' | 'Holy' | 'Neutral';
    race: 'DemiHuman' | 'Plant' | 'Brute' | 'Undead' | 'Demon' | 'Angel' | 'Dragon';
    zone: string;
    weakness?: 'sword' | 'two-hand sword' | 'bow' | 'crossbow'
    | 'dagger' | 'staff' | 'mace' | 'spear' | 'axe' | 'sling' | 'throwing' | 'hammer' | 'fist';
    imagePath: string;



    // สกิลพิเศษ (ถ้ามี) เช่น บอสอาจจะมี Skill 1 อันที่แรงพิเศษ
    specialSkill?: {
        name: string;
        damageMultiplier: number;
        effectChance: number;
    };

    // ตารางดรอปของ
    dropTable: DropItem[];
    guaranteedMaterials?: { itemId: string; amount: number }[];
}

export interface MaterialTemplate {
    id: string; // เช่น 'iron_ore'
    name: string;
    icon: string; // เช่น '/Icons/Materials/iron_ore.svg'
    description: string;
}


export interface DropItem {
    itemId: string;
    dropChance: number;
    type: 'item' | 'material' | 'skill';

    // สำหรับแร่
    amountRange?: { min: number; max: number };

    // สำหรับไอเทมและสกิล
    statRanges?: Partial<Record<keyof Stats, { min: number; max: number }>>;
    fixedRarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}
