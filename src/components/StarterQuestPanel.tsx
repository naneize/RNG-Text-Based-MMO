// components/StarterQuestPanel.tsx
import { useState } from 'react';
import { useAchievementStore } from '../store/achievementStore';
import { useGameStore } from '../store/gameStore';
import { materialLibrary } from '../data/materialLibrary';
import { itemLibrary } from '../data/itemLibrary';

type PageType = 'home' | 'adventure' | 'collection' | 'achievement' | 'marketplace' | 'profile';

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

// แผนที่เควส -> หน้าที่ต้องไปทำ (เควสไม่มีใน map = ทำบนหน้า Main นี้อยู่แล้ว)
const QUEST_TARGET: Partial<Record<string, PageType>> = {
    QUEST_READY_FOR_BOSS: 'adventure',
    QUEST_FIRST_BATTLE: 'adventure',
    QUEST_FIRST_BOSS_KILL: 'adventure',
};

const MATERIAL_INFO = Object.fromEntries(materialLibrary.map((m) => [m.id, m]));
const ITEM_INFO = Object.fromEntries(itemLibrary.map((i) => [i.id, i]));

const RARITY_COLOR: Record<string, string> = {
    common: 'text-stone-300',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-amber-400',
};

// ไอคอน + ชื่อของรางวัลแต่ละชิ้น (material / equipment / ฉายา+กรอบ)
const RewardPreview = ({ reward }: { reward: any[] }) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
        {reward.map((rew, i) => {
            if (rew.type === 'material' && MATERIAL_INFO[rew.itemId]) {
                const mat = MATERIAL_INFO[rew.itemId];
                return (
                    <span key={i} className="flex items-center gap-1 text-[10px] text-amber-200/90 font-medium">
                        <img src={mat.icon} alt={mat.name} className="w-4 h-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        {mat.name} ×{rew.amount ?? 1}
                    </span>
                );
            }
            if (rew.type === 'equipment' && ITEM_INFO[rew.itemId]) {
                const item = ITEM_INFO[rew.itemId];
                return (
                    <span key={i} className={`flex items-center gap-1 text-[10px] font-bold ${RARITY_COLOR[String(rew.rarity).toLowerCase()] ?? 'text-amber-300'}`}>
                        <img src={item.icon} alt={item.name} className="w-4 h-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        {item.name} ({rew.rarity})
                    </span>
                );
            }
            return null;
        })}
    </div>
);

export const StarterQuestPanel = () => {
    const achievements = useAchievementStore((s) => s.achievements);
    const claimReward = useAchievementStore((s) => s.claimReward);
    const currentPage = useGameStore((s) => s.currentPage);
    const setCurrentPage = useGameStore((s) => s.setCurrentPage);

    const [isExpanded, setIsExpanded] = useState(true);

    const quests = QUEST_ORDER.map((id) => achievements[id]).filter(Boolean);
    const allDone = quests.every((q) => q.isClaimed);
    const doneCount = quests.filter((q) => q.isClaimed).length;

    if (allDone || quests.length === 0) return null;

    // "เควสถัดไป" = อันแรกสุดในลำดับที่ยังไม่ได้ claim ให้จอจับโฟกัสแค่ก้าวถัดไปเดียว
    const nextQuestId = quests.find((q) => !q.isClaimed)?.id;

    return (
        <div className="bg-stone-950 border border-amber-900/80 rounded-2xl p-3 shadow-xl shadow-amber-950/40 text-amber-100">
            <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2.5 drop-shadow">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    Getting Started
                    {/* ตัวนับความคืบหน้า + แถบ progress บาง ๆ */}
                    <span className="flex items-center gap-1.5 normal-case tracking-normal">
                        <span className="text-stone-300 font-bold">{doneCount}/{quests.length}</span>
                        <span className="w-16 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-amber-950 inline-flex">
                            <span
                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                                style={{ width: `${(doneCount / quests.length) * 100}%` }}
                            />
                        </span>
                    </span>
                </h3>
                <button className="text-amber-400/80 text-xs font-bold hover:text-amber-300 transition">
                    {isExpanded ? '▲ Hide' : '▼ Show'}
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-amber-950/80">
                    {quests.map((quest) => {
                        // สถานะ: done / ready (claim ได้) / next (ก้าวถัดไป) / upcoming (ยังไกล)
                        const isDone = quest.isClaimed;
                        const isReady = !isDone && quest.isUnlocked;
                        const isNext = !isDone && !isReady && quest.id === nextQuestId;
                        const target = QUEST_TARGET[quest.id];

                        // เควสที่ทำเสร็จแล้ว หรือยังไม่ใช่ก้าวถัดไป -> แถบการันตีเล็ก ๆ ไม่รกสายตา
                        if (isDone || (!isReady && !isNext)) {
                            return (
                                <div
                                    key={quest.id}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] ${isDone
                                        ? 'text-amber-500/60 line-through decoration-amber-800/60'
                                        : 'text-stone-500'
                                        }`}
                                >
                                    <span>{isDone ? '✅' : '🔒'}</span>
                                    <span className="font-medium">{quest.title}</span>
                                </div>
                            );
                        }

                        // การ์ดเต็มสำหรับเควสที่ claim ได้ หรือก้าวถัดไป
                        return (
                            <div
                                key={quest.id}
                                className={`p-3 rounded-xl border text-xs transition ${isReady
                                    ? 'bg-amber-950/40 border-amber-600/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'bg-stone-900/60 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-sm shrink-0">{isReady ? '🎁' : '⬜'}</span>
                                        <div className="min-w-0">
                                            <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                                {quest.title}
                                                {!isReady && (
                                                    <span className="text-[9px] font-extrabold uppercase bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded">
                                                        Next
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-stone-300">{quest.description}</div>

                                            {/* รางวัลที่จะได้รับ */}
                                            {quest.reward && <RewardPreview reward={quest.reward} />}
                                            {(quest.rewardTitle || quest.rewardFrame) && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {quest.rewardFrame && (
                                                        <img
                                                            src={quest.rewardFrame}
                                                            alt="frame"
                                                            className="h-4 rounded-sm border border-amber-900/50"
                                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                                        />
                                                    )}
                                                    {quest.rewardTitle && (
                                                        <span className="text-[10px] text-amber-400 font-semibold">
                                                            Title: "{quest.rewardTitle}"
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                                        {isReady ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    claimReward(quest.id);
                                                }}
                                                className="bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-lg shadow-amber-900/40 transition-all cursor-pointer"
                                            >
                                                Claim
                                            </button>
                                        ) : target ? (
                                            /* ปุ่มพาไปหน้าที่ต้องทำเควส */
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentPage(target);
                                                }}
                                                className="bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-amber-300 text-xs font-extrabold px-3.5 py-1.5 rounded-xl border border-amber-700/60 transition-all cursor-pointer"
                                            >
                                                {currentPage === target ? 'You are here' : 'Go ➔'}
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-amber-500/70 font-semibold whitespace-nowrap">
                                                ↓ Do it on this page
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
