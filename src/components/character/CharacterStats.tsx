import { useState } from 'react';
import type { Player } from '../../types/game';
import { STAT_CAPS } from '../../utils/statCalculator';
import { StatLimitModal } from '../Modals/StatLimitModal';
import type { Stats, Item } from '../../types/game';
import { getActiveSetBonuses, describeTierScaling } from '../../data/setBonuses';

interface CharacterStatsProps {
    player?: Player;
    finalStats: Stats;
    statBreakdown?: Record<string, { label: string; value: number }[]>;
    equippedItems?: Record<string, Item | null>;
    setShowBonusModal?: (show: boolean) => void;
    hideExtraButtons?: boolean;
    hideBreakdown?: boolean;
}

const RES_WEIGHT = 0.3;

const calculateReductionPercent = (key: string, value: number, stats: Stats): number | null => {
    if (key === 'def') {
        const baseAtk = Math.max(1000, stats.atk || 3500);
        const totalMitigation = value + ((stats.res || 0) * RES_WEIGHT);
        const reduction = totalMitigation / (baseAtk + totalMitigation);
        return Math.min(95, Math.round(reduction * 100));
    }

    if (key === 'mRes') {
        const basePower = Math.max(1000, stats.skillPower || 3500);
        const totalMitigation = value + ((stats.res || 0) * RES_WEIGHT);
        const reduction = totalMitigation / (basePower + totalMitigation);
        return Math.min(95, Math.round(reduction * 100));
    }

    if (key === 'res') {
        const baseAtk = Math.max(1000, stats.atk || 3500);
        const totalMitigation = value * RES_WEIGHT;
        const reduction = totalMitigation / (baseAtk + totalMitigation);
        return Math.min(95, Math.round(reduction * 100));
    }

    if (key === 'flee') {
        const baseEnemyHit = 1800;
        const fleeWeight = 0.5;
        let incomingHitChance = 95 * (baseEnemyHit / (baseEnemyHit + value * fleeWeight));
        incomingHitChance = Math.max(3, Math.min(97, incomingHitChance));
        const dodgeChance = 100 - incomingHitChance;
        return Math.max(3, Math.min(97, Math.round(dodgeChance)));
    }

    if (key === 'hit') {
        const baseEnemyFlee = 800;
        const fleeWeight = 0.5;
        const hitBase = Math.max(1, value);
        let hitChance = 95 * (hitBase / (hitBase + baseEnemyFlee * fleeWeight));
        hitChance = Math.max(3, Math.min(97, hitChance));
        return Math.round(hitChance);
    }

    return null;
};

const getCritReductionPercent = (mResValue: number): number => {
    return Math.min(40, Math.round((mResValue / 5000) * 100));
};

