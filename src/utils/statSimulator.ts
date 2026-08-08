import { generateRandomItem } from './itemGenerator';
import { BOSS_LIBRARY } from '../data/bossLibrary';       // ✅ เพิ่ม
import { calculateBossDrops } from './dropLogic';          // ✅ เพิ่ม
import { PITY_CONFIG } from '../types/game';
import { getEffectiveStats, calculateDamage } from './combat';

/**
 * จำลองการสุ่มไอเทมจำนวนมาก แล้วสรุปค่า stat และเลเวลแต่ละตัวแยกตาม rarity
 * 
 * วิธีเรียกใช้ใน console:
 *   simulateItemStats(2000)                        // สุ่มทุก slot, ทุก rarity
 *   simulateItemStats(2000, 'weapon')              // เจาะเฉพาะ slot 'weapon'
 *   simulateItemStats(2000, 'weapon', 'Rare')      // เจาะเฉพาะ slot + rarity
 *   simulateItemStats(2000, undefined, undefined, 20) // กำหนด itemLevel เอง (default 1)
 */

(window as any).simulateItemStats = (
    iterations: number,
    filterSlot?: string,
    filterRarity?: string,
    itemLevel: number = 1
) => {
    type Agg = { sum: number; count: number; min: number; max: number };
    // rarity -> statKey -> aggregate
    const statTotals: Record<string, Record<string, Agg>> = {};
    // rarity -> จำนวนชิ้นที่เจอ (ไว้เทียบ % การกระจาย)
    const rarityCount: Record<string, number> = {};
    // เพิ่มตัวแปรเก็บข้อมูลเช็คเลเวลไอเทมที่ได้รับจริง
    const rarityLevelInfo: Record<string, { minLevel: number; maxLevel: number; sampleItemLevels: number[] }> = {};

    let matched = 0;
    let skipped = 0; // skill / material / slot ไม่ตรง filter

    for (let i = 0; i < iterations; i++) {
        const item: any = generateRandomItem(filterRarity, itemLevel);

        // ข้าม skill กับ material เพราะไม่มี stats แบบ equipment
        if (item.type !== 'equipment') {
            skipped++;
            continue;
        }
        if (filterSlot && item.slot !== filterSlot) {
            skipped++;
            continue;
        }

        matched++;
        const rarity = item.rarity as string;
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1;

        // บันทึกข้อมูลเลเวลของไอเทมชิ้นนี้
        const currentItemLevel = item.level ?? itemLevel; // ปรับให้ตรงกับ key เลเวลในโครงสร้าง Item ของคุณ (เช่น item.level หรือ item.itemLevel)
        if (!rarityLevelInfo[rarity]) {
            rarityLevelInfo[rarity] = { minLevel: currentItemLevel, maxLevel: currentItemLevel, sampleItemLevels: [] };
        }
        rarityLevelInfo[rarity].minLevel = Math.min(rarityLevelInfo[rarity].minLevel, currentItemLevel);
        rarityLevelInfo[rarity].maxLevel = Math.max(rarityLevelInfo[rarity].maxLevel, currentItemLevel);
        if (rarityLevelInfo[rarity].sampleItemLevels.length < 5) {
            rarityLevelInfo[rarity].sampleItemLevels.push(currentItemLevel); // เก็บตัวอย่างเลเวลไว้ดูเล่นๆ สัก 5 ค่า
        }

        if (!statTotals[rarity]) statTotals[rarity] = {};

        for (const [statKey, rawValue] of Object.entries(item.stats || {})) {
            const value = rawValue as number;
            if (!value) continue; // ข้าม stat ที่เป็น 0 / undefined

            if (!statTotals[rarity][statKey]) {
                statTotals[rarity][statKey] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
            }
            const agg = statTotals[rarity][statKey];
            agg.sum += value;
            agg.count += 1;
            agg.min = Math.min(agg.min, value);
            agg.max = Math.max(agg.max, value);
        }
    }

    console.log(
        `--- จำลองการสุ่มไอเทม ${iterations} ครั้ง ---`,
        `\nตรงเงื่อนไข: ${matched} ชิ้น | ข้าม (skill/material/slot ไม่ตรง): ${skipped} ชิ้น`,
        filterSlot ? `\nfilter slot = "${filterSlot}"` : '',
        filterRarity ? `\nfilter rarity = "${filterRarity}"` : '',
        `\ninput itemLevel = ${itemLevel}`
    );

    console.log('--- การกระจายตัวของ Rarity ในกลุ่มที่สุ่มได้ ---');
    console.table(rarityCount);

    // เรียง rarity ตามลำดับ Common → Legendary ให้อ่านง่าย
    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
    const sortedRarities = Object.keys(statTotals).sort(
        (a, b) => rarityOrder.indexOf(a) - rarityOrder.indexOf(b)
    );

    for (const rarity of sortedRarities) {
        console.log(`--- Stats สำหรับ Rarity: ${rarity} (ช่วง Item Level ที่สุ่มได้: ${rarityLevelInfo[rarity].minLevel} - ${rarityLevelInfo[rarity].maxLevel}) ---`);

        const tableData: Record<string, { avg: string; min: number; max: number; sampleCount: number }> = {};

        for (const [statKey, agg] of Object.entries(statTotals[rarity])) {
            tableData[statKey] = {
                avg: (agg.sum / agg.count).toFixed(1),
                min: agg.min,
                max: agg.max,
                sampleCount: agg.count
            };
        }
        console.table(tableData);
    }

    console.log(
        '%cเช็คด่วน: ดูคอลัมน์ max เทียบกับ avg ถ้า max สูงกว่า avg หลายเท่าตัวแบบผิดสังเกต (โดยเฉพาะ atk/def/hit/str ของ weapon) ให้สงสัยว่ายังมี double-dip หลุดเหลืออยู่',
        'color: orange; font-weight: bold;'
    );
};

