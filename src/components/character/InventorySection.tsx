import { type Player, type Item, type EquipmentSlot, PITY_CONFIG } from '../../types/game';
import { itemLibrary } from '../../data/itemLibrary';
import { MAX_INVENTORY_SLOTS } from '../../types/game';
import { useState } from 'react';
import { BulkSalvageModal } from '../Modals/BulkSalvageModal';

interface InventorySectionProps {
    player: Player;
    filterOptions: ('all' | EquipmentSlot | 'skill')[];
    filter: EquipmentSlot | 'all' | 'skill';
    setFilter: (filter: EquipmentSlot | 'all' | 'skill') => void;
    filteredInventory: Item[];
    setSelectedMaterial: (mat: { name: string; amount: number } | null) => void;
    setSelectedItem: (item: Item | null) => void;
    getRarityColor: (rarity: string) => string;
    unequipItem: (item: Item) => void;
    isLooting: boolean;
    progress: number;
    handleLoot: (isAuto?: boolean) => void;
    epicPity: number;
    legendPity: number;
    isAutoActive: boolean;
    toggleAutoLoot: () => void;
}

export const InventorySection = ({
    player,
    filterOptions,
    filter,
    setFilter,
    filteredInventory,
    setSelectedMaterial,
    setSelectedItem,
    getRarityColor,
    unequipItem,
    isLooting,
    progress,
    handleLoot,
    epicPity,
    legendPity,
    isAutoActive,
    toggleAutoLoot
}: InventorySectionProps) => {

    const [pendingSalvageItems, setPendingSalvageItems] = useState<Item[] | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000); // จางหายไปเองใน 3 วินาที
    };

    const handlePrepareSalvage = (rarity: string) => {
        const itemsToSalvage = player.inventory.filter(
            (item) => item.rarity?.toLowerCase() === rarity.toLowerCase()
        );

        // 🟢 แก้ไข: เปลี่ยนจาก items.length เป็น itemsToSalvage.length
        // 🟢 แก้ไข: เปลี่ยนจาก toast.error มาใช้ showToast() ที่มีอยู่แล้ว
        if (itemsToSalvage.length === 0) {
            showToast(`No ${rarity.toUpperCase()} items in inventory to salvage.`);
            return;
        }

        setPendingSalvageItems(itemsToSalvage);
    };

    return (
        <div className="space-y-4 relative">
            {/* 🟢 Toast Notification UI สไตล์เกม (จะแสดงเมื่อไม่มีไอเทมให้ย่อย) */}
            {toastMessage && (
                <div className="fixed bottom-6 left-6 bg-slate-900 border border-red-500/80 text-red-300 px-4 py-2.5 rounded-lg shadow-2xl text-xs font-bold animate-bounce z-50 flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="flex gap-1 overflow-x-auto pb-1">
                {filterOptions.map((opt) => (
                    <button key={opt} onClick={() => setFilter(opt)} className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition-all whitespace-nowrap ${filter === opt ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {opt}
                    </button>
                ))}
            </div>

            {/* ส่วนแสดง Materials แบบแยกสัดส่วน */}
            <div className="flex gap-2 flex-wrap">
                {Object.entries(player.materials).map(([id, amount]) => {
                    const itemData = itemLibrary.find(i => i.id === id);
                    const displayName = itemData ? itemData.name : id.replace(/_/g, ' ');

                    return (
                        <button
                            key={id}
                            onClick={() => setSelectedMaterial({ name: displayName, amount })}
                            className="bg-slate-800 px-3 py-1 rounded border border-slate-700 text-[10px] text-emerald-400 font-bold flex items-center gap-2 hover:border-emerald-500 transition-colors"
                        >
                            {displayName.toUpperCase()}: <span className="text-white">{amount}</span>
                        </button>
                    );
                })}
            </div>

            {/* ช่อง Inventory Counter + Salvage All */}
            <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
                <div className="flex items-center gap-2">

                    {/* ชุดปุ่ม Auto Salvage เหมาตามระดับสี */}
                    <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase px-1">
                            Salvage All :
                        </span>

                        {/* COMMON */}
                        <button
                            onClick={() => handlePrepareSalvage('common')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-md text-xs font-bold transition-all active:scale-95 shadow-sm"
                        >
                            COMMON
                        </button>

                        {/* RARE */}
                        <button
                            onClick={() => handlePrepareSalvage('rare')}
                            className="px-2.5 py-1 bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-600/60 rounded-md text-xs font-bold transition-all active:scale-95 shadow-sm"
                        >
                            RARE
                        </button>

                        {/* EPIC */}
                        <button
                            onClick={() => handlePrepareSalvage('epic')}
                            className="px-2.5 py-1 bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/60 rounded-md text-xs font-bold transition-all active:scale-95 shadow-sm"
                        >
                            EPIC
                        </button>
                    </div>

                </div>
            </div>

            {/* ช่อง Inventory */}
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] text-slate-400 uppercase font-bold">
                    Inventory
                </h3>
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${player.inventory.length >= MAX_INVENTORY_SLOTS
                    ? 'bg-red-900/80 text-red-300 border border-red-500 animate-pulse'
                    : 'text-slate-400 bg-slate-800'
                    }`}>
                    {player.inventory.length} / {MAX_INVENTORY_SLOTS}
                </span>
            </div>

            {/* Grid แสดงรายการไอเทมในกระเป๋า */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 content-start border border-slate-800 p-2 rounded bg-slate-950/50 min-h-[100px]">
                {filteredInventory.length === 0 ? (
                    <div className="w-full text-center py-8 text-xs text-slate-600 font-medium">
                        No items found
                    </div>
                ) : (
                    filteredInventory.map((item, index) => (
                        <button
                            key={`${item.id}-${index}`}
                            onClick={() => setSelectedItem(item)}
                            className={`w-12 h-12 bg-slate-800 border-2 ${getRarityColor(item.rarity)} rounded flex flex-col items-center justify-center p-1 relative hover:scale-105 transition-transform group`}
                        >
                            <img src={item.icon} alt={item.name} className="w-6 h-6 object-contain" />
                            <span className="text-[8px] text-slate-300 truncate w-full text-center mt-0.5">
                                {item.name}
                            </span>
                        </button>
                    ))
                )}
            </div>

            {/* EQUIPPED SKILLS */}
            <div className="mt-2">
                <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-2 text-[12px]">EQUIPPED SKILLS</h3>
                <div className="flex gap-2">
                    {/* Skill Slot 1 */}
                    <div className={`relative flex-1 h-16 bg-slate-800 border-2 ${player.equippedItems.skill1 ? getRarityColor(player.equippedItems.skill1.rarity) : 'border-slate-700'} rounded flex flex-col items-center justify-center p-1 group`}>
                        {player.equippedItems.skill1 ? (
                            <>
                                <img src={player.equippedItems.skill1.icon} alt={player.equippedItems.skill1.name} className="w-6 h-6 object-contain" />
                                <span className="text-emerald-400 text-[10px] truncate w-full text-center px-1">{player.equippedItems.skill1.name}</span>
                                {player.equippedItems.skill1.skillCondition && (
                                    <div className="flex gap-1 mt-0.5">
                                        {player.equippedItems.skill1.skillCondition.damageType && (
                                            <span className={`text-[8px] font-bold px-1 rounded ${player.equippedItems.skill1.skillCondition.damageType === 'magic' ? 'bg-purple-900/50 text-purple-300' : 'bg-orange-900/50 text-orange-300'}`}>
                                                {player.equippedItems.skill1.skillCondition.damageType === 'magic' ? 'MAGIC' : 'PHYS'}
                                            </span>
                                        )}
                                        {player.equippedItems.skill1.skillCondition.elementBonusAgainst && (
                                            <span className="text-[8px] font-bold px-1 rounded bg-blue-900/50 text-blue-300">
                                                +{player.equippedItems.skill1.skillCondition.elementBonusPercent}% VS {player.equippedItems.skill1.skillCondition.elementBonusAgainst.slice(0, 3)}
                                            </span>
                                        )}
                                        {player.equippedItems.skill1.skillCondition.scalingStat && (
                                            <span className="text-[8px] font-bold px-1 rounded bg-emerald-900/50 text-emerald-300">
                                                {player.equippedItems.skill1.skillCondition.scalingStat.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button onClick={() => unequipItem(player.equippedItems.skill1!)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10">X</button>
                            </>
                        ) : <span className="text-[10px] text-slate-700">Slot 1</span>}
                    </div>

                    {/* Skill Slot 2 */}
                    <div className={`relative flex-1 h-16 bg-slate-800 border-2 ${player.equippedItems.skill2 ? getRarityColor(player.equippedItems.skill2.rarity) : 'border-slate-700'} rounded flex flex-col items-center justify-center p-1 group`}>
                        {player.equippedItems.skill2 ? (
                            <>
                                <img src={player.equippedItems.skill2.icon} alt={player.equippedItems.skill2.name} className="w-6 h-6 object-contain" />
                                <span className="text-emerald-400 text-[10px] truncate w-full text-center px-1">{player.equippedItems.skill2.name}</span>
                                {player.equippedItems.skill2.skillCondition && (
                                    <div className="flex gap-1 mt-0.5">
                                        {player.equippedItems.skill2.skillCondition.damageType && (
                                            <span className={`text-[8px] font-bold px-1 rounded ${player.equippedItems.skill2.skillCondition.damageType === 'magic' ? 'bg-purple-900/50 text-purple-300' : 'bg-orange-900/50 text-orange-300'}`}>
                                                {player.equippedItems.skill2.skillCondition.damageType === 'magic' ? 'MAGIC' : 'PHYS'}
                                            </span>
                                        )}
                                        {player.equippedItems.skill2.skillCondition.elementBonusAgainst && (
                                            <span className="text-[8px] font-bold px-1 rounded bg-blue-900/50 text-blue-300">
                                                +{player.equippedItems.skill2.skillCondition.elementBonusPercent}% VS {player.equippedItems.skill2.skillCondition.elementBonusAgainst.slice(0, 3)}
                                            </span>
                                        )}
                                        {player.equippedItems.skill2.skillCondition.scalingStat && (
                                            <span className="text-[8px] font-bold px-1 rounded bg-emerald-900/50 text-emerald-300">
                                                {player.equippedItems.skill2.skillCondition.scalingStat.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button onClick={() => unequipItem(player.equippedItems.skill2!)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10">X</button>
                            </>
                        ) : <span className="text-[10px] text-slate-700">Slot 2</span>}
                    </div>
                </div>
            </div>

            {/* Epic Pity */}
            <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-purple-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                        EPIC PITY
                    </span>
                    <span className="text-slate-300 font-mono">{epicPity ?? 0} <span className="text-slate-500">/ {PITY_CONFIG.EPIC}</span></span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-purple-500/20">
                    <div
                        className="h-full bg-gradient-to-r from-purple-800 to-purple-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                        style={{ width: `${Math.min(100, ((epicPity ?? 0) / PITY_CONFIG.EPIC) * 100)}%` }}
                    />
                </div>
            </div>

            {/* Legend Pity */}
            <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-amber-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        LEGEND PITY
                    </span>
                    <span className="text-slate-300 font-mono">{legendPity ?? 0} <span className="text-slate-500">/ {PITY_CONFIG.LEGEND}</span></span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-[1px] border border-amber-500/20">
                    <div
                        className="h-full bg-gradient-to-r from-amber-800 to-amber-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                        style={{ width: `${Math.min(100, ((legendPity ?? 0) / PITY_CONFIG.LEGEND) * 100)}%` }}
                    />
                </div>
            </div>

            {/* ปุ่ม ROLL FOR LOOT & AUTO ROLL Toggle */}
            <div className="flex gap-2 w-full max-w-xs mx-auto items-start">
                <div className="relative flex-1 overflow-hidden rounded-lg border border-emerald-500/50 shadow-md">
                    {(isLooting || isAutoActive) && (
                        <div
                            className={`absolute top-0 left-0 h-full transition-all duration-75 ease-linear pointer-events-none ${isAutoActive ? 'bg-amber-400/40' : 'bg-emerald-400/40'
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    )}

                    <button
                        onClick={() => handleLoot()}
                        disabled={isLooting || isAutoActive || player.inventory.length >= MAX_INVENTORY_SLOTS}
                        className={`w-full py-4 font-bold text-sm transition-all relative z-10 
            ${player.inventory.length >= MAX_INVENTORY_SLOTS
                                ? 'bg-red-950 text-red-400 cursor-not-allowed border-red-800'
                                : isAutoActive
                                    ? 'bg-amber-900/40 text-amber-300 font-mono'
                                    : isLooting
                                        ? 'bg-emerald-900/50 text-emerald-200 font-mono'
                                        : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg active:scale-[0.98]'
                            }`}
                    >
                        {player.inventory.length >= MAX_INVENTORY_SLOTS
                            ? 'INVENTORY FULL'
                            : isAutoActive
                                ? `AUTO ROLLING... ${Math.round(progress)}%`
                                : isLooting
                                    ? `ROLLING... ${Math.round(progress)}%`
                                    : 'ROLL FOR LOOT'
                        }
                    </button>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            if (player.inventory.length >= MAX_INVENTORY_SLOTS) return;
                            if (toggleAutoLoot) toggleAutoLoot();
                        }}
                        disabled={player.inventory.length >= MAX_INVENTORY_SLOTS}
                        className={`px-4 py-4 rounded-lg font-bold text-xs uppercase border transition-all h-[54px] ${player.inventory.length >= MAX_INVENTORY_SLOTS
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : isAutoActive
                                ? 'bg-amber-600 border-amber-400 text-white animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200 active:scale-95'
                            }`}
                    >
                        {isAutoActive ? 'AUTO ROLL : ON' : 'AUTO ROLL : OFF'}
                    </button>

                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                        IDLE MODE (2.5 SEC)
                    </span>
                </div>
            </div>

            {/* Modal ยืนยัน/แสดงผล Bulk Salvage */}
            {pendingSalvageItems && (
                <BulkSalvageModal
                    itemsToSalvage={pendingSalvageItems}
                    onClose={() => setPendingSalvageItems(null)}
                />
            )}

        </div>
    );
};