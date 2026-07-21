
import type { Boss } from '../types/game';

export const BOSS_LIBRARY: Boss[] = [
    {
        id: 'b-001',
        level: 5,
        name: 'Evil Book',
        element: 'Dark',
        race: 'Demon',
        zone: 'Dark Forest',
        weakness: 'mace',
        stats: {
            str: 40, agi: 30, vit: 40, int: 30, dex: 40, luk: 40,
            critRate: 20, critDmg: 100, atk: 60, def: 60,
            maxHp: 1200, hit: 80, flee: 40, res: 40, mRes: 35
        },
        dropTable: [
            {
                itemId: 'mace',
                type: 'item',
                dropChance: 0.15,
                fixedRarity: 'Rare',
            },
            {
                itemId: 'mace',
                type: 'item',
                dropChance: 0.05,
                fixedRarity: 'Epic',
            },
            {
                itemId: 'iron_ore',
                type: 'material',
                dropChance: 0.8,
                amountRange: { min: 1, max: 3 }
            },
            {
                itemId: 'steel_ingot',
                type: 'material',
                dropChance: 0.2,
                amountRange: { min: 1, max: 3 }
            },
        ],
        imagePath: '/Icons/Monsters/EvilBook.svg'
    } as unknown as Boss,
    {
        id: 'b-002',
        level: 10,
        name: 'Drake',
        element: 'Dark',
        race: 'Demon',
        zone: 'Dark Forest',
        weakness: 'two-hand sword',
        stats: {
            str: 120, agi: 60, vit: 80, int: 30, dex: 60, luk: 60,
            critRate: 30, critDmg: 110, atk: 100, def: 100,
            maxHp: 2900, hit: 120, flee: 60, res: 85, mRes: 60
        },
        dropTable: [
            {
                itemId: 'great_sword',
                type: 'item',
                dropChance: 0.15,
                fixedRarity: 'Rare',

            },
            {
                itemId: 'great_sword',
                type: 'item',
                dropChance: 0.05,
                fixedRarity: 'Epic',

            },
            {
                itemId: 'iron_ore',
                type: 'material',
                dropChance: 0.8,
                amountRange: { min: 3, max: 5 }
            },
            {
                itemId: 'steel_ingot',
                type: 'material',
                dropChance: 0.4,
                amountRange: { min: 2, max: 4 }
            },
        ],
        imagePath: '/Icons/Monsters/Drake.svg'
    } as unknown as Boss,

];