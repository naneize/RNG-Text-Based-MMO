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
                    const equippedItem = player.equippedItems[slot];
                    const borderStyle = equippedItem ? getRarityColor(equippedItem.rarity) : 'border-slate-700';
                    return (
                        <div key={slot} className={`relative h-16 bg-slate-800 border-2 ${borderStyle} flex flex-col items-center justify-center rounded p-1 group transition-colors`}>
                            <span className="capitalize text-[10px] text-slate-500 font-bold">{slot}</span>
                            {equippedItem ? (
                                <>
                                    <img src={equippedItem.icon} alt={equippedItem.name} className="w-6 h-6 object-contain" />
                                    <span className="text-emerald-400 text-[10px] truncate w-full text-center px-1">{equippedItem.name}</span>
                                    <button onClick={() => unequipItem(equippedItem)}
                                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10">X</button>
                                </>
                            ) : <span className="text-[10px] text-slate-700">Empty</span>}
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
        </div>
    );
};