import React, { useState, useEffect } from 'react';
import { itemLibrary } from '../../data/itemLibrary';
import { SALVAGE_RATES, useGameStore } from '../../store/gameStore';
import type { Item } from '../../types/game';
import { getExpectedMaterials } from './SalvageModal';

export interface BulkSalvageResult {
    success: boolean;
    totalSalvaged: number;
    successCount: number;
    summaryMaterials: { id: string; amount: number }[];
    detailedResults?: {
        itemName: string;
        itemIcon?: string;
        isSuccess: boolean;
        materials: { id: string; amount: number }[];
    }[];
    message: string;
}

interface BulkSalvageModalProps {
    itemsToSalvage: Item[];
    onClose: () => void;
}

const DISPLAY_RARITIES = ['common', 'rare', 'epic'];

export const BulkSalvageModal: React.FC<BulkSalvageModalProps> = ({ itemsToSalvage = [], onClose }) => {
    const salvageAllByRarity = useGameStore((state) => state.salvageAllByRarity);
    const [result, setResult] = useState<BulkSalvageResult | null>(null);

    // State สำหรับจัดการหลอดโหลด
    const [isSalvaging, setIsSalvaging] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            setIsSalvaging(false);
        };
    }, []);

    // คำนวณ Rarity Breakdown
    const rarityCounts = (itemsToSalvage || []).reduce((acc, item) => {
        const key = item.rarity?.toLowerCase() || 'common';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // แจ้งเตือนว่ามีไอเทม locked กี่ชิ้นที่ถูกข้าม (นับเฉพาะ rarity ที่กำลังจะกวาดเท่านั้น)
    const lockedSkipped = useGameStore((state) => state.player.inventory).filter(
        (invItem) => invItem.locked && rarityCounts[invItem.rarity?.toLowerCase() || 'common'] !== undefined
    ).length;

    // เมื่อกดปุ่มยืนยัน ให้เริ่มวิ่งหลอดเปอร์เซ็นต์ก่อน
    const handleConfirmSalvage = () => {
        if (itemsToSalvage.length === 0 || isSalvaging) return;

        setIsSalvaging(true);
        setProgressPercent(0);

        // คำนวณผลลัพธ์จริงเตรียมไว้ก่อน
        const targetRarity = itemsToSalvage[0].rarity?.toLowerCase() || 'common';
        const res = salvageAllByRarity(targetRarity);

        // จำลองเวลาหลอดวิ่งจาก 1% ถึง 100% (ใช้เวลาประมาณ 800 มิลลิวินาที)
        const duration = 800;
        const intervalTime = 30;
        const steps = duration / intervalTime;
        const increment = 100 / steps;

        let currentProgress = 0;
        const timer = setInterval(() => {
            currentProgress += increment;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(timer);
                setProgressPercent(100);
                setResult(res);
                setIsSalvaging(false);
            } else {
                setProgressPercent(Math.round(currentProgress));
            }
        }, intervalTime);
    };

    // ฟังก์ชันคำนวณวัตถุดิบรวมจากไอเทมหลายชิ้นที่จะย่อย
    const getBulkExpectedMaterials = (items: Item[]) => {
        const summary: { [key: string]: { min: number; max: number } } = {};

        items.forEach((item) => {
            const mats = getExpectedMaterials(item.rarity);
            mats.forEach((mat) => {
                if (!summary[mat.name]) {
                    summary[mat.name] = { min: 0, max: 0 };
                }
                const [minStr, maxStr] = mat.count.split(' - ');
                summary[mat.name].min += parseInt(minStr) || 1;
                summary[mat.name].max += parseInt(maxStr || minStr) || 1;
            });
        });

        return Object.keys(summary).map((name) => ({
            name,
            count: `${summary[name].min} - ${summary[name].max}`,
        }));
    };

    // คำนวณเปอร์เซ็นต์ความสำเร็จจริง
    const actualSuccessRate = result && result.totalSalvaged > 0
        ? Math.round((result.successCount / result.totalSalvaged) * 100)
        : 0;

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-stone-900 border border-amber-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl shadow-amber-950/20 space-y-4 max-h-[85vh] flex flex-col">

                {/* Header - ธีมทอง Amber */}
                <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
                    <h2 className="text-amber-400 font-bold text-lg drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                        {isSalvaging ? 'Salvaging Items...' : result ? 'Bulk Salvage Results' : 'Confirm Bulk Salvage'}
                    </h2>
                    <span className="text-xs font-mono bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30 text-amber-300">
                        {result ? `Success ${result.successCount} / ${result.totalSalvaged}` : `${itemsToSalvage.length} Items`}
                    </span>
                </div>

                {/* STATE 3: กำลังวิ่งหลอดโหลด (Loading) */}
                {isSalvaging ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 my-auto">
                        <div className="text-amber-400 animate-pulse text-sm font-semibold">
                            Processing Bulk Salvage . . .
                        </div>

                        {/* หลอดเปอร์เซ็นต์ทอง */}
                        <div className="w-full bg-stone-950 rounded-full h-4 p-0.5 border border-amber-500/30 overflow-hidden relative shadow-inner">
                            <div
                                className="bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 h-full rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-400">
                            {progressPercent}%
                        </div>
                    </div>
                ) : !result ? (
                    /* STATE 1: ก่อนย่อย */
                    <>
                        <div className="bg-stone-950 p-4 rounded-xl border border-amber-500/20 shadow-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-amber-500/10 pb-2.5">
                                <div className="text-xs font-bold text-amber-200 tracking-wide uppercase flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#fbbf24]"></span>
                                    Targets
                                </div>
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/30">
                                    {itemsToSalvage.length} Selected
                                </span>
                            </div>

                            {lockedSkipped > 0 && (
                                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 font-semibold bg-amber-950/30 border border-amber-900/50 rounded-lg px-2.5 py-1.5">
                                    🔒 {lockedSkipped} locked item{lockedSkipped > 1 ? 's' : ''} will be skipped.
                                </div>
                            )}

                            <div className="space-y-2 text-xs">
                                {Object.entries(rarityCounts).map(([rarity, count]) => {
                                    const rateData = SALVAGE_RATES[rarity];
                                    const percentage = rateData ? Math.round(rateData.rate * 100) : 80;
                                    const lowerRarity = rarity.toLowerCase();

                                    const rarityBadgeStyle =
                                        lowerRarity === 'legendary' ? 'bg-amber-950/80 text-amber-300 border-amber-700/50' :
                                            lowerRarity === 'epic' ? 'bg-purple-950/80 text-purple-300 border-purple-700/50' :
                                                lowerRarity === 'rare' ? 'bg-blue-950/80 text-blue-300 border-blue-700/50' :
                                                    'bg-stone-800/80 text-stone-300 border-stone-700';

                                    return (
                                        <div
                                            key={rarity}
                                            className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-2.5 px-3 rounded-lg border border-amber-500/20 flex justify-between items-center w-full shadow-inner"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase border ${rarityBadgeStyle}`}>
                                                    {rarity} ({count})
                                                </span>
                                                <span className="text-[11px] text-stone-300">
                                                    Success Rate : <span className="font-bold text-amber-400">{percentage}%</span>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-amber-500/10 pt-2.5 flex justify-between items-center bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/20">
                                <div className="text-[11px] font-medium text-amber-200">Ready for Salvage</div>
                                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                    {itemsToSalvage.length} Ready
                                </span>
                            </div>
                        </div>

                        {/* Expected Rewards */}
                        <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-500/30 space-y-2 shadow-[inset_0_1px_4px_rgba(251,191,36,0.1)]">
                            <div className="text-xs font-semibold text-amber-300">Expected Rewards (Estimated) :</div>
                            <div className="flex flex-col gap-1.5">
                                {getBulkExpectedMaterials(itemsToSalvage).map((mat, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-stone-950/80 px-2.5 py-1.5 rounded border border-amber-500/20">
                                        <span className="text-stone-300 font-medium">{mat.name}</span>
                                        <span className="text-amber-400 font-bold">~{mat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warning Box */}
                        <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-xs text-red-300 space-y-1">
                            <div className="font-bold text-red-400">⚠️ Warning</div>
                            <div>
                                Salvaging <strong>{itemsToSalvage.length} items</strong> will permanently destroy them. Failed items will yield scrap materials instead.
                            </div>
                        </div>

                        {/* Action Buttons - ปุ่ม Claim/Confirm โทนทอง Amber */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 border border-stone-600 rounded-lg text-xs font-bold text-stone-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSalvage}
                                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 rounded-lg text-xs font-bold text-stone-950 shadow-lg shadow-amber-900/40 border border-amber-400/50 transition-all"
                            >
                                Confirm Salvage All
                            </button>
                        </div>
                    </>
                ) : (
                    /* STATE 2: แสดงผลลัพธ์หลังย่อย */
                    <>
                        <div className="bg-stone-950 rounded-lg p-3 border border-amber-500/20 space-y-2">
                            <div className="flex items-center justify-between text-xs text-stone-300">
                                <span>Base Rate:</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {DISPLAY_RARITIES.map((key) => {
                                        const data = SALVAGE_RATES[key];
                                        if (!data) return null;
                                        const percentage = Math.round(data.rate * 100);
                                        return (
                                            <span key={key} className={`px-2 py-0.5 rounded border text-[11px] font-medium ${data.color}`}>
                                                {data.label}: {percentage}%
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-500/10">
                                <span className="text-stone-300">Batch Success Rate:</span>
                                <span className="font-bold font-mono text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]">
                                    {actualSuccessRate}%
                                </span>
                            </div>
                        </div>

                        <div className={`p-2.5 rounded-lg text-xs font-medium text-center border ${result.successCount === result.totalSalvaged
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                                : 'bg-amber-950/20 text-amber-200 border-amber-500/30'
                            }`}>
                            {result.message}
                        </div>

                        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                            {result.detailedResults && result.detailedResults.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-amber-400/90 mb-2">Item Breakdown:</h3>
                                    <div className="space-y-1.5">
                                        {result.detailedResults.map((item, idx) => (
                                            <div key={idx} className="bg-stone-950 border border-amber-500/20 rounded p-2 text-xs flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {item.itemIcon && <img src={item.itemIcon} alt="" className="w-5 h-5 object-contain" />}
                                                    <span className="font-medium text-stone-200">{item.itemName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${item.isSuccess
                                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                            : 'bg-red-900/40 text-red-300 border border-red-800/50'
                                                        }`}>
                                                        {item.isSuccess ? 'Success' : 'Scrap'}
                                                    </span>
                                                    <div className="text-[11px] text-stone-300">
                                                        {item.materials?.map(m => {
                                                            const matData = itemLibrary.find(i => i.id === m.id);
                                                            return `${matData?.name || m.id} +${m.amount}`;
                                                        }).join(', ')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.summaryMaterials && result.summaryMaterials.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-amber-400/90 mb-2">Total Materials Acquired:</h3>
                                    <div className="space-y-1.5">
                                        {result.summaryMaterials.map((mat) => {
                                            const itemData = itemLibrary.find(i => i.id === mat.id);
                                            const displayName = itemData ? itemData.name : mat.id.replace(/_/g, ' ');

                                            return (
                                                <div key={mat.id} className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5 flex justify-between items-center shadow-[inset_0_1px_3px_rgba(251,191,36,0.1)]">
                                                    <span className="text-stone-200 font-medium text-xs">{displayName}</span>
                                                    <span className="text-amber-400 font-mono font-bold text-sm drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]">+{mat.amount}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.99] border border-amber-400/50 rounded-lg text-stone-950 font-bold text-xs shadow-lg shadow-amber-900/40 transition-all"
                        >
                            Close
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};