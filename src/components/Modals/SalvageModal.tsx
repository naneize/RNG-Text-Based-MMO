import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Item } from '../../types/game';

interface SalvageModalProps {
    item: Item;
    onClose: () => void;
    getRarityColor: (rarity: string) => string;
}

// ฟังก์ชันดึงเปอร์เซ็นต์เรตตาม Rarity สำหรับแสดงบน UI
const getSuccessRateText = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
        case 'common': return '90%';
        case 'rare': return '75%';
        case 'epic': return '55%';
        case 'legendary': return '35%';
        default: return '80%';
    }
};

// ฟังก์ชันพรีวิว Expected Rewards (ตามเรตของ Store)
const getExpectedMaterials = (rarity: string) => {
    switch (rarity.toLowerCase()) {
        case 'common':
            return [
                { name: 'Iron Ore', count: '1 - 3' },
                { name: 'Leather', count: '1 - 2' }
            ];
        case 'rare':
            return [
                { name: 'Magic Dust', count: '2 - 4' },
                { name: 'Mithril', count: '1 - 2' },
                { name: 'Steel Ingot', count: '2' }
            ];
        case 'epic':
            return [
                { name: 'Dark Crystal', count: '1 - 2' },
                { name: 'Dragon Scale', count: '1' },
                { name: 'Gold Ore', count: '2 - 4' }
            ];
        case 'legendary':
            return [
                { name: 'Void Essence', count: '1' },
                { name: 'Celestial Shard', count: '1 - 2' },
                { name: 'Ancient Rune', count: '1' },
                { name: 'Primordial Essence', count: '1' }
            ];
        default:
            return [{ name: 'Iron Ore', count: '1' }];
    }
};

export const SalvageModal: React.FC<SalvageModalProps> = ({ item, onClose, getRarityColor }) => {
    const salvageItem = useGameStore((state) => state.salvageItem);
    const [salvagedResult, setSalvagedResult] = useState<{ success: boolean; materialsGained: { id: string; amount: number }[]; message: string } | null>(null);

    const expectedMaterials = getExpectedMaterials(item.rarity);
    const successRateDisplay = getSuccessRateText(item.rarity);

    const handleConfirm = () => {
        const res = salvageItem(item.uid);
        setSalvagedResult(res);

        // ตั้งเวลาปิด Modal อัตโนมัติทุกครั้ง ไม่ว่าจะสำเร็จหรือพลาด
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm text-white shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-amber-400">Confirm Salvage</h3>

                <div className={`p-3 bg-slate-800 rounded-lg border-2 ${getRarityColor(item.rarity)} flex items-center gap-3`}>
                    {item.icon && <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />}
                    <div>
                        <div className="text-sm font-bold text-slate-100">{item.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">Rarity: {item.rarity}</div>
                    </div>
                </div>

                {!salvagedResult ? (
                    <>
                        {/* ส่วนแสดง % โอกาสสำเร็จตาม Rarity จริง */}
                        <div className="bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700 flex items-center justify-between text-xs">
                            <span className="text-slate-300">Success Rate:</span>
                            <span className="text-amber-400 font-bold">{successRateDisplay} (Fail yields scrap)</span>
                        </div>

                        {/* ส่วนแสดงพรีวิววัสดุก่อนย่อย */}
                        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-2">
                            <div className="text-xs font-semibold text-slate-300">Expected Rewards:</div>
                            <div className="flex flex-col gap-1.5">
                                {expectedMaterials.map((mat, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-900/50 px-2.5 py-1.5 rounded">
                                        <span className="text-amber-300 font-medium">{mat.name}</span>
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
                    /* ส่วนแสดงผลลัพธ์จริงหลังกดสุ่มย่อย */
                    <div className={`p-3.5 rounded-lg border space-y-2.5 animate-fadeIn ${salvagedResult.success ? 'bg-slate-800/80 border-emerald-500/50' : 'bg-slate-800/80 border-amber-500/50'
                        }`}>
                        <div className={`text-xs font-bold text-center ${salvagedResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {salvagedResult.message}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase text-center">You received:</div>
                        <div className="flex flex-col gap-1.5">
                            {salvagedResult.materialsGained.map((mat, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                                    <span className="text-amber-300 font-semibold capitalize">{mat.id.replace(/_/g, ' ')}</span>
                                    <span className={salvagedResult.success ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                                        +{mat.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    {!salvagedResult && (
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