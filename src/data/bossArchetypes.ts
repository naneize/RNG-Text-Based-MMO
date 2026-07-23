import type { Boss } from '../types/game';

export type ItemDropConfig = {
    id: string;
};

export type BossArchetype = {
    element: Boss['element'];
    race: Boss['race'][];
    zone: string;
    names: string[];
    fixedDrops: {
        weakness: NonNullable<Boss['weakness']>;
        item1?: ItemDropConfig;
        item2?: ItemDropConfig;
        item3?: ItemDropConfig;
        material1?: ItemDropConfig; // 🟢 เพิ่มตรงนี้เพื่อรองรับการฟิกซ์แร่/วัตถุดิบตัวที่ 1
        material2?: ItemDropConfig;
        skill: ItemDropConfig;
    }[];
};

export const bossArchetypes: BossArchetype[] = [
    {
        element: 'Fire',
        race: ['Brute', 'Brute', 'DemiHuman', 'DemiHuman', 'Demon', 'Demon', 'Dragon', 'Dragon', 'Dragon', 'Demon', 'Dragon', 'Demon'],
        zone: 'Volcanic Core',
        names: [
            'Ember Grunt', 'Cinder Raider', 'Firelash Orc', 'Blazing Brute', 'Infernal Warlord',
            'Magma Berserker', 'Volcanic Chieftain', 'Ashborn Titan', 'Pyre Sovereign', 'Emberking Ragnar',
            'Hellfire Wyrm', 'Lord of the Magma Abyss'
        ],
        fixedDrops: [
            { weakness: 'spear', item1: { id: 'two_hand_axe' }, item2: { id: 'burning_cape' }, skill: { id: 'fire_burst' }, material1: { id: 'iron_ore' }, material2: { id: 'steel_ingot' } },
            { weakness: 'sword', item1: { id: 'broad_axe' }, item2: { id: 'ruby_ring' }, skill: { id: 'flame_strike' }, material1: { id: 'iron_ore' }, material2: { id: 'leather' } },
            { weakness: 'bow', item1: { id: 'halberd' }, item2: { id: 'rogue_jacket' }, skill: { id: 'flame_strike' }, material1: { id: 'steel_ingot' }, material2: { id: 'magic_dust' } },
            { weakness: 'dagger', item1: { id: 'claymore' }, item2: { id: 'ruby_necklace' }, skill: { id: 'flame_strike' }, material1: { id: 'leather' }, material2: { id: 'dragon_scale' } },
            { weakness: 'mace', item1: { id: 'crossbow' }, item2: { id: 'spiked_shield' }, skill: { id: 'flame_strike' }, material1: { id: 'magic_dust' }, material2: { id: 'mithril' } },
            { weakness: 'axe', item1: { id: 'burning_cape' }, item2: { id: 'dragon_amulet' }, skill: { id: 'flame_strike' }, material1: { id: 'steel_ingot' }, material2: { id: 'dragon_scale' } },
            { weakness: 'hammer', item1: { id: 'ruby_ring' }, item2: { id: 'chain_mail' }, skill: { id: 'flame_strike' }, material1: { id: 'leather' }, material2: { id: 'gold_ore' } },
            { weakness: 'fist', item1: { id: 'throwing_knives' }, item2: { id: 'heavy_boots' }, skill: { id: 'flame_strike' }, material1: { id: 'magic_dust' }, material2: { id: 'ancient_rune' } },
            { weakness: 'staff', item1: { id: 'tiara' }, item2: { id: 'magic_staff' }, item3: { id: 'silver_amulet' }, skill: { id: 'flame_strike' }, material1: { id: 'gold_ore' }, material2: { id: 'dark_crystal' } },
            { weakness: 'sword', item1: { id: 'great_sword' }, item2: { id: 'winged_helm' }, item3: { id: 'iron_greaves' }, skill: { id: 'flame_strike' }, material1: { id: 'mithril' }, material2: { id: 'celestial_shard' } },
            { weakness: 'staff', item1: { id: 'battle_bow' }, item2: { id: 'silk_mantle' }, item3: { id: 'sling' }, skill: { id: 'fire_burst' }, material1: { id: 'ancient_rune' }, material2: { id: 'dragon_scale' } },
            { weakness: 'mace', item1: { id: 'plate_helm' }, item2: { id: 'blessed_boots' }, item3: { id: 'mailed_fist' }, skill: { id: 'poison_slash' }, material1: { id: 'dragon_scale' }, material2: { id: 'primordial_essence' } }

        ]
    },
    {
        element: 'Water',
        race: ['Plant', 'Undead', 'Plant', 'Demon', 'Brute', 'DemiHuman', 'Brute', 'Undead' as any, 'Dragon', 'Plant', 'Plant', 'Dragon'],
        zone: 'Sunken Temple',
        names: [
            'Sprout Sapling', 'Mossy Vinewalker', 'Tidal Bramble', 'Coral Treant', 'Gluttonous Smile',
            'Water Spirit', 'Ice Golem', 'Tsunami Warden', 'Oceanic Elder', 'Primordial Kraken-Tree',
            'Abyssal Leviathan', 'Deep Sea Sovereign'
        ],
        fixedDrops: [
            { weakness: 'throwing', item1: { id: 'steel_dagger' }, item2: { id: 'magic_shoes' }, skill: { id: 'ice_spike' }, material1: { id: 'iron_ore' }, material2: { id: 'steel_ingot' } },
            { weakness: 'sling', item1: { id: 'gladius' }, item2: { id: 'leather_boots' }, skill: { id: 'ice_spike' }, material1: { id: 'iron_ore' }, material2: { id: 'leather' } },
            { weakness: 'sword', item1: { id: 'spear' }, item2: { id: 'sapphire_ring' }, skill: { id: 'tidal_wave' }, material1: { id: 'steel_ingot' }, material2: { id: 'magic_dust' } },
            { weakness: 'bow', item1: { id: 'pike' }, item2: { id: 'star_pendant' }, skill: { id: 'tidal_wave' }, material1: { id: 'leather' }, material2: { id: 'dragon_scale' } },
            { weakness: 'dagger', item1: { id: 'sling' }, item2: { id: 'crystal_necklace' }, skill: { id: 'tidal_wave' }, material1: { id: 'magic_dust' }, material2: { id: 'mithril' } },
            { weakness: 'staff', item1: { id: 'rapier' }, item2: { id: 'crystal_necklace' }, skill: { id: 'tidal_wave' }, material1: { id: 'steel_ingot' }, material2: { id: 'celestial_shard' } },
            { weakness: 'axe', item1: { id: 'magic_shoes' }, item2: { id: 'spear' }, skill: { id: 'tidal_wave' }, material1: { id: 'leather' }, material2: { id: 'gold_ore' } },
            { weakness: 'hammer', item1: { id: 'sapphire_ring' }, item2: { id: 'long_bow' }, skill: { id: 'tidal_wave' }, material1: { id: 'magic_dust' }, material2: { id: 'ancient_rune' } },
            { weakness: 'fist', item1: { id: 'crystal_necklace' }, item2: { id: 'war_hammer' }, skill: { id: 'tidal_wave' }, material1: { id: 'gold_ore' }, material2: { id: 'dark_crystal' } },
            { weakness: 'spear', item1: { id: 'sapphire_ring' }, item2: { id: 'long_bow' }, skill: { id: 'tidal_wave' }, material1: { id: 'mithril' }, material2: { id: 'celestial_shard' } },
            { weakness: 'bow', item1: { id: 'war_hammer' }, item2: { id: 'crystal_necklace' }, skill: { id: 'tidal_wave' }, material1: { id: 'ancient_rune' }, material2: { id: 'dragon_scale' } },
            { weakness: 'staff', item1: { id: 'heavy_crossbow' }, item2: { id: 'sapphire_ring' }, skill: { id: 'ice_spike' }, material1: { id: 'dragon_scale' }, material2: { id: 'primordial_essence' } }
        ]
    },
    {
        element: 'Earth',
        race: ['Brute', 'DemiHuman', 'Dragon', 'Plant', 'Brute', 'Undead', 'Demon', 'Brute', 'Earth' as any, 'Dragon', 'Brute', 'Dragon'],
        zone: 'Quarry Ruins',
        names: [
            'Rubble Brute', 'Boulder Fist', 'Granite Ogre', 'Quarry Smasher', 'Mountain Crusher',
            'Bedrock Titan', 'Seismic Behemoth', 'Obsidian Warlord', 'Tectonic Colossus', "Gaia's Wrath",
            'Worldbreaker Behemoth', 'Titan of the Core'
        ],
        fixedDrops: [
            { weakness: 'two-hand sword', item1: { id: 'iron_band' }, item2: { id: 'iron_helm' }, skill: { id: 'stone_skin' } },
            { weakness: 'crossbow', item1: { id: 'iron_band' }, item2: { id: 'iron_helm' }, skill: { id: 'stone_skin' } },
            { weakness: 'sword', item1: { id: 'iron_greaves' }, item2: { id: 'tower_shield' }, skill: { id: 'earthquake' } },
            { weakness: 'bow', item1: { id: 'iron_greaves' }, item2: { id: 'tower_shield' }, skill: { id: 'earthquake' } },
            { weakness: 'dagger', item1: { id: 'heavy_plate' }, item2: { id: 'plate_armor' }, skill: { id: 'earthquake' } },
            { weakness: 'staff', item1: { id: 'heavy_plate' }, item2: { id: 'plate_armor' }, skill: { id: 'earthquake' } },
            { weakness: 'mace', item1: { id: 'tower_shield' }, item2: { id: 'iron_greaves' }, skill: { id: 'earthquake' } },
            { weakness: 'axe', item1: { id: 'iron_helm' }, item2: { id: 'heavy_plate' }, skill: { id: 'earthquake' } },
            { weakness: 'hammer', item1: { id: 'plate_armor' }, item2: { id: 'tower_shield' }, skill: { id: 'earthquake' } },
            { weakness: 'fist', item1: { id: 'heavy_plate' }, item2: { id: 'plate_armor' }, skill: { id: 'earthquake' } },
            { weakness: 'hammer', item1: { id: 'iron_helm' }, item2: { id: 'plate_armor' }, skill: { id: 'earthquake' } },
            { weakness: 'sword', item1: { id: 'tower_shield' }, item2: { id: 'heavy_plate' }, skill: { id: 'stone_skin' } }
        ]
    },
    {
        element: 'Wind',
        race: ['Undead', 'Angel', 'DemiHuman', 'Dragon', 'Wind' as any, 'Plant', 'Undead', 'Demon', 'Angel', 'Wind' as any, 'Angel', 'Dragon'],
        zone: 'Sky Fortress',
        names: [
            'Hollow Wisp', 'Restless Specter', 'Howling Wraith', 'Gale Phantom', 'Soulwind Reaper',
            'Tempest Banshee', 'Cyclone Revenant', 'Storm Harbinger', 'Deathwind Sovereign', 'Eternal Maelstrom',
            'Sky Lord Aeris', 'God of the Firmament'
        ],
        fixedDrops: [
            { weakness: 'sling', item1: { id: 'elven_cape' }, item2: { id: 'pocket_bow' }, skill: { id: 'wind_slash' } },
            { weakness: 'throwing', item1: { id: 'elven_cape' }, item2: { id: 'pocket_bow' }, skill: { id: 'wind_slash' } },
            { weakness: 'sword', item1: { id: 'leather_cloak' }, item2: { id: 'swift_boots' }, skill: { id: 'tornado' } },
            { weakness: 'spear', item1: { id: 'leather_cloak' }, item2: { id: 'swift_boots' }, skill: { id: 'tornado' } },
            { weakness: 'mace', item1: { id: 'winged_helm' }, item2: { id: 'gladius' }, skill: { id: 'tornado' } },
            { weakness: 'axe', item1: { id: 'winged_helm' }, item2: { id: 'gladius' }, skill: { id: 'tornado' } },
            { weakness: 'hammer', item1: { id: 'swift_boots' }, item2: { id: 'leather_cloak' }, skill: { id: 'tornado' } },
            { weakness: 'fist', item1: { id: 'pocket_bow' }, item2: { id: 'winged_helm' }, skill: { id: 'tornado' } },
            { weakness: 'dagger', item1: { id: 'gladius' }, item2: { id: 'swift_boots' }, skill: { id: 'tornado' } },
            { weakness: 'bow', item1: { id: 'winged_helm' }, item2: { id: 'gladius' }, skill: { id: 'tornado' } },
            { weakness: 'dagger', item1: { id: 'pocket_bow' }, item2: { id: 'swift_boots' }, skill: { id: 'tornado' } },
            { weakness: 'bow', item1: { id: 'elven_cape' }, item2: { id: 'winged_helm' }, skill: { id: 'wind_slash' } }
        ]
    },
    {
        element: 'Dark',
        race: ['Demon', 'Undead', 'Dragon', 'DemiHuman', 'Dark' as any, 'Brute', 'Demon', 'Undead', 'Dragon', 'Demon', 'Demon', 'Undead'],
        zone: 'Cursed Throne',
        names: [
            'Shade Imp', 'Grim Cultist', 'Dusk Fiend', 'Nightmare Stalker', 'Voidcaller',
            'Abyssal Tormentor', 'Chaos Devourer', 'Darkblood Overlord', 'Infernal Archdemon', "Oblivion's Herald",
            'Lord of Despair', 'Harbinger of the Void'
        ],
        fixedDrops: [
            { weakness: 'mace', item1: { id: 'bone_dagger' }, item2: { id: 'dark_ring' }, skill: { id: 'shadow_strike' } },
            { weakness: 'crossbow', item1: { id: 'bone_dagger' }, item2: { id: 'dark_ring' }, skill: { id: 'shadow_strike' } },
            { weakness: 'sword', item1: { id: 'hood_of_shadow' }, item2: { id: 'life_pendant' }, skill: { id: 'dark_pact' } },
            { weakness: 'bow', item1: { id: 'hood_of_shadow' }, item2: { id: 'life_pendant' }, skill: { id: 'dark_pact' } },
            { weakness: 'spear', item1: { id: 'morning_star' }, item2: { id: 'guardian_shield' }, skill: { id: 'dark_pact' } },
            { weakness: 'axe', item1: { id: 'morning_star' }, item2: { id: 'guardian_shield' }, skill: { id: 'dark_pact' } },
            { weakness: 'mace', item1: { id: 'life_pendant' }, item2: { id: 'hood_of_shadow' }, skill: { id: 'dark_pact' } },
            { weakness: 'hammer', item1: { id: 'dark_ring' }, item2: { id: 'morning_star' }, skill: { id: 'dark_pact' } },
            { weakness: 'fist', item1: { id: 'guardian_shield' }, item2: { id: 'life_pendant' }, skill: { id: 'dark_pact' } },
            { weakness: 'staff', item1: { id: 'morning_star' }, item2: { id: 'dark_ring' }, skill: { id: 'dark_pact' } },
            { weakness: 'sword', item1: { id: 'bone_dagger' }, item2: { id: 'life_pendant' }, skill: { id: 'dark_pact' } },
            { weakness: 'staff', item1: { id: 'hood_of_shadow' }, item2: { id: 'dark_ring' }, skill: { id: 'shadow_strike' } }
        ]
    },
    {
        element: 'Holy',
        race: ['Angel', 'Plant', 'Holy' as any, 'Angel', 'DemiHuman', 'Dragon', 'Angel', 'Undead', 'Plant', 'Angel', 'Angel', 'DemiHuman'],
        zone: 'Holy Sanctuary',
        names: [
            'Novice Acolyte', 'Blessed Guardian', 'Radiant Templar', 'Divine Sentinel', 'Holy Vanguard',
            'Celestial Paladin', 'Seraphic Warden', 'Archangel Ascendant', 'Empyrean Judge', 'Divine Sovereign',
            'Supreme Seraph', 'Apostle of Light'
        ],
        fixedDrops: [
            { weakness: 'dagger', item1: { id: 'star_pendant' }, item2: { id: 'diamond_ring' }, skill: { id: 'holy_smite' } },
            { weakness: 'sling', item1: { id: 'star_pendant' }, item2: { id: 'diamond_ring' }, skill: { id: 'holy_smite' } },
            { weakness: 'sword', item1: { id: 'blessed_boots' }, item2: { id: 'royal_crown' }, skill: { id: 'divine_light' } },
            { weakness: 'spear', item1: { id: 'blessed_boots' }, item2: { id: 'royal_crown' }, skill: { id: 'divine_light' } },
            { weakness: 'bow', item1: { id: 'necklace' }, item2: { id: 'shield' }, skill: { id: 'divine_light' } },
            { weakness: 'dagger', item1: { id: 'necklace' }, item2: { id: 'shield' }, skill: { id: 'divine_light' } },
            { weakness: 'axe', item1: { id: 'royal_crown' }, item2: { id: 'blessed_boots' }, skill: { id: 'divine_light' } },
            { weakness: 'mace', item1: { id: 'diamond_ring' }, item2: { id: 'necklace' }, skill: { id: 'divine_light' } },
            { weakness: 'hammer', item1: { id: 'shield' }, item2: { id: 'royal_crown' }, skill: { id: 'divine_light' } },
            { weakness: 'fist', item1: { id: 'mace' }, item2: { id: 'diamond_ring' }, skill: { id: 'divine_light' } },
            { weakness: 'staff', item1: { id: 'royal_crown' }, item2: { id: 'diamond_ring' }, skill: { id: 'divine_light' } },
            { weakness: 'sword', item1: { id: 'blessed_boots' }, item2: { id: 'shield' }, skill: { id: 'holy_smite' } }
        ]
    },
    {
        element: 'Neutral',
        race: ['Dragon', 'Brute', 'Undead', 'Demon', 'Neutral' as any, 'Plant', 'Angel', 'DemiHuman', 'Dragon', 'Neutral' as any, 'Dragon', 'Dragon'],
        zone: 'Abyssal Void',
        names: [
            'Wyrmling', 'Scaled Drake', 'Void Serpent', 'Twilight Wyvern', 'Astral Dragon',
            'Nebula Wyrm', 'Cosmic Leviathan', 'Starforged Dragon', 'Voidbound Ancient', 'Genesis Wyrmking',
            'Infinite World-Eater', 'Primeval Cosmos'
        ],
        fixedDrops: [
            { weakness: 'crossbow', item1: { id: 'silver_amulet' }, item2: { id: 'traveler_cloak' }, skill: { id: 'lightning_strike' } },
            { weakness: 'throwing', item1: { id: 'silver_amulet' }, item2: { id: 'traveler_cloak' }, skill: { id: 'lightning_strike' } },
            { weakness: 'sword', item1: { id: 'leather_vest' }, item2: { id: 'silver_ring' }, skill: { id: 'poison_slash' } },
            { weakness: 'bow', item1: { id: 'leather_vest' }, item2: { id: 'silver_ring' }, skill: { id: 'poison_slash' } },
            { weakness: 'spear', item1: { id: 'chain_mail' }, item2: { id: 'iron_sword' }, skill: { id: 'lightning_strike' } },
            { weakness: 'dagger', item1: { id: 'chain_mail' }, item2: { id: 'iron_sword' }, skill: { id: 'lightning_strike' } },
            { weakness: 'axe', item1: { id: 'traveler_cloak' }, item2: { id: 'leather_vest' }, skill: { id: 'lightning_strike' } },
            { weakness: 'mace', item1: { id: 'silver_ring' }, item2: { id: 'chain_mail' }, skill: { id: 'lightning_strike' } },
            { weakness: 'hammer', item1: { id: 'iron_sword' }, item2: { id: 'traveler_cloak' }, skill: { id: 'lightning_strike' } },
            { weakness: 'fist', item1: { id: 'iron_sword' }, item2: { id: 'silver_ring' }, skill: { id: 'lightning_strike' } },
            { weakness: 'sword', item1: { id: 'chain_mail' }, item2: { id: 'traveler_cloak' }, skill: { id: 'lightning_strike' } },
            { weakness: 'staff', item1: { id: 'silver_amulet' }, item2: { id: 'leather_vest' }, skill: { id: 'poison_slash' } }
        ]
    }
];