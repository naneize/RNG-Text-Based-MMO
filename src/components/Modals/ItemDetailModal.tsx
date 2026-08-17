import type { Item } from '../../types/game';
import { getFullStatRanges, getSpecialBonusRange } from '../../utils/statRanges';
import { WEAPON_ABILITY_POOL } from '../../data/weaponAbilities';

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
    const weaponAbility = selectedItem.weaponAbilityId
        ? WEAPON_ABILITY_POOL.find(a => a.id === selectedItem.weaponAbilityId)
        : undefined;

    // 1. สร้างฟังก์ชันช่วยแปลงข้อความ description ให้ตัวเลขเปอร์เซ็นต์กลายเป็นสีไฮไลต์อัตโนมัติ
    const renderFormattedDescription = (text: string) => {
        // ใช้ Regex หาแพทเทิร์นที่เป็นตัวเลขเปอร์เซ็นต์ (เช่น "72% - 88%" หรือ "30%")
        const parts = text.split(/(\d+% - \d+%|\d+%)/g);

        return parts.map((part, i) => {
            // ถ้าส่วนไหนตรงกับตัวเลขเปอร์เซ็นต์ ให้ครอบด้วย span เปลี่ยนสี
            if (/(\d+% - \d+%|\d+%)/.test(part)) {
                return (
                    <span key={i} className="text-amber-400 font-bold">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
            <div className={`relative bg-slate-900 border-2 ${getRarityColor(selectedItem.rarity)} px-12 py-14 rounded-2xl w-full max-w-6xl min-h-[680px] flex flex-col md:flex-row gap-12 justify-between`} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 w-7 h-7 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition cursor-pointer z-10"
                    title="Close"
                >
                    ✕
                </button>

                {/* คอลัมน์ซ้าย: รูปและข้อมูลพื้นฐาน */}
                <div className="flex flex-col items-center justify-start w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0">
                    <h2 className="text-2xl font-bold text-white text-center mb-3">{selectedItem.name}</h2>

                    {selectedItem.icon ? (
                        <img
                            src={selectedItem.icon}
                            alt={selectedItem.name}
                            className="w-44 h-44 mb-5 object-contain drop-shadow-lg"
                        />
                    ) : (
                        <div className="w-44 h-44 mb-5 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-sm border border-slate-700">
                            No Image
                        </div>
                    )}

                    <div className="text-center space-y-1.5">
                        {/* ป้ายบอก Slot (เพิ่มขนาดฟอนต์และขอบมน) */}
                        <span className="inline-block bg-slate-800 text-slate-300 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest border border-slate-700">
                            {selectedItem.slot}
                        </span>

                        {/* Item Level */}
                        {selectedItem.type !== 'material' && selectedItem.slot !== 'material' && selectedItem.type !== 'skill' && selectedItem.slot !== 'skill' && (
                            <div className="text-xs text-white font-bold uppercase tracking-widest mt-2">
                                ITEM LEVEL : <span className="text-emerald-400">{selectedItem.itemLevel ?? 1}</span>
                            </div>
                        )}

                        {/* ประเภทอาวุธและชื่อ Weapon Type */}
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
                                <div className="flex flex-col mt-2 space-y-1 items-center">
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        TYPE : {groupText}
                                    </div>
                                    {/* แก้จาก wrap-break-word เป็น break-words และเพิ่มขนาดฟอนต์ */}
                                    <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider text-center break-words max-w-[220px]">
                                        WEAPON : {selectedItem.weaponType.replace(/-/g, ' ')}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Drop Chance */}
                        {!hideActions && (
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">
                                DROP CHANCE : <span className="text-yellow-500">{getDropChance(selectedItem.rarity)}%</span>
                            </div>
                        )}



                        {/* 🌟 Weapon Trait: จัดชิดเข้าหากัน + เปลี่ยนสีแยกประเภท */}
                        {weaponAbility && (
                            <div className="w-full text-left space-y-2 mt-3 pt-4 border-t border-slate-700/80">
                                <div className="flex items-center gap-3">
                                    {/* เพิ่มขนาดจาก text-[10px] เป็น text-xs */}
                                    <span className="text-xs text-indigo-400 font-extrabold uppercase tracking-widest">
                                        Weapon Trait
                                    </span>
                                    {/* เพิ่มขนาดจาก text-[9px] เป็น text-[10px] */}
                                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                                        {weaponAbility.type.replace('_', ' ')}
                                    </span>
                                </div>

                                <div>
                                    {/* เพิ่มขนาดชื่อสกิลจาก text-sm เป็น text-base */}
                                    <div className="text-base font-extrabold text-amber-400 tracking-wide">
                                        {weaponAbility.name}
                                    </div>

                                    {/* เพิ่มขนาด Lore จาก text-[11px] เป็น text-xs */}
                                    {weaponAbility.lore && (
                                        <p className="text-xs text-slate-400 italic leading-relaxed font-normal mt-1.5">
                                            "{weaponAbility.lore}"
                                        </p>
                                    )}

                                    {/* เพิ่มขนาด Description จาก text-[11px] เป็น text-xs */}
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1.5">
                                        {renderFormattedDescription(weaponAbility.description)}
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* คอลัมน์ขวา: รายละเอียด, Stats และปุ่ม */}
                <div className="flex-1 flex flex-col">
                    {/* 🟢 ใช้ targetSlotKey ดึงข้อมูลชิ้นที่สวมใส่อยู่จริง */}
                    {(() => {
                        return equippedInSlot ? (
                            <div className="text-[10px] text-amber-500 text-center mb-4 font-bold border-b border-slate-700 pb-2">EQUIPPED: {equippedInSlot.name}</div>
                        ) : null;
                    })()}

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
                        <div className="space-y-4 grow">
                            <div>
                                <div className="text-xs text-emerald-400 font-bold mb-2 uppercase tracking-wider">
                                    {equippedInSlot ? "Stats Comparison" : "Stats Gained"}
                                </div>

                                {/* ปรับจาก grid-cols-3 เป็น grid-cols-4 และเพิ่ม gap เป็น gap-3 */}
                                <div className="grid grid-cols-4 gap-3">

                                    {/* 1. ส่วน Element Bonus */}
                                    {(selectedItem.elementBonus || equippedInSlot?.elementBonus) && (() => {
                                        const newVal = selectedItem.elementBonus?.value || 0;
                                        const oldVal = equippedInSlot?.elementBonus?.value || 0;
                                        const diff = newVal - oldVal;
                                        const isMax = newVal >= specialRange.max;

                                        return (
                                            <div className="col-span-1 p-3.5 bg-blue-900/20 border border-blue-700/40 rounded-xl flex flex-col justify-between text-center shadow-md">
                                                <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">
                                                    ELEMENT : {selectedItem.elementBonus?.type || equippedInSlot?.elementBonus?.type}
                                                </span>
                                                <div className="my-2">
                                                    <span className="text-emerald-400 font-extrabold text-base">
                                                        +{newVal}%
                                                    </span>
                                                    {equippedInSlot && diff !== 0 && (
                                                        <span className={`text-xs ml-1 font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            ({diff > 0 ? '+' : ''}{diff})
                                                        </span>
                                                    )}
                                                    {isMax && <span className="text-xs ml-1 text-amber-400 font-bold">MAX</span>}
                                                </div>
                                                <div className={`text-[10px] px-2 py-0.5 rounded-md font-semibold mx-auto ${isMax ? 'text-amber-100 bg-amber-700/70' : 'text-slate-200 bg-slate-700/80'}`}>
                                                    {specialRange.min}–{specialRange.max}%
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 2. ส่วน Race Bonus */}
                                    {(selectedItem.raceBonus || equippedInSlot?.raceBonus) && (() => {
                                        const newVal = selectedItem.raceBonus?.value || 0;
                                        const oldVal = equippedInSlot?.raceBonus?.value || 0;
                                        const diff = newVal - oldVal;
                                        const isMax = newVal >= specialRange.max;

                                        return (
                                            <div className="col-span-1 p-3.5 bg-amber-900/20 border border-amber-700/40 rounded-xl flex flex-col justify-between text-center shadow-md">
                                                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                                                    RACE : {selectedItem.raceBonus?.type || equippedInSlot?.raceBonus?.type}
                                                </span>
                                                <div className="my-2">
                                                    <span className="text-emerald-400 font-extrabold text-base">
                                                        +{newVal}%
                                                    </span>
                                                    {equippedInSlot && diff !== 0 && (
                                                        <span className={`text-xs ml-1 font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            ({diff > 0 ? '+' : ''}{diff})
                                                        </span>
                                                    )}
                                                    {isMax && <span className="text-xs ml-1 text-amber-400 font-bold">MAX</span>}
                                                </div>
                                                <div className={`text-[10px] px-2 py-0.5 rounded-md font-semibold mx-auto ${isMax ? 'text-amber-100 bg-amber-700/70' : 'text-slate-200 bg-slate-700/80'}`}>
                                                    {specialRange.min}–{specialRange.max}%
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 3. ส่วน Stats ปกติ */}
                                    {Array.from(new Set([...Object.keys(selectedItem.stats || {}), ...Object.keys(equippedInSlot?.stats || {})])).map((stat) => {
                                        const statKey = stat as keyof typeof selectedItem.stats;
                                        const newVal = Number(selectedItem.stats?.[statKey]) || 0;
                                        const oldVal = equippedInSlot?.stats ? Number((equippedInSlot.stats as any)[statKey]) || 0 : 0;
                                        const diff = newVal - oldVal;

                                        if (newVal === 0 && oldVal === 0) return null;

                                        const range = statRanges[stat as keyof typeof statRanges];
                                        const isMax = !!range && newVal >= range.max;

                                        return (
                                            <div key={stat} className="bg-slate-800/90 border border-slate-700/50 p-3.5 rounded-xl text-center flex flex-col justify-between shadow-md">
                                                <div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat}</div>
                                                    <div className="font-extrabold text-lg text-slate-100 my-1">
                                                        {newVal > 0 ? newVal : 0}
                                                        {isMax && (
                                                            <span className="text-[10px] ml-1 text-amber-400 font-bold align-middle">
                                                                MAX
                                                            </span>
                                                        )}
                                                        {equippedInSlot && diff !== 0 && (
                                                            <span className={`text-xs ml-1 font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                ({diff > 0 ? '+' : ''}{diff})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {range && (
                                                    <div className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold mx-auto ${isMax ? 'text-amber-100 bg-amber-700/70' : 'text-slate-200 bg-slate-700/80'}`}>
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
                        <div className="grid grid-cols-5 gap-3 mt-8">
                            {/* 1. EQUIP */}
                            {selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => { equipItem(selectedItem); setSelectedItem(null); }}
                                    className="bg-emerald-700 hover:bg-emerald-600 h-18 flex items-center justify-center rounded-lg font-bold text-white transition-all text-xs cursor-pointer shadow-md"                                >
                                    EQUIP
                                </button>
                            )}

                            {/* 2. SHARE TO CHAT */}
                            {onShareToChat && (
                                <button
                                    onClick={() => { onShareToChat(selectedItem); setSelectedItem(null); }}
                                    className="bg-sky-600 hover:bg-sky-500 py-3 rounded-lg font-bold text-white transition-all text-xs cursor-pointer shadow-md"
                                >
                                    SHARE TO CHAT
                                </button>
                            )}

                            {/* 3. STATS TRANSFER */}
                            {selectedItem.type !== 'skill' && selectedItem.type !== 'material' && (
                                <button
                                    onClick={onTransferClick}
                                    className="bg-violet-700 hover:bg-violet-600 py-3 rounded-lg font-bold text-white transition-all text-xs cursor-pointer shadow-md"
                                >
                                    STATS TRANSFER
                                </button>
                            )}

                            {/* 4. STATS REROLL */}
                            {selectedItem.type !== 'skill' && selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => { onRerollClick(selectedItem); setSelectedItem(null); }}
                                    className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-bold text-white transition-all text-xs cursor-pointer shadow-md"
                                >
                                    STATS REROLL
                                </button>
                            )}

                            {/* 5. SALVAGE ITEM */}
                            {selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => { onSalvageClick(selectedItem); setSelectedItem(null); }}
                                    className="bg-rose-600 hover:bg-rose-500 py-3 rounded-lg font-bold text-white transition-all text-xs cursor-pointer shadow-md"
                                >
                                    SALVAGE ITEM
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};