/**
 * จำลองการฆ่าบอสจำนวนมาก แล้วสรุปว่าได้ item/skill/material อะไรบ้าง เท่าไหร่ % และ item level ที่สุ่มได้จริงอยู่ช่วงไหน
 *
 * วิธีเรียกใช้ใน console:
 *   listBossIds()                       // ดูรายชื่อ + id ของบอสทั้งหมดก่อน เพื่อเอา id ไปใช้
 *   simulateBossDrops('b-001', 5000)    // จำลองฆ่าบอส id 'b-001' จำนวน 5000 ครั้ง
 */
(window as any).simulateBossDrops = (bossId: string, iterations: number = 2000) => {
    const boss = BOSS_LIBRARY.find(b => b.id === bossId);
    if (!boss) {
        console.warn(`ไม่พบบอส id="${bossId}" — เช็ครายชื่อทั้งหมดด้วย listBossIds()`);
        return;
    }

    // key = "itemId | rarity" เพื่อแยกสถิติแต่ละ rarity tier ของ item/skill ตัวเดียวกัน
    const itemStats: Record<string, {
        count: number;
        minLevel: number;
        maxLevel: number;
        levelSum: number;
    }> = {};

    const materialStats: Record<string, {
        count: number;
        totalAmount: number;
        minAmount: number;
        maxAmount: number;
    }> = {};

    for (let i = 0; i < iterations; i++) {
        const rewards = calculateBossDrops(boss, boss.level);

        rewards.forEach(reward => {
            if (reward.type === 'material') {
                if (!materialStats[reward.id]) {
                    materialStats[reward.id] = { count: 0, totalAmount: 0, minAmount: Infinity, maxAmount: -Infinity };
                }
                const stat = materialStats[reward.id];
                const amount = reward.amount || 0;
                stat.count += 1;
                stat.totalAmount += amount;
                stat.minAmount = Math.min(stat.minAmount, amount);
                stat.maxAmount = Math.max(stat.maxAmount, amount);
            }
            else if (reward.type === 'item' && reward.itemData) {
                const item = reward.itemData as any;
                const key = `${reward.id} | ${item.rarity}`;
                if (!itemStats[key]) {
                    itemStats[key] = { count: 0, minLevel: Infinity, maxLevel: -Infinity, levelSum: 0 };
                }
                const stat = itemStats[key];
                const lvl = item.itemLevel ?? 0;
                stat.count += 1;
                stat.minLevel = Math.min(stat.minLevel, lvl);
                stat.maxLevel = Math.max(stat.maxLevel, lvl);
                stat.levelSum += lvl;
            }
        });
    }

    console.log(`--- จำลองฆ่าบอส "${boss.name}" (id=${boss.id}, level=${boss.level}) จำนวน ${iterations} ครั้ง ---`);

    console.log('--- Item/Skill ที่ดรอป (แยกตาม rarity tier + ช่วง item level ที่สุ่มได้จริง) ---');
    const itemTable: Record<string, any> = {};
    Object.entries(itemStats).forEach(([key, stat]) => {
        itemTable[key] = {
            'จำนวนครั้งที่ได้': stat.count,
            '% ต่อการฆ่า': ((stat.count / iterations) * 100).toFixed(2) + '%',
            'level ต่ำสุด': stat.minLevel,
            'level สูงสุด': stat.maxLevel,
            'level เฉลี่ย': (stat.levelSum / stat.count).toFixed(1),
        };
    });
    console.table(itemTable);

    console.log('--- Material ที่ดรอป ---');
    const matTable: Record<string, any> = {};
    Object.entries(materialStats).forEach(([id, stat]) => {
        matTable[id] = {
            'จำนวนครั้งที่ได้': stat.count,
            '% ต่อการฆ่า': ((stat.count / iterations) * 100).toFixed(2) + '%',
            'จำนวนขั้นต่ำ/ครั้ง': stat.minAmount,
            'จำนวนสูงสุด/ครั้ง': stat.maxAmount,
            'จำนวนเฉลี่ย/ครั้ง': (stat.totalAmount / stat.count).toFixed(1),
            'รวมทั้งหมดจากทุกครั้ง': stat.totalAmount,
        };
    });
    console.table(matTable);

    console.log(
        '%cเช็คด่วน: บวก % ของทุก rarity tier ของ item เดียวกัน (เช่น item1 | Common + item1 | Rare + ...) ต้องไม่เกิน 100% ถ้าเกินแปลว่า multi-rarity bug กลับมาอีก',
        'color: orange; font-weight: bold;'
    );
};

