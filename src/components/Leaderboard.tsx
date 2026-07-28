import { useState, useEffect } from 'react';
import { useLeaderboardStore, LEADERBOARD_STATS } from '../store/leaderboardStore';
import type { Stats } from '../types/game';
import { useAuthStore } from '../store/authStore';

interface LeaderboardProps {
    onClose?: () => void;
}

// ชื่อย่อสวยๆ สำหรับแสดงผล (ไม่ต้องโชว์ camelCase ตรงๆ)
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
    const [showAllStats, setShowAllStats] = useState(false);

    // Guest = มี userProfile (ชื่อปลอม) แต่ไม่มี Firebase user จริง
    const isGuest = !!userProfile && !user;

    useEffect(() => {
        fetchBoard(selectedStat);
    }, [selectedStat]);

    const entries = boards[selectedStat] || [];

    return (
        <div className="flex flex-col h-[600px] w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                <h2 className="text-white font-bold text-sm tracking-wider">LEADERBOARD</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-7 h-7 bg-slate-700/50 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* แบนเนอร์เตือน Guest (โผล่เฉพาะตอนเป็น Guest เท่านั้น) */}
            {isGuest && (
                <div className="px-4 py-1.5 bg-amber-900/20 border-b border-amber-800/40 text-amber-400 text-[11px] text-center">
                    Guest mode cannot be saved to the Leaderboard — Sign up to rank up.
                </div>
            )}

            {/* แถวเดียว: แท็บเลือก stat (เลื่อนได้) + ปุ่มสลับโหมดแสดงผล */}
            <div className="flex items-center gap-2 p-3 border-b border-slate-800">
                <div className="flex-1 flex flex-wrap gap-1.5">
                    {LEADERBOARD_STATS.map((statKey) => (
                        <button
                            key={statKey}
                            onClick={() => setSelectedStat(statKey)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${selectedStat === statKey
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {STAT_LABELS[statKey]}
                        </button>
                    ))}
                </div>

                {/* ปุ่ม toggle แบบไอคอนเดียว ไม่กินพื้นที่ */}
                <button
                    onClick={() => setShowAllStats(!showAllStats)}
                    title={showAllStats ? 'Switch to single view' : 'Show all stats'}
                    className={`shrink-0 px-3 h-8 rounded-md text-xs font-bold transition flex items-center justify-center border ${showAllStats
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                        }`}
                >
                    ALL
                </button>
            </div>
            {/* รายชื่อ top 10 */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        Loading . . .
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        No data in this category
                    </div>
                ) : showAllStats ? (
                    // 📊 โหมดภาพรวม SHOW ALL: จัดเรียงเป็นกริด 2 คอลัมน์ (ดีไซน์คล้ายกล่องสเตตัสตัวละคร) โชว์ Top 3 ของแต่ละสเตต
                    <div className="grid grid-cols-2 gap-3">
                        {LEADERBOARD_STATS.map((statKey) => {
                            const statEntries = boards[statKey] || [];
                            const top1 = statEntries[0];
                            const top2 = statEntries[1];
                            const top3 = statEntries[2];

                            return (
                                <div
                                    key={statKey}
                                    className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between shadow-md"
                                >
                                    {/* หัวการ์ด: ชื่อ Stat */}
                                    <div className="text-xs font-bold text-slate-400 tracking-wider mb-2">
                                        {STAT_LABELS[statKey]}
                                    </div>

                                    {/* รายชื่อ Top 3 ภายในกล่อง */}
                                    <div className="flex flex-col gap-1.5 text-xs">
                                        {/* อันดับ 1 */}
                                        <div className="flex items-center justify-between bg-slate-900/40 px-2 py-1 rounded">
                                            <span className="text-amber-400 font-bold truncate max-w-[90px]" title={top1?.username || '-'}>
                                                🥇 {top1 ? top1.username : '-'}
                                            </span>
                                            <span className="text-amber-300 font-semibold">
                                                {top1 ? Math.floor(top1.stats[statKey] || 0).toLocaleString() : '0'}
                                            </span>
                                        </div>

                                        {/* อันดับ 2 */}
                                        <div className="flex items-center justify-between px-2 py-0.5">
                                            <span className="text-slate-300 truncate max-w-[90px]" title={top2?.username || '-'}>
                                                🥈 {top2 ? top2.username : '-'}
                                            </span>
                                            <span className="text-slate-300">
                                                {top2 ? Math.floor(top2.stats[statKey] || 0).toLocaleString() : '0'}
                                            </span>
                                        </div>

                                        {/* อันดับ 3 */}
                                        <div className="flex items-center justify-between px-2 py-0.5">
                                            <span className="text-orange-500 truncate max-w-[90px]" title={top3?.username || '-'}>
                                                🥉 {top3 ? top3.username : '-'}
                                            </span>
                                            <span className="text-slate-400">
                                                {top3 ? Math.floor(top3.stats[statKey] || 0).toLocaleString() : '0'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // list เดิม: โชว์ทีละ stat แบบรายชื่อ Top 10 เต็มจอ
                    <div className="flex flex-col gap-2">
                        {entries.map((entry, index) => {
                            const isMe = entry.uid === userProfile?.uid;
                            const rankColor =
                                index === 0 ? 'text-amber-400' :
                                    index === 1 ? 'text-slate-300' :
                                        index === 2 ? 'text-orange-600' : 'text-slate-500';

                            return (
                                <div
                                    key={entry.uid}
                                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${isMe
                                        ? 'bg-emerald-900/30 border-emerald-700'
                                        : 'bg-slate-800/50 border-slate-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold text-sm w-6 ${rankColor}`}>#{index + 1}</span>
                                        <span className={`text-sm ${isMe ? 'text-emerald-400 font-bold' : 'text-slate-200'}`}>
                                            {entry.username}
                                        </span>
                                        {isMe && <span className="text-[10px] text-emerald-500">(YOU)</span>}
                                    </div>
                                    <span className="text-white font-bold text-sm">
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
