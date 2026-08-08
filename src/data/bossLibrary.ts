import type { Boss } from '../types/game';
import { bossArchetypes } from './bossArchetypes';
import { bossImages, baseStats, materialTiers } from './bossAssets';



const generateBoss = (index: number, archetype: typeof bossArchetypes[0], levelIndex: number): Boss => {
    const { element, race: raceList, zone, names, fixedDrops } = archetype;
    const level = 90 + levelIndex * 10;
    const bossId = `b-${String(index + 1).padStart(3, '0')}`;

    const bossName = names[levelIndex] || names[names.length - 1];
    const race = raceList[levelIndex] || raceList[levelIndex % raceList.length];

    const randomImage = bossImages[bossId] || '/Icons/Monsters/Drake.svg';

    const levelMultiplier = 1 + (level - 5) * 0.15;
    const combatMultiplier = 1 + (level - 5) * 0.18;

    // 🟢 สร้างตัวคูณเฉพาะตัว (Variant) ให้บอสแต่ละตัวไม่ซ้ำซากจำเจ
    // ใช้ index คำนวณหาเศษ เพื่อกระจายบทบาทบอสออกเป็น 4 สายแบบอัตโนมัติ
    const seed = (index * 997) % 100;
    let hpMod = 1.0;
    let atkMod = 1.0;
    let defMod = 1.0;
    let agiMod = 1.0;
    let hitMod = 1.0;

    if (seed < 20) {
        // สายแทงค์: เลือดหนา เกราะแน่น ตีเบาลงนิดนึง
        hpMod = 1.35; defMod = 1.25; atkMod = 0.85;
    } else if (seed < 40) {
        // สายเบอร์เซิร์ก / ดาเมจจัด: พลังโจมตีสูงปรี๊ด แลกมาด้วยเลือดที่บางลง
        atkMod = 1.30; hpMod = 0.85; agiMod = 1.1;
    } else if (seed < 60) {
        // สายว่องไว / หลบพริ้ว: หลบหลีกสูง คริไว
        agiMod = 1.35; defMod = 0.9; hpMod = 0.9;
    } else if (seed < 80) {
        // 🎯 สายแม่นยำ / นักล่า: แม่นยำสูงมาก (Hit พุ่ง) โจมตีดี แลกกับเกราะหรือเลือดที่ลดลงหน่อย
        hitMod = 1.50; atkMod = 1.15; defMod = 0.85;
    } else {
        // สายสมดุล: ใช้ค่ามาตรฐาน
        hpMod = 1.0; atkMod = 1.0; defMod = 1.0; agiMod = 1.0; hitMod = 1.0;
    }

    const defScale = 1 + (level - 5) * 0.08 + Math.pow((level - 5) / 40, 2);
    const resScale = 1 + (level - 5) * 0.03 + Math.pow((level - 5) / 60, 2);

    const stats = {
        // กลุ่มสเตตัสหลัก (คูณตัวคูณเลเวล + คูณ Mod เฉพาะตัวเข้าไป)
        str: Math.floor(baseStats.str * levelMultiplier * atkMod),
        agi: Math.floor(baseStats.agi * levelMultiplier * agiMod),
        vit: Math.floor(baseStats.vit * levelMultiplier * hpMod),
        int: Math.floor(baseStats.int * levelMultiplier),
        dex: Math.floor(baseStats.dex * levelMultiplier * hitMod), // ให้ dex ส่งผลร่วมกับความแม่นยำด้วย
        luk: Math.floor(baseStats.luk * levelMultiplier),

        // กลุ่มคริติคอล
        critRate: Math.min(95, baseStats.critRate + levelIndex * 3),
        critDmg: baseStats.critDmg + levelIndex * 12,

        // กลุ่มพลังชีวิตและดาเมจ (ผูกกับ Mod ด้วย)
        maxHp: Math.floor(baseStats.maxHp * combatMultiplier * hpMod),
        atk: Math.floor(baseStats.atk * combatMultiplier * atkMod),

        // กลุ่มป้องกันและแม่นยำ
        def: Math.floor(baseStats.def * defScale * defMod),
        res: Math.floor(baseStats.res * resScale),
        mRes: Math.floor(baseStats.mRes * resScale),
        hit: Math.floor((baseStats.hit + level * 5) * hitMod), // คูณ Mod ความแม่นยำตรงนี้
        flee: Math.floor((baseStats.flee + level * 5) * agiMod)
    };


    // 🟢 ดึงข้อมูลไอเทมและจุดอ่อนที่ฟิกซ์ไว้ตามเลเวลอินเด็กซ์นั้นๆ
    const currentDrops = fixedDrops?.[levelIndex] || {
        weakness: 'sword',
        item1: { id: 'mace' },
        item2: { id: 'shield' },
        item3: { id: 'helmet' },
        skill: { id: 'holy_smite' }
    };

    const tier = Math.min(5, Math.floor(levelIndex / 2) + 1);
    const availableMaterials = materialTiers[tier] || materialTiers[1];
    const material1 = currentDrops.material1?.id || availableMaterials[0];
    const material2 = currentDrops.material2?.id || (availableMaterials[1] || availableMaterials[0]);

    // 🟢 ปรับสูตรให้จำนวนดรอปพุ่งสูงขึ้นตามเลเวลและความยาก
    const minMat1 = 15 + (levelIndex * 5);
    const maxMat1 = 30 + (levelIndex * 8);

    const minMat2 = 5 + (levelIndex * 2);
    const maxMat2 = 12 + (levelIndex * 4);

    const legendaryChance = Number((Math.min(0.04, 0.005 + levelIndex * 0.0025)).toFixed(4));
    const epicChance = Number((Math.min(0.10, 0.015 + levelIndex * 0.0065)).toFixed(4));
    const rareChance = Number((Math.min(0.30, 0.050 + levelIndex * 0.0200)).toFixed(4));
    const commonChance = Number((Math.max(0.30, 0.750 - levelIndex * 0.0350)).toFixed(4));

    return {
        id: bossId,
        level,
        name: bossName,
        element,
        race,
        zone,
        weakness: currentDrops.weakness,
        stats,
        dropTable: [
            { itemId: currentDrops.item1?.id || '', type: 'item', dropChance: commonChance, fixedRarity: 'Common' },
            { itemId: currentDrops.item1?.id || '', type: 'item', dropChance: rareChance, fixedRarity: 'Rare' },
            { itemId: currentDrops.item1?.id || '', type: 'item', dropChance: epicChance, fixedRarity: 'Epic' },
            { itemId: currentDrops.item1?.id || '', type: 'item', dropChance: legendaryChance, fixedRarity: 'Legendary' },

            { itemId: currentDrops.item2?.id || '', type: 'item', dropChance: commonChance, fixedRarity: 'Common' },
            { itemId: currentDrops.item2?.id || '', type: 'item', dropChance: rareChance, fixedRarity: 'Rare' },
            { itemId: currentDrops.item2?.id || '', type: 'item', dropChance: epicChance, fixedRarity: 'Epic' },
            { itemId: currentDrops.item2?.id || '', type: 'item', dropChance: legendaryChance, fixedRarity: 'Legendary' },

            ...(currentDrops.item3 ? [
                { itemId: currentDrops.item3.id, type: 'item', dropChance: commonChance, fixedRarity: 'Common' },
                { itemId: currentDrops.item3.id, type: 'item', dropChance: rareChance, fixedRarity: 'Rare' },
                { itemId: currentDrops.item3.id, type: 'item', dropChance: epicChance, fixedRarity: 'Epic' },
                { itemId: currentDrops.item3.id, type: 'item', dropChance: legendaryChance, fixedRarity: 'Legendary' },
            ] : []),

            { itemId: currentDrops.skill.id, type: 'skill', dropChance: commonChance, fixedRarity: 'Common', statRanges: { effectPower: { min: 20 + levelIndex * 2, max: 30 + levelIndex * 3 } } },
            { itemId: currentDrops.skill.id, type: 'skill', dropChance: rareChance, fixedRarity: 'Rare', statRanges: { effectPower: { min: 30 + levelIndex * 2, max: 40 + levelIndex * 4 } } },
            { itemId: currentDrops.skill.id, type: 'skill', dropChance: epicChance, fixedRarity: 'Epic', statRanges: { effectPower: { min: 40 + levelIndex * 3, max: 55 + levelIndex * 5 } } },
            { itemId: currentDrops.skill.id, type: 'skill', dropChance: legendaryChance, fixedRarity: 'Legendary', statRanges: { effectPower: { min: 60 + levelIndex * 4, max: 80 + levelIndex * 6 } } },

            {
                itemId: material1,
                type: 'material',
                dropChance: 0.75,
                amountRange: { min: minMat1, max: maxMat1 } // บอสตัวแรก (เวล 50, levelIndex=0) จะดรอปประมาณ x15 - x30 ชิ้น
            },
            {
                itemId: material2,
                type: 'material',
                dropChance: 0.20,
                amountRange: { min: minMat2, max: maxMat2 } // บอสตัวแรก (เวล 50, levelIndex=0) จะดรอปประมาณ x5 - x12 ชิ้น
            },
        ],
        imagePath: randomImage
    } as unknown as Boss;
};

export const BOSS_LIBRARY: Boss[] = (() => {
    const bosses: Boss[] = [];
    let bossIndex = 0;

    for (const archetype of bossArchetypes) {
        for (let levelIndex = 0; levelIndex < 12; levelIndex++) {
            bosses.push(generateBoss(bossIndex, archetype, levelIndex));
            bossIndex++;
        }
    }

    return bosses;
})();