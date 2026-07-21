import type { Player, Item, EquipmentSlot } from '../../types/game';
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
    handleLoot: () => void;
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
    handleLoot
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
            <div className="flex flex-wrap gap-2 h-48 overflow-y-auto pr-2 content-start border-b border-slate-700 pb-4">
                {filteredInventory.map((item) => (
                    <button key={item.uid} onClick={() => setSelectedItem(item)} className={`w-16 h-20 bg-slate-800 p-1 rounded border-2 ${getRarityColor(item.rarity)} hover:scale-[1.05] transition-all flex flex-col items-center justify-center text-center`}>
                        {item.icon && <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />}
                        <div className="text-[8px] text-slate-200 truncate w-full font-bold mt-1">{item.name}</div>
                    </button>
                ))}
            </div>

            {/* ย้าย EQUIPPED SKILL มาไว้ตรงนี้ครับ! */}
            <div className="mt-2">
                <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-2 text-[12px]">EQUIPPED SKILL</h3>
                <div className={`relative h-16 bg-slate-800 border-2 ${player.equippedItems.skill ? getRarityColor(player.equippedItems.skill.rarity) : 'border-slate-700'} rounded flex flex-col items-center justify-center p-1 group`}>
                    {player.equippedItems.skill ? (
                        <>
                            <img src={player.equippedItems.skill.icon} alt={player.equippedItems.skill.name} className="w-6 h-6 object-contain" />
                            <span className="text-emerald-400 text-[10px] truncate w-full text-center px-1">{player.equippedItems.skill.name}</span>
                            <button onClick={() => unequipItem(player.equippedItems.skill!)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10">X</button>
                        </>
                    ) : <span className="text-[10px] text-slate-700">Empty Skill Slot</span>}
                </div>
            </div>

            <div className="w-full max-w-xs mx-auto relative overflow-hidden rounded-lg border border-emerald-500/50 shadow-md">
                {isLooting && (
                    <div
                        className="absolute top-0 left-0 h-full bg-emerald-500/30 transition-all duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                )}
                <button
                    onClick={handleLoot}
                    disabled={isLooting}
                    // *** เพิ่ม animate-pulse เฉพาะตอนที่ปุ่มยังไม่ได้ถูกกด ***
                    className={`w-full py-4 font-bold text-lg transition-all relative z-10 
        ${isLooting
                            ? 'bg-emerald-900/50 text-emerald-200 cursor-not-allowed'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white' // เพิ่มตรงนี้
                        }`}
                >
                    {isLooting ? `RoLLING ... ${Math.round(progress)}%` : 'ROLL FOR LOOT'}
                </button>
            </div>
        </div>
    );
};