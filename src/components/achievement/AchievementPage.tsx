import React, { useState } from 'react';
import { useAchievementStore } from '../../store/achievementStore';
import { itemLibrary } from '../../data/itemLibrary';

const getItemDisplayName = (itemId?: string) => {
    if (!itemId) return '';
    const foundItem = itemLibrary.find((item) => item.id === itemId);
    return foundItem ? foundItem.name : itemId;
};

export const AchievementPage: React.FC = () => {
    // ดึง achievements และฟังก์ชัน claimReward ออกมาใช้งาน
    const { achievements, claimReward } = useAchievementStore();
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    const filteredAchievements = Object.values(achievements).filter((ach) => {
        if (selectedFilter === 'all') return true;
        return ach.category === selectedFilter;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-400">Achievements</h2>
                    <p className="text-slate-400 text-sm">Complete special conditions to earn rewards and glory!</p>
                </div>

                {/* ปุ่ม Filter หมวดหมู่ */}
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
                    <button
                        onClick={() => setSelectedFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedFilter === 'all'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setSelectedFilter('collection')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedFilter === 'collection'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Collection
                    </button>
                    <button
                        onClick={() => setSelectedFilter('challenge')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedFilter === 'challenge'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Challenge
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((ach) => {
                    const isUnlocked = ach.isUnlocked;

                    return (
                        <div
                            key={ach.id}
                            className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${isUnlocked
                                ? 'bg-slate-900/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                                : 'bg-slate-950/50 border-slate-800 opacity-65'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${isUnlocked
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-900 text-slate-600 border border-slate-800'
                                }`}>
                                {isUnlocked ? '🏆' : '🔒'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className={`font-semibold truncate ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                                        {ach.title}
                                    </h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${isUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                        {ach.category?.toUpperCase() || 'CHALLENGE'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mt-1">{ach.description}</p>

                                {/* ส่วนแสดงรางวัลและปุ่มกดรับ */}
                                <div className="mt-3 flex items-center justify-between gap-2">
                                    {ach.reward && (
                                        <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                            🎁 Reward : {ach.reward.amount} {getItemDisplayName(ach.reward.itemId) || ach.reward.type?.toUpperCase()}
                                        </div>
                                    )}

                                    {/* เงื่อนไขแสดงปุ่ม Claim */}
                                    {isUnlocked && (
                                        ach.isClaimed ? (
                                            <span className="text-xs px-3 py-1 rounded-lg bg-slate-800 text-slate-500 font-medium">
                                                Claimed
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => claimReward(ach.id)}
                                                className="text-xs px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-500/20 animate-pulse"
                                            >
                                                Claim Reward
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};