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
    // 🟢 เพิ่ม State สำหรับเก็บไอเทมที่ถูกคลิกดูรายละเอียด
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-2">EQUIPPED GEAR</h3>
            <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                    const itemKey = slot === 'helm' ? 'helmet' : slot;
                    const equippedItem = player.equippedItems[itemKey as keyof typeof player.equippedItems];

                    const getSlotStyle = (rarity?: string) => {
                        if (!rarity) return 'border-slate-800 bg-slate-900/40 text-slate-500';

                        switch (rarity.toLowerCase()) {
                            case 'legendary':
                                return 'border-amber-500/40 bg-amber-950/10 shadow-[inset_0_0_12px_rgba(245,158,11,0.15)] text-amber-400';
                            case 'epic':
                                return 'border-purple-500/40 bg-purple-950/10 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)] text-purple-400';
                            case 'rare':
                                return 'border-sky-500/40 bg-sky-950/10 shadow-[inset_0_0_12px_rgba(56,189,248,0.15)] text-sky-400';
                            case 'uncommon':
                                return 'border-emerald-500/40 bg-emerald-950/10 text-emerald-400';
                            default:
                                return 'border-slate-600/50 bg-slate-800/50 text-slate-300';
                        }
                    };

                    const slotStyle = getSlotStyle(equippedItem?.rarity);

                    return (
                        <div
                            key={slot}
                            className={`relative h-16 border rounded-lg p-1.5 flex flex-col items-center justify-center group transition-all duration-200 hover:border-slate-400/60 cursor-pointer ${slotStyle}`}
                            // 🟢 เพิ่ม onClick เพื่อคลิกเปิดดูรายละเอียดไอเทม (ถ้ามีไอเทม)
                            onClick={() => {
                                if (equippedItem) {
                                    setSelectedItem(selectedItem?.name === equippedItem.name ? null : equippedItem);
                                }
                            }}
                        >
                            <span className="capitalize text-[9px] text-slate-400 font-semibold tracking-wide pointer-events-none">{slot}</span>

                            {equippedItem ? (
                                <>
                                    <img src={equippedItem.icon} alt={equippedItem.name} className="w-5 h-5 object-contain my-0.5 filter drop-shadow pointer-events-none" />

                                    <span className="text-[10px] font-bold truncate w-full text-center px-1 tracking-tight opacity-95 pointer-events-none">
                                        {equippedItem.name}
                                    </span>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // กันไม่ให้คลิกปุ่มถอดแล้วไปโดน event คลิกการ์ด
                                            unequipItem(equippedItem);
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-600/90 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10 shadow cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <span className="text-[10px] text-slate-600 font-medium pointer-events-none">Empty</span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="w-full">
                <div className="mt-4 p-3 bg-slate-800/80 rounded-lg border border-slate-700/50">
                    <h4 className="text-[10px] text-slate-400 uppercase font-bold mb-2 tracking-wider">
                        Bonus Stats
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                        {synergyBonusList.map((item, index) => (
                            <div key={index} className="text-slate-300">
                                {item.label}
                                <span className="text-emerald-500 ml-1">
                                    {item.bonus} / {item.stat}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setShowCombine(true)}
                    className="w-full py-4 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700/80 shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-5 text-xs"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    COMBINE ITEMS
                </button>
            </div>

            {/* 🟢 Modal แสดงรายละเอียดไอเทมตรงกลางจอ (คลิกพื้นหลังเพื่อปิดได้) */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 cursor-pointer"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="w-80 p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl cursor-default text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ชื่อไอเทม */}
                        <div className="font-bold text-slate-200 text-lg mb-1">{selectedItem.name}</div>

                        {/* ระดับและความหายาก */}
                        <div className="text-xs text-slate-400 mb-3 pb-2 border-b border-slate-800">
                            {selectedItem.rarity} • Lv.{selectedItem.itemLevel || 1}
                        </div>

                        {/* แสดงสเตตัสหลัก (Stats) */}
                        {Object.entries(selectedItem.stats || {}).filter(([_, value]) => Number(value) > 0).length > 0 && (
                            <div className="space-y-1.5 mb-3">
                                {Object.entries(selectedItem.stats)
                                    .filter(([_, value]) => Number(value) > 0)
                                    .map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between text-xs py-1 border-b border-slate-800/60 last:border-b-0">
                                            <span className="text-slate-400 uppercase">{stat}</span>
                                            <span className="text-emerald-400 font-mono">+{value as number}</span>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Element Bonus */}
                        {selectedItem.elementBonus && (
                            <div className="mb-2.5 pb-2 border-b border-slate-800 text-xs">
                                <div className="text-slate-400 mb-1 font-semibold">Element Bonus:</div>
                                <div className="flex justify-between text-sky-400 font-mono">
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
                                <div className="text-slate-400 mb-1 font-semibold">Race Bonus:</div>
                                <div className="flex justify-between text-amber-400 font-mono">
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