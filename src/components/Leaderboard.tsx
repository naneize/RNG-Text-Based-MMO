import { useState, useEffect } from 'react';
import { useLeaderboardStore, LEADERBOARD_STATS } from '../store/leaderboardStore';
import type { Stats } from '../types/game';
import { useAuthStore } from '../store/authStore';

interface LeaderboardProps {
    onClose?: () => void;
}

// ชื่อย่อสวยๆ สำหรับแสดงผล
const STAT_LABELS: Record<keyof Stats, string> = {
    str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK',
    critRate: 'Crit Rate', critDmg: 'Crit Dmg', atk: 'ATK', def: 'DEF',
    maxHp: 'Max HP', hit: 'HIT', flee: 'FLEE', res: 'RES', mRes: 'M.RES',
    skillPower: 'Skill Pwr',
};

export const Leaderboard = ({ onClose }: LeaderboardProps) => {
    const { boards, isLoading, fetchBoard } = useLeaderboardStore();
    const { userProfile, user } = useAuthStore();
    const [selectedStat, setSelectedStat] = useState<keyof Stats>('atk');
    const [showAllStats, setShowAllStats] = useState(true);

    // Guest = มี userProfile (ชื่อปลอม) แต่ไม่มี Firebase user จริง
    const isGuest = !!userProfile && !user;

    // โหลดข้อมูลทุก Stat ทันทีที่เปิด Leaderboard
    useEffect(() => {
        LEADERBOARD_STATS.forEach((statKey) => {
            fetchBoard(statKey);
        });
    }, []);

    // โหลดเฉพาะ Stat ที่เลือกเพิ่ม (กรณีเปลี่ยนโหมดมาดูแบบเดี่ยว)
    useEffect(() => {
        if (!showAllStats) {
            fetchBoard(selectedStat);
        }
    }, [selectedStat, showAllStats]);

    const entries = boards[selectedStat] || [];

    return (
        <div className="flex flex-col h-[600px] w-full max-w-3xl bg-stone-950 border border-amber-900/80 rounded-2xl overflow-hidden shadow-2xl shadow-amber-950/40 text-amber-100">
            {/* Header */}
            <div className="bg-stone-900 px-5 py-3.5 border-b border-amber-950/80 flex justify-between items-center">
                <h2 className="text-amber-400 font-extrabold text-sm tracking-wider uppercase drop-shadow">LEADERBOARD</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-7 h-7 bg-stone-950 hover:bg-amber-950 text-amber-400/80 hover:text-amber-300 rounded-xl border border-amber-950 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* แบนเนอร์เตือน Guest */}
            {isGuest && (
                <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-900/40 text-amber-400 text-[11px] text-center font-medium">
                    Guest mode cannot be saved to the Leaderboard — Sign up to rank up.
                </div>
            )}

            {/* แถบควบคุมด้านบน */}
            <div className="flex items-center justify-between p-3.5 border-b border-amber-950/50 bg-stone-900/40">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-300/80">
                        {showAllStats ? 'Overview (All Stats)' : 'Detailed View:'}
                    </span>
                    {!showAllStats && (
                        <select
                            value={selectedStat}
                            onChange={(e) => setSelectedStat(e.target.value as keyof Stats)}
                            className="bg-stone-900 border border-amber-900/80 text-amber-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer shadow-inner"
                        >
                            {LEADERBOARD_STATS.map((statKey) => (
                                <option key={statKey} value={statKey} className="bg-stone-950 text-amber-200">
                                    {STAT_LABELS[statKey]}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* ปุ่มสลับโหมด */}
                <button
                    onClick={() => setShowAllStats(!showAllStats)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${showAllStats
                        ? 'bg-stone-900 border-amber-600 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-stone-900 border-amber-950 text-amber-400/80 hover:bg-stone-800'
                        }`}
                >
                    {showAllStats ? 'Switch to Single View' : 'Show All Overview'}
                </button>
            </div>

            {/* รายชื่อและข้อมูล Leaderboard */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-amber-500/60 text-sm">
                        Loading . . .
                    </div>
                ) : showAllStats ? (
                    // โหมดภาพรวม SHOW ALL (2 คอลัมน์)
                    <div className="grid grid-cols-2 gap-3">
                        {LEADERBOARD_STATS.map((statKey) => {
                            const statEntries = boards[statKey] || [];
                            const top1 = statEntries[0];
                            const top2 = statEntries[1];
                            const top3 = statEntries[2];

                            return (
                                <div
                                    key={statKey}
                                    className="bg-stone-900/80 border border-amber-950/60 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-amber-900/80 transition-colors"
                                >
                                    <div className="text-xs font-bold text-amber-500 tracking-wider mb-2 uppercase">
                                        {STAT_LABELS[statKey]}
                                    </div>

                                    <div className="flex flex-col gap-1.5 text-xs">
                                        {/* อันดับ 1 */}
                                        {(() => {
                                            const isMe1 = top1?.uid === userProfile?.uid;
                                            return (
                                                <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${isMe1 ? 'bg-amber-950/40 border border-amber-700/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'bg-stone-950/40'
                                                    }`}>
                                                    <div className="flex items-center gap-1.5 truncate max-w-[110px]">
                                                        <span className="text-amber-400 font-bold shrink-0">🥇</span>
                                                        <span className={`truncate ${isMe1 ? 'text-amber-300 font-bold' : 'text-amber-200 font-bold'}`} title={top1?.username || '-'}>
                                                            {top1 ? top1.username : '-'}
                                                        </span>
                                                        {isMe1 && <span className="text-[9px] text-amber-400 font-bold shrink-0">(YOU)</span>}
                                                    </div>
                                                    <span className="text-amber-300 font-mono font-semibold shrink-0">
                                                        {top1 ? Math.floor(top1.stats[statKey] || 0).toLocaleString() : '0'}
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* อันดับ 2 */}
                                        {(() => {
                                            const isMe2 = top2?.uid === userProfile?.uid;
                                            return (
                                                <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${isMe2 ? 'bg-amber-950/40 border border-amber-700/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'bg-stone-950/20'
                                                    }`}>
                                                    <div className="flex items-center gap-1.5 truncate max-w-[110px]">
                                                        <span className="text-stone-300 font-bold shrink-0">🥈</span>
                                                        <span className={`truncate ${isMe2 ? 'text-amber-300 font-bold' : 'text-stone-300'}`} title={top2?.username || '-'}>
                                                            {top2 ? top2.username : '-'}
                                                        </span>
                                                        {isMe2 && <span className="text-[9px] text-amber-400 font-bold shrink-0">(YOU)</span>}
                                                    </div>
                                                    <span className={`shrink-0 font-mono ${isMe2 ? 'text-amber-300 font-semibold' : 'text-stone-300'}`}>
                                                        {top2 ? Math.floor(top2.stats[statKey] || 0).toLocaleString() : '0'}
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* อันดับ 3 */}
                                        {(() => {
                                            const isMe3 = top3?.uid === userProfile?.uid;
                                            return (
                                                <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${isMe3 ? 'bg-amber-950/40 border border-amber-700/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'bg-stone-950/20'
                                                    }`}>
                                                    <div className="flex items-center gap-1.5 truncate max-w-[110px]">
                                                        <span className="text-amber-600 font-bold shrink-0">🥉</span>
                                                        <span className={`truncate ${isMe3 ? 'text-amber-300 font-bold' : 'text-amber-600/90'}`} title={top3?.username || '-'}>
                                                            {top3 ? top3.username : '-'}
                                                        </span>
                                                        {isMe3 && <span className="text-[9px] text-amber-400 font-bold shrink-0">(YOU)</span>}
                                                    </div>
                                                    <span className={`shrink-0 font-mono ${isMe3 ? 'text-amber-300 font-semibold' : 'text-amber-600/90'}`}>
                                                        {top3 ? Math.floor(top3.stats[statKey] || 0).toLocaleString() : '0'}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-amber-500/60 text-sm">
                        No data in this category
                    </div>
                ) : (
                    // โหมดดูเดี่ยว Top 10 เต็มจอ
                    <div className="flex flex-col gap-2">
                        {entries.map((entry, index) => {
                            const isMe = entry.uid === userProfile?.uid;
                            const rankColor =
                                index === 0 ? 'text-amber-400' :
                                    index === 1 ? 'text-stone-300' :
                                        index === 2 ? 'text-amber-600' : 'text-amber-500/60';

                            return (
                                <div
                                    key={entry.uid}
                                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${isMe
                                        ? 'bg-amber-950/40 border-amber-600/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                        : 'bg-stone-900/80 border-amber-950/60'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`font-extrabold text-sm w-6 font-mono ${rankColor}`}>#{index + 1}</span>
                                        <span className={`text-sm ${isMe ? 'text-amber-300 font-bold' : 'text-amber-100'}`}>
                                            {entry.username}
                                        </span>
                                        {isMe && <span className="text-[10px] text-amber-400 font-extrabold">(YOU)</span>}
                                    </div>
                                    <span className="text-amber-300 font-bold font-mono text-sm">
                                        {Math.floor(entry.stats[selectedStat] || 0).toLocaleString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};