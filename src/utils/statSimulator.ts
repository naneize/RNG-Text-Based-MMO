import { generateRandomItem } from './itemGenerator';
import { BOSS_LIBRARY } from '../data/bossLibrary';       // ✅ เพิ่ม
import { calculateBossDrops } from './dropLogic';          // ✅ เพิ่ม

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