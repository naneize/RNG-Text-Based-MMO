import type { Item } from '../../types/game';
import { getTraitById } from '../../data/equipmentTraits';

interface LootedModalProps {
    lootedItem: Item;
    setLootedItem: (item: Item | null) => void;
    getDropChance: (rarity: string) => string;
}

export const LootModal = ({
    lootedItem,
    setLootedItem,
    getDropChance
}: LootedModalProps) => {
    const isLegendary = lootedItem.rarity === 'Legendary';
    const isEpic = lootedItem.rarity === 'Epic';
    const isRare = lootedItem.rarity === 'Rare';

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4"
            onClick={() => setLootedItem(null)}
        >
            {/* ส่วนของพลุเอฟเฟกต์เฉพาะไอเทมหายาก */}
            {(isLegendary || isEpic) && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(isLegendary ? 20 : 10)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-2 h-2 rounded-full animate-ping ${isLegendary ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-purple-500 shadow-[0_0_10px_#a855f7]'}`}
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: '1.5s'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* กล่องหลัก Modal */}
            <div
                className={`relative bg-stone-950 p-6 rounded-2xl w-full max-w-2xl flex flex-col md:flex-row gap-6 animate-in fade-in zoom-in duration-300 border backdrop-blur-xl
                    ${isLegendary ? 'shadow-[0_0_60px_15px_rgba(245,158,11,0.3)] border-amber-500/80' : ''}
                    ${isEpic ? 'shadow-[0_0_50px_10px_rgba(168,85,247,0.3)] border-purple-500/80' : ''}
                    ${isRare ? 'shadow-[0_0_40px_8px_rgba(59,130,246,0.3)] border-blue-500/80' : ''}
                    ${!isLegendary && !isEpic && !isRare ? 'border-amber-950 shadow-2xl' : ''}
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* คอลัมน์ซ้าย: รูปและสถานะไอเทม */}
                <div className="flex flex-col items-center justify-center w-full md:w-1/3 border-b md:border-b-0 md:border-r border-amber-950/60 pb-4 md:pb-0 md:pr-4">
                    <div className={`font-bold text-[10px] tracking-widest uppercase mb-4 ${isLegendary ? 'text-amber-400' : isEpic ? 'text-purple-400' : isRare ? 'text-blue-400' : 'text-amber-200/70'}`}>
                        YOU FOUND A {lootedItem.rarity.toUpperCase()}!
                    </div>

                    <div className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center bg-stone-900 border border-amber-950/80 shadow-inner ${isLegendary ? 'shadow-[0_0_25px_rgba(245,158,11,0.4)]' : ''}`}>
                        <img src={lootedItem.icon} alt={lootedItem.name} className="w-20 h-20 object-contain drop-shadow-2xl" />
                    </div>

                    <h3 className="text-amber-100 font-bold text-lg text-center tracking-wide">{lootedItem.name}</h3>

                    {lootedItem.type !== 'material' && lootedItem.type !== 'skill' && (
                        <div className="mt-2 text-center">
                            <span className="bg-amber-950/50 text-amber-300 text-[9px] px-2.5 py-0.5 rounded-full font-bold tracking-wider border border-amber-800/60 shadow-sm">
                                LEVEL {lootedItem.itemLevel ?? 1}
                            </span>
                        </div>
                    )}
                </div>

                {/* คอลัมน์ขวา: รายละเอียด Stats และ Ability */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        {lootedItem.type !== 'material' && lootedItem.type !== 'skill' && (
                            <div className="text-[9px] text-amber-500/70 font-bold uppercase tracking-widest mb-3">
                                DROP CHANCE: <span className="text-amber-400 font-mono">{getDropChance(lootedItem.rarity)}%</span>
                            </div>
                        )}

                        {/* ประเภทอาวุธ */}
                        {lootedItem.slot === 'weapon' && lootedItem.weaponType && (() => {
                            const oneHandedTypes = ['sword', 'dagger', 'mace', 'staff'];
                            const twoHandedTypes = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
                            const rangedTypes = ['bow', 'crossbow', 'sling', 'throwing'];

                            const isOneHanded = oneHandedTypes.includes(lootedItem.weaponType);
                            const isTwoHanded = twoHandedTypes.includes(lootedItem.weaponType) || lootedItem.weaponType.includes('two-hand');
                            const isRanged = rangedTypes.includes(lootedItem.weaponType);

                            let groupText = 'WEAPON';
                            if (isOneHanded) groupText = 'ONE-HAND WEAPON';
                            else if (isTwoHanded) groupText = 'TWO-HAND WEAPON';
                            else if (isRanged) groupText = 'RANGED WEAPON';

                            return (
                                <div className="flex flex-col mb-3 space-y-0.5 items-start bg-amber-950/20 p-2 rounded-lg border border-amber-950/60">
                                    <div className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wider">
                                        TYPE: <span className="text-amber-300">{groupText}</span>
                                    </div>
                                    <div className="text-[10px] text-amber-200/90 font-semibold uppercase tracking-wider">
                                        CLASS: {lootedItem.weaponType.replace(/-/g, ' ')}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Equipment Trait */}
                        {((lootedItem as any).traitId || (lootedItem as any).weaponAbilityId) && (() => {
                            const trait = getTraitById((lootedItem as any).traitId || (lootedItem as any).weaponAbilityId);
                            if (!trait) return null;
                            return (
                                <div className="bg-amber-950/30 border border-amber-800/50 p-2.5 rounded-lg mb-3 space-y-1 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                                            {lootedItem.slot ? `${lootedItem.slot.toUpperCase()} TRAIT` : 'EQUIPMENT TRAIT'}
                                        </div>
                                        <div className="text-[8px] text-orange-400 font-bold uppercase tracking-wider bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-900/50">
                                            {trait.trigger.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-amber-100">{trait.name}</div>
                                    <p className="text-[10px] text-amber-200/70 leading-relaxed">{trait.description}</p>
                                </div>
                            );
                        })()}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {Object.entries(lootedItem.stats).filter(([_, v]) => (v as number) > 0).map(([k, v]) => (
                                <div key={k} className="bg-stone-900/90 p-1.5 rounded-lg border border-amber-950/60 flex justify-between items-center px-2">
                                    <span className="text-amber-500/80 font-semibold">{k.toUpperCase()}</span>
                                    <span className="font-mono font-bold text-amber-300">
                                        +{v as number}
                                    </span>
                                </div>
                            ))}

                            {/* Element Bonus */}
                            {(lootedItem as any).elementBonus && (
                                <div className="bg-amber-950/30 p-2 rounded-lg border border-amber-900/50 col-span-2 flex justify-between items-center">
                                    <span className="text-amber-400 font-bold text-[10px]">Element Bonus</span>
                                    <span className="text-amber-200 font-bold font-mono">{(lootedItem as any).elementBonus.type} +{(lootedItem as any).elementBonus.value}%</span>
                                </div>
                            )}

                            {/* Race Bonus */}
                            {(lootedItem as any).raceBonus && (
                                <div className="bg-amber-950/30 p-2 rounded-lg border border-amber-900/50 col-span-2 flex justify-between items-center">
                                    <span className="text-amber-400 font-bold text-[10px]">Race Bonus</span>
                                    <span className="text-amber-200 font-bold font-mono">{(lootedItem as any).raceBonus.type} +{(lootedItem as any).raceBonus.value}%</span>
                                </div>
                            )}

                            {/* Skill Item Details */}
                            {(lootedItem as any).type === 'skill' && (
                                <>
                                    {(lootedItem as any).description && (
                                        <div className="col-span-2 text-xs text-amber-200/80 bg-stone-900/80 p-2.5 rounded-lg border border-amber-950/80 mt-1 leading-relaxed">
                                            {(lootedItem as any).description}
                                        </div>
                                    )}

                                    <div className="col-span-2 flex justify-center items-center bg-stone-900 p-2 rounded-lg border border-amber-950/80 mt-1 gap-6">
                                        <div className="text-center">
                                            <div className="text-[9px] text-amber-500/70 uppercase font-semibold">Chance</div>
                                            <div className="text-amber-400 font-bold font-mono text-xs">{(lootedItem as any).effectChance}%</div>
                                        </div>
                                        <div className="w-px h-6 bg-amber-950"></div>
                                        <div className="text-center">
                                            <div className="text-[9px] text-amber-500/70 uppercase font-semibold">Power</div>
                                            <div className="text-amber-300 font-bold font-mono text-xs">{(lootedItem as any).effectPower}</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ปุ่มยืนยัน */}
                    <button
                        onClick={() => setLootedItem(null)}
                        className="mt-5 w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 border border-amber-500/50 rounded-xl text-stone-950 text-xs font-extrabold tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};