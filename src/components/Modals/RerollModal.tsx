import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { itemLibrary } from '../../data/itemLibrary';
import { getFullStatRanges, getSpecialBonusRange } from '../../utils/statRanges'; // <-- ดึงมาจากตรงนี้
import {
    STAT_TO_MATERIAL, ELEMENT_BONUS_MATERIAL, RACE_BONUS_MATERIAL,
    UNIVERSAL_MATERIAL, calculateRerollCost,
} from '../../data/rerollConfig';
import type { Item, Stats } from '../../types/game';

interface RerollModalProps {
    item: Item;
    onClose: () => void;
    getRarityColor: (rarity: string) => string;
}

type TargetOption =
    | { kind: 'stat'; key: keyof Stats; value: number }
    | { kind: 'element' | 'race'; label: string; value: number };

export const RerollModal = ({ item, onClose, getRarityColor }: RerollModalProps) => {
    const { player, rerollStat, rerollSpecialBonus } = useGameStore();

    const [selected, setSelected] = useState<TargetOption | null>(null);
    const [useSafetyLock, setUseSafetyLock] = useState(false);
    const [useUniversal, setUseUniversal] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // State สำหรับ Progress Bar
    const [isRerolling, setIsRerolling] = useState(false);
    const [progress, setProgress] = useState(0);

    // Collect available stats/bonuses that can be rerolled
    const statOptions: TargetOption[] = Object.entries(item.stats || {})
        .filter(([key, val]) => !!val && STAT_TO_MATERIAL[key as keyof Stats])
        .map(([key, val]) => ({ kind: 'stat', key: key as keyof Stats, value: val as number }));

    if (item.elementBonus) {
        statOptions.push({ kind: 'element', label: `Element: ${item.elementBonus.type}`, value: item.elementBonus.value });
    }
    if (item.raceBonus) {
        statOptions.push({ kind: 'race', label: `Race: ${item.raceBonus.type}`, value: item.raceBonus.value });
    }

    const getMaterialId = (opt: TargetOption): string => {
        if (opt.kind === 'stat') return STAT_TO_MATERIAL[opt.key]!;
        if (opt.kind === 'element') return ELEMENT_BONUS_MATERIAL;
        return RACE_BONUS_MATERIAL;
    };

    const getMaterialDisplay = (id: string) => {
        const t = itemLibrary.find(i => i.id === id);
        return { name: t?.name || id, icon: t?.icon };
    };

    const cost = selected ? calculateRerollCost(item.rarity, item.itemLevel ?? 1, useSafetyLock, useUniversal) : 0;
    const materialId = selected ? (useUniversal ? UNIVERSAL_MATERIAL : getMaterialId(selected)) : '';
    const materialHave = materialId ? (player.materials[materialId] || 0) : 0;
    const canAfford = materialHave >= cost;

    const handleConfirm = () => {
        if (!selected || !canAfford || isRerolling) return;

        setIsRerolling(true);
        setProgress(0);

        const duration = 1000; // 1 วินาที
        const startTime = Date.now();

        // ทำให้ Progress Bar วิ่งเนียนๆ
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);
        }, 50);

        // สั่งทำงานจริงเมื่อครบเวลา 1 วินาที
        setTimeout(() => {
            clearInterval(interval);
            let res;
            if (selected.kind === 'stat') {
                res = rerollStat(item.uid, selected.key, useSafetyLock, useUniversal);
            } else {
                res = rerollSpecialBonus(item.uid, selected.kind, useSafetyLock, useUniversal);
            }
            setIsRerolling(false);
            setResult(res);
        }, duration);
    };

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={!isRerolling ? onClose : undefined}
        >
            <div
                className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-lg text-white shadow-2xl space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-amber-400">Reroll Stat</h3>

                <div className={`p-3 bg-slate-800 rounded-lg border-2 ${getRarityColor(item.rarity)} flex items-center gap-3`}>
                    {item.icon && <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />}
                    <div>
                        <div className="text-sm font-bold text-slate-100">{item.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Lv.{item.itemLevel ?? 1} · {item.rarity}</div>
                    </div>
                </div>

                {isRerolling ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-4">
                        <div className="text-amber-400 font-bold text-sm animate-pulse">
                            Forging new attributes...
                        </div>
                        <div className="w-full space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                                <span>Progress</span>
                                <span className="font-bold text-amber-400">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div
                                    className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-75 ease-linear rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ) : result ? (
                    <div className={`p-3.5 rounded-lg border text-xs space-y-1 ${result.success ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300' : 'bg-red-950/40 border-red-600 text-red-300'}`}>
                        {result.message}
                    </div>
                ) : (
                    <>
                        <div className="text-xs font-semibold text-slate-300">
                            {selected ? "Selected Target:" : "Select Stat to Reroll:"}
                        </div>

                        {/* แสดงผลเป็น Grid สี่เหลี่ยมผืนผ้า 2 คอลัมน์ หรือแสดงการ์ดเดี่ยวคู่กับปุ่ม Change ทางขวา */}
                        <div className={selected ? "flex gap-2 items-stretch" : "grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1"}>
                            {(selected ? [selected] : statOptions).map((opt, idx) => {
                                const label = opt.kind === 'stat' ? String(opt.key).toUpperCase() : opt.label;
                                const isSelected = selected === opt;
                                const matId = useUniversal ? UNIVERSAL_MATERIAL : getMaterialId(opt);
                                const matDisplay = getMaterialDisplay(matId);
                                const baseCost = calculateRerollCost(item.rarity, item.itemLevel ?? 1, useSafetyLock, useUniversal);
                                const haveCount = player.materials[matId] || 0;
                                const enough = haveCount >= baseCost;

                                // --- ดึง Range ตามที่ ItemDetailModal ใช้จริง ---
                                let minVal = 1;
                                let maxVal = 100;
                                if (opt.kind === 'stat') {
                                    // ส่ง object item เข้าไปตามที่ getFullStatRanges ต้องการ
                                    const statRanges = getFullStatRanges({
                                        slot: item.slot,
                                        weaponType: item.weaponType,
                                        rarity: item.rarity,
                                        itemLevel: item.itemLevel ?? 1,
                                    });
                                    const range = statRanges[opt.key as keyof Stats];
                                    if (range) {
                                        minVal = range.min;
                                        maxVal = range.max;
                                    }
                                } else {
                                    const specialRange = getSpecialBonusRange(item.rarity);
                                    minVal = specialRange.min;
                                    maxVal = specialRange.max;
                                }
                                const isMax = opt.value >= maxVal;
                                // ----------------------------------------------

                                return (
                                    <div key={idx} className={selected ? "flex-1 flex flex-col" : "flex flex-col"}>
                                        <button
                                            onClick={() => setSelected(isSelected ? null : opt)}
                                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex flex-col justify-between h-full ${isSelected
                                                ? 'border-emerald-500 bg-emerald-900/30 ring-1 ring-emerald-500'
                                                : 'border-slate-700 bg-slate-800 hover:bg-slate-700'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center w-full mb-1">
                                                <span className="text-slate-300 font-bold truncate">{label}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-100 font-mono font-bold">{opt.value}</span>
                                                    {isMax && (
                                                        <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded font-bold">
                                                            MAX
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* แสดงผลช่วง Range */}
                                            <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1.5 font-mono">
                                                <span>Range:</span>
                                                <span className="px-1.5 py-0.5 bg-slate-900/80 border border-slate-700/80 rounded text-slate-200 font-semibold">
                                                    {minVal}–{maxVal}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between w-full pt-1.5 border-t border-slate-700/60 text-[10px]">
                                                <span className="text-slate-400 flex items-center gap-1 truncate">
                                                    {matDisplay.icon && <img src={matDisplay.icon} alt="" className="w-3.5 h-3.5 object-contain" />}
                                                    <span className="truncate">{matDisplay.name}</span>
                                                </span>
                                                <span className={`font-mono font-bold ${enough ? 'text-amber-400' : 'text-rose-400'}`}>
                                                    x{baseCost}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}

                            {/* ปุ่ม Change Selection ย้ายมาอยู่ด้านขวาเมื่อมีการเลือก Stat แล้ว */}
                            {selected && (
                                <button
                                    onClick={() => setSelected(null)}
                                    className="w-32 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center p-3 text-center shrink-0"
                                >
                                    Change Selection
                                </button>
                            )}

                            {!selected && statOptions.length === 0 && (
                                <div className="col-span-2 text-center text-slate-500 text-xs py-4">This item has no rerollable stats.</div>
                            )}
                        </div>

                        {selected && (
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                                <label className="flex items-center justify-between text-xs cursor-pointer">
                                    <span className="text-slate-300">Use Primordial Essence (4x Cost)</span>
                                    <input type="checkbox" checked={useUniversal} onChange={(e) => setUseUniversal(e.target.checked)} className="cursor-pointer" />
                                </label>
                                <label className="flex items-center justify-between text-xs cursor-pointer">
                                    <span className="text-slate-300">Safety Lock (Keep old if worse - 3x Cost)</span>
                                    <input type="checkbox" checked={useSafetyLock} onChange={(e) => setUseSafetyLock(e.target.checked)} className="cursor-pointer" />
                                </label>

                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
                                    <span className="text-slate-400">Required Total:</span>
                                    <span className={`font-bold flex items-center gap-1.5 ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {getMaterialDisplay(materialId).icon && (
                                            <img src={getMaterialDisplay(materialId).icon} alt="" className="w-4 h-4 object-contain" />
                                        )}
                                        {getMaterialDisplay(materialId).name} x{cost} (Have {materialHave})
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ซ่อนปุ่มด้านล่างทั้งหมดในขณะที่กำลัง Reroll */}
                {!isRerolling && (
                    <div className="flex justify-end gap-2 pt-2">
                        {result ? (
                            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs cursor-pointer">Close</button>
                        ) : (
                            <>
                                <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs cursor-pointer">Cancel</button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!selected || !canAfford}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded text-xs font-semibold cursor-pointer"
                                >
                                    Confirm Reroll
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};