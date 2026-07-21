import { generateRandomItem } from './itemGenerator';

/**
 * จำลองการสุ่มไอเทมจำนวนมาก แล้วสรุปค่า stat แต่ละตัวแยกตาม rarity
 * ใช้เช็คว่าหลังแก้ baseStatsSet แล้ว ไม่มี stat ไหนบวมผิดปกติ (max หลุดกรอบ)
 *
 * วิธีเรียกใช้ใน console:
 *   simulateItemStats(2000)                       // สุ่มทุก slot, ทุก rarity
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
        `\nitemLevel = ${itemLevel}`
    );

    console.log('--- การกระจายตัวของ Rarity ในกลุ่มที่สุ่มได้ ---');
    console.table(rarityCount);

    // เรียง rarity ตามลำดับ Common → Legendary ให้อ่านง่าย
    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
    const sortedRarities = Object.keys(statTotals).sort(
        (a, b) => rarityOrder.indexOf(a) - rarityOrder.indexOf(b)
    );

    for (const rarity of sortedRarities) {
        console.log(`--- Stats สำหรับ Rarity: ${rarity} ---`);
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
        '%cเช็คด่วน: ดูคอลัมน์ max เทียบกับ avg ถ้า max สูงกว่า avg หลายเท่าตัวแบบผิดสังเกต (โดยเฉพาะ atk/def/hit/str ของ weapon) ให้สงสัยว่ายังมี double-dip หลงเหลืออยู่',
        'color: orange; font-weight: bold;'
    );
};