// components/pages/AchievementPage.tsx
import React, { useState } from 'react';
import { useAchievementStore } from '../../store/achievementStore';
import { itemLibrary } from '../../data/itemLibrary';

const getItemData = (itemId?: string) => {
    if (!itemId) return null;
    return itemLibrary.find((item) => item.id === itemId);
};

export const AchievementPage: React.FC = () => {
    const { achievements, claimReward } = useAchievementStore();
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    const achievementList = Object.values(achievements);

    const totalCount = achievementList.length;
    const unlockedCount = achievementList.filter((ach) => ach.isUnlocked).length;

    const filteredAchievements = achievementList.filter((ach) => {
        if (selectedFilter === 'all') return true;
        return ach.category === selectedFilter;
    });

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'starter', label: 'Starter' },
        { id: 'collection', label: 'Collection' },
        { id: 'combat', label: 'Combat' },
        { id: 'challenge', label: 'Challenge' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-amber-400 tracking-wide">Achievements</h2>
                    </div>
                    <p className="text-stone-400 text-sm mt-1">Complete special conditions to earn rewards and glory!</p>
                </div>

                {/* Progress Badge */}
                <span className="ml-auto text-xs px-3 py-1 rounded-full bg-stone-900/90 text-amber-400 border border-amber-900/60 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    {unlockedCount} / {totalCount} Completed
                </span>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1.5 bg-stone-950/80 p-1 rounded-xl border border-amber-950 w-fit backdrop-blur-md">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedFilter === filter.id
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((ach) => {
                    const isUnlocked = ach.isUnlocked;

                    return (
                        <div
                            key={ach.id}
                            className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${isUnlocked
                                ? 'bg-stone-950/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
                                : 'bg-stone-950/50 border-stone-900 opacity-60'
                                }`}
                        >
                            {/* Icon / Lock Status */}
                            <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${isUnlocked
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'bg-stone-900 text-stone-600 border border-stone-800'
                                    }`}
                            >
                                {isUnlocked ? '🏆' : '🔒'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className={`font-semibold truncate ${isUnlocked ? 'text-amber-100' : 'text-stone-400'}`}>
                                        {ach.title}
                                    </h3>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium ${isUnlocked
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                            : 'bg-stone-900 text-stone-500 border border-stone-800'
                                            }`}
                                    >
                                        {ach.category?.toUpperCase() || 'CHALLENGE'}
                                    </span>
                                </div>
                                <p className="text-sm text-stone-400 mt-1">{ach.description}</p>

                                {/* Title Reward */}
                                {ach.rewardTitle && (
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <span className="text-[10px] text-amber-500/90 uppercase font-medium">Title Reward :</span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded font-bold tracking-wider ${ach.isUnlocked
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                : 'bg-stone-900 text-stone-500 border border-stone-800'
                                                }`}
                                        >
                                            {ach.rewardTitle}
                                        </span>
                                    </div>
                                )}

                                {/* Frame Reward */}
                                {ach.rewardFrame && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] text-amber-500/90 uppercase font-medium">Frame Reward :</span>
                                        <div
                                            className={`w-8 h-8 rounded-md p-0.5 border flex items-center justify-center overflow-hidden ${ach.isUnlocked
                                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                                : 'bg-stone-900 border-stone-800'
                                                }`}
                                        >
                                            <img src={ach.rewardFrame} alt="Reward Frame" className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                )}

                                {/* Rewards & Claim Button Section */}
                                <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-stone-900">
                                    {ach.reward && Array.isArray(ach.reward) && ach.reward.length > 0 && (
                                        <div className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] text-stone-500">REWARD :</span>
                                            {ach.reward.map((rew, idx) => {
                                                const itemData = getItemData(rew.itemId);
                                                const itemName = itemData ? itemData.name : rew.type;

                                                if (rew.type === 'equipment') {
                                                    const rarityText = rew.rarity ? `${rew.rarity} ` : '';
                                                    const levelText = rew.itemLevel ? ` Lv.${rew.itemLevel}` : '';
                                                    const iconSrc = itemData?.icon || `./Icons/Equipments/${rew.itemId}.png`;

                                                    return (
                                                        <span key={idx} className="inline-flex items-center gap-1">
                                                            <img
                                                                src={iconSrc}
                                                                alt={itemName}
                                                                className="w-7 h-7 object-contain"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                            <span className="text-amber-200 font-semibold text-[11px]">
                                                                {rarityText}{itemName.toUpperCase()}{levelText}
                                                            </span>
                                                        </span>
                                                    );
                                                }

                                                return (
                                                    <span key={idx} className="text-amber-300 font-semibold text-[11px]">
                                                        {rew.amount ? `${rew.amount} ` : ''}{itemName.toUpperCase()}
                                                    </span>
                                                );
                                            }).reduce((prev, curr) => [prev, <span key={Math.random()} className="text-stone-600">,</span>, curr] as any)}
                                        </div>
                                    )}

                                    {/* Claim Status & Action */}
                                    {isUnlocked && (
                                        <div className="ml-auto">
                                            {ach.isClaimed ? (
                                                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-900/50 text-amber-400 font-bold flex items-center gap-1">
                                                    ✓ CLAIMED
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => claimReward(ach.id)}
                                                    className="text-[11px] px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all shadow-md shadow-amber-500/20 animate-pulse cursor-pointer"
                                                >
                                                    CLAIM REWARD
                                                </button>
                                            )}
                                        </div>
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