export const CharacterStats = ({ player, finalStats, statBreakdown = {}, setShowBonusModal, hideExtraButtons = false, hideBreakdown = false }: CharacterStatsProps) => {
    const [showLimitModal, setShowLimitModal] = useState(false);
    const activeSets = player ? getActiveSetBonuses(player.equippedItems) : [];

    return (
        <div className="space-y-4 text-amber-100">
            {!hideExtraButtons && (
                <>
                    <div className="flex gap-2 ml-1">
                        <button
                            onClick={() => setShowBonusModal?.(true)}
                            className="bg-stone-900 hover:bg-stone-800 text-[10px] text-amber-300 px-3 py-1.5 rounded-xl border border-amber-900/80 font-bold transition-all shadow-sm cursor-pointer"
                        >
                            BONUS DETAILS
                        </button>

                        <button
                            onClick={() => setShowLimitModal(true)}
                            className="bg-stone-900 hover:bg-stone-800 text-[10px] text-amber-400 px-3 py-1.5 rounded-xl border border-amber-950 font-bold transition-all shadow-sm cursor-pointer"
                        >
                            STAT LIMITS
                        </button>
                    </div>

                    {showLimitModal && (
                        <StatLimitModal onClose={() => setShowLimitModal(false)} />
                    )}
                </>
            )}

            {/* แสดง Set Bonus ที่กำลังทำงานอยู่ (เฉพาะ set ที่สวมอย่างน้อย 1 ชิ้น) */}
            {activeSets.length > 0 && (
                <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-800/50 space-y-2 shadow-inner">
                    {activeSets.map(({ set, equippedCount, avgItemLevel, activeTiers }) => (
                        <div key={set.id}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">
                                    {set.name}
                                </span>
                                <span className="text-[10px] font-mono text-amber-200/80">
                                    {equippedCount}/{set.itemIds.length} pieces · Avg Lv {avgItemLevel}
                                </span>
                            </div>
                            {set.tiers.map((tier) => {
                                const activeTier = activeTiers.find((t) => t.requiredCount === tier.requiredCount);
                                return (
                                    <div
                                        key={tier.requiredCount}
                                        className={`text-[10px] font-semibold ${activeTier ? 'text-amber-300' : 'text-stone-500'}`}
                                    >
                                        {activeTier ? '◆' : '◇'} {activeTier ? activeTier.label : describeTierScaling(tier)}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* กรอบสเตตัสหลัก ธีม Dark Fantasy */}
            <div className="relative bg-stone-950/60 p-3.5 rounded-xl border border-amber-950/80 shadow-inner">
                <div className="flex flex-wrap gap-2">
                    {Object.entries(finalStats)
                        .filter(([key]) => !['effectPower'].includes(key))
                        .sort(([a], [b]) => {
                            const order: Record<string, number> = {
                                'maxHp': 1, 'atk': 2, 'def': 3, 'hit': 4, 'flee': 5,
                                'critRate': 6, 'critDmg': 7,
                                'str': 8, 'vit': 9, 'agi': 10, 'dex': 11, 'int': 12, 'luk': 13
                            };
                            return (order[a] || 99) - (order[b] || 99);
                        })
                        .map(([key, value]) => {
                            const cap = STAT_CAPS[key as keyof typeof STAT_CAPS];
                            const isCapped = cap !== undefined && value >= cap;
                            const reductionPct = calculateReductionPercent(key, value, finalStats);

                            const baseStatValue = player?.baseStats?.[key as keyof typeof player.baseStats] || 0;
                            const textColor = isCapped
                                ? 'text-amber-400'
                                : (value > baseStatValue ? 'text-amber-200' : 'text-amber-100/90');

                            const sources = statBreakdown[key] || [];
                            const rawSum = sources.reduce((sum, src) => sum + src.value, 0);
                            const totalSum = isCapped ? rawSum : value;

                            return (
                                <div
                                    key={key}
                                    className="group relative flex justify-between items-center bg-stone-900/90 border border-amber-950/50 p-2 rounded-xl w-[calc(50%-4px)] cursor-pointer hover:border-amber-600/60 transition-colors shadow-sm"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="uppercase text-amber-500/80 text-[10px] font-bold tracking-wider truncate">
                                            {key}
                                        </span>
                                    </div>

                                    <span className={`font-mono text-xs font-bold ${isCapped ? 'text-amber-500' : textColor}`}>
                                        {isCapped ? (
                                            <span className="flex items-center gap-1">
                                                {Math.floor(cap)}
                                                <span className="text-[8px] text-amber-950 font-extrabold bg-amber-500 px-1 py-0.5 rounded shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                                                    CAPPED
                                                </span>
                                            </span>
                                        ) : (
                                            key === 'critRate' ? `${Math.floor(value)}%` : Math.floor(value)
                                        )}
                                    </span>

                                    {/* Breakdown Tooltip (ปรับตำแหน่งให้เด้งขึ้นด้านบนสวยงาม และแสดงผลตลอดเมื่อชี้โฮเวอร์) */}
                                    {!hideBreakdown && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 max-h-80 overflow-y-auto p-3 bg-stone-950 text-xs text-amber-100 rounded-xl shadow-2xl border border-amber-900 z-50 pointer-events-none backdrop-blur-md">
                                            <div className="font-bold mb-1.5 text-amber-200 border-b border-amber-950 pb-1 uppercase tracking-wider flex justify-between items-center">
                                                <span>{key} Breakdown</span>
                                            </div>

                                            {/* Tooltip สำหรับ DEF */}
                                            {key === 'def' && reductionPct !== null && (
                                                <div className="mb-2 p-2 bg-amber-950/30 border border-amber-900/50 rounded-lg text-[10px] text-amber-300 space-y-1">
                                                    <div className="font-semibold text-amber-200">Physical Damage Reduction</div>
                                                    <div>Reduces incoming physical attacks by ~<b className="text-white">{reductionPct}%</b></div>
                                                    <div className="text-[9px] text-amber-500/70 font-normal border-t border-amber-900/40 pt-1">
                                                        Combines DEF with RES to mitigate physical hits.
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tooltip สำหรับ mRes */}
                                            {key === 'mRes' && (
                                                <div className="mb-2 p-2 bg-amber-950/30 border border-amber-900/50 rounded-lg text-[10px] text-amber-300 space-y-1">
                                                    <div className="font-semibold text-amber-200">Magic & Critical Protection</div>
                                                    {reductionPct !== null && (
                                                        <div>Magic Damage Reduction: ~<b className="text-white">{reductionPct}%</b></div>
                                                    )}
                                                    <div className="text-amber-300">
                                                        Crit DMG Multiplier Reduced: -<b className="text-white">{getCritReductionPercent(value)}%</b>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tooltip สำหรับ RES */}
                                            {key === 'res' && reductionPct !== null && (
                                                <div className="mb-2 p-2 bg-amber-950/30 border border-amber-900/50 rounded-lg text-[10px] text-amber-300 space-y-1">
                                                    <div className="font-semibold text-amber-200">Global Bonus Armor</div>
                                                    <div>Adds extra armor layer against <b className="text-white">All Damage Types</b></div>
                                                    <div className="text-[9px] text-amber-500/70 font-normal border-t border-amber-900/40 pt-1">
                                                        Boosts total defense alongside DEF and mRES.
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tooltip สำหรับ FLEE */}
                                            {key === 'flee' && reductionPct !== null && (
                                                <div className="mb-2 p-2 bg-amber-950/30 border border-amber-900/50 rounded-lg text-[10px] text-amber-300 space-y-1">
                                                    <div className="font-semibold text-amber-200">Dodge Chance</div>
                                                    <div>Roughly <b className="text-white">{reductionPct}%</b> chance to avoid an incoming hit entirely</div>
                                                    <div className="text-[9px] text-amber-500/70 font-normal border-t border-amber-900/40 pt-1">
                                                        Chance-based avoidance against standard bosses.
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tooltip สำหรับ HIT */}
                                            {key === 'hit' && reductionPct !== null && (
                                                <div className="mb-2 p-2 bg-amber-950/30 border border-amber-900/50 rounded-lg text-[10px] text-amber-300 space-y-1">
                                                    <div className="font-semibold text-amber-200">Hit Rate</div>
                                                    <div>Roughly <b className="text-white">{reductionPct}%</b> chance to land hits successfully</div>
                                                    <div className="text-[9px] text-amber-500/70 font-normal border-t border-amber-900/40 pt-1">
                                                        Determines accuracy against enemy FLEE.
                                                    </div>
                                                </div>
                                            )}

                                            {/* Source List */}
                                            {sources.length > 0 ? (
                                                <div className="space-y-1">
                                                    {sources.map((src, idx) => (
                                                        <div key={idx} className="flex justify-between text-[11px]">
                                                            <span className="text-amber-200 truncate pr-2">• {src.label}</span>
                                                            <span className="font-mono text-amber-400">+{src.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-amber-500/60 italic">No extra sources (Base stats)</div>
                                            )}

                                            {/* Raw Total */}
                                            <div className="mt-2 pt-1.5 border-t border-amber-950 flex justify-between font-bold text-amber-300">
                                                <span>Raw Total</span>
                                                <span className="font-mono text-amber-400">
                                                    {key === 'critRate' ? `${Math.floor(totalSum)}%` : Math.floor(totalSum)}
                                                </span>
                                            </div>

                                            {/* Capped Warning */}
                                            {isCapped && cap !== undefined && (
                                                <div className="mt-1 flex justify-between text-[10px] text-amber-500 font-semibold">
                                                    "Capped At"
                                                    <span className="font-mono">{key === 'critRate' ? `${Math.floor(cap)}%` : Math.floor(cap)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};