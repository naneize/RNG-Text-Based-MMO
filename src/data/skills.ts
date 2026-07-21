// src/data/skills.ts
import type { Item } from '../types/game';

// เพิ่ม ID เพื่อให้จัดการระบบคอลเลกชันได้ง่ายขึ้น
export const SKILL_POOL: Item[] = [
    {
        id: 'lightning_strike',
        name: 'Lightning Strike',
        type: 'skill',
        slot: 'skill',
        rarity: 'Rare',
        icon: '/Icons/Skills/skill-lightning.svg',
        stats: {},
        statsLog: [],
        uid: '', // จะถูกสร้างใหม่ตอนสุ่ม
        description: 'Strikes enemies with a powerful lightning bolt.',
        effectChance: 25,
        effectPower: 30
    },
    {
        id: 'poison_slash',
        name: 'Poison Slash',
        type: 'skill',
        slot: 'skill',
        rarity: 'Rare',
        icon: '/Icons/Skills/skill-poison.svg',
        stats: {},
        statsLog: [],
        uid: '',
        description: 'Deals damage and poisons the target for continuous damage.',
        effectChance: 30,
        effectPower: 40
    },
    {
        id: 'dodge_counter',
        name: 'Dodge and Counter',
        type: 'skill',
        slot: 'skill',
        rarity: 'Epic',
        icon: '/Icons/Skills/skill-dodge.svg',
        stats: {},
        statsLog: [],
        uid: '',
        description: 'Dodge an attack and immediately counter-attack.',
        effectChance: 40,
        effectPower: 30
    }
];