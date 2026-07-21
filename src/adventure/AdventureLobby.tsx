import React, { useState, useMemo } from 'react';
import { BOSS_LIBRARY } from '../data/bossLibrary';
import { getEffectiveStats } from '../utils/combat';
import { itemLibrary } from '../data/itemLibrary'; // import เข้ามา
import { WEAKNESS_BONUS_RATE } from '../types/game';




export const AdventureLobby = ({ onSelectBoss }: { onSelectBoss: (boss: any) => void }) => {
    const [selectedElement, setSelectedElement] = useState<string>('All');
    const [selectedBossForDrops, setSelectedBossForDrops] = useState<any>(null);

    const WEAKNESS_DISPLAY_PERCENT = 20;

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Common': return 'text-slate-400 border-slate-600';
            case 'Rare': return 'text-blue-400 border-blue-600';
            case 'Epic': return 'text-purple-400 border-purple-600';
            case 'Legendary': return 'text-amber-400 border-amber-600';
            default: return 'text-slate-400 border-slate-600';
        }
    };

    const DropModal = ({ boss, onClose }: { boss: any; onClose: () => void }) => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Drops : {boss.name}</h3>

                <div className="space-y-2">
                    {boss.dropTable?.map((item: any, index: number) => {
                        // ดึงข้อมูลจาก Library โดยใช้ itemId
                        const itemData = itemLibrary[item.itemId];

                        return (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700">
                                <div className="flex items-center gap-3">
                                    {/* ส่วนแสดงรูปไอเทม */}
                                    <div className="w-10 h-10 bg-slate-950 rounded border border-slate-700 flex items-center justify-center">
                                        <img
                                            src={
                                                item.type === 'material'
                                                    ? `/Icons/Materials/${item.itemId}.svg`
                                                    : `/Icons/Equipments/${item.itemId}.svg`
                                            }
                                            alt={itemData?.name || 'Item'}
                                            className="w-8 h-8 object-contain"
                                            onError={(e) => {
                                                // ถ้าไฟล์รูปไม่พบ ให้เด้งไปรูป Default
                                                e.currentTarget.src = '/Icons/Items/default.png';
                                            }}
                                        />
                                    </div>
                                    {/* ส่วนแสดงชื่อ */}
                                    {/* ส่วนแสดงชื่อและข้อมูลเพิ่มเติม */}
                                    <div className="flex flex-col">
                                        <span className="text-slate-200 font-medium capitalize">
                                            {item.itemId.replace('_', ' ')}
                                        </span>

                                        <div className="flex gap-2 items-center">
                                            {/* แสดง Rarity ถ้ามี */}
                                            {item.fixedRarity && (
                                                <span className={`text-[10px] font-bold px-1 rounded border ${getRarityColor(item.fixedRarity)}`}>
                                                    {item.fixedRarity}
                                                </span>
                                            )}
                                            {/* แสดง AmountRange ถ้ามี */}
                                            {item.amountRange && (
                                                <span className="text-[10px] text-slate-400">
                                                    X {item.amountRange.min}-{item.amountRange.max}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ส่วนแสดงโอกาสดรอป */}
                                <span className="text-amber-400 font-bold bg-amber-950/30 px-2 py-1 rounded text-sm">
                                    {(item.dropChance * 100).toFixed(0)}%
                                </span>
                            </div>
                        );
                    }) || <p className="text-slate-500 italic">No drops available.</p>}
                </div>

                <button onClick={onClose} className="mt-6 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold transition">
                    Close
                </button>
            </div>
        </div>
    );

    // 1. ระบบ Filter ตามธาตุ
    const filteredBosses = useMemo(() => {
        return selectedElement === 'All'
            ? BOSS_LIBRARY
            : BOSS_LIBRARY.filter(b => b.element === selectedElement);
    }, [selectedElement]);

    // 2. จัดกลุ่มบอสตามโซน (Zone)
    const bossesByZone = useMemo(() => {
        return filteredBosses.reduce((acc, boss) => {
            const zone = boss.zone || 'Unknown';
            if (!acc[zone]) acc[zone] = [];
            acc[zone].push(boss);
            // เรียงตามเลเวลภายในโซน
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
        <div className="max-w-2xl mx-auto">
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
                    <h2 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-wider">
                        {zoneName}
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        {bosses.map((boss) => {
                            const effectiveStats = getEffectiveStats(boss.stats);

                            return (
                                <button
                                    key={boss.id}
                                    onClick={() => onSelectBoss(boss)}
                                    className="p-5 bg-slate-800 hover:bg-slate-700 rounded-lg text-left text-white border border-slate-600 transition flex items-center gap-4"
                                >
                                    {/* ส่วนรูปมอนสเตอร์ */}
                                    <div className="w-25 h-25 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                                        <img
                                            src={boss.imagePath}
                                            alt={boss.name}
                                            className="w-full h-full object-contain p-2"
                                            onError={(e) => {
                                                e.currentTarget.src = '/Icons/Monsters/default.png';
                                            }}
                                        />
                                    </div>

                                    {/* ส่วนรายละเอียดเนื้อหา */}
                                    <div className="flex-grow flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg text-white">{boss.name}</span>
                                                    <span className="px-1.5 py-0.5 bg-amber-900/50 border border-amber-700 rounded text-[10px] text-amber-400 font-bold">
                                                        Lv.{boss.level}
                                                    </span>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedBossForDrops(boss); }}
                                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                                                    >
                                                        View Drops
                                                    </button>
                                                </div>

                                                {/* เพิ่ม Weakness ต่อจาก Race ตรงนี้ครับ */}
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                                                    <div>
                                                        <span className="text-slate-500">Element:</span>
                                                        <span className={`${elementColors[boss.element] || 'text-white'} font-medium ml-1`}>
                                                            {boss.element}
                                                        </span>
                                                    </div>

                                                    <div className="w-[1px] h-3 bg-slate-700"></div>

                                                    <div>
                                                        <span className="text-slate-500">Race:</span>
                                                        <span className="text-slate-200 font-medium ml-1">{boss.race}</span>
                                                    </div>

                                                    {/* --- ส่วนที่เพิ่มเข้ามาสำหรับแสดง Weakness --- */}
                                                    {boss.weakness && (
                                                        <>
                                                            <div className="w-[1px] h-3 bg-slate-700"></div>
                                                            <div>
                                                                <span className="text-slate-500">Weakness:</span>
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
                                        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded border border-slate-700/50">
                                            <div className="space-y-1">
                                                <p className="text-xs">
                                                    HP: <span className="text-emerald-400">{effectiveStats.maxHp.toLocaleString()}</span>
                                                </p>
                                                <div className="flex gap-2">
                                                    <p className="text-[10px] text-blue-400">DEF: {Math.floor(effectiveStats.def)}</p>
                                                    <p className="text-[10px] text-purple-400">RES: {Math.floor(effectiveStats.res)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs">
                                                    ATK: <span className="text-emerald-400">{effectiveStats.atk.toLocaleString()}</span>
                                                </p>
                                                <div className="flex gap-2">
                                                    <p className="text-[10px] text-orange-400">Cri.Rate: {effectiveStats.critRate}%</p>
                                                    <p className="text-[10px] text-orange-600">Cri.Dmg: {effectiveStats.critDmg}%</p>
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