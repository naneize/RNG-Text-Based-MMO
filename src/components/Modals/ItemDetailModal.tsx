import type { Item } from '../../types/game';
import { getFullStatRanges, getSpecialBonusRange } from '../../utils/statRanges';

interface ItemDetailModalProps {
    selectedItem: Item;
    setSelectedItem: (item: Item | null) => void;
    getRarityColor: (rarity: string) => string;
    getDropChance: (rarity: string) => string;
    equippedInSlot: Item | null;
    equipItem: (item: Item) => void;
    onTransferClick: () => void;
    onSalvageClick: (item: Item) => void;
    onRerollClick: (item: Item) => void;
    onShareToChat?: (item: Item) => void;
    hideActions?: boolean;

}



export const ItemDetailModal = ({
    selectedItem,
    setSelectedItem,
    getRarityColor,
    getDropChance,
    equippedInSlot,
    equipItem,
    onTransferClick,
    onSalvageClick,
    onRerollClick,
    onShareToChat,
    hideActions = false,
}: ItemDetailModalProps) => {

    const statRanges = getFullStatRanges({
        slot: selectedItem.slot,
        weaponType: selectedItem.weaponType,
        rarity: selectedItem.rarity,
        itemLevel: selectedItem.itemLevel,
    });
    const specialRange = getSpecialBonusRange(selectedItem.rarity);


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
            <div className={`relative bg-slate-900 border-2 ${getRarityColor(selectedItem.rarity)} p-8 rounded-2xl w-full max-w-2xl flex flex-col md:flex-row gap-6`} onClick={e => e.stopPropagation()}>

                <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 w-7 h-7 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition cursor-pointer z-10"
                    title="Close"
                >
                    ✕
                </button>

                {/* คอลัมน์ซ้าย: รูปและข้อมูลพื้นฐาน */}
                <div className="flex flex-col items-center justify-start w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0">
                    <h2 className="text-xl font-bold text-white text-center mb-2">{selectedItem.name}</h2>
                    {selectedItem.icon ? (
                        <img src={selectedItem.icon} alt={selectedItem.name} className="w-24 h-24 mb-4 object-contain" />
                    ) : (
                        <div className="w-24 h-24 mb-4 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs">No Image</div>
                    )}

                    <div className="text-center space-y-1">
                        <span className="inline-block bg-slate-800 text-slate-400 text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest border border-slate-700">{selectedItem.slot}</span>

                        {selectedItem.type !== 'material' && selectedItem.slot !== 'material' && selectedItem.type !== 'skill' && selectedItem.slot !== 'skill' && (
                            <div className="text-[9px] text-white font-bold uppercase tracking-widest mt-1">
                                ITEM LEVEL : <span className="text-emerald-400">{selectedItem.itemLevel ?? 1}</span>
                            </div>
                        )}

                        {selectedItem.slot === 'weapon' && selectedItem.weaponType && (() => {
                            const oneHandedTypes = ['sword', 'dagger', 'mace', 'staff'];
                            const twoHandedTypes = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
                            const rangedTypes = ['bow', 'crossbow', 'sling', 'throwing'];

                            const isOneHanded = oneHandedTypes.includes(selectedItem.weaponType);
                            const isTwoHanded = twoHandedTypes.includes(selectedItem.weaponType) || selectedItem.weaponType.includes('two-hand');
                            const isRanged = rangedTypes.includes(selectedItem.weaponType);

                            let groupText = 'WEAPON';
                            if (isOneHanded) groupText = 'ONE-HAND ';
                            else if (isTwoHanded) groupText = 'TWO-HAND ';
                            else if (isRanged) groupText = 'RANGED ';

                            return (
                                <div className="flex flex-col mt-1 space-y-0.5 items-center">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                        TYPE : {groupText}
                                    </div>
                                    <div className="text-[9px] text-emerald-300 font-semibold uppercase tracking-wider text-center wrap-break-word max-w-50">
                                        WEAPON : {selectedItem.weaponType.replace(/-/g, ' ')}
                                    </div>
                                </div>
                            );
                        })()}

                        {!hideActions && (
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                DROP CHANCE : <span className="text-yellow-600">{getDropChance(selectedItem.rarity)}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* คอลัมน์ขวา: รายละเอียด, Stats และปุ่ม */}
                <div className="flex-1 flex flex-col">
                    {equippedInSlot && (
                        <div className="text-[10px] text-amber-500 text-center mb-4 font-bold border-b border-slate-700 pb-2">EQUIPPED: {equippedInSlot.name}</div>
                    )}

                    {selectedItem.description && (
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mb-4">
                            <p className="text-slate-300 text-[11px] italic text-center">"{selectedItem.description}"</p>
                        </div>
                    )}

                    {selectedItem.type === 'skill' && (
                        <div className="space-y-3 mb-4">
                            {selectedItem.description && (
                                <div className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/60">
                                    {selectedItem.description}
                                </div>
                            )}

                            <div className="flex justify-around bg-slate-800 p-2 rounded-lg border border-slate-700">
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-400 uppercase">Chance</div>
                                    <div className="text-yellow-400 font-bold text-xs">{selectedItem.effectChance}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] text-slate-400 uppercase">Power</div>
                                    <div className="text-red-400 font-bold text-xs">{selectedItem.effectPower}</div>
                                </div>
                            </div>

                            {selectedItem.skillCondition && (
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 space-y-2">
                                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider border-b border-slate-700 pb-1">Skill Conditions</div>

                                    {selectedItem.skillCondition.damageType && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 uppercase">Damage Type</span>
                                            <span className={`text-[10px] font-bold uppercase ${selectedItem.skillCondition.damageType === 'magic' ? 'text-purple-400' : 'text-orange-400'}`}>
                                                {selectedItem.skillCondition.damageType}
                                            </span>
                                        </div>
                                    )}

                                    {selectedItem.skillCondition.elementBonusAgainst && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 uppercase">Vs Element</span>
                                            <span className="text-[10px] text-blue-400 font-bold">
                                                {selectedItem.skillCondition.elementBonusAgainst} +{selectedItem.skillCondition.elementBonusPercent}%
                                            </span>
                                        </div>
                                    )}

                                    {selectedItem.skillCondition.raceBonusAgainst && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 uppercase">Vs Race</span>
                                            <span className="text-[10px] text-amber-400 font-bold">
                                                {selectedItem.skillCondition.raceBonusAgainst} +{selectedItem.skillCondition.raceBonusPercent}%
                                            </span>
                                        </div>
                                    )}

                                    {selectedItem.skillCondition.scalingStat && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 uppercase">Scales With</span>
                                            <span className="text-[10px] text-emerald-400 font-bold">
                                                {selectedItem.skillCondition.scalingStat.toUpperCase()} ×{selectedItem.skillCondition.scalingMultiplier?.toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    {(selectedItem.skillCondition.requiresLowHp || selectedItem.skillCondition.requiresHighHp) && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 uppercase">
                                                Bonus <span className="text-emerald-400 font-semibold">+25%</span> {selectedItem.skillCondition.requiresLowHp ? 'When HP Below' : 'When HP Above'}
                                            </span>
                                            <span className="text-[10px] text-red-400 font-bold">
                                                {selectedItem.skillCondition.hpThreshold}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ส่วน Stats Gained + เปรียบเทียบ */}
                    {(selectedItem.type !== 'skill' && selectedItem.slot !== 'skill' && selectedItem.stats && Object.keys(selectedItem.stats).length > 0) && (
                        <div className="space-y-4 flex-grow">
                            <div>
                                <div className="text-[9px] text-emerald-500 font-bold mb-1 uppercase tracking-wider">
                                    {equippedInSlot ? "Stats Comparison" : "Stats Gained"}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {(selectedItem.elementBonus || equippedInSlot?.elementBonus) && (() => {
                                        const newVal = selectedItem.elementBonus?.value || 0;
                                        const oldVal = equippedInSlot?.elementBonus?.value || 0;
                                        const diff = newVal - oldVal;
                                        const isMax = newVal >= specialRange.max;

                                        return (
                                            <div className="col-span-2 p-2 bg-blue-900/20 border border-blue-700/30 rounded flex justify-between items-center">
                                                <span className="text-[9px] text-blue-400 font-bold uppercase">
                                                    Element: {selectedItem.elementBonus?.type || equippedInSlot?.elementBonus?.type}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-2">
                                                        {equippedInSlot?.elementBonus && (
                                                            <span className="text-[10px] text-slate-500">{equippedInSlot.elementBonus.value}%</span>
                                                        )}
                                                        {equippedInSlot?.elementBonus && <span className="text-[10px] text-slate-600">→</span>}
                                                        <span className="text-emerald-400 font-bold text-[11px]">
                                                            + {newVal}%
                                                            {isMax && (
                                                                <span className="text-[9px] ml-1 text-amber-400 font-bold align-middle">
                                                                    MAX
                                                                </span>
                                                            )}
                                                            {equippedInSlot && diff !== 0 && (
                                                                <span className={`text-[10px] ml-1 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    ({diff > 0 ? '+' : ''}{diff})
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 font-medium ${isMax ? 'text-amber-100 bg-amber-700/70' : 'text-slate-100 bg-slate-600/70'}`}>
                                                        {specialRange.min}–{specialRange.max}%
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {(selectedItem.raceBonus || equippedInSlot?.raceBonus) && (() => {
                                        const newVal = selectedItem.raceBonus?.value || 0;
                                        const oldVal = equippedInSlot?.raceBonus?.value || 0;
                                        const diff = newVal - oldVal;
                                        const isMax = newVal >= specialRange.max;

                                        return (
                                            <div className="col-span-2 p-2 bg-amber-900/20 border border-amber-700/30 rounded flex justify-between items-center">
                                                <span className="text-[9px] text-amber-400 font-bold uppercase">
                                                    Race: {selectedItem.raceBonus?.type || equippedInSlot?.raceBonus?.type}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-2">
                                                        {equippedInSlot?.raceBonus && (
                                                            <span className="text-[10px] text-slate-500">{equippedInSlot.raceBonus.value}%</span>
                                                        )}
                                                        {equippedInSlot?.raceBonus && <span className="text-[10px] text-slate-500">→</span>}
                                                        <span className="text-emerald-400 font-bold text-[11px]">
                                                            + {newVal}%
                                                            {isMax && (
                                                                <span className="text-[9px] ml-1 text-amber-400 font-bold align-middle">
                                                                    MAX
                                                                </span>
                                                            )}
                                                            {equippedInSlot && diff !== 0 && (
                                                                <span className={`text-[10px] ml-1 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    ({diff > 0 ? '+' : ''}{diff})
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 font-medium ${isMax ? 'text-amber-100 bg-amber-700/70' : 'text-slate-100 bg-slate-600/70'}`}>
                                                        {specialRange.min}–{specialRange.max}%
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {Array.from(new Set([...Object.keys(selectedItem.stats), ...Object.keys(equippedInSlot?.stats || {})])).map((stat) => {
                                        const newVal = (selectedItem.stats as any)[stat] || 0;
                                        const oldVal = equippedInSlot ? (equippedInSlot.stats as any)?.[stat] || 0 : 0;
                                        const diff = newVal - oldVal;

                                        if (newVal === 0 && oldVal === 0) return null;

                                        const range = statRanges[stat as keyof typeof statRanges];
                                        const isMax = !!range && newVal >= range.max; // ✅ เช็คว่าค่าชน max ของ range หรือไม่

                                        return (
                                            <div key={stat} className="bg-slate-800 p-2 rounded text-center">
                                                <div className="text-[9px] text-slate-400 uppercase">{stat}</div>
                                                <div className="font-bold text-sm text-slate-200">
                                                    {newVal > 0 ? newVal : 0}
                                                    {isMax && (
                                                        <span className="text-[9px] ml-1 text-amber-400 font-bold align-middle">
                                                            MAX
                                                        </span>
                                                    )}
                                                    {equippedInSlot && diff !== 0 && (
                                                        <span className={`text-[10px] ml-1 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            ({diff > 0 ? '+' : ''}{diff})
                                                        </span>
                                                    )}
                                                </div>
                                                {range && (
                                                    <div className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 font-medium ${isMax ? 'text-amber-100 bg-amber-700/70' : 'text-slate-100 bg-slate-600/70'
                                                        }`}>
                                                        {range.min}–{range.max}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {!hideActions && (
                        <div className="flex gap-2 mt-6 flex-wrap">

                            {/* 1. ซ่อนปุ่ม EQUIP สำหรับ Material */}
                            {selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => { equipItem(selectedItem); setSelectedItem(null); }}
                                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 py-2 rounded font-bold text-white transition-all text-xs cursor-pointer"
                                >
                                    EQUIP
                                </button>
                            )}

                            {onShareToChat && (
                                <button
                                    onClick={() => {
                                        onShareToChat(selectedItem);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 bg-sky-600 hover:bg-sky-500 py-2 rounded font-bold text-white transition-all text-xs cursor-pointer"
                                >
                                    SHARE TO CHAT
                                </button>
                            )}

                            {/* 2. ซ่อนปุ่ม STATS TRANSFER สำหรับทั้ง Skill และ Material */}
                            {selectedItem.type !== 'skill' && selectedItem.type !== 'material' && (
                                <button
                                    onClick={onTransferClick}
                                    className="flex-1 bg-violet-700 hover:bg-violet-600 py-2 rounded font-bold text-white transition-all text-xs cursor-pointer"
                                >
                                    STATS TRANSFER
                                </button>
                            )}
                            {/* 3. เพิ่มปุ่ม REROLL ในส่วนปุ่มกดการกระทำ */}
                            {selectedItem.type !== 'skill' && selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => {
                                        onRerollClick(selectedItem);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded font-bold text-white transition-all text-xs cursor-pointer shadow-lg shadow-indigo-900/30"
                                >
                                    STATS REROLL
                                </button>
                            )}

                            {selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => {
                                        onSalvageClick(selectedItem);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 bg-rose-600 hover:bg-rose-500 py-2 rounded font-bold text-white transition-all text-xs cursor-pointer shadow-lg shadow-rose-900/30"
                                >
                                    SALVAGE ITEM
                                </button>
                            )}


                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};