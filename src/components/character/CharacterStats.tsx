import { useState } from 'react';
import type { Player } from '../../types/game';
import { STAT_CAPS } from '../../utils/statCalculator';
import { StatLimitModal } from '../Modals/StatLimitModal';
import type { Stats, Item } from '../../types/game';

interface CharacterStatsProps {
    player?: Player;
    finalStats: Stats;
    statBreakdown?: Record<string, { label: string; value: number }[]>;
    equippedItems?: Record<string, Item | null>;
    setShowBonusModal?: (show: boolean) => void;
    hideExtraButtons?: boolean;
    hideBreakdown?: boolean;
}

const RES_WEIGHT = 0.3; // ✅ ต้องตรงกับ RES_WEIGHT ใน utils/combat.ts เป๊ะ — ควร import จากที่เดียวกันจริงๆ ถ้าเป็นไปได้

const calculateReductionPercent = (key: string, value: number, stats: Stats): number | null => {
    if (key === 'def') {
        const baseAtk = Math.max(1000, stats.atk || 3500);
        // ✅ แก้ resWeight เป็น RES_WEIGHT จริง (0.3 ไม่ใช่ 1)
        const totalMitigation = value + ((stats.res || 0) * RES_WEIGHT);
        const reduction = totalMitigation / (baseAtk + totalMitigation);
        return Math.min(95, Math.round(reduction * 100));
    }

    if (key === 'mRes') {
        const basePower = Math.max(1000, stats.skillPower || 3500);
        // ✅ แก้เหมือนกัน
        const totalMitigation = value + ((stats.res || 0) * RES_WEIGHT);
        const reduction = totalMitigation / (basePower + totalMitigation);
        return Math.min(95, Math.round(reduction * 100));
    }

    if (key === 'res') {
        const baseAtk = Math.max(1000, stats.atk || 3500); // ✅ ใช้ atk จริงเหมือน def แทน hardcode 3500 ตายตัว (ให้สอดคล้องกัน)
        // ✅ คูณ RES_WEIGHT เข้าไปด้วย ไม่ใช่ ×1 เฉยๆ
        const totalMitigation = value * RES_WEIGHT;
        const reduction = totalMitigation / (baseAtk + totalMitigation);
        return Math.min(95, Math.round(reduction * 100));
    }

    // ✅ เพิ่มใหม่ — คำอธิบายของ flee
    if (key === 'flee') {
        const baseEnemyHit = 1800;
        const fleeWeight = 0.5;

        // 1. คำนวณ Hit Chance
        let incomingHitChance = 95 * (baseEnemyHit / (baseEnemyHit + value * fleeWeight));

        // 2. ล็อคช่วง 3% - 97% ให้ตรงกับสูตรต่อสู้จริงใน Combat Engine!
        incomingHitChance = Math.max(3, Math.min(97, incomingHitChance));

        // 3. คิดเป็น Dodge Chance
        const dodgeChance = 100 - incomingHitChance;

        // 4. ล็อคค่าให้อยู่ในช่วง 3% - 97%
        return Math.max(3, Math.min(97, Math.round(dodgeChance)));
    }

    if (key === 'hit') {
        // 💡 ตั้งค่า FLEE บอสมาตรฐานไว้ที่ 800 - 1,200 (อ้างอิง Cap FLEE 2,500)
        const baseEnemyFlee = 800;
        const fleeWeight = 0.5;

        const hitBase = Math.max(1, value);
        let hitChance = 95 * (hitBase / (hitBase + baseEnemyFlee * fleeWeight));

        // ล็อคช่วง 3% - 97% ให้ตรงกับ Combat Engine
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

    return (
        <div className="space-y-4">
            {!hideExtraButtons && (
                <>
                    <div className="flex gap-2 ml-4">
                        <button
                            onClick={() => setShowBonusModal?.(true)}
                            className="bg-slate-700 hover:bg-slate-600 text-[10px] text-white px-2 py-1 rounded border border-slate-600 font-bold"
                        >
                            BONUS DETAILS
                        </button>

                        <button
                            onClick={() => setShowLimitModal(true)}
                            className="bg-purple-900/30 hover:bg-purple-800/40 text-[10px] text-purple-300 px-2 py-1 rounded border border-purple-800 font-bold"
                        >
                            STAT LIMITS
                        </button>
                    </div>

                    {showLimitModal && (
                        <StatLimitModal onClose={() => setShowLimitModal(false)} />
                    )}
                </>
            )}

            {/* 📌 ใส่ relative ไว้ตรงนี้เพื่อให้ Tooltip อ้างอิงจุดกึ่งกลางจากกรอบใหญ่นี้ */}
            <div className="relative bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex flex-wrap gap-3">
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
                                ? 'text-orange-400'
                                : (value > baseStatValue ? 'text-emerald-400' : 'text-white');

                            const sources = statBreakdown[key] || [];
                            const rawSum = sources.reduce((sum, src) => sum + src.value, 0);
                            const totalSum = isCapped ? rawSum : value;

                            return (
                                <div
                                    key={key}
                                    className="group flex justify-between bg-slate-900 p-2 rounded w-[calc(50%-6px)] cursor-pointer hover:bg-slate-800/80 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="uppercase text-slate-400 text-xs font-bold truncate">
                                            {key}
                                        </span>
                                    </div>

                                    <span className={`font-mono ${isCapped ? 'text-orange-500' : textColor}`}>
                                        {isCapped ? (
                                            <span className="flex items-center gap-1">
                                                {Math.floor(cap)}
                                                <span className="text-[9px] text-orange-400 font-bold bg-orange-900/30 px-1.5 py-0.5 rounded">

                                                    CAPPED
                                                </span>
                                            </span>
                                        ) : (
                                            key === 'critRate' ? `${Math.floor(value)}%` : Math.floor(value)
                                        )}
                                    </span>

                                    {/* 📌 ส่วนแสดงผล Breakdown Tooltip (เด้งตรงกลางกรอบหลักเสมอ + มี max-h รองรับถ้ารายการยาวมาก) */}
                                    {!hideBreakdown && (sources.length > 0 || reductionPct !== null) && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:block w-72 max-h-[85%] overflow-y-auto p-3 bg-slate-950/95 text-xs text-slate-200 rounded-lg shadow-2xl border border-slate-700 z-50 pointer-events-none backdrop-blur-sm">
                                            <div className="font-bold mb-1.5 text-amber-500 border-b border-slate-800 pb-1 uppercase tracking-wider flex justify-between items-center">
                                                <span>{key} Breakdown</span>
                                            </div>

                                            {/* Tooltip สำหรับ DEF */}
                                            {key === 'def' && reductionPct !== null && (
                                                <div className="mb-2 p-1.5 bg-cyan-950/40 border border-cyan-800/50 rounded text-[10px] text-cyan-300 space-y-1">
                                                    <div className="font-semibold text-cyan-200">Physical Damage Reduction</div>
                                                    <div>Reduces incoming physical attacks by ~<b className="text-white">{reductionPct}%</b></div>
                                                    <div className="text-[9px] text-slate-400 font-normal border-t border-cyan-900/40 pt-1">
                                                        Combines DEF with RES to mitigate physical hits.
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tooltip สำหรับ mRES */}
                                            {key === 'mRes' && (
                                                <div className="mb-2 p-1.5 bg-indigo-950/40 border border-indigo-800/50 rounded text-[10px] text-indigo-300 space-y-1">
                                                    <div className="font-semibold text-indigo-200">Magic & Critical Protection</div>
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
                                                <div className="mb-2 p-1.5 bg-purple-950/40 border border-purple-800/50 rounded text-[10px] text-purple-300 space-y-1">
                                                    <div className="font-semibold text-purple-200">Global Bonus Armor</div>
                                                    <div>Adds extra armor layer against <b className="text-white">All Damage Types</b></div>
                                                    <div className="text-[9px] text-slate-400 font-normal border-t border-purple-900/40 pt-1">
                                                        Boosts total defense alongside DEF and mRES.
                                                    </div>
                                                </div>
                                            )}

                                            {/* ✅ เพิ่ม Tooltip สำหรับ FLEE */}
                                            {key === 'flee' && reductionPct !== null && (
                                                <div className="mb-2 p-1.5 bg-teal-950/40 border border-teal-800/50 rounded text-[10px] text-teal-300 space-y-1">
                                                    <div className="font-semibold text-teal-200">Dodge Chance</div>
                                                    <div>Roughly <b className="text-white">{reductionPct}%</b> chance to avoid an incoming hit entirely (vs. standard boss)</div>
                                                    <div className="text-[9px] text-slate-400 font-normal border-t border-teal-900/40 pt-1">
                                                        Unlike DEF/RES, FLEE is chance-based — the hit either lands fully or misses completely, no partial reduction. Higher level & hit bosses will reduce your actual dodge chance.
                                                    </div>
                                                </div>
                                            )}

                                            {/* ✅ เพิ่ม Tooltip สำหรับ HIT */}
                                            {key === 'hit' && reductionPct !== null && (
                                                <div className="mb-2 p-1.5 bg-amber-950/40 border border-amber-800/50 rounded text-[10px] text-amber-300 space-y-1">
                                                    <div className="font-semibold text-amber-200">Hit Rate</div>
                                                    <div>Roughly <b className="text-white">{reductionPct}%</b> chance to land hits successfully (vs. standard boss)</div>
                                                    <div className="text-[9px] text-slate-400 font-normal border-t border-amber-900/40 pt-1">
                                                        Determines accuracy against enemy FLEE. Combat always enforces a 3% min miss & 3% min hit chance. High FLEE bosses will reduce your actual hit rate further.
                                                    </div>
                                                </div>
                                            )}

                                            {/* รายการแหล่งที่มาของสเตตัส */}
                                            <div className="space-y-1">
                                                {sources.map((src, idx) => (
                                                    <div key={idx} className="flex justify-between text-[11px]">
                                                        <span className="text-slate-400 truncate pr-2">• {src.label}</span>
                                                        <span className="font-mono text-emerald-400">+{src.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* ช่องคำนวณ Raw Total */}
                                            <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                                                <span>Raw Total</span>
                                                <span className="font-mono text-emerald-400">
                                                    {key === 'critRate' ? `${Math.floor(totalSum)}%` : Math.floor(totalSum)}
                                                </span>
                                            </div>

                                            {/* แจ้งเตือน Capped */}
                                            {isCapped && cap !== undefined && (
                                                <div className="mt-1 flex justify-between text-[10px] text-orange-400 font-semibold">
                                                    <span>Capped At</span>
                                                    <span className="font-mono">{key === 'critRate' ? `${Math.floor(cap)}%` : Math.floor(cap)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
};