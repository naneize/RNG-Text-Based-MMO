import React, { useState, useMemo, useEffect } from 'react';
import { BOSS_LIBRARY } from '../data/bossLibrary';
import { getEffectiveStats } from '../utils/combat';
import { SKILL_POOL } from '../data/skills';
import { useAchievementStore } from '../store/achievementStore';

export const AdventureLobby = ({ onSelectBoss, playerCP }: { onSelectBoss: (boss: any) => void; playerCP: number }) => {
    const [selectedElement, setSelectedElement] = useState<string>('All');
    const [selectedBossForDrops, setSelectedBossForDrops] = useState<any>(null);

    useEffect(() => {
        const firstBoss = [...BOSS_LIBRARY].sort((a, b) => a.level - b.level)[0];
        if (firstBoss?.recommendedCP) {
            useAchievementStore.getState().checkCondition('CHECK_CP_READY', {
                playerCP,
                requiredCP: firstBoss.recommendedCP,
            });
        }
    }, [playerCP]);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Common': return 'text-stone-400 border-stone-600';
            case 'Rare': return 'text-blue-400 border-blue-600';
            case 'Epic': return 'text-purple-400 border-purple-600';
            case 'Legendary': return 'text-amber-400 border-amber-600';
            default: return 'text-stone-400 border-stone-600';
        }
    };

    const DropModal = ({ boss, onClose }: { boss: any; onClose: () => void }) => {
        const rarityWeight: Record<string, number> = {
            'Legendary': 1,
            'Epic': 2,
            'Rare': 3,
            'Common': 4,
            'material': 5
        };

        const sortedDropTable = boss.dropTable ? [...boss.dropTable].sort((a: any, b: any) => {
            const getPriority = (item: any) => {
                if (item.type === 'material') return 'material';
                return item.fixedRarity || 'Common';
            };

            const weightA = rarityWeight[getPriority(a)] ?? 99;
            const weightB = rarityWeight[getPriority(b)] ?? 99;

            return weightA - weightB;
        }) : [];

        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-stone-950 border-2 border-amber-900/60 p-6 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-[0_0_25px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-amber-400 mb-4 uppercase tracking-widest text-center drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                        Drops : {boss.name}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-grow">
                        {sortedDropTable.map((item: any, index: number) => {
                            let iconPath = '/Icons/Items/default.png';

                            if (item.type === 'material') {
                                iconPath = `/Icons/Materials/${item.itemId}.png`;
                            } else if (item.type === 'skill') {
                                const foundSkill = SKILL_POOL.find((s: any) => s.id === item.itemId);
                                iconPath = foundSkill?.icon || `/Icons/Skills/skill-${item.itemId}.svg`;
                            } else if (item.type === 'item') {
                                iconPath = `/Icons/Equipments/${item.itemId}.png`;
                            }

                            const bossLevel = boss.level || 1;
                            const maxLevel = Math.floor(bossLevel * 5);
                            const minLevel = Math.max(1, Math.floor(maxLevel * 0.7));

                            return (
                                <div key={index} className="flex items-center justify-between p-2.5 bg-stone-900/90 rounded-xl border border-amber-900/40 hover:border-amber-500/60 transition-all group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 bg-black rounded-lg border border-amber-900/40 flex items-center justify-center p-1 shrink-0">
                                            <img
                                                src={iconPath}
                                                alt={item.itemId}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/Icons/Items/default.png';
                                                }}
                                            />
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <span className="text-stone-100 font-semibold capitalize text-xs truncate group-hover:text-amber-400 transition-colors" title={item.itemId.replace(/_/g, ' ')}>
                                                {item.itemId.replace(/_/g, ' ')}
                                            </span>

                                            <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                                                {item.fixedRarity && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRarityColor(item.fixedRarity)}`}>
                                                        {item.fixedRarity}
                                                    </span>
                                                )}
                                                <span className="text-[9px] text-amber-500/70 uppercase font-mono">
                                                    [{item.type}]
                                                </span>

                                                {item.type === 'item' && (
                                                    <span className="text-[9px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-700/60 px-1.5 rounded">
                                                        {minLevel === maxLevel ? `iLv.${maxLevel}` : `iLv.${minLevel}-${maxLevel}`}
                                                    </span>
                                                )}

                                                {item.amountRange && (
                                                    <span className="text-[9px] text-stone-300 font-mono">
                                                        x{item.amountRange.min}-{item.amountRange.max}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <span className="text-amber-400 font-bold bg-amber-950/80 border border-amber-700/50 px-2 py-1 rounded text-xs shrink-0 ml-2 shadow-[0_0_5px_rgba(245,158,11,0.2)]">
                                        {(item.dropChance * 100).toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={onClose} className="mt-5 w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold rounded-lg transition tracking-wider uppercase border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        Close
                    </button>
                </div>
            </div>
        );
    };

    const filteredBosses = useMemo(() => {
        return selectedElement === 'All'
            ? BOSS_LIBRARY
            : BOSS_LIBRARY.filter(b => b.element === selectedElement);
    }, [selectedElement]);

    const bossesByZone = useMemo(() => {
        return filteredBosses.reduce((acc, boss) => {
            const zone = boss.zone || 'Unknown';
            if (!acc[zone]) acc[zone] = [];
            acc[zone].push(boss);
            acc[zone].sort((a, b) => a.level - b.level);
            return acc;
        }, {} as Record<string, typeof BOSS_LIBRARY>);
    }, [filteredBosses]);

    const elements = ['All', ...Array.from(new Set(BOSS_LIBRARY.map(b => b.element)))];

    const elementColors: Record<string, string> = {
        Fire: "text-red-400",
        Water: "text-blue-400",
        Earth: "text-amber-600",
        Wind: "text-emerald-400",
        Dark: "text-purple-400",
        Holy: "text-yellow-300",
        Neutral: "text-stone-300"
    };

    return (
        <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-amber-400 mb-6 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">Boss Lobby</h1>

            {/* แถบ Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {elements.map(el => (
                    <button
                        key={el}
                        onClick={() => setSelectedElement(el)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${selectedElement === el ? 'bg-amber-600 border-amber-400 text-stone-950 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-stone-900 border-amber-900/40 text-stone-300 hover:bg-stone-800 hover:text-amber-300'}`}
                    >
                        {el}
                    </button>
                ))}
            </div>

            {/* Render บอสตามโซน */}
            {Object.entries(bossesByZone).map(([zoneName, bosses]) => (
                <div key={zoneName} className="mb-8">
                    <h2 className="text-lg font-bold text-amber-500/80 mb-4 uppercase tracking-wider border-b border-amber-900/40 pb-2">
                        {zoneName}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bosses.map((boss) => {
                            const effectiveStats = getEffectiveStats(boss.stats);
                            const isReady = playerCP >= (boss.recommendedCP || 0);

                            const getBossCardBg = (element: string) => {
                                const el = element?.toLowerCase();
                                if (el === 'water' || el === 'ธาตุน้ำ') {
                                    return 'url(/Icons/Backgrounds/BG_BOSS_WATER.png)';
                                } else if (el === 'fire' || el === 'ธาตุไฟ') {
                                    return 'url(/Icons/Backgrounds/BG_BOSS_FIRE.png)';
                                }
                                return 'none';
                            };

                            return (
                                <button
                                    key={boss.id}
                                    onClick={() => onSelectBoss(boss)}
                                    className="w-full p-5 bg-stone-950/80 hover:bg-stone-900 rounded-xl text-left text-white border-2 border-amber-900/50 hover:border-amber-500/60 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] backdrop-blur-[2px] flex flex-col sm:flex-row items-center gap-5 bg-cover bg-center bg-no-repeat relative overflow-hidden group"
                                    style={{
                                        backgroundImage: `${getBossCardBg(boss.element)}, linear-gradient(to right, rgba(3, 7, 18, 0.9), rgba(3, 7, 18, 0.9))`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

                                    <div className="relative z-10 w-full flex flex-col sm:flex-row items-center gap-5">

                                        <div className="relative w-36 h-24 shrink-0 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full transform scale-75 pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>

                                            <img
                                                src={boss.imagePath}
                                                alt={boss.name}
                                                className="relative w-full h-full object-cover [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/Icons/Monsters/Drake.svg';
                                                }}
                                            />
                                        </div>

                                        <div className="grow flex flex-col gap-2.5 w-full min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="w-full">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-base text-stone-100 truncate max-w-[150px] sm:max-w-[180px] drop-shadow group-hover:text-amber-400 transition-colors">{boss.name}</span>
                                                            <span className="px-2 py-0.5 bg-black/80 border border-amber-900/50 rounded-full text-[10px] text-amber-400 font-bold uppercase tracking-widest shadow-inner">
                                                                Lv.{boss.level}
                                                            </span>
                                                            {boss.recommendedCP && (
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${isReady
                                                                    ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400'
                                                                    : 'bg-red-950/80 border-red-700/60 text-red-400'
                                                                    }`}>
                                                                    CP {boss.recommendedCP.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedBossForDrops(boss); }}
                                                            className="text-[11px] text-amber-400 hover:text-amber-300 underline shrink-0 font-medium transition drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]"
                                                        >
                                                            View Drops
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1.5 flex-wrap">
                                                        <div>
                                                            <span className="text-stone-300">Element:</span>
                                                            <span className={`${elementColors[boss.element] || 'text-white'} font-medium ml-1`}>
                                                                {boss.element}
                                                            </span>
                                                        </div>

                                                        <div className="w-[1px] h-3 bg-amber-900/60"></div>

                                                        <div>
                                                            <span className="text-amber-500">Race:</span>
                                                            <span className="text-stone-200 font-medium ml-1">
                                                                {Array.isArray(boss.race) ? boss.race.join(', ') : boss.race}
                                                            </span>
                                                        </div>

                                                        {boss.weakness && (
                                                            <>
                                                                <div className="w-[1px] h-3 bg-amber-900/60"></div>
                                                                <div>
                                                                    <span className="text-purple-400">Weak:</span>
                                                                    <span className="text-stone-100 font-medium ml-1 uppercase">
                                                                        {boss.weakness}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 bg-black/60 p-2.5 rounded-lg border border-amber-900/30">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs text-stone-300">
                                                        HP: <span className="text-emerald-400 font-semibold">{Math.floor(effectiveStats.maxHp).toLocaleString()}</span>
                                                    </p>
                                                    <div className="flex gap-2 text-[10px]">
                                                        <span className="text-blue-400">DEF: {Math.floor(effectiveStats.def)}</span>
                                                        <span className="text-purple-400">RES: {Math.floor(effectiveStats.res)}</span>
                                                        <span className="text-pink-400">MRES: {Math.floor(effectiveStats.mRes || 0)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-cyan-400">
                                                        Hit: {Math.floor(effectiveStats.hit)}
                                                    </div>
                                                </div>

                                                <div className="space-y-0.5">
                                                    <p className="text-xs text-stone-300">
                                                        ATK: <span className="text-emerald-400 font-semibold">{Math.floor(effectiveStats.atk).toLocaleString()}</span>
                                                    </p>
                                                    <div className="flex gap-2 text-[10px]">
                                                        <span className="text-orange-400">Crit: {Math.floor(effectiveStats.critRate)}%</span>
                                                        <span className="text-orange-500">Dmg: {Math.floor(effectiveStats.critDmg)}%</span>
                                                    </div>
                                                    <div className="text-[10px] text-teal-400">
                                                        Flee: {Math.floor(effectiveStats.flee)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {selectedBossForDrops && (
                <DropModal
                    boss={selectedBossForDrops}
                    onClose={() => setSelectedBossForDrops(null)}
                />
            )}
        </div>
    );
}