/**
 * ดูรายชื่อ + id ของบอสทั้งหมด เอาไว้หา id ไปใช้กับ simulateBossDrops()
 */
(window as any).listBossIds = () => {
    console.table(BOSS_LIBRARY.map(b => ({ id: b.id, name: b.name, level: b.level, zone: b.zone })));
};

/**
 * จำลอง "roll จนถึง item level cap ที่กำหนด" แล้วเทียบว่าสู้บอสที่เลือกไหวไหม
 * ใช้ pity system + สูตร maxLevel เดียวกับของจริงเป๊ะ (executeSingleRoll ใน useCharacterDashboard.ts)
 *
 * วิธีเรียกใช้ใน console:
 *   simulateRollVsBoss('b-001', 275)              // roll cap = 275, ทดสอบกับบอส b-001
 *   simulateRollVsBoss('b-001', 275, 50)           // จำลอง 50 รอบ (เพิ่มความแม่นยำของค่าเฉลี่ย)
 */
(window as any).simulateRollVsBoss = (
    bossId: string = 'b-001',
    rollCap: number = 275,
    trials: number = 30
) => {
    const boss = BOSS_LIBRARY.find(b => b.id === bossId);
    if (!boss) {
        console.warn(`ไม่พบบอส id="${bossId}" — เช็ครายชื่อด้วย listBossIds()`);
        return;
    }

    const scoreItem = (item: any): number => {
        if (!item.stats) return 0;
        return Object.values(item.stats).reduce((sum: any, v: any) => sum + (v || 0), 0) as number;
    };

    // ✅ จำลองการ roll จนกว่า item level จะแตะ cap ที่กำหนด (ใช้สูตร pity เดียวกับของจริงเป๊ะ)
    const simulateRollSession = () => {
        let totalOpens = 0;
        let epicPity = 0;
        let legendPity = 0;
        const equipped: Record<string, any> = {};
        const maxRolls = 800; // เพดานกันลูปไม่รู้จบ

        for (let i = 0; i < maxRolls; i++) {
            totalOpens++;

            const rawMaxLevel = totalOpens < 1000
                ? 1 + Math.floor(totalOpens / 10) * 5
                : 500 + Math.floor((totalOpens - 1000) / 100) * 5;
            const maxLevel = Math.min(rawMaxLevel, rollCap);
            const minLevel = Math.max(1, Math.floor(maxLevel * 0.7));
            const randomLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

            let newItem: any;
            if (legendPity >= PITY_CONFIG.LEGEND) {
                newItem = generateRandomItem('legendary', randomLevel);
                legendPity = 0; epicPity = 0;
            } else if (epicPity >= PITY_CONFIG.EPIC) {
                newItem = generateRandomItem('epic', randomLevel);
                epicPity = 0; legendPity++;
            } else {
                newItem = generateRandomItem(undefined, randomLevel);
                if (newItem.rarity === 'Legendary') { legendPity = 0; epicPity = 0; }
                else if (newItem.rarity === 'Epic') { epicPity = 0; legendPity++; }
                else {
                    if (legendPity < PITY_CONFIG.LEGEND) legendPity++;
                    if (epicPity < PITY_CONFIG.EPIC) epicPity++;
                }
            }

            if (newItem.type === 'equipment') {
                const slot = newItem.slot;
                if (!equipped[slot] || scoreItem(newItem) > scoreItem(equipped[slot])) {
                    equipped[slot] = newItem;
                }
            }

            // หยุดเมื่อ level คงที่ที่ cap แล้ว และ roll เก็บของมาพอสมควร (กันของขาด slot)
            if (maxLevel >= rollCap && totalOpens >= 300) break;
        }

        return { totalOpens, equipped };
    };

    // รวม stat จากอุปกรณ์ที่ equip ได้ทั้งหมด (ไม่รวม player baseStats เพราะเล็กมากเทียบกับ gear ที่ itemLevel หลักร้อย)
    const buildPlayerStats = (equipped: Record<string, any>) => {
        const rawTotal: any = {
            str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0,
            critRate: 0, critDmg: 0, atk: 0, def: 0, maxHp: 0, hit: 0, flee: 0, res: 0, mRes: 0
        };
        Object.values(equipped).forEach((item: any) => {
            if (!item?.stats) return;
            Object.entries(item.stats).forEach(([k, v]: [string, any]) => {
                rawTotal[k] = (rawTotal[k] || 0) + (v || 0);
            });
        });
        return getEffectiveStats(rawTotal);
    };

    const bossEffectiveStats = getEffectiveStats(boss.stats);

    let totalHitsToKillBoss = 0;
    let totalHitsPlayerSurvives = 0;
    let sampleTotalOpens = 0;
    let sampleEquippedCount = 0;

    for (let t = 0; t < trials; t++) {
        const { totalOpens, equipped } = simulateRollSession();
        const playerStats = buildPlayerStats(equipped);

        sampleTotalOpens += totalOpens;
        sampleEquippedCount += Object.keys(equipped).length;

        // จำลองตีบอสจนตาย (นับจำนวนครั้ง ไม่สนใจ miss เพื่อความเร็วในการซิม)
        let bossHp = bossEffectiveStats.maxHp;
        let hits = 0;
        while (bossHp > 0 && hits < 500) {
            const result = calculateDamage(playerStats, bossEffectiveStats);
            if (!result.isMiss) bossHp -= result.damage;
            hits++;
        }
        totalHitsToKillBoss += hits;

        // จำลองผู้เล่นโดนบอสตีจนตาย (นับว่าทนได้กี่ครั้ง)
        let playerHp = playerStats.maxHp || 1;
        let survivedHits = 0;
        while (playerHp > 0 && survivedHits < 500) {
            const result = calculateDamage(bossEffectiveStats, playerStats);
            if (!result.isMiss) playerHp -= result.damage;
            survivedHits++;
        }
        totalHitsPlayerSurvives += survivedHits;
    }

    const avgHitsToKill = Math.round(totalHitsToKillBoss / trials);
    const avgHitsSurvive = Math.round(totalHitsPlayerSurvives / trials);
    const avgTotalOpens = Math.round(sampleTotalOpens / trials);
    const avgSlotsFilled = (sampleEquippedCount / trials).toFixed(1);

    console.log(`--- จำลอง Roll (cap=${rollCap}) vs บอส "${boss.name}" (level ${boss.level}) — ${trials} รอบ ---`);
    console.table({
        'จำนวน Roll เฉลี่ยที่ใช้ถึง cap': avgTotalOpens,
        'จำนวน slot ที่ equip ได้เฉลี่ย': `${avgSlotsFilled} / 10`,
        'ตีบอสตายใช้กี่ครั้ง (เฉลี่ย)': avgHitsToKill,
        'ผู้เล่นทนโดนตีได้กี่ครั้ง (เฉลี่ย)': avgHitsSurvive,
        'สรุป': avgHitsSurvive > avgHitsToKill * 1.5
            ? '✅ ไหวสบาย (ทนได้มากกว่าที่ต้องใช้ตีบอสตายเยอะ)'
            : avgHitsSurvive > avgHitsToKill
                ? '⚠️ พอไหวแต่ตึงมือ (ทนได้พอๆ กับจำนวนครั้งที่ต้องตี)'
                : '❌ ไม่น่าไหว (ตายก่อนบอสตาย โดยเฉลี่ย)'
    });
};