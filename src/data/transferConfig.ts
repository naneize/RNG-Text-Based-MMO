export const TRANSFER_COSTS = {
    common: {
        successRate: 70,
        materials: [
            { id: 'iron_ore', amount: 30 },     // ปรับจาก 10 เป็น 30
            { id: 'steel_ingot', amount: 30 },   // ปรับจาก 10 เป็น 30
            { id: 'leather', amount: 25 }        // ปรับจาก 8 เป็น 25
        ]
    },
    rare: {
        successRate: 45,
        materials: [
            { id: 'magic_dust', amount: 50 },    // ปรับจาก 18 เป็น 50
            { id: 'mithril', amount: 35 },       // ปรับจาก 12 เป็น 35
            { id: 'gold_ore', amount: 25 }       // ปรับจาก 8 เป็น 25
        ]
    },
    epic: {
        successRate: 20,
        materials: [
            { id: 'dark_crystal', amount: 80 },    // ปรับจาก 25 เป็น 80
            { id: 'dragon_scale', amount: 50 },    // ปรับจาก 15 เป็น 50 (สอดคล้องกับที่บอสดรอปหลักสัปดาห์/ร้อย)
            { id: 'void_essence', amount: 35 }     // ปรับจาก 10 เป็น 35
        ]
    },
    legendary: {
        successRate: 10,
        materials: [
            { id: 'celestial_shard', amount: 100 },  // ปรับจาก 25 เป็น 100
            { id: 'ancient_rune', amount: 75 },      // ปรับจาก 20 เป็น 75
            { id: 'primordial_essence', amount: 50 } // ปรับจาก 15 เป็น 50 (บอสดรอปหลักสิบถึงห้าสิบกว่า เหมาะสมกันพอดี)
        ]
    }
};