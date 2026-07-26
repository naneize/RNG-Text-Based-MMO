import React, { useState } from 'react';
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

    // 🟢 เพิ่ม State สำหรับจัดการหลอดโหลด
    const [isSalvaging, setIsSalvaging] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);

    // คำนวณ Rarity Breakdown
    const rarityCounts = (itemsToSalvage || []).reduce((acc, item) => {
        const key = item.rarity?.toLowerCase() || 'common';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

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
                // พอหลอดเต็ม 100% ให้แสดงผลลัพธ์จริง
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
            const mats = getExpectedMaterials(item.rarity); // ใช้ฟังก์ชันเดิมที่มีอยู่แล้ว
            mats.forEach((mat) => {
                // สมมติว่า mat.count อยู่ในรูป "1 - 3" หรือแปลงตัวเลขตามต้องการ
                // นำมาบวกสะสมยอด Min-Max ของวัตถุดิบแต่ละชนิด
                if (!summary[mat.name]) {
                    summary[mat.name] = { min: 0, max: 0 };
                }
                // แปลง string ช่วงจำนวน (เช่น "1 - 2") เป็นตัวเลขเพื่อนำมาบวกกัน
                const [minStr, maxStr] = mat.count.split(' - ');
                summary[mat.name].min += parseInt(minStr) || 1;
                summary[mat.name].max += parseInt(maxStr || minStr) || 1;
            });
        });

        // แปลงผลลัพธ์กลับเป็น Array เพื่อเอาไป .map() แสดงผลใน UI
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
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-xl space-y-4 max-h-[85vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h2 className="text-amber-400 font-bold text-lg">
                        {isSalvaging ? 'Salvaging Items...' : result ? 'Bulk Salvage Results' : 'Confirm Bulk Salvage'}
                    </h2>
                    <span className="text-xs font-mono  bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                        {result ? `Success ${result.successCount} / ${result.totalSalvaged}` : `${itemsToSalvage.length} Items`}
                    </span>
                </div>

                {/* ==================== STATE 3: กำลังวิ่งหลอดโหลด (Loading) ==================== */}
                {isSalvaging ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 my-auto">
                        <div className="text-amber-400 animate-pulse text-sm">
                            Processing Bulk Salvage . . .
                        </div>

                        {/* หลอดเปอร์เซ็นต์ */}
                        <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-800 overflow-hidden relative">
                            <div
                                className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-75"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-400">
                            {progressPercent}%
                        </div>
                    </div>
                ) : !result ? (
                    /* ==================== STATE 1: ก่อนย่อย ==================== */
                    <>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 shadow-xl space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                                <div className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Targets
                                </div>
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 font-semibold border border-slate-800">
                                    {itemsToSalvage.length} Selected
                                </span>
                            </div>

                            {/* Rarity Breakdown List (คลีนๆ ไม่มีคำว่า items ซ้ำซ้อน) */}
                            <div className="space-y-2 text-xs">
                                {Object.entries(rarityCounts).map(([rarity, count]) => {
                                    const rateData = SALVAGE_RATES[rarity];
                                    const percentage = rateData ? Math.round(rateData.rate * 100) : 80;
                                    const lowerRarity = rarity.toLowerCase();

                                    const rarityBadgeStyle =
                                        lowerRarity === 'legendary' ? 'bg-amber-950/80 text-amber-300 border-amber-700/50' :
                                            lowerRarity === 'epic' ? 'bg-purple-950/80 text-purple-300 border-purple-700/50' :
                                                lowerRarity === 'rare' ? 'bg-blue-950/80 text-blue-300 border-blue-700/50' :
                                                    'bg-slate-800/80 text-slate-300 border-slate-700';

                                    return (
                                        <div
                                            key={rarity}
                                            className="bg-slate-900/80 hover:bg-slate-900 transition-colors p-2.5 px-3 rounded-lg border border-slate-800/80 flex justify-between items-center w-full shadow-inner"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase border ${rarityBadgeStyle}`}>
                                                    {rarity}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    Suscess Rate : <span className="font-bold text-amber-400">{percentage}%</span>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer Status Summary (ยุบรวมข้อความให้กระชับ ไม่รก) */}
                            <div className="border-t border-slate-800/60 pt-2.5 flex justify-between items-center bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/50">
                                <div className="flex items-center gap-2">

                                    <div className="text-[11px] font-medium text-slate-300">Ready for Salvage</div>
                                </div>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    {itemsToSalvage.length} Ready
                                </span>
                            </div>
                        </div>

                        {/* 🎁 ส่วนแสดง Expected Rewards แบบไดนามิก */}
                        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                            <div className="text-xs font-semibold text-slate-300">Expected Rewards (Estimated) :</div>
                            <div className="flex flex-col gap-1.5">
                                {getBulkExpectedMaterials(itemsToSalvage).map((mat, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/50 px-2.5 py-1.5 rounded border border-slate-800">
                                        <span className="text-slate-400 font-medium">{mat.name}</span>
                                        <span className="text-emerald-400 font-bold">~{mat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-xs text-red-300 space-y-1">
                            <div className="font-bold text-red-400">⚠️ Warning</div>
                            <div>
                                Salvaging <strong>{itemsToSalvage.length} items</strong> will permanently destroy them. Failed items will yield scrap materials instead.
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSalvage}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 rounded-lg text-xs font-bold text-white shadow-lg shadow-red-900/30 transition-all"
                            >
                                Confirm Salvage All
                            </button>
                        </div>
                    </>
                ) : (
                    /* ==================== STATE 2: แสดงผลลัพธ์หลังย่อย ==================== */
                    <>
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
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

                            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                                <span className="text-slate-400">Batch Success Rate:</span>
                                <span className={`font-bold font-mono ${actualSuccessRate >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {actualSuccessRate}%
                                </span>
                            </div>
                        </div>

                        <div className={`p-2.5 rounded-lg text-xs font-medium text-center border ${result.successCount === result.totalSalvaged
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                            : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                            }`}>
                            {result.message}
                        </div>

                        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                            {result.detailedResults && result.detailedResults.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 mb-2">Item Breakdown:</h3>
                                    <div className="space-y-1.5">
                                        {result.detailedResults.map((item, idx) => (
                                            <div key={idx} className="bg-slate-950 border border-slate-800 rounded p-2 text-xs flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {item.itemIcon && <img src={item.itemIcon} alt="" className="w-5 h-5 object-contain" />}
                                                    <span className="font-medium text-slate-200">{item.itemName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${item.isSuccess
                                                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50'
                                                        : 'bg-red-900/40 text-red-300 border border-red-800/50'
                                                        }`}>
                                                        {item.isSuccess ? 'Success' : 'Scrap'}
                                                    </span>
                                                    <div className="text-[11px] text-slate-400">
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
                                    <h3 className="text-xs font-bold text-slate-400 mb-2">Total Materials Acquired:</h3>
                                    <div className="space-y-1.5">
                                        {result.summaryMaterials.map((mat) => {
                                            const itemData = itemLibrary.find(i => i.id === mat.id);
                                            const displayName = itemData ? itemData.name : mat.id.replace(/_/g, ' ');

                                            return (
                                                <div key={mat.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-2.5 flex justify-between items-center">
                                                    <span className="text-slate-200 font-medium text-xs">{displayName}</span>
                                                    <span className="text-emerald-400 font-mono font-bold text-sm">+{mat.amount}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] border border-slate-600 rounded-lg text-white font-bold text-xs transition-all"
                        >
                            Close
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};