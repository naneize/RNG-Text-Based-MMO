// synergy.ts
import type { Stats } from "../types/game";

const SYNERGY_CONFIG = [
    { label: 'CRIT RATE', bonus: 1, divisor: 20, statKey: 'luk' as keyof Stats, targetKey: 'critRate' as keyof Stats, isPercent: true },
    { label: 'CRIT DMG', bonus: 1, divisor: 20, statKey: 'luk' as keyof Stats, targetKey: 'critDmg' as keyof Stats },
];

export const calculateSynergyStats = (baseStats: Stats, equippedSkill?: any): Stats => {
    const stats = { ...baseStats };

    SYNERGY_CONFIG.forEach(cfg => {
        const value = baseStats[cfg.statKey] || 0;
        const target = cfg.targetKey;
        stats[target] = (stats[target] || 0) + Math.floor(Math.floor(value / cfg.divisor) * cfg.bonus);
    });

    stats.skillPower = equippedSkill?.effectPower || 0;

    return stats;
};

export const getSynergyInfo = () => SYNERGY_CONFIG.map(c => ({
    label: c.label,
    bonus: `+${c.bonus}${c.isPercent ? '%' : ''}`,
    stat: `${c.divisor} ${(c.statKey as string).toUpperCase()}`
}));