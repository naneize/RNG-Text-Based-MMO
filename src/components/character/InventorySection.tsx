import { type Player, type Item, type EquipmentSlot, PITY_CONFIG } from '../../types/game';
import { itemLibrary } from '../../data/itemLibrary';
import { MAX_INVENTORY_SLOTS } from '../../types/game';
import { useState } from 'react';
import { BulkSalvageModal } from '../Modals/BulkSalvageModal';
import { useGameStore } from '../../store/gameStore';

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
    totalRoll: number;
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
    toggleAutoLoot,
}: InventorySectionProps) => {

    const [pendingSalvageItems, setPendingSalvageItems] = useState<Item[] | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const totalOpens = useGameStore((state) => state.totalOpens);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handlePrepareSalvage = (rarity: string) => {
        const allOfRarity = player.inventory.filter(
            (item) => item.rarity?.toLowerCase() === rarity.toLowerCase()
        );
        // 🛡️ ไอเทมที่ล็อกไว้จะไม่ถูกกวาด (ตรงกับที่ store กรองไว้อีกชั้น)
        const itemsToSalvage = allOfRarity.filter((item) => !item.locked);

        if (itemsToSalvage.length === 0) {
            showToast(
                allOfRarity.length > 0
                    ? `All ${rarity.toUpperCase()} items are locked. Unlock them to salvage.`
                    : `No ${rarity.toUpperCase()} items in inventory to salvage.`
            );
            return;
        }

        setPendingSalvageItems(itemsToSalvage);
    };

    return (
        <div className="space-y-4 relative text-amber-100">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 left-6 bg-stone-950 border border-rose-500/80 text-rose-300 px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.3)] text-xs font-bold animate-bounce z-50 flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-amber-950">
                {filterOptions.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => setFilter(opt)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all whitespace-nowrap cursor-pointer ${filter === opt
                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                            : 'bg-stone-900/80 text-amber-500/70 border border-amber-950 hover:bg-stone-800 hover:text-amber-300'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            <h3 className="text-[10px] text-amber-200 uppercase font-bold tracking-wider mb-1">
                Material
            </h3>

            {/* Materials List */}
            <div className="max-h-28 overflow-y-auto pr-1 flex gap-1.5 flex-wrap bg-stone-950/60 p-2.5 rounded-xl border border-amber-950/80 shadow-inner">
                {Object.entries(player.materials).map(([id, amount]) => {
                    const itemData = itemLibrary.find(i => i.id === id);
                    const displayName = itemData ? itemData.name : id.replace(/_/g, ' ');

                    return (
                        <button
                            key={id}
                            onClick={() => setSelectedMaterial({ name: displayName, amount })}
                            className="bg-stone-900/90 px-2.5 py-1 rounded-lg border border-amber-900/50 text-[10px] text-amber-300 font-bold flex items-center gap-1.5 hover:border-amber-600 transition-colors cursor-pointer shadow-sm"
                        >
                            <span className="text-amber-200/90">{displayName.toUpperCase()}</span>
                            <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">{amount}</span>
                        </button>
                    );
                })}
            </div>

            {/* Salvage All Bar */}
            <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
                <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center gap-1.5 bg-stone-950/80 p-1.5 rounded-xl border border-amber-950 w-full justify-between">
                        <span className="text-[10px] font-bold text-amber-200 uppercase px-1 tracking-wider">
                            Salvage All:
                        </span>

                        <div className="flex items-center gap-1.5">
                            {/* COMMON */}
                            <button
                                onClick={() => handlePrepareSalvage('common')}
                                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700/80 rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                            >
                                COMMON
                            </button>

                            {/* RARE */}
                            <button
                                onClick={() => handlePrepareSalvage('rare')}
                                className="px-2.5 py-1 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 border border-sky-800/60 rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                            >
                                RARE
                            </button>

                            {/* EPIC */}
                            <button
                                onClick={() => handlePrepareSalvage('epic')}
                                className="px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/60 rounded-lg text-[10px] font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                            >
                                EPIC
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Counter */}
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">
                    Inventory
                </h3>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${player.inventory.length >= MAX_INVENTORY_SLOTS
                    ? 'bg-rose-950 text-rose-300 border border-rose-600 animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                    : 'text-amber-400 bg-stone-950 border border-amber-950'
                    }`}>
                    {player.inventory.length} / {MAX_INVENTORY_SLOTS}
                </span>
            </div>

            {/* Inventory Grid */}
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 content-start border border-amber-950 p-2.5 rounded-xl bg-stone-950/60 min-h-28 shadow-inner">
                {filteredInventory.length === 0 ? (
                    <div className="w-full text-center py-8 text-xs text-amber-600/60 font-medium">
                        No items found
                    </div>
                ) : (
                    filteredInventory.map((item, index) => (
                        <button
                            key={`${item.id}-${index}`}
                            onClick={() => setSelectedItem(item)}
                            className={`w-14 h-14 bg-stone-900/90 border-2 ${item.locked ? 'border-amber-500/80' : getRarityColor(item.rarity)} rounded-xl flex flex-col items-center justify-center p-1 relative hover:scale-105 transition-transform group cursor-pointer shadow-md`}
                        >
                            <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain filter drop-shadow pointer-events-none" />
                            <span className="text-[6px] text-amber-200/80 truncate w-full text-center mt-0.5 font-semibold pointer-events-none">
                                {item.name}
                            </span>
                            {/* ปุ่มล็อกกัน salvage — กดสลับได้ทันที ไม่เปิด modal */}
                            <span
                                role="button"
                                title={item.locked ? 'Unlock (allow salvage)' : 'Lock (protect from salvage)'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    useGameStore.getState().toggleItemLock(item.uid);
                                }}
                                className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[8px] flex items-center justify-center border transition-all cursor-pointer z-10 ${item.locked
                                    ? 'bg-amber-600 border-amber-300 text-stone-950 shadow-[0_0_8px_rgba(245,158,11,0.6)] opacity-100'
                                    : 'bg-stone-800 border-amber-900/60 text-amber-400/70 opacity-0 group-hover:opacity-100 hover:bg-amber-900'
                                    }`}
                            >
                                {item.locked ? '🔒' : '🔓'}
                            </span>
                        </button>
                    ))
                )}
            </div>

            {/* EQUIPPED SKILLS */}
            <div className="mt-2">
                <h3 className="font-bold text-amber-200/90 border-b border-amber-950 pb-2 mb-2 text-xs uppercase tracking-wide">EQUIPPED SKILLS</h3>
                <div className="flex gap-2">
                    {/* Skill Slot 1 */}
                    <div className={`relative flex-1 h-13 bg-stone-950/60 border-2 ${player.equippedItems.skill1 ? getRarityColor(player.equippedItems.skill1.rarity) : 'border-amber-950/60'} rounded-xl flex items-center px-2.5 gap-2 group shadow-inner`}>
                        {player.equippedItems.skill1 ? (
                            <>
                                <img src={player.equippedItems.skill1.icon} alt={player.equippedItems.skill1.name} className="w-6 h-6 object-contain flex-shrink-0 filter drop-shadow" />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-amber-300 font-bold text-[10px] truncate">{player.equippedItems.skill1.name}</span>
                                    {player.equippedItems.skill1.skillCondition && (
                                        <div className="flex gap-1 mt-0.5 flex-wrap">
                                            {player.equippedItems.skill1.skillCondition.damageType && (
                                                <span className={`text-[7px] font-bold px-1 rounded ${player.equippedItems.skill1.skillCondition.damageType === 'magic' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                                                    {player.equippedItems.skill1.skillCondition.damageType === 'magic' ? 'MAGIC' : 'PHYS'}
                                                </span>
                                            )}
                                            {player.equippedItems.skill1.skillCondition.elementBonusAgainst && (
                                                <span className="text-[7px] font-bold px-1 rounded bg-sky-950 text-sky-300 border border-sky-800">
                                                    +{player.equippedItems.skill1.skillCondition.elementBonusPercent}% VS {player.equippedItems.skill1.skillCondition.elementBonusAgainst.slice(0, 3)}
                                                </span>
                                            )}
                                            {player.equippedItems.skill1.skillCondition.scalingStat && (
                                                <span className="text-[7px] font-bold px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                                    {player.equippedItems.skill1.skillCondition.scalingStat.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => unequipItem(player.equippedItems.skill1!)} className="absolute -top-1 -right-1 bg-rose-900 text-amber-100 rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 z-10 shadow cursor-pointer border border-rose-950">✕</button>
                            </>
                        ) : <span className="text-[10px] text-amber-200 font-medium w-full text-center">Slot 1</span>}
                    </div>

                    {/* Skill Slot 2 */}
                    <div className={`relative flex-1 h-13 bg-stone-950/60 border-2 ${player.equippedItems.skill2 ? getRarityColor(player.equippedItems.skill2.rarity) : 'border-amber-950/60'} rounded-xl flex items-center px-2.5 gap-2 group shadow-inner`}>
                        {player.equippedItems.skill2 ? (
                            <>
                                <img src={player.equippedItems.skill2.icon} alt={player.equippedItems.skill2.name} className="w-6 h-6 object-contain flex-shrink-0 filter drop-shadow" />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-amber-300 font-bold text-[10px] truncate">{player.equippedItems.skill2.name}</span>
                                    {player.equippedItems.skill2.skillCondition && (
                                        <div className="flex gap-1 mt-0.5 flex-wrap">
                                            {player.equippedItems.skill2.skillCondition.damageType && (
                                                <span className={`text-[7px] font-bold px-1 rounded ${player.equippedItems.skill2.skillCondition.damageType === 'magic' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                                                    {player.equippedItems.skill2.skillCondition.damageType === 'magic' ? 'MAGIC' : 'PHYS'}
                                                </span>
                                            )}
                                            {player.equippedItems.skill2.skillCondition.elementBonusAgainst && (
                                                <span className="text-[7px] font-bold px-1 rounded bg-sky-950 text-sky-300 border border-sky-800">
                                                    +{player.equippedItems.skill2.skillCondition.elementBonusPercent}% VS {player.equippedItems.skill2.skillCondition.elementBonusAgainst.slice(0, 3)}
                                                </span>
                                            )}
                                            {player.equippedItems.skill2.skillCondition.scalingStat && (
                                                <span className="text-[7px] font-bold px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                                    {player.equippedItems.skill2.skillCondition.scalingStat.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => unequipItem(player.equippedItems.skill2!)} className="absolute -top-1 -right-1 bg-rose-900 text-amber-100 rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 z-10 shadow cursor-pointer border border-rose-950">✕</button>
                            </>
                        ) : <span className="text-[10px] text-amber-200 font-medium w-full text-center">Slot 2</span>}
                    </div>
                </div>
            </div>

            {/* Pity Bars */}
            <div className="grid grid-cols-2 gap-2">
                {/* Epic Pity */}
                <div className="space-y-1 bg-stone-950/60 p-2.5 rounded-xl border border-purple-500/20 shadow-inner">
                    <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-purple-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                            EPIC PITY
                        </span>
                        <span className="font-mono text-purple-300">
                            {epicPity ?? 0}<span className="text-purple-500/70">/{PITY_CONFIG.EPIC}</span>
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden p-[1px] border border-purple-500/20">
                        <div
                            className="h-full bg-gradient-to-r from-purple-900 to-purple-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                            style={{ width: `${Math.min(100, ((epicPity ?? 0) / PITY_CONFIG.EPIC) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Legend Pity */}
                <div className="space-y-1 bg-stone-950/60 p-2.5 rounded-xl border border-amber-500/20 shadow-inner">
                    <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-amber-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            LEGEND PITY
                        </span>
                        <span className="font-mono text-amber-300">
                            {legendPity ?? 0}<span className="text-amber-500/70">/{PITY_CONFIG.LEGEND}</span>
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden p-[1px] border border-amber-500/20">
                        <div
                            className="h-full bg-gradient-to-r from-amber-900 to-amber-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            style={{ width: `${Math.min(100, ((legendPity ?? 0) / PITY_CONFIG.LEGEND) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ROLL FOR LOOT & AUTO ROLL Toggle */}
            <div className="flex gap-2 w-full max-w-xs mx-auto items-start">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="relative w-full overflow-hidden rounded-xl border border-amber-700/60 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                        {(isLooting || isAutoActive) && (
                            <div
                                className={`absolute top-0 left-0 h-full transition-all duration-75 ease-linear pointer-events-none ${isAutoActive ? 'bg-amber-500/60' : 'bg-amber-600/40'
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                        )}

                        <button
                            onClick={() => handleLoot()}
                            disabled={isLooting || isAutoActive || player.inventory.length >= MAX_INVENTORY_SLOTS}
                            className={`w-full py-3.5 font-bold text-xs uppercase tracking-wider transition-all relative z-10 cursor-pointer ${player.inventory.length >= MAX_INVENTORY_SLOTS
                                ? 'bg-rose-950 text-rose-300 cursor-not-allowed border-rose-800'
                                : isAutoActive
                                    ? 'bg-amber-950/80 text-amber-200'
                                    : isLooting
                                        ? 'bg-amber-900/60 text-amber-100 font-mono'
                                        : 'bg-stone-900 hover:bg-stone-800 text-amber-200 shadow-lg active:scale-[0.98] border border-amber-900/80'
                                }`}
                        >
                            {player.inventory.length >= MAX_INVENTORY_SLOTS
                                ? 'INVENTORY FULL'
                                : isAutoActive
                                    ? `AUTO ROLLING... ${Math.round(progress)}%`
                                    : isLooting
                                        ? `ROLLING... ${Math.round(progress)}%`
                                        : 'ROLL FOR LOOT'}
                        </button>
                    </div>

                    <div className="flex flex-col items-center text-[10px] font-mono tracking-wider uppercase leading-tight">
                        <span className="text-amber-100">Total Rolls</span>
                        <span className="text-amber-300 font-bold text-xs mt-0.5">{totalOpens ?? 0}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            if (player.inventory.length >= MAX_INVENTORY_SLOTS) return;
                            if (toggleAutoLoot) toggleAutoLoot();
                        }}
                        disabled={player.inventory.length >= MAX_INVENTORY_SLOTS}
                        className={`px-3.5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wide border transition-all h-[46px] cursor-pointer shadow-md ${player.inventory.length >= MAX_INVENTORY_SLOTS
                            ? 'bg-stone-950 border-amber-950 text-amber-700 cursor-not-allowed'
                            : isAutoActive
                                ? 'bg-amber-600 border-amber-400 text-stone-950 font-extrabold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                                : 'bg-stone-900 border-amber-900/80 text-amber-400 hover:bg-stone-800 hover:text-amber-200 active:scale-95'
                            }`}
                    >
                        {isAutoActive ? 'AUTO ROLL : ON' : 'AUTO ROLL : OFF'}
                    </button>

                    <span className="text-[9px] font-semibold tracking-wider text-amber-200 uppercase font-mono">
                        IDLE MODE (2.5 SEC)
                    </span>
                </div>
            </div>

            {/* Bulk Salvage Modal */}
            {pendingSalvageItems && (
                <BulkSalvageModal
                    itemsToSalvage={pendingSalvageItems}
                    onClose={() => setPendingSalvageItems(null)}
                />
            )}
        </div>
    );
};