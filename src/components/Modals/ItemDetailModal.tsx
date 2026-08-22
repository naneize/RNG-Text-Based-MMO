import type { Item } from '../../types/game';
import { getFullStatRanges, getSpecialBonusRange } from '../../utils/statRanges';
import { getTraitById } from '../../data/equipmentTraits';
import { getSetInfoForItem, describeTierScaling } from '../../data/setBonuses';
import { itemLibrary } from '../../data/itemLibrary';

const ITEM_INFO = Object.fromEntries(itemLibrary.map((i) => [i.id, i]));

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
    const equipmentTrait = getTraitById(selectedItem.traitId || selectedItem.weaponAbilityId);

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
            <div className={`relative bg-stone-950 border-2 ${getRarityColor(selectedItem.rarity)} px-12 py-14 rounded-2xl w-full max-w-6xl min-h-[680px] flex flex-col md:flex-row gap-12 justify-between shadow-2xl`} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 w-7 h-7 bg-stone-900 hover:bg-rose-600 border border-amber-950/60 text-amber-400/70 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition cursor-pointer z-10 shadow-sm"
                    title="Close"
                >
                    ✕
                </button>

                {/* คอลัมน์ซ้าย: รูปและข้อมูลพื้นฐาน */}
                <div className="flex flex-col items-center justify-start w-full md:w-1/3 border-b md:border-b-0 md:border-r border-amber-950/60 pb-4 md:pb-0 md:pr-6">
                    <h2 className="text-2xl font-bold text-amber-100 text-center mb-3 tracking-wide">{selectedItem.name}</h2>

                    {selectedItem.icon ? (
                        <img
                            src={selectedItem.icon}
                            alt={selectedItem.name}
                            className="w-44 h-44 mb-5 object-contain drop-shadow-2xl"
                        />
                    ) : (
                        <div className="w-44 h-44 mb-5 bg-stone-900 rounded-xl flex items-center justify-center text-amber-500/50 text-sm border border-amber-950/80">
                            No Image
                        </div>
                    )}

                    <div className="text-center space-y-1.5 w-full">
                        {/* ป้ายบอก Slot */}
                        <span className="inline-block bg-amber-950/40 text-amber-300 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest border border-amber-800/60 shadow-sm">
                            {selectedItem.slot}
                        </span>

                        {/* Item Level */}
                        {selectedItem.type !== 'material' && selectedItem.slot !== 'material' && selectedItem.type !== 'skill' && selectedItem.slot !== 'skill' && (
                            <div className="text-xs text-amber-100/90 font-bold uppercase tracking-widest mt-2">
                                ITEM LEVEL : <span className="text-amber-400 font-mono">{selectedItem.itemLevel ?? 1}</span>
                            </div>
                        )}

                        {/* Drop Chance */}
                        {!hideActions && (
                            <div className="text-xs text-amber-500/70 font-bold uppercase tracking-widest mt-2">
                                DROP CHANCE : <span className="text-amber-400 font-mono">{getDropChance(selectedItem.rarity)}%</span>
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
                                <div className="flex flex-col mt-2 space-y-1 items-center bg-amber-950/20 p-2.5 rounded-lg border border-amber-950/60">
                                    <div className="text-xs text-amber-500/80 font-bold uppercase tracking-wider">
                                        TYPE : {groupText}
                                    </div>
                                    <div className="text-xs text-amber-200 font-semibold uppercase tracking-wider text-center break-words max-w-[220px]">
                                        WEAPON : {selectedItem.weaponType.replace(/-/g, ' ')}
                                    </div>
                                </div>
                            );
                        })()}


                        {/* 🛡️ Set Info — แสดงเฉพาะไอเทมที่เป็นชิ้นส่วนของ set */}
                        {(() => {
                            const setInfo = getSetInfoForItem(selectedItem.id);
                            if (!setInfo) return null;
                            return (
                                <div className="w-full text-left mt-3 p-3 rounded-xl border border-amber-700/60 bg-amber-950/30">
                                    <div className="text-xs text-amber-400 font-extrabold uppercase tracking-widest drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">
                                        Set : {setInfo.name}
                                    </div>
                                    <div className="text-[10px] text-amber-100/60 mt-1.5 leading-relaxed">
                                        {setInfo.itemIds.map((pieceId) => {
                                            const piece = ITEM_INFO[pieceId];
                                            const isThisPiece = pieceId === selectedItem.id;
                                            return (
                                                <div key={pieceId} className={isThisPiece ? 'text-amber-300 font-bold' : ''}>
                                                    • {piece?.name ?? pieceId} {isThisPiece ? '(this item)' : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-amber-900/40 space-y-0.5">
                                        {setInfo.tiers.map((tier) => (
                                            <div key={tier.requiredCount} className="text-[10px] text-amber-300 font-semibold">
                                                {describeTierScaling(tier)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 🌟 Equipment Trait */}
                        {equipmentTrait && (
                            <div className="w-full text-left space-y-2 mt-3 pt-4 border-t border-amber-950/60 bg-amber-950/20 p-3 rounded-xl border border-amber-950/60">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-amber-400 font-extrabold uppercase tracking-widest">
                                        {selectedItem.slot ? `${selectedItem.slot.toUpperCase()} TRAIT` : 'EQUIPMENT TRAIT'}
                                    </span>
                                    <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/50">
                                        {equipmentTrait.trigger.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                <div>
                                    <div className="text-base font-extrabold text-amber-200 tracking-wide">
                                        {equipmentTrait.name}
                                    </div>

                                    {equipmentTrait.lore && (
                                        <p className="text-xs text-amber-300/70 italic leading-relaxed font-normal mt-1.5">
                                            "{equipmentTrait.lore}"
                                        </p>
                                    )}

                                    <p className="text-xs text-amber-100/90 leading-relaxed font-medium mt-1.5">
                                        {renderFormattedDescription(equipmentTrait.description)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* คอลัมน์ขวา: รายละเอียด, Stats และปุ่ม */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        {/* Equipped Item Slot */}
                        {(() => {
                            return equippedInSlot ? (
                                <div className="flex flex-col items-center justify-center text-xs mb-4 border-b border-amber-950/60 pb-3 gap-1 bg-amber-950/10 p-2.5 rounded-xl border border-amber-950/40">
                                    <span className="text-[10px] text-amber-500 font-bold tracking-wider">EQUIPPED ITEM</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-100 font-bold">{equippedInSlot.name}</span>
                                        <span className="bg-amber-500/20 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-sm">
                                            Lv.{equippedInSlot.itemLevel || 1}
                                        </span>
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {selectedItem.description && (
                            <div className="bg-stone-900/90 p-3 rounded-lg border border-amber-950/80 mb-4 shadow-inner">
                                <p className="text-amber-200/80 text-[11px] italic text-center">"{selectedItem.description}"</p>
                            </div>
                        )}

                        {selectedItem.type === 'skill' && (
                            <div className="space-y-3 mb-4">
                                {selectedItem.description && (
                                    <div className="text-xs text-amber-200/90 bg-stone-900 p-2.5 rounded-lg border border-amber-950/80">
                                        {selectedItem.description}
                                    </div>
                                )}

                                <div className="flex justify-around bg-stone-900 p-2.5 rounded-lg border border-amber-950/80 shadow-inner">
                                    <div className="text-center">
                                        <div className="text-[9px] text-amber-500/70 uppercase font-semibold">Chance</div>
                                        <div className="text-amber-400 font-bold font-mono text-xs">{selectedItem.effectChance}%</div>
                                    </div>
                                    <div className="w-px h-6 bg-amber-950"></div>
                                    <div className="text-center">
                                        <div className="text-[9px] text-amber-500/70 uppercase font-semibold">Power</div>
                                        <div className="text-orange-400 font-bold font-mono text-xs">{selectedItem.effectPower}</div>
                                    </div>
                                </div>

                                {selectedItem.skillCondition && (
                                    <div className="bg-stone-900 p-3 rounded-lg border border-amber-950/80 space-y-2 shadow-inner">
                                        <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider border-b border-amber-950 pb-1">Skill Conditions</div>

                                        {selectedItem.skillCondition.damageType && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-amber-500/70 uppercase font-semibold">Damage Type</span>
                                                <span className={`text-[10px] font-bold uppercase ${selectedItem.skillCondition.damageType === 'magic' ? 'text-purple-400' : 'text-orange-400'}`}>
                                                    {selectedItem.skillCondition.damageType}
                                                </span>
                                            </div>
                                        )}

                                        {selectedItem.skillCondition.elementBonusAgainst && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-amber-500/70 uppercase font-semibold">Vs Element</span>
                                                <span className="text-[10px] text-blue-400 font-bold font-mono">
                                                    {selectedItem.skillCondition.elementBonusAgainst} +{selectedItem.skillCondition.elementBonusPercent}%
                                                </span>
                                            </div>
                                        )}

                                        {selectedItem.skillCondition.raceBonusAgainst && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-amber-500/70 uppercase font-semibold">Vs Race</span>
                                                <span className="text-[10px] text-amber-400 font-bold font-mono">
                                                    {selectedItem.skillCondition.raceBonusAgainst} +{selectedItem.skillCondition.raceBonusPercent}%
                                                </span>
                                            </div>
                                        )}

                                        {selectedItem.skillCondition.scalingStat && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-amber-500/70 uppercase font-semibold">Scales With</span>
                                                <span className="text-[10px] text-amber-300 font-bold font-mono">
                                                    {selectedItem.skillCondition.scalingStat.toUpperCase()} ×{selectedItem.skillCondition.scalingMultiplier?.toFixed(2)}
                                                </span>
                                            </div>
                                        )}

                                        {(selectedItem.skillCondition.requiresLowHp || selectedItem.skillCondition.requiresHighHp) && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] text-amber-500/70 uppercase font-semibold">
                                                    Bonus <span className="text-amber-400 font-semibold">+25%</span> {selectedItem.skillCondition.requiresLowHp ? 'When HP Below' : 'When HP Above'}
                                                </span>
                                                <span className="text-[10px] text-rose-400 font-bold font-mono">
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
                                    <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wider">
                                        {equippedInSlot ? "Stats Comparison" : "Stats Gained"}
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {/* 1. ส่วน Element Bonus */}
                                        {(selectedItem.elementBonus || equippedInSlot?.elementBonus) && (() => {
                                            const newVal = selectedItem.elementBonus?.value || 0;
                                            const oldVal = equippedInSlot?.elementBonus?.value || 0;
                                            const diff = newVal - oldVal;
                                            const isMax = newVal >= specialRange.max;

                                            return (
                                                <div className="col-span-1 p-3.5 bg-stone-900 border border-amber-950/80 rounded-xl flex flex-col justify-between text-center shadow-md">
                                                    <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                                                        ELEMENT : {selectedItem.elementBonus?.type || equippedInSlot?.elementBonus?.type}
                                                    </span>
                                                    <div className="my-2">
                                                        <span className="text-amber-300 font-extrabold text-base font-mono">
                                                            +{newVal}%
                                                        </span>
                                                        {equippedInSlot && diff !== 0 && (
                                                            <span className={`text-xs ml-1 font-bold font-mono ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                ({diff > 0 ? '+' : ''}{diff})
                                                            </span>
                                                        )}
                                                        {isMax && <span className="text-xs ml-1 text-amber-400 font-bold">MAX</span>}
                                                    </div>
                                                    <div className={`text-[10px] px-2 py-0.5 rounded-md font-semibold mx-auto ${isMax ? 'text-stone-950 bg-amber-500' : 'text-amber-200/80 bg-stone-800 border border-amber-950'}`}>
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
                                                <div className="col-span-1 p-3.5 bg-stone-900 border border-amber-950/80 rounded-xl flex flex-col justify-between text-center shadow-md">
                                                    <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                                                        RACE : {selectedItem.raceBonus?.type || equippedInSlot?.raceBonus?.type}
                                                    </span>
                                                    <div className="my-2">
                                                        <span className="text-amber-300 font-extrabold text-base font-mono">
                                                            +{newVal}%
                                                        </span>
                                                        {equippedInSlot && diff !== 0 && (
                                                            <span className={`text-xs ml-1 font-bold font-mono ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                ({diff > 0 ? '+' : ''}{diff})
                                                            </span>
                                                        )}
                                                        {isMax && <span className="text-xs ml-1 text-amber-400 font-bold">MAX</span>}
                                                    </div>
                                                    <div className={`text-[10px] px-2 py-0.5 rounded-md font-semibold mx-auto ${isMax ? 'text-stone-950 bg-amber-500' : 'text-amber-200/80 bg-stone-800 border border-amber-950'}`}>
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
                                                <div key={stat} className="bg-stone-900 border border-amber-950/80 p-3.5 rounded-xl text-center flex flex-col justify-between shadow-md">
                                                    <div>
                                                        <div className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">{stat}</div>
                                                        <div className="font-extrabold text-lg text-amber-100 my-1 font-mono">
                                                            {newVal > 0 ? newVal : 0}
                                                            {isMax && (
                                                                <span className="text-[10px] ml-1 text-amber-400 font-bold align-middle">
                                                                    MAX
                                                                </span>
                                                            )}
                                                            {equippedInSlot && diff !== 0 && (
                                                                <span className={`text-xs ml-1 font-bold font-mono ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    ({diff > 0 ? '+' : ''}{diff})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {range && (
                                                        <div className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold mx-auto ${isMax ? 'text-stone-950 bg-amber-500' : 'text-amber-200/80 bg-stone-800 border border-amber-950'}`}>
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
                    </div>

                    {/* ส่วนปุ่มกดด้านล่าง */}
                    {!hideActions && (
                        <div className="grid grid-cols-5 gap-3 mt-8">
                            {/* 1. EQUIP */}
                            {selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => { equipItem(selectedItem); setSelectedItem(null); }}
                                    className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 h-18 flex items-center justify-center rounded-xl font-extrabold text-stone-950 transition-all text-xs cursor-pointer shadow-lg shadow-amber-500/25 border border-amber-400/50"
                                >
                                    EQUIP
                                </button>
                            )}

                            {/* 2. SHARE TO CHAT */}
                            {onShareToChat && (
                                <button
                                    onClick={() => { onShareToChat(selectedItem); setSelectedItem(null); }}
                                    className="bg-stone-800 hover:bg-stone-700 active:bg-stone-900 py-3 rounded-xl font-bold text-amber-300 transition-all text-xs cursor-pointer shadow-md border border-amber-900/60 flex items-center justify-center"
                                >
                                    SHARE TO CHAT
                                </button>
                            )}

                            {/* 3. STATS TRANSFER */}
                            {selectedItem.type !== 'skill' && selectedItem.type !== 'material' && (
                                <button
                                    onClick={onTransferClick}
                                    className="bg-stone-800 hover:bg-stone-700 active:bg-stone-900 py-3 rounded-xl font-bold text-amber-300 transition-all text-xs cursor-pointer shadow-md border border-amber-900/60 flex items-center justify-center"
                                >
                                    STATS TRANSFER
                                </button>
                            )}

                            {/* 4. STATS REROLL */}
                            {selectedItem.type !== 'skill' && selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => { onRerollClick(selectedItem); setSelectedItem(null); }}
                                    className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 py-3 rounded-xl font-extrabold text-stone-950 transition-all text-xs cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-amber-400/50 flex items-center justify-center"
                                >
                                    STATS REROLL
                                </button>
                            )}

                            {/* 5. SALVAGE ITEM */}
                            {selectedItem.type !== 'material' && (
                                <button
                                    onClick={() => { onSalvageClick(selectedItem); setSelectedItem(null); }}
                                    className="bg-rose-700 hover:bg-rose-600 active:bg-rose-800 py-3 rounded-xl font-bold text-white transition-all text-xs cursor-pointer shadow-md border border-rose-500/30 flex items-center justify-center"
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
}