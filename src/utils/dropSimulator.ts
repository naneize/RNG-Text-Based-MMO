import { rarityConfig } from './itemGenerator';

(window as any).simulateDrops = (iterations: number) => {
    const results: Record<string, number> = {};
    const totalWeight = rarityConfig.reduce((sum, r) => sum + r.weight, 0);

    for (let i = 0; i < iterations; i++) {
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        for (const rarity of rarityConfig) {
            currentWeight += rarity.weight;
            if (random < currentWeight) {
                results[rarity.name] = (results[rarity.name] || 0) + 1;
                break;
            }
        }
    }

    console.log(`--- ผลการจำลองการสุ่ม ${iterations} ครั้ง ---`);
    console.table(results);
};