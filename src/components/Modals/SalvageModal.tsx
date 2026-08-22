import React, { useState } from 'react';
import { useGameStore, SALVAGE_RATES } from '../../store/gameStore';
import { itemLibrary } from '../../data/itemLibrary';
import { SALVAGE_MATERIALS, DEFAULT_SALVAGE_FALLBACK } from '../../data/salvageConfig';
import type { Item } from '../../types/game';

interface SalvageModalProps {
    item: Item;
    onClose: () => void;
    getRarityColor: (rarity: string) => string;
}

export const getExpectedMaterials = (rarity: string) => {
    const table = SALVAGE_MATERIALS[rarity?.toLowerCase()];
    const drops = table ? table.success : DEFAULT_SALVAGE_FALLBACK;

    return drops.map(d => {
        const template = itemLibrary.find(i => i.id === d.id);
        const name = template?.name || d.id.replace(/_/g, ' ');
        const count = d.min === d.max ? `${d.min}` : `${d.min} - ${d.max}`;
        return { name, count };
    });
};

export const SalvageModal: React.FC<SalvageModalProps> = ({ item, onClose, getRarityColor }) => {
    const salvageItem = useGameStore((state) => state.salvageItem);
    const [salvagedResult, setSalvagedResult] = useState<{ success: boolean; materialsGained: { id: string; amount: number }[]; message: string } | null>(null);

    const [isSalvaging, setIsSalvaging] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);

    const rarityKey = item.rarity?.toLowerCase() || 'common';
    const expectedMaterials = getExpectedMaterials(item.rarity);

    const rateConfig = SALVAGE_RATES[rarityKey];
    const successRatePercent = rateConfig ? Math.round(rateConfig.rate * 100) : 80;

    const handleConfirm = () => {
        if (isSalvaging || item.locked) return;

        setIsSalvaging(true);
        setProgressPercent(0);

        const res = salvageItem(item.uid);

        const duration = 700;
        const intervalTime = 25;
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        let currentProgress = 0;
        const timer = setInterval(() => {
            currentProgress += increment;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(timer);
                setProgressPercent(100);

                setSalvagedResult(res);
                setIsSalvaging(false);

                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setProgressPercent(Math.round(currentProgress));
            }
        }, intervalTime);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#171412] border border-[#f59e0b]/30 p-6 rounded-2xl w-full max-w-md text-white shadow-2xl space-y-5 relative">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#f59e0b]/20 pb-4">
                    <h3 className="text-lg font-bold tracking-wide text-[#fbbf24]">
                        {isSalvaging ? 'Salvaging Item...' : salvagedResult ? 'Salvage Report' : 'Confirm Salvage'}
                    </h3>
                    <div className="px-3 py-1 bg-[#292524] border border-[#f59e0b]/30 rounded-lg text-xs font-semibold text-[#fbbf24]">
                        1 Item
                    </div>
                </div>

                {/* Target & Item Info Box */}
                <div className="bg-[#201d1b] border border-[#f59e0b]/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-[#fbbf24] uppercase flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-pulse"></span>
                            TARGET
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-[#34302b] border border-[#f59e0b]/40 rounded-full text-[#fbbf24]">
                            1 Selected
                        </span>
                    </div>

                    {/* Item Card */}
                    <div className={`p-3 bg-[#292524] rounded-xl border-2 ${getRarityColor(item.rarity)} flex items-center gap-3.5`}>
                        {item.icon && (
                            <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />
                        )}
                        <div className="flex-1">
                            <div className="text-sm font-bold text-stone-100">{item.name}</div>
                            <div className="text-[11px] text-[#fbbf24] font-medium uppercase">
                                {item.rarity}
                            </div>
                        </div>
                        <div className="text-xs font-semibold text-stone-300">
                            Success Rate : <span className="text-[#fbbf24] font-bold">{successRatePercent}%</span>
                        </div>
                    </div>
                </div>

                {/* ==================== STATE 2: Loading ==================== */}
                {isSalvaging ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-[#201d1b] border border-[#f59e0b]/30 rounded-xl p-4">
                        <div className="text-[#fbbf24] font-bold animate-pulse text-xs uppercase tracking-wider">
                            Processing Salvage . . .
                        </div>

                        <div className="w-full bg-[#0e0c0a] rounded-full h-3.5 p-0.5 border border-[#f59e0b]/20 overflow-hidden relative">
                            <div
                                className="bg-gradient-to-r from-amber-600 to-[#fbbf24] h-full rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="text-xs font-mono font-bold text-[#fbbf24]">
                            {progressPercent}%
                        </div>
                    </div>
                ) : !salvagedResult ? (
                    /* ==================== STATE 1: Before Salvage ==================== */
                    <div className="bg-[#201d1b] border border-[#f59e0b]/30 rounded-xl p-4 space-y-3">
                        <div className="text-xs font-bold text-[#fbbf24] tracking-wider">
                            Expected Rewards (Estimated) :
                        </div>
                        <div className="flex flex-col gap-2">
                            {expectedMaterials.map((mat, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-[#292524] px-3.5 py-2.5 rounded-lg border border-[#f59e0b]/20">
                                    <span className="text-stone-200 font-medium">{mat.name}</span>
                                    <span className="text-[#fbbf24] font-bold font-mono">~{mat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ==================== STATE 3: Results ==================== */
                    <div className="bg-[#201d1b] border border-[#f59e0b]/30 rounded-xl p-4 space-y-3">
                        <div className={`text-xs font-bold text-center ${salvagedResult.success ? 'text-emerald-400' : 'text-[#fbbf24]'}`}>
                            {salvagedResult.message}
                        </div>
                        <div className="text-[11px] text-[#fbbf24] uppercase text-center font-semibold tracking-wider">
                            You received :
                        </div>
                        <div className="flex flex-col gap-2">
                            {salvagedResult.materialsGained.map((mat, idx) => {
                                const matData = itemLibrary.find(i => i.id === mat.id);
                                const displayName = matData ? matData.name : mat.id.replace(/_/g, ' ');

                                return (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-[#292524] px-3.5 py-2.5 rounded-lg border border-[#f59e0b]/20">
                                        <span className="text-stone-200 font-semibold">{displayName}</span>
                                        <span className="text-emerald-400 font-bold font-mono">
                                            +{mat.amount}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Warning Box */}
                {!salvagedResult && !isSalvaging && (
                    <div className="bg-[#241417] border border-red-500/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-200/90">
                        <span className="text-amber-400 text-sm">⚠️</span>
                        <div>
                            <span className="font-bold text-amber-400">Warning</span>
                            <p className="mt-0.5 text-[11px] text-stone-300">
                                Salvaging <span className="font-bold text-white">1 item</span> will permanently destroy it. Failed items will yield scrap materials instead.
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions Footer */}
                <div className="flex justify-end gap-3 pt-2">
                    {!salvagedResult && !isSalvaging && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-[#292524] hover:bg-[#3b3530] text-stone-300 rounded-xl text-xs font-semibold transition-colors border border-[#f59e0b]/30"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={item.locked}
                                className={`px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95 ${item.locked
                                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-amber-950'
                                    : 'bg-gradient-to-r from-amber-600 to-[#fbbf24] hover:from-amber-500 hover:to-amber-300 text-stone-950 font-bold shadow-lg shadow-amber-500/20'
                                    }`}
                            >
                                {item.locked ? '🔒 Item Locked' : 'Confirm Salvage'}
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};