import { type Player, type Item, type EquipmentSlot, PITY_CONFIG } from '../../types/game';
import { itemLibrary } from '../../data/itemLibrary';

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
    setIsAutoActive: React.Dispatch<React.SetStateAction<boolean>>;

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
    setIsAutoActive


}: InventorySectionProps) => {
    return (
        <div className="space-y-4">
            <div className="flex gap-1 overflow-x-auto pb-1">
                {filterOptions.map((opt) => (
                    <button key={opt} onClick={() => setFilter(opt)} className={`px-3 py-5 rounded text-[10px] uppercase font-bold transition-all whitespace-nowrap ${filter === opt ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {opt}
                    </button>
                ))}
            </div>

            {/* ส่วนแสดง Materials แบบแยกสัดส่วน */}
            <div className="flex gap-2 flex-wrap">
                {Object.entries(player.materials).map(([id, amount]) => {
                    // 1. ค้นหาชื่อจริงจาก itemLibrary
                    const itemData = itemLibrary.find(i => i.id === id);
                    const displayName = itemData ? itemData.name : id.replace(/_/g, ' '); // ถ้าเจอใช้ชื่อจริง ถ้าไม่เจอใช้การแทนที่ _ ด้วยเว้นวรรค

                    return (
                        <button
                            key={id}
                            onClick={() => setSelectedMaterial({ name: displayName, amount })}
                            className="bg-slate-800 px-3 py-1 rounded border border-slate-700 text-[10px] text-emerald-400 font-bold flex items-center gap-2 hover:border-emerald-500 transition-colors"
                        >
                            {/* 2. ใช้ displayName แทน */}
                            {displayName.toUpperCase()}: <span className="text-white">{amount}</span>
                        </button>
                    );
                })}
            </div>

            {/* ช่อง Inventory */}
            <h3 className="text-[10px] text-slate-400 uppercase font-bold mb-2">Inventory</h3>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-2 content-start border-b border-slate-700 pb-4">
                {filteredInventory.map((item) => (
                    <button key={item.uid} onClick={() => setSelectedItem(item)} className={`w-16 h-20 bg-slate-800 p-1 rounded border-2 ${getRarityColor(item.rarity)} hover:scale-[1.05] transition-all flex flex-col items-center justify-center text-center`}>
                        {item.icon && <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />}
                        <div className="text-[8px] text-slate-200 truncate w-full font-bold mt-1">{item.name}</div>
                    </button>
                ))}
            </div>

            {/* ย้าย EQUIPPED SKILL มาไว้ตรงนี้ครับ! */}
            <div className="mt-2">
                <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-2 text-[12px]">EQUIPPED SKILLS</h3>
                <div className="flex gap-2">
                    {/* Skill Slot 1 */}
                    <div className={`relative flex-1 h-16 bg-slate-800 border-2 ${player.equippedItems.skill1 ? getRarityColor(player.equippedItems.skill1.rarity) : 'border-slate-700'} rounded flex flex-col items-center justify-center p-1 group`}>
                        {player.equippedItems.skill1 ? (
                            <>
                                <img src={player.equippedItems.skill1.icon} alt={player.equippedItems.skill1.name} className="w-6 h-6 object-contain" />
                                <span className="text-emerald-400 text-[10px] truncate w-full text-center px-1">{player.equippedItems.skill1.name}</span>
                                {/* Skill Condition Hints */}
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
                                {/* Skill Condition Hints */}
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
            <div className="flex gap-2 w-full max-w-xs mx-auto">
                {/* ปุ่มหลักสำหรับ Roll (กดมือ) */}
                <div className="relative flex-1 overflow-hidden rounded-lg border border-emerald-500/50 shadow-md">
                    {isLooting && (
                        <div
                            className="absolute top-0 left-0 h-full bg-emerald-500/30 transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    )}
                    <button
                        onClick={() => handleLoot(false)} // 👈 ปุ่มนี้กดสุ่มมือ ส่ง false เพื่อให้เด้ง Modal
                        disabled={isLooting && !isAutoActive}
                        className={`w-full py-4 font-bold text-sm transition-all relative z-10 
            ${isLooting && !isAutoActive
                                ? 'bg-emerald-900/50 text-emerald-200 cursor-not-allowed'
                                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                            }`}
                    >
                        {isLooting ? `ROLLING ... ${Math.round(progress)}%` : 'ROLL FOR LOOT'}
                    </button>
                </div>

                {/* ปุ่มเปิด/ปิด Auto Roll (ปุ่มขวา) */}
                <button
                    onClick={() => setIsAutoActive(!isAutoActive)} // 👈 ปุ่มนี้ใช้สลับสถานะ Auto เปิด/ปิด
                    className={`px-4 rounded-lg font-bold text-xs uppercase border transition-all ${isAutoActive
                        ? 'bg-amber-600 border-amber-400 text-white animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                >
                    {isAutoActive ? 'AUTO ROLL : ON' : 'AUTO ROLL : OFF'}
                </button>
            </div>
        </div>
    );
};