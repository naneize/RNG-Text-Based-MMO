// data/setBonuses.ts
// แหล่งข้อมูลเดียวของระบบ Set Bonus — set ประกอบจาก item.id ที่มีอยู่ใน itemLibrary
// ไม่ต้องแก้ itemGenerator/itemLibrary เลย: membership derive จาก id ตอนสวมใส่
//
// ค่าโบนัสสเกลตามเลเวล: ผลลัพธ์จริง = base + (perLevel × itemLevel เฉลี่ยของชิ้นที่สวมใน set)
// ทำให้ set ยังมีความหมายทั้งต้นเกมและปลายเกม และผลักดันให้ฟาร์มชิ้นรุ่นใหม่ (เลเวลสูงกว่า) มาแทนทีละชิ้น
import type { Stats } from '../types/game';

// ค่าสเกลของ stat หนึ่งตัวใน tier
export interface SetBonusStat {
    base: number;       // ค่าตั้งต้น (เลเวล 0)
    perLevel: number;   // บวกเพิ่มต่อ itemLevel เฉลี่ย 1 เลเวล
}

export interface SetBonusTier {
    requiredCount: number;                          // สวมครบกี่ชิ้นถึงจะได้
    stats: Partial<Record<keyof Stats, SetBonusStat>>;
    label?: string;                                 // (optional) override ข้อความ — ปกติให้ระบบ generate จากค่าจริง
}

export interface ItemSet {
    id: string;
    name: string;
    itemIds: string[];              // ไอเทมที่นับเป็นชิ้นส่วนของ set (ใช้ id จาก itemLibrary)
    tiers: SetBonusTier[];          // เรียงจากน้อยชิ้น -> มากชิ้น
}

export const ITEM_SETS: ItemSet[] = [
    {
        id: 'berserker_hunger',
        name: "Berserker's Hunger",
        itemIds: ['broad_axe', 'beast_mask', 'heavy_boots', 'dark_ring'],
        tiers: [
            {
                requiredCount: 2,
                stats: { critDmg: { base: 10, perLevel: 0.8 } },
            },
            {
                requiredCount: 4,
                stats: {
                    atk: { base: 20, perLevel: 1.6 },
                    str: { base: 5, perLevel: 0.3 },
                },
            },
        ],
    },
    {
        id: 'warden_oath',
        name: "Warden's Oath",
        itemIds: ['heavy_shield', 'heavy_plate', 'fur_cloak', 'life_pendant'],
        tiers: [
            {
                requiredCount: 2,
                stats: { maxHp: { base: 100, perLevel: 5 } },
            },
            {
                requiredCount: 4,
                stats: {
                    def: { base: 20, perLevel: 1.6 },
                    vit: { base: 5, perLevel: 0.3 },
                },
            },
        ],
    },
];

// Lookup แบบเร็ว: itemId -> set ที่สังกัด
export const ITEM_TO_SET: Record<string, ItemSet> = ITEM_SETS.reduce((acc, set) => {
    set.itemIds.forEach((itemId) => {
        acc[itemId] = set;
    });
    return acc;
}, {} as Record<string, ItemSet>);

export const getSetInfoForItem = (itemId?: string): ItemSet | undefined =>
    itemId ? ITEM_TO_SET[itemId] : undefined;

// Tier ที่ active พร้อมค่า stat ที่คำนวณตามเลเวลจริงแล้ว (ตัวเลขสำเร็จรูป)
export interface ActiveSetTier {
    requiredCount: number;
    stats: Partial<Stats>;      // ค่าจริงหลังบวก perLevel × avgItemLevel (ปัดเศษแล้ว)
    label: string;              // ข้อความโชว์ UI สร้างจากค่าจริง เช่น "(2) +68 Critical Damage"
}

export interface ActiveSetBonus {
    set: ItemSet;
    equippedCount: number;
    avgItemLevel: number;       // itemLevel เฉลี่ยของชิ้นที่สวมอยู่ใน set นี้
    activeTiers: ActiveSetTier[];
}

// จำนวนชิ้น -> ใช้ generate ข้อความ tier ตอนยังไม่รู้เลเวล (เช่น ใน ItemDetailModal)
export const describeTierScaling = (tier: SetBonusTier): string =>
    tier.label ??
    `(${tier.requiredCount}) ` +
    Object.entries(tier.stats)
        .map(([key, s]) => `+${s.base} +${s.perLevel}/Lv ${key}`)
        .join(', ');

// generate ข้อความจากค่าจริงที่ resolve แล้ว
const describeTierResolved = (requiredCount: number, stats: Partial<Stats>): string =>
    `(${requiredCount}) ` +
    Object.entries(stats)
        .map(([key, val]) => `+${val} ${key}`)
        .join(', ');

// นับชิ้นที่สวมอยู่ของแต่ละ set แล้วคืนเฉพาะ set ที่มีอย่างน้อย 1 ชิ้นสวมอยู่
// activeTiers จะมีเฉพาะ tier ที่ครบเงื่อนไขจริง พร้อม stat ที่สเกลตาม avgItemLevel แล้ว
export const getActiveSetBonuses = (equippedItems: Record<string, { id?: string; itemLevel?: number } | null>): ActiveSetBonus[] => {
    if (!equippedItems) return [];

    const piecesBySet: Record<string, { id?: string; itemLevel?: number }[]> = {};
    Object.values(equippedItems).forEach((item) => {
        if (!item?.id) return;
        const set = ITEM_TO_SET[item.id];
        if (set) {
            if (!piecesBySet[set.id]) piecesBySet[set.id] = [];
            piecesBySet[set.id].push(item);
        }
    });

    return ITEM_SETS
        .filter((set) => (piecesBySet[set.id] || []).length > 0)
        .map((set) => {
            const pieces = piecesBySet[set.id];
            const equippedCount = pieces.length;

            // itemLevel เฉลี่ยของชิ้นที่สวมจริง (ชิ้นที่ไม่มีค่านับเป็น 1 เหมือนค่า default ของ generator)
            const avgItemLevel = pieces.length > 0
                ? pieces.reduce((sum, p) => sum + (p.itemLevel || 1), 0) / pieces.length
                : 1;

            const activeTiers: ActiveSetTier[] = set.tiers
                .filter((t) => equippedCount >= t.requiredCount)
                .map((t) => {
                    const resolved: Partial<Stats> = {};
                    Object.entries(t.stats).forEach(([key, s]) => {
                        resolved[key as keyof Stats] = Math.floor(s.base + s.perLevel * avgItemLevel);
                    });
                    return {
                        requiredCount: t.requiredCount,
                        stats: resolved,
                        label: describeTierResolved(t.requiredCount, resolved),
                    };
                });

            return { set, equippedCount, avgItemLevel: Math.floor(avgItemLevel), activeTiers };
        });
};
