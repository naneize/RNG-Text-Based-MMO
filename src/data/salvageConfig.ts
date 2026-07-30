// data/salvageConfig.ts

export interface MaterialDrop {
    id: string;
    min: number;
    max: number;
}

export interface SalvageMaterialTable {
    success: MaterialDrop[];
    fail: MaterialDrop[];
}

// ✅ แหล่งข้อมูลเดียวของ material ที่ได้จากการ salvage แต่ละ rarity
// ทั้ง gameStore.ts (logic จริง) และ SalvageModal.tsx (ตัวเลขที่โชว์ UI)
// ต้องดึงจากที่นี่ที่เดียว ห้าม hardcode ซ้ำที่อื่นอีก
export const SALVAGE_MATERIALS: Record<string, SalvageMaterialTable> = {
    common: {
        success: [
            { id: 'iron_ore', min: 1, max: 3 },
            { id: 'steel_ingot', min: 1, max: 2 },
        ],
        fail: [{ id: 'iron_ore', min: 1, max: 1 }],
    },
    rare: {
        success: [
            { id: 'magic_dust', min: 2, max: 4 },
            { id: 'mithril', min: 2, max: 4 },
            { id: 'dragon_scale', min: 1, max: 2 },
            { id: 'leather', min: 1, max: 2 },
        ],
        fail: [
            { id: 'magic_dust', min: 1, max: 1 },
            { id: 'leather', min: 1, max: 1 },
            { id: 'mithril', min: 1, max: 1 },
        ],
    },
    epic: {
        success: [
            { id: 'dark_crystal', min: 1, max: 2 },
            { id: 'dragon_scale', min: 1, max: 3 },
            { id: 'gold_ore', min: 2, max: 4 },
        ],
        fail: [
            { id: 'dark_crystal', min: 1, max: 1 },
            { id: 'gold_ore', min: 1, max: 1 },
        ],
    },
    legendary: {
        success: [
            { id: 'void_essence', min: 1, max: 1 },
            { id: 'celestial_shard', min: 1, max: 2 },
            { id: 'ancient_rune', min: 1, max: 1 },
            { id: 'primordial_essence', min: 1, max: 1 },
        ],
        fail: [{ id: 'celestial_shard', min: 1, max: 1 }],
    },
};

export const DEFAULT_SALVAGE_FALLBACK: MaterialDrop[] = [{ id: 'iron_ore', min: 1, max: 1 }];

// สุ่มจำนวนจริงจาก config นี้ (ใช้ใน gameStore.ts ตอน salvage จริง)
export const rollMaterials = (drops: MaterialDrop[]): { id: string; amount: number }[] => {
    return drops.map(d => ({
        id: d.id,
        amount: Math.floor(Math.random() * (d.max - d.min + 1)) + d.min,
    }));
};