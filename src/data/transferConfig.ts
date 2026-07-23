export const TRANSFER_COSTS = {
    common: {
        successRate: 70,
        materials: [
            { id: 'iron_ore', amount: 10 },
            { id: 'steel_ingot', amount: 10 },
            { id: 'leather', amount: 5 }
        ]
    },
    rare: {
        successRate: 45,
        materials: [
            { id: 'magic_dust', amount: 20 },
            { id: 'mithril', amount: 15 },
            { id: 'gold_ore', amount: 10 }
        ]
    },
    epic: {
        successRate: 20,
        materials: [
            { id: 'dark_crystal', amount: 25 },
            { id: 'dragon_scale', amount: 15 },
            { id: 'void_essence', amount: 10 }
        ]
    },
    legendary: {
        successRate: 5,
        materials: [
            { id: 'celestial_shard', amount: 50 },
            { id: 'ancient_rune', amount: 30 },
            { id: 'primordial_essence', amount: 10 }
        ]
    }
};