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
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-2">EQUIPPED GEAR</h3>
            <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                    // 🟢 แปลง slot ให้วิ่งไปดึง key 'helmet' ถ้าเจอ 'helm'
                    const itemKey = slot === 'helm' ? 'helmet' : slot;
                    const equippedItem = player.equippedItems[itemKey as keyof typeof player.equippedItems];

                    // 🟢 1. กำหนดสไตล์แยกตาม Rarity (ลดเส้นกรอบ เพิ่มความฟุ้งละมุน)
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
                            default: // common
                                return 'border-slate-600/50 bg-slate-800/50 text-slate-300';
                        }
                    };

                    const slotStyle = getSlotStyle(equippedItem?.rarity);

                    return (
                        <div
                            key={slot}
                            // 🟢 2. ปรับ border-2 -> border และใส่ transition ให้นุ่มนวล
                            className={`relative h-16 border rounded-lg p-1.5 flex flex-col items-center justify-center group transition-all duration-200 hover:border-slate-400/60 ${slotStyle}`}
                        >
                            <span className="capitalize text-[9px] text-slate-400 font-semibold tracking-wide">{slot}</span>

                            {equippedItem ? (
                                <>
                                    <img src={equippedItem.icon} alt={equippedItem.name} className="w-5 h-5 object-contain my-0.5 filter drop-shadow" />

                                    {/* 🟢 3. สีตัวหนังสือใช้สีเดียวกับ Rarity ของช่อง (Inherit จาก parent) */}
                                    <span className="text-[10px] font-bold truncate w-full text-center px-1 tracking-tight opacity-90">
                                        {equippedItem.name}
                                    </span>

                                    <button
                                        onClick={() => unequipItem(equippedItem)}
                                        className="absolute -top-1 -right-1 bg-red-600/90 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10 shadow"
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <span className="text-[10px] text-slate-600 font-medium">Empty</span>
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
                    className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-4 rounded mt-10 w-full text-xs"
                >
                    COMBINE ITEMS
                </button>
            </div>
        </div >
    );
};