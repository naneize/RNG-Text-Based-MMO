import { useState } from 'react';
import type { Player } from '../../types/game';
import { STAT_CAPS } from '../../utils/statCalculator';
import { StatLimitModal } from '../Modals/StatLimitModal';
import type { Stats } from '../../types/game';


interface CharacterStatsProps {
    player: Player;
    finalStats: Stats;
    statBreakdown?: Record<string, { label: string; value: number }[]>; // 📌 เพิ่มรับค่านี้
    setShowBonusModal: (show: boolean) => void;
}



export const CharacterStats = ({ player, finalStats, statBreakdown = {}, setShowBonusModal }: CharacterStatsProps) => {
    const [showLimitModal, setShowLimitModal] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex gap-2 ml-4">
                <button
                    onClick={() => setShowBonusModal(true)}
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

            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex flex-wrap gap-3">
                    {Object.entries(finalStats)
                        .sort(([a], [b]) => {
                            const order: Record<string, number> = {
                                'maxHp': 1, 'atk': 2, 'def': 3, 'hit': 4, 'flee': 5,
                                'critRate': 6, 'critDmg': 7,
                                'str': 8, 'vit': 9, 'agi': 10, 'dex': 11, 'int': 12, 'luk': 13
                            };
                            return (order[a] || 99) - (order[b] || 99);
                        })
                        .map(([key, value]) => {
                            // เช็คว่าค่าเกินไหม
                            const cap = STAT_CAPS[key as keyof typeof STAT_CAPS];
                            const isCapped = cap !== undefined && value >= cap;

                            // กำหนดสี: ถ้าล้นให้เป็นสีส้ม/แดงเตือน, ถ้าปกติเป็นสีเขียว
                            const textColor = isCapped
                                ? 'text-orange-400'
                                : (value > (player.baseStats[key as keyof typeof player.baseStats] || 0) ? 'text-yellow-400' : 'text-emerald-400');

                            // 📌 ดึงข้อมูลที่มาของสเตตัสตัวนี้
                            const sources = statBreakdown[key] || [];
                            const totalSum = sources.reduce((sum, src) => sum + src.value, 0);

                            // 📌 เช็กว่าเป็นสเตตัสฝั่งขวาหรือไม่ (เพื่อให้ Tooltip เด้งไปทางซ้าย ไม่ล้นจอ)
                            const isRightSide = ['atk', 'hit', 'critRate', 'str', 'agi', 'int', 'res', 'skillPower'].includes(key);

                            return (
                                <div
                                    key={key}
                                    className="relative group flex justify-between bg-slate-900 p-2 rounded w-[calc(50%-6px)] cursor-pointer"
                                >
                                    <span className="uppercase text-slate-400 text-xs font-bold">{key}</span>
                                    <span className={`font-mono ${isCapped ? 'text-orange-400' : textColor}`}>
                                        {isCapped ? (
                                            <span className="flex items-center gap-1">
                                                {Math.floor(cap)}
                                                <span className="text-[9px] text-slate-500 font-normal opacity-70">
                                                    ▲ MAX
                                                </span>
                                            </span>
                                        ) : (
                                            key === 'critRate' ? `${Math.floor(value)}%` : Math.floor(value)
                                        )}
                                    </span>

                                    {/* 📌 ส่วนของ Tooltip ที่ปรับให้สลับฝั่งอัตโนมัติซ้าย/ขวา */}
                                    {sources.length > 0 && (
                                        /* 📌 เปลี่ยนจาก bottom-full mb-2 เป็น top-full mt-2 เพื่อให้ Tooltip เด้งลงด้านล่างแทน */
                                        <div className={`absolute top-full mt-2 mb-2 hidden group-hover:block w-52 p-2.5 bg-slate-950 text-xs text-slate-200 rounded-md shadow-xl border border-slate-700 z-50 pointer-events-none ${isRightSide ? 'right-0' : 'left-0'}`}>
                                            <div className="font-bold mb-1.5 text-purple-400 border-b border-slate-800 pb-1 uppercase tracking-wider">
                                                {key} Breakdown
                                            </div>
                                            <div className="space-y-1">
                                                {sources.map((src, idx) => (
                                                    <div key={idx} className="flex justify-between text-[11px]">
                                                        <span className="text-slate-400 truncate pr-2">• {src.label}</span>
                                                        <span className="font-mono text-emerald-400">+{src.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* ส่วนแสดงผลรวม (Total) ด้านล่างสุด */}
                                            <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between font-bold text-slate-100">
                                                <span>Total</span>
                                                <span className="font-mono text-emerald-400">{totalSum}</span>
                                            </div>
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