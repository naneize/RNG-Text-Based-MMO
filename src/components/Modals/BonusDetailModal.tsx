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

                // เช็กจาก skillCondition สำหรับสกิล (skill1 และ skill2)
                if (item.skillCondition) {
                    if (item.skillCondition.elementBonusAgainst && item.skillCondition.elementBonusPercent) {
                        elementsList.push({
                            itemName: item.name,
                            slot: 'skill', // เปลี่ยนให้แสดงผลเป็นคำว่า skill เฉยๆ
                            type: item.skillCondition.elementBonusAgainst,
                            value: item.skillCondition.elementBonusPercent
                        });
                    }
                    if (item.skillCondition.raceBonusAgainst && item.skillCondition.raceBonusPercent) {
                        racesList.push({
                            itemName: item.name,
                            slot: 'skill', // เปลี่ยนให้แสดงผลเป็นคำว่า skill เฉยๆ
                            type: item.skillCondition.raceBonusAgainst,
                            value: item.skillCondition.raceBonusPercent
                        });
                    }
                }
            }
        });

        return { elementsList, racesList };
    };

    const { elementsList, racesList } = getDetailedBonuses();
    const combined = getCombinedBonuses(equippedItems);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setShowBonusModal(false)}>
            {/* กล่องหลักธีม Dark Fantasy */}
            <div className="bg-stone-950 border border-amber-900/80 p-6 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-amber-950/40 text-amber-100" onClick={e => e.stopPropagation()}>
                <h3 className="text-amber-400 font-extrabold text-base tracking-wider mb-4 text-center border-b border-amber-950 pb-2 uppercase">
                    Active Bonuses
                </h3>

                {/* Grid 2 Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Elemental Multipliers */}
                    <div className="bg-stone-900/90 p-3.5 rounded-xl border border-amber-950/60 shadow-sm">
                        <div className="text-[10px] text-amber-500 uppercase font-bold tracking-wider mb-2">Elemental Multipliers</div>
                        {elementsList.length > 0 ? (
                            <div className="space-y-1.5">
                                {elementsList.map((b, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-stone-300 truncate pr-2">
                                            • {b.itemName} <span className="text-amber-500/60 text-[10px]">({b.slot})</span>
                                        </span>
                                        <span className="text-amber-400 font-mono font-bold whitespace-nowrap">
                                            +{b.value}% <span className="text-amber-200">({b.type})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : combined.elements.length > 0 ? (
                            combined.elements.map((b, i) => (
                                <div key={i} className="flex justify-between text-xs text-stone-300">
                                    <span>{b.type}</span>
                                    <span className="text-amber-400 font-bold font-mono">+{b.value}%</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-stone-500 italic">No elemental bonuses</div>
                        )}
                    </div>

                    {/* Race Multipliers */}
                    <div className="bg-stone-900/90 p-3.5 rounded-xl border border-amber-950/60 shadow-sm">
                        <div className="text-[10px] text-amber-500 uppercase font-bold tracking-wider mb-2">Race Multipliers</div>
                        {racesList.length > 0 ? (
                            <div className="space-y-1.5">
                                {racesList.map((b, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-stone-300 truncate pr-2">
                                            • {b.itemName} <span className="text-amber-500/60 text-[10px]">({b.slot})</span>
                                        </span>
                                        <span className="text-amber-400 font-mono font-bold whitespace-nowrap">
                                            +{b.value}% <span className="text-amber-200">({b.type})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : combined.races.length > 0 ? (
                            combined.races.map((b, i) => (
                                <div key={i} className="flex justify-between text-xs text-stone-300">
                                    <span>{b.type}</span>
                                    <span className="text-amber-400 font-bold font-mono">+{b.value}%</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-stone-500 italic">No race bonuses</div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setShowBonusModal(false)}
                    className="mt-6 w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-amber-900/80 rounded-xl text-amber-300 text-xs font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                >
                    Close
                </button>
            </div>
        </div>
    );
};