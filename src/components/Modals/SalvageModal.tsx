import React, { useState } from 'react';
import { useGameStore, SALVAGE_RATES } from '../../store/gameStore';
import { itemLibrary } from '../../data/itemLibrary';
import { SALVAGE_MATERIALS, DEFAULT_SALVAGE_FALLBACK } from '../../data/salvageConfig'; // ✅ เพิ่มบรรทัดนี้
import type { Item } from '../../types/game';

interface SalvageModalProps {
    item: Item;
    onClose: () => void;
    getRarityColor: (rarity: string) => string;
}


// ฟังก์ชันพรีวิว Expected Rewards (กรณีสุ่มย่อยสำเร็จ) — ดึงจาก SALVAGE_MATERIALS ที่เดียวกับ gameStore.ts
export const getExpectedMaterials = (rarity: string) => {
    const table = SALVAGE_MATERIALS[rarity?.toLowerCase()];
    const drops = table ? table.success : DEFAULT_SALVAGE_FALLBACK;

    return drops.map(d => {
        const template = itemLibrary.find(i => i.id === d.id);
        const name = template?.name || d.id.replace(/_/g, ' '); // เผื่อ id ไหนหาไม่เจอ ยังอ่านออกอยู่
        const count = d.min === d.max ? `${d.min}` : `${d.min} - ${d.max}`;
        return { name, count };
    });
};


export const SalvageModal: React.FC<SalvageModalProps> = ({ item, onClose, getRarityColor }) => {
    const salvageItem = useGameStore((state) => state.salvageItem);
    const [salvagedResult, setSalvagedResult] = useState<{ success: boolean; materialsGained: { id: string; amount: number }[]; message: string } | null>(null);

    // 🟢 เพิ่ม State สำหรับจัดการหลอดโหลด
    const [isSalvaging, setIsSalvaging] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);

    const rarityKey = item.rarity?.toLowerCase() || 'common';
    const expectedMaterials = getExpectedMaterials(item.rarity);

    // 🎲 อ่านเรตความสำเร็จจาก Config กลางใน gameStore
    const rateConfig = SALVAGE_RATES[rarityKey];
    const successRatePercent = rateConfig ? Math.round(rateConfig.rate * 100) : 80;

    const handleConfirm = () => {
        if (isSalvaging) return;

        setIsSalvaging(true);
        setProgressPercent(0);

        // คำนวณผลลัพธ์จริงเตรียมไว้ก่อน
        const res = salvageItem(item.uid);

        // จำลองเวลาหลอดวิ่งจาก 1% ถึง 100% (ใช้เวลาประมาณ 700 มิลลิวินาที)
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

                // พอหลอดเต็ม 100% ให้แสดงผลลัพธ์จริง และตั้งเวลาปิด Modal อัตโนมัติ
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm text-white shadow-2xl space-y-4">

                <h3 className="text-lg font-bold text-amber-400">
                    {isSalvaging ? 'Salvaging Item...' : salvagedResult ? 'Salvage Results' : 'Confirm Salvage'}
                </h3>

                <div className={`p-3 bg-slate-800 rounded-lg border-2 ${getRarityColor(item.rarity)} flex items-center gap-3`}>
                    {item.icon && <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />}
                    <div>
                        <div className="text-sm font-bold text-slate-100">{item.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Rarity: {item.rarity}</div>
                    </div>
                </div>

                {/* ==================== STATE 2: กำลังวิ่งหลอดโหลด (Loading) ==================== */}
                {isSalvaging ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <div className="text-amber-400 font-bold animate-pulse text-xs">
                            Processing Salvage . . .
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
                ) : !salvagedResult ? (
                    /* ==================== STATE 1: ก่อนย่อย ==================== */
                    <>
                        {/* 📊 ส่วนแสดง % โอกาสสำเร็จจาก Config กลาง */}
                        <div className="bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                            <span className="text-slate-300">Success Rate :</span>
                            <span className="text-amber-400 font-bold">{successRatePercent}% (Fail yields scrap)</span>
                        </div>

                        {/* ส่วนแสดงพรีวิววัสดุก่อนย่อย */}
                        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                            <div className="text-xs font-semibold text-slate-300">Expected Rewards :</div>
                            <div className="flex flex-col gap-1.5">
                                {expectedMaterials.map((mat, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/50 px-2.5 py-1.5 rounded">
                                        <span className="text-slate-400 font-medium">{mat.name}</span>
                                        <span className="text-emerald-400 font-bold">+{mat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-slate-400">
                            Salvaging this item will destroy it permanently. Do you wish to proceed?
                        </p>
                    </>
                ) : (
                    /* ==================== STATE 3: แสดงผลลัพธ์จริงหลังกดสุ่มย่อย ==================== */
                    <div className={`p-3.5 rounded-lg border space-y-2.5 animate-fadeIn ${salvagedResult.success ? 'bg-slate-800/80 border-emerald-500/50' : 'bg-slate-800/80 border-amber-500/50'
                        }`}>
                        <div className={`text-xs font-bold text-center ${salvagedResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {salvagedResult.message}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase text-center">You received :</div>
                        <div className="flex flex-col gap-1.5">
                            {salvagedResult.materialsGained.map((mat, idx) => {
                                // 🔍 ดึงชื่อเต็มของ Material จาก itemLibrary
                                const matData = itemLibrary.find(i => i.id === mat.id);
                                const displayName = matData ? matData.name : mat.id.replace(/_/g, ' ');

                                return (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                                        <span className="text-slate-200 font-semibold">{displayName}</span>
                                        <span className="text-emerald-400 font-bold">
                                            +{mat.amount}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    {!salvagedResult && !isSalvaging && (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-xs font-semibold transition-colors"
                            >
                                Confirm Salvage
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};