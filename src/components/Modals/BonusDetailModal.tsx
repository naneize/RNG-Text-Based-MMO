// components/modals/BonusDetailModal.tsx
import type { Item } from '../../types/game';

interface BonusDetailModalProps {
    setShowBonusModal: (show: boolean) => void;
    getCombinedBonuses: (equipment: Record<string, Item | null>) => {
        elements: Array<{ type: string; value: number }>;
        races: Array<{ type: string; value: number }>;
    };
    equippedItems: Record<string, Item | null>;
}

export const BonusDetailModal = ({ setShowBonusModal, getCombinedBonuses, equippedItems }: BonusDetailModalProps) => {

    // 📌 ดึงข้อมูลแบบเจาะจงรายชิ้นจาก elementBonus และ raceBonus ของ Item
    const getDetailedBonuses = () => {
        const elementsList: Array<{ itemName: string; slot: string; type: string; value: number }> = [];
        const racesList: Array<{ itemName: string; slot: string; type: string; value: number }> = [];

        Object.entries(equippedItems).forEach(([slot, item]) => {
            if (item) {
                // เช็กจาก item.elementBonus ที่ประกาศไว้ใน Interface
                if (item.elementBonus) {
                    elementsList.push({
                        itemName: item.name,
                        slot,
                        type: item.elementBonus.type,
                        value: item.elementBonus.value
                    });
                }
                // เช็กจาก item.raceBonus ที่ประกาศไว้ใน Interface
                if (item.raceBonus) {
                    racesList.push({
                        itemName: item.name,
                        slot,
                        type: item.raceBonus.type,
                        value: item.raceBonus.value
                    });
                }
            }
        });

        return { elementsList, racesList };
    };

    const { elementsList, racesList } = getDetailedBonuses();
    const combined = getCombinedBonuses(equippedItems);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4" onClick={() => setShowBonusModal(false)}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold text-lg mb-4 text-center border-b border-slate-700 pb-2">ACTIVE BONUSES</h3>

                <div className="space-y-4">
                    {/* Elemental Multipliers */}
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-900/30">
                        <div className="text-[10px] text-blue-400 uppercase font-bold mb-1">Elemental Multipliers</div>
                        {elementsList.length > 0 ? (
                            <div className="space-y-1.5">
                                {elementsList.map((b, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-slate-300 truncate pr-2">
                                            • {b.itemName} <span className="text-slate-500 text-[10px]">({b.slot})</span>
                                        </span>
                                        <span className="text-emerald-400 font-mono font-bold">+{b.value}% <span className="text-blue-300">({b.type})</span></span>
                                    </div>
                                ))}
                            </div>
                        ) : combined.elements.length > 0 ? (
                            combined.elements.map((b, i) => (
                                <div key={i} className="flex justify-between text-sm text-white">
                                    <span>{b.type}</span>
                                    <span className="text-emerald-400 font-bold">+{b.value}%</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-500 italic">No elemental bonuses</div>
                        )}
                    </div>

                    {/* Race Multipliers */}
                    <div className="bg-amber-900/20 p-3 rounded border border-amber-900/30">
                        <div className="text-[10px] text-amber-400 uppercase font-bold mb-1">Race Multipliers</div>
                        {racesList.length > 0 ? (
                            <div className="space-y-1.5">
                                {racesList.map((b, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-slate-300 truncate pr-2">
                                            • {b.itemName} <span className="text-slate-500 text-[10px]">({b.slot})</span>
                                        </span>
                                        <span className="text-emerald-400 font-mono font-bold">+{b.value}% <span className="text-amber-200">({b.type})</span></span>
                                    </div>
                                ))}
                            </div>
                        ) : combined.races.length > 0 ? (
                            combined.races.map((b, i) => (
                                <div key={i} className="flex justify-between text-sm text-white">
                                    <span>{b.type}</span>
                                    <span className="text-emerald-400 font-bold">+{b.value}%</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-500 italic">No race bonuses</div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setShowBonusModal(false)}
                    className="mt-6 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold transition-colors"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
};