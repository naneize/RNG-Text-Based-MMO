import { useState } from 'react';
import type { Player, Item, EquipmentSlot } from '../../types/game';

interface EquippedGearProps {
    player: Player;
    slots: EquipmentSlot[];
    getRarityColor: (rarity: string) => string;
    unequipItem: (item: Item) => void;
    synergyBonusList: Array<{ label: string; bonus: string | number; stat: string }>;
    setShowCombine: (show: boolean) => void;
}

export const EquippedGear = ({
    player,
    slots,
    getRarityColor,
    unequipItem,
    synergyBonusList,
    setShowCombine
}: EquippedGearProps) => {
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-amber-200/90 border-b border-amber-950 pb-2 tracking-wide text-xs uppercase">EQUIPPED GEAR</h3>
            <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                    const itemKey = slot === 'helm' ? 'helmet' : slot;
                    const equippedItem = player.equippedItems[itemKey as keyof typeof player.equippedItems];

                    const getSlotStyle = (rarity?: string) => {
                        if (!rarity) return 'border-amber-950/40 bg-stone-950/40 text-amber-500/40';

                        switch (rarity.toLowerCase()) {
                            case 'legendary':
                                return 'border-amber-500/50 bg-amber-950/20 shadow-[inset_0_0_12px_rgba(245,158,11,0.2)] text-amber-300';
                            case 'epic':
                                return 'border-purple-500/50 bg-purple-950/20 shadow-[inset_0_0_12px_rgba(168,85,247,0.2)] text-purple-300';
                            case 'rare':
                                return 'border-sky-500/50 bg-sky-950/20 shadow-[inset_0_0_12px_rgba(56,189,248,0.2)] text-sky-300';
                            case 'uncommon':
                                return 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300';
                            default:
                                return 'border-amber-900/40 bg-stone-900/60 text-amber-200/80';
                        }
                    };

                    const slotStyle = getSlotStyle(equippedItem?.rarity);

                    return (
                        <div
                            key={slot}
                            className={`relative h-16 border rounded-lg p-1.5 flex flex-col items-center justify-center group transition-all duration-200 hover:border-amber-700/60 cursor-pointer ${slotStyle}`}
                            onClick={() => {
                                if (equippedItem) {
                                    setSelectedItem(selectedItem?.name === equippedItem.name ? null : equippedItem);
                                }
                            }}
                        >
                            <span className="capitalize text-[9px] text-amber-200 font-semibold tracking-wide pointer-events-none">{slot}</span>

                            {equippedItem ? (
                                <>
                                    <img src={equippedItem.icon} alt={equippedItem.name} className="w-5 h-5 object-contain my-0.5 filter drop-shadow pointer-events-none" />

                                    <span className="text-[10px] font-bold truncate w-full text-center px-1 tracking-tight opacity-95 pointer-events-none text-amber-100">
                                        {equippedItem.name}
                                    </span>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            unequipItem(equippedItem);
                                        }}
                                        className="absolute -top-1 -right-1 bg-rose-900 text-amber-100 rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 z-10 shadow cursor-pointer border border-rose-950"
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <span className="text-[10px] text-amber-100 font-medium pointer-events-none">Empty</span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="w-full">
                <div className="mt-4 p-3 bg-stone-950/80 rounded-xl border border-amber-950 shadow-inner">
                    <h4 className="text-[10px] text-amber-500/80 uppercase font-bold mb-2 tracking-wider">
                        Bonus Stats
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                        {synergyBonusList.map((item, index) => (
                            <div key={index} className="text-amber-200/80">
                                {item.label}
                                <span className="text-amber-400 font-semibold ml-1">
                                    {item.bonus} / {item.stat}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setShowCombine(true)}
                    className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-200 font-bold rounded-xl border border-amber-900/60 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition flex items-center justify-center gap-2 cursor-pointer mt-4 text-xs"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    COMBINE ITEMS
                </button>
            </div>

            {/* Modal แสดงรายละเอียดไอเทม */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="w-80 p-5 bg-stone-950 border border-amber-950 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-default text-left text-amber-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ชื่อไอเทม */}
                        <div className="font-bold text-amber-300 text-base mb-1">{selectedItem.name}</div>

                        {/* ระดับและความหายาก */}
                        <div className="text-xs text-amber-500/70 mb-3 pb-2 border-b border-amber-950">
                            {selectedItem.rarity} • Lv.{selectedItem.itemLevel || 1}
                        </div>

                        {/* แสดงสเตตัสหลัก (Stats) */}
                        {Object.entries(selectedItem.stats || {}).filter(([_, value]) => Number(value) > 0).length > 0 && (
                            <div className="space-y-1.5 mb-3">
                                {Object.entries(selectedItem.stats)
                                    .filter(([_, value]) => Number(value) > 0)
                                    .map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between text-xs py-1 border-b border-amber-950/50 last:border-b-0">
                                            <span className="text-amber-200/70 uppercase">{stat}</span>
                                            <span className="text-amber-400 font-mono">+{value as number}</span>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Element Bonus */}
                        {selectedItem.elementBonus && (
                            <div className="mb-2.5 pb-2 border-b border-amber-950 text-xs">
                                <div className="text-amber-500/80 mb-1 font-semibold">Element Bonus:</div>
                                <div className="flex justify-between text-amber-300 font-mono">
                                    <span>
                                        {typeof selectedItem.elementBonus === 'object' && selectedItem.elementBonus !== null
                                            ? ((selectedItem.elementBonus as any).type || (selectedItem.elementBonus as any).element || 'Element')
                                            : 'Element'}
                                    </span>
                                    <span>
                                        +{typeof selectedItem.elementBonus === 'object' && selectedItem.elementBonus !== null
                                            ? (selectedItem.elementBonus.value || 0)
                                            : (selectedItem.elementBonus || 0)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Race Bonus */}
                        {selectedItem.raceBonus && (
                            <div className="text-xs">
                                <div className="text-amber-500/80 mb-1 font-semibold">Race Bonus:</div>
                                <div className="flex justify-between text-amber-300 font-mono">
                                    <span>
                                        {typeof selectedItem.raceBonus === 'object' && selectedItem.raceBonus !== null
                                            ? ((selectedItem.raceBonus as any).type || (selectedItem.raceBonus as any).race || 'Race')
                                            : 'Race'}
                                    </span>
                                    <span>
                                        +{typeof selectedItem.raceBonus === 'object' && selectedItem.raceBonus !== null
                                            ? (selectedItem.raceBonus.value || 0)
                                            : (selectedItem.raceBonus || 0)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};