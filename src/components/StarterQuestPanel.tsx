// components/StarterQuestPanel.tsx
import { useState } from 'react';
import { useAchievementStore } from '../store/achievementStore';


const QUEST_ORDER = [
    'FIRST_EQUIP',
    'EQUIP_FIVE_COMMONS',
    'QUEST_ROLL_10',
    'FIRST_EPIC',
    'FIRST_LEGENDARY',
    'QUEST_REROLL_FIRST',
    'QUEST_SALVAGE_FIRST',
    'QUEST_TRANSFER_FIRST',
    'QUEST_READY_FOR_BOSS',
    'QUEST_FIRST_BATTLE',
    'QUEST_FIRST_BOSS_KILL',
];

export const StarterQuestPanel = () => {
    const achievements = useAchievementStore((s) => s.achievements);
    const claimReward = useAchievementStore((s) => s.claimReward);

    const [isExpanded, setIsExpanded] = useState(true);

    const quests = QUEST_ORDER.map((id) => achievements[id]).filter(Boolean);
    const allDone = quests.every((q) => q.isClaimed);

    if (allDone || quests.length === 0) return null;

    return (
        /* 🟢 1. เปลี่ยนกรอบนอกหลัก จากเดิมที่เป็น amber-700/40 ให้เป็นโทน slate เช่น border-slate-700/60 หรือ border-slate-800 */
        <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-2 shadow-lg">
            <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    {/* 🟢 จุดกระพริบดึงดูดสายตา */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Getting Started Quest
                </h3>
                <button className="text-slate-400 text-xs font-bold hover:text-slate-200 transition">
                    {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800">
                    {quests.map((quest) => (
                        <div
                            key={quest.id}
                            className={`flex items-center justify-between p-3 rounded-lg border text-xs transition ${quest.isClaimed
                                ? 'bg-emerald-950/40 border-emerald-700/60 opacity-80'
                                : quest.isUnlocked
                                    ? 'bg-emerald-900/30 border-emerald-500 shadow-md shadow-emerald-500/20'
                                    : 'bg-slate-800/80 border-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="text-sm">{quest.isClaimed ? '✅' : quest.isUnlocked ? '🎁' : '⬜'}</span>
                                <div>
                                    {/* 🟢 ปรับชื่อเควสให้เป็นสีเขียวสว่าง */}
                                    <div className="font-bold text-emerald-400">{quest.title}</div>
                                    {/* คำอธิบายยังคงใช้สีเทาอ่อนเพื่อให้สบายตา */}
                                    <div className="text-[11px] text-slate-300">{quest.description}</div>
                                </div>
                            </div>

                            {/* 🟢 ส่วนที่แก้ไข: ถ้า Claim แล้วให้แสดงป้าย Claimed, ถ้ายัง ให้แสดงปุ่ม Claim, ถ้ายังไม่ปลดล็อคจะไม่แสดงอะไรเลย */}
                            {quest.isClaimed ? (
                                <span className="text-emerald-400 text-xs font-bold px-2.5 py-1 bg-emerald-950/60 rounded-md border border-emerald-800/50">
                                    Claimed
                                </span>
                            ) : quest.isUnlocked ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        claimReward(quest.id);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-lg"
                                >
                                    Claim
                                </button>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};