import type { Item, CollectionRecord } from '../../types/game';

export const updateCollection = (
    newItem: Item,
    currentCollection: CollectionRecord[]
): CollectionRecord[] => {




    return currentCollection.map(record => {
        if (record.itemId === newItem.id) {
            // 1. เปรียบเทียบ Stats ปกติ
            const newStats = { ...record.bestStats };
            Object.entries(newItem.stats).forEach(([key, value]) => {
                const statKey = key as keyof typeof newStats;
                if (value !== undefined && ((newStats[statKey] as number) || 0) < (value as number)) {
                    newStats[statKey] = value;
                }
            });

            // 2. เก็บค่า Element Bonus ที่สูงที่สุด (เปรียบเทียบจาก value)
            let newElementBonus = record.bestElementBonus;
            if (newItem.elementBonus) {
                if (!newElementBonus || newItem.elementBonus.value > newElementBonus.value) {
                    newElementBonus = newItem.elementBonus;
                }
            }

            // 3. เก็บค่า Race Bonus ที่สูงที่สุด (เปรียบเทียบจาก value)
            let newRaceBonus = record.bestRaceBonus;
            if (newItem.raceBonus) {
                if (!newRaceBonus || newItem.raceBonus.value > newRaceBonus.value) {
                    newRaceBonus = newItem.raceBonus;
                }
            }

            return {
                ...record,
                isUnlocked: true,
                bestStats: newStats,
                bestElementBonus: newElementBonus,
                bestRaceBonus: newRaceBonus,
                foundCount: record.foundCount + 1
            };
        }
        return record;
    });
};