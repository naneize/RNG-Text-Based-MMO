export const TRANSFER_COSTS = {
    common: {
        successRate: 70,
        materials: [
            { id: 'iron_ore', amount: 25 },
            { id: 'steel_ingot', amount: 25 },
            { id: 'leather', amount: 20 }
        ]
    },
    rare: {
        successRate: 45,
        materials: [
            { id: 'magic_dust', amount: 40 },
            { id: 'mithril', amount: 30 },
            { id: 'leather', amount: 25 }
        ]
    },
    epic: {
        successRate: 20,
        materials: [
            // เนื่องจาก Epic การันตีทุก 30 ครั้ง (ไวมาก) แร่ขยะทั่วไปและแร่ Epic จึงควรใช้อย่างสมดุล
            { id: 'iron_ore', amount: 100 },
            { id: 'magic_dust', amount: 80 },
            { id: 'dark_crystal', amount: 20 },
            { id: 'dragon_scale', amount: 10 },
            { id: 'gold_ore', amount: 30 }
        ]
    },
    legendary: {
        successRate: 10,
        materials: [
            // 🟢 เพิ่ม iron_ore เข้ามาด้วย เพื่อผลาญแร่ขยะจากระบบ Auto-Salvage ช่วงท้ายเกม
            { id: 'iron_ore', amount: 500 },       // แร่ขยะ Common ตั้งต้น
            { id: 'steel_ingot', amount: 300 },
            { id: 'mithril', amount: 250 },
            { id: 'celestial_shard', amount: 35 },
            { id: 'ancient_rune', amount: 25 },
            { id: 'primordial_essence', amount: 15 }
        ]
    }
};

// ต้นทุนแร่สำหรับ "ป้องกัน" ไม่ให้ stat หายตอน transfer ล้มเหลว — จ่ายเพิ่มต่างหากจากต้นทุน transfer ปกติ
// ตั้งใจใช้ ancient_rune เป็นแกนหลักตั้งแต่ rare ขึ้นไป เพราะปัจจุบันแทบไม่มีใครใช้แร่ตัวนี้เลยนอกจาก legendary transfer
export const PROTECTION_COSTS: Record<string, { id: string; amount: number }[]> = {
    common: [
        { id: 'leather', amount: 15 },
    ],
    rare: [
        { id: 'mithril', amount: 20 },
        { id: 'ancient_rune', amount: 3 },
    ],
    epic: [
        { id: 'dragon_scale', amount: 5 },
        { id: 'ancient_rune', amount: 8 },
    ],
    legendary: [
        { id: 'ancient_rune', amount: 20 },
        { id: 'primordial_essence', amount: 5 },
    ],
};