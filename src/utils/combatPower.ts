import type { Stats } from '../types/game';

/**
 * Combat Power Weights Configuration
 * Adjust these values to balance the CP calculation formula
 */
export const CP_WEIGHTS = {
    // Offensive stats (highest priority)
    atk: 2.0,
    critRate: 1.5,
    critDmg: 1.2,
    hit: 1.0,
    skillPower: 1.8,

    // Defensive stats (medium priority)
    def: 1.5,
    maxHp: 0.5, // HP is divided by a factor since it's a large number
    res: 1.2,
    mRes: 1.2,
    flee: 1.0,

    // Core attributes (lower priority since they convert to other stats)
    str: 0.3,
    agi: 0.3,
    vit: 0.3,
    int: 0.3,
    dex: 0.3,
    luk: 0.3,
} as const;

/**
 * Calculate Combat Power from final/total stats
 * Returns a single overall score representing player strength
 */
export const calculateCombatPower = (stats: Stats): number => {
    let totalCP = 0;

    // Calculate weighted contribution from each stat
    Object.entries(stats).forEach(([key, value]) => {
        const weight = CP_WEIGHTS[key as keyof typeof CP_WEIGHTS];
        if (weight && value > 0) {
            // Special handling for maxHp since it's a large number
            const adjustedValue = key === 'maxHp' ? value / 100 : value;
            totalCP += adjustedValue * weight;
        }
    });

    // Apply a scaling factor to keep CP numbers reasonable
    const scalingFactor = 0.1;
    return Math.floor(totalCP * scalingFactor);
};

/**
 * Get CP rating/rank based on Combat Power score
 */
export const getCPRating = (cp: number): { rank: string; color: string; description: string } => {
    if (cp < 100) {
        return { rank: 'F', color: 'text-slate-400', description: 'Novice' };
    } else if (cp < 250) {
        return { rank: 'D', color: 'text-emerald-400', description: 'Apprentice' };
    } else if (cp < 500) {
        return { rank: 'C', color: 'text-blue-400', description: 'Adept' };
    } else if (cp < 1000) {
        return { rank: 'B', color: 'text-purple-400', description: 'Expert' };
    } else if (cp < 2000) {
        // อัปเกรดจาก A เดิม (ขยับช่วง)
        return { rank: 'A', color: 'text-amber-400', description: 'Master' };
    } else if (cp < 4000) {
        return { rank: 'S', color: 'text-rose-400', description: 'Legendary' };
    } else if (cp < 8000) {
        // แรงค์ SS ใหม่
        return { rank: 'SS', color: 'text-orange-400', description: 'Mythic' };
    } else {
        // แรงค์ SSS ใหม่ (สำหรับผู้เล่นที่มีพลังรบ 8,000 ขึ้นไป)
        return { rank: 'SSS', color: 'text-yellow-300 shadow-yellow-500/50 animate-pulse', description: 'Transcendent' };
    }
};

/**
 * Get CP breakdown by stat category for detailed view
 */
export const getCPBreakdown = (stats: Stats): {
    offensive: number;
    defensive: number;
    core: number;
} => {
    let offensive = 0;
    let defensive = 0;
    let core = 0;

    const offensiveStats: (keyof Stats)[] = ['atk', 'critRate', 'critDmg', 'hit', 'skillPower'];
    const defensiveStats: (keyof Stats)[] = ['def', 'maxHp', 'res', 'mRes', 'flee'];
    const coreStats: (keyof Stats)[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];

    offensiveStats.forEach(key => {
        const weight = CP_WEIGHTS[key];
        const value = stats[key] || 0;
        const adjustedValue = key === 'maxHp' ? value / 100 : value;
        if (weight && value > 0) {
            offensive += adjustedValue * weight;
        }
    });

    defensiveStats.forEach(key => {
        const weight = CP_WEIGHTS[key];
        const value = stats[key] || 0;
        const adjustedValue = key === 'maxHp' ? value / 100 : value;
        if (weight && value > 0) {
            defensive += adjustedValue * weight;
        }
    });

    coreStats.forEach(key => {
        const weight = CP_WEIGHTS[key];
        const value = stats[key] || 0;
        if (weight && value > 0) {
            core += value * weight;
        }
    });

    const scalingFactor = 0.1;
    return {
        offensive: Math.floor(offensive * scalingFactor),
        defensive: Math.floor(defensive * scalingFactor),
        core: Math.floor(core * scalingFactor),
    };
};
