import React, { useState, useMemo } from 'react';
import { BOSS_LIBRARY } from '../data/bossLibrary';
import { getEffectiveStats } from '../utils/combat';
import { SKILL_POOL } from '../data/skills';

export const AdventureLobby = ({ onSelectBoss }: { onSelectBoss: (boss: any) => void }) => {
    const [selectedElement, setSelectedElement] = useState<string>('All');
    const [selectedBossForDrops, setSelectedBossForDrops] = useState<any>(null);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Common': return 'text-slate-400 border-slate-600';
            case 'Rare': return 'text-blue-400 border-blue-600';
            case 'Epic': return 'text-purple-400 border-purple-600';
            case 'Legendary': return 'text-amber-400 border-amber-600';
            default: return 'text-slate-400 border-slate-600';
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
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-white mb-4">Drops : {boss.name}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-grow">
                        {sortedDropTable.map((item: any, index: number) => {
                            let iconPath = '/Icons/Items/default.png';

                            if (item.type === 'material') {
                                iconPath = `/Icons/Materials/${item.itemId}.svg`;
                            } else if (item.type === 'skill') {
                                const foundSkill = SKILL_POOL.find((s: any) => s.id === item.itemId);
                                iconPath = foundSkill?.icon || `/Icons/Skills/skill-${item.itemId}.svg`;
                            } else if (item.type === 'item') {
                                iconPath = `/Icons/Equipments/${item.itemId}.svg`;
                            }

                            return (
                                <div key={index} className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80 hover:border-slate-600 transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 bg-slate-950 rounded border border-slate-700 flex items-center justify-center p-1 shrink-0">
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
                                            <span className="text-slate-100 font-semibold capitalize text-xs truncate" title={item.itemId.replace(/_/g, ' ')}>
                                                {item.itemId.replace(/_/g, ' ')}
                                            </span>

                                            <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                                                {item.fixedRarity && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRarityColor(item.fixedRarity)}`}>
                                                        {item.fixedRarity}
                                                    </span>
                                                )}
                                                <span className="text-[9px] text-slate-400 uppercase">
                                                    [{item.type}]
                                                </span>
                                                {item.amountRange && (
                                                    <span className="text-[9px] text-slate-300">
                                                        x{item.amountRange.min}-{item.amountRange.max}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <span className="text-amber-400 font-bold bg-amber-950/40 border border-amber-900/50 px-2 py-1 rounded text-xs shrink-0 ml-2">
                                        {(item.dropChance * 100).toFixed(0)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={onClose} className="mt-5 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold transition">
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
        Neutral: "text-slate-300"
    };

    return (
        /* 🟢 ขยายความกว้างสูงสุดของหน้าต่าง Lobby เพื่อรองรับ Grid 2 คอลัมน์ */
        <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-white mb-6">Boss Lobby</h1>

            {/* แถบ Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {elements.map(el => (
                    <button
                        key={el}
                        onClick={() => setSelectedElement(el)}
                        className={`px-4 py-1 rounded-full text-sm border transition ${selectedElement === el ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                    >
                        {el}
                    </button>
                ))}
            </div>

            {/* Render บอสตามโซน */}
            {Object.entries(bossesByZone).map(([zoneName, bosses]) => (
                <div key={zoneName} className="mb-8">
                    <h2 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-wider border-b border-slate-800 pb-2">
                        {zoneName}
                    </h2>

                    {/* 🟢 เปลี่ยนเป็น Grid 2 คอลัมน์สำหรับหน้าจอขนาดกลางขึ้นไป */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bosses.map((boss) => {
                            const effectiveStats = getEffectiveStats(boss.stats);

                            return (
                                <button
                                    key={boss.id}
                                    onClick={() => onSelectBoss(boss)}
                                    className="p-4 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-left text-white border border-slate-700 hover:border-slate-500 transition flex flex-col sm:flex-row items-center gap-4 shadow-lg group"
                                >
                                    {/* ส่วนรูปมอนสเตอร์ */}
                                    <div className="w-20 h-20 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-indigo-500/50 transition">
                                        <img
                                            src={boss.imagePath}
                                            alt={boss.name}
                                            className="w-14 h-14 object-cover rounded-md"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/Icons/Monsters/Drake.svg';
                                            }}
                                        />
                                    </div>

                                    {/* ส่วนรายละเอียดเนื้อหา */}
                                    <div className="flex-grow flex flex-col gap-2.5 w-full min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="w-full">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-base text-white truncate max-w-[150px] sm:max-w-[180px]">{boss.name}</span>
                                                        <span className="px-1.5 py-0.5 bg-amber-900/50 border border-amber-700 rounded text-[10px] text-amber-400 font-bold shrink-0">
                                                            Lv.{boss.level}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedBossForDrops(boss); }}
                                                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline shrink-0 font-medium"
                                                    >
                                                        View Drops
                                                    </button>
                                                </div>

                                                {/* รายละเอียด Element, Race, Weakness */}
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                                                    <div>
                                                        <span className="text-slate-300">Element:</span>
                                                        <span className={`${elementColors[boss.element] || 'text-white'} font-medium ml-1`}>
                                                            {boss.element}
                                                        </span>
                                                    </div>

                                                    <div className="w-[1px] h-3 bg-slate-700"></div>

                                                    <div>
                                                        <span className="text-orange-400">Race:</span>
                                                        <span className="text-slate-200 font-medium ml-1">
                                                            {Array.isArray(boss.race) ? boss.race.join(', ') : boss.race}
                                                        </span>
                                                    </div>

                                                    {boss.weakness && (
                                                        <>
                                                            <div className="w-[1px] h-3 bg-slate-700"></div>
                                                            <div>
                                                                <span className="text-purple-400">Weak:</span>
                                                                <span className="text-slate-100 font-medium ml-1 uppercase">
                                                                    {boss.weakness}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ข้อมูล Combat Preview */}
                                        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-700/50">
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-slate-300">
                                                    HP: <span className="text-emerald-400 font-semibold">{Math.floor(effectiveStats.maxHp).toLocaleString()}</span>
                                                </p>
                                                <div className="flex gap-2 text-[10px]">
                                                    <span className="text-blue-400">DEF: {Math.floor(effectiveStats.def)}</span>
                                                    <span className="text-purple-400">RES: {Math.floor(effectiveStats.res)}</span>
                                                </div>
                                                <div className="text-[10px] text-cyan-400">
                                                    Hit: {Math.floor(effectiveStats.hit)}
                                                </div>
                                            </div>

                                            <div className="space-y-0.5">
                                                <p className="text-xs text-slate-300">
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
};