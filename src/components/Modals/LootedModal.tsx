import type { Item } from '../../types/game';

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
    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setLootedItem(null)}
        >
            {/* ส่วนของพลุ */}
            {(lootedItem.rarity === 'Legendary' || lootedItem.rarity === 'Epic') && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(lootedItem.rarity === 'Legendary' ? 20 : 10)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-2 h-2 rounded-full animate-ping ${lootedItem.rarity === 'Legendary' ? 'bg-orange-500' : 'bg-purple-500'}`}
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

            {/* กล่องหลัก: ปรับเป็น flex-row (แนวนอน) */}
            <div
                className={`relative bg-slate-900 p-6 rounded-2xl w-full max-w-2xl flex flex-col md:flex-row gap-6 animate-in fade-in zoom-in duration-300 border border-slate-700
                    ${lootedItem.rarity === 'Legendary' ? 'shadow-[0_0_50px_10px_rgba(249,115,22,0.4)] border-orange-500/50' : ''}
                    ${lootedItem.rarity === 'Epic' ? 'shadow-[0_0_50px_10px_rgba(168,85,247,0.4)] border-purple-600/50' : ''}
                    ${lootedItem.rarity === 'Rare' ? 'shadow-[0_0_40px_8px_rgba(59,130,246,0.5)] border-blue-500/80' : ''}
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* คอลัมน์ซ้าย: รูปและสถานะ */}
                <div className="flex flex-col items-center justify-center w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0">
                    <div className={`font-bold text-[10px] tracking-widest uppercase mb-4 ${lootedItem.rarity === 'Legendary' ? 'text-orange-400' : lootedItem.rarity === 'Epic' ? 'text-purple-400' : 'text-emerald-400'}`}>
                        YOU FOUND A {lootedItem.rarity.toUpperCase()} ITEM!
                    </div>

                    <div className={`w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center bg-slate-800 shadow-inner ${lootedItem.rarity === 'Legendary' ? 'shadow-[0_0_20px_rgba(249,115,22,0.5)]' : ''}`}>
                        <img src={lootedItem.icon} alt={lootedItem.name} className="w-20 h-20 object-contain drop-shadow-2xl" />
                    </div>

                    <h3 className="text-white font-bold text-lg text-center">{lootedItem.name}</h3>

                    {lootedItem.type !== 'material' && lootedItem.type !== 'skill' && (
                        <div className="mt-2 text-center">
                            <span className="bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded font-bold tracking-wider border border-slate-700">
                                LEVEL {lootedItem.itemLevel ?? 1}
                            </span>
                        </div>
                    )}
                </div>

                {/* คอลัมน์ขวา: รายละเอียด Stats และปุ่ม */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        {lootedItem.type !== 'material' && lootedItem.type !== 'skill' && (
                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4">
                                DROP CHANCE: <span className="text-yellow-600">{getDropChance(lootedItem.rarity)}%</span>
                            </div>
                        )}

                        {lootedItem.slot === 'weapon' && lootedItem.weaponType && (() => {
                            const oneHandedTypes = ['sword', 'dagger', 'mace', 'staff'];
                            // 2. กำหนดรายชื่ออาวุธสองมือ
                            const twoHandedTypes = ['two-hand sword', 'spear', 'axe', 'fist', 'hammer'];
                            // 3. กำหนดรายชื่ออาวุธระยะไกล
                            const rangedTypes = ['bow', 'crossbow', 'sling', 'throwing'];

                            const isOneHanded = oneHandedTypes.includes(lootedItem.weaponType);
                            const isTwoHanded = twoHandedTypes.includes(lootedItem.weaponType) || lootedItem.weaponType.includes('two-hand');
                            const isRanged = rangedTypes.includes(lootedItem.weaponType);

                            let groupText = 'WEAPON';
                            if (isOneHanded) groupText = 'ONE-HAND WEAPON';
                            else if (isTwoHanded) groupText = 'TWO-HAND WEAPON';
                            else if (isRanged) groupText = 'RANGED WEAPON';

                            return (
                                <div className="flex flex-col mb-4 space-y-0.5 items-center">
                                    {/* บรรทัดที่ 1: กลุ่มหลัก */}
                                    <div className="text-[10px] text-slate-400font-bold uppercase tracking-wider">
                                        TYPE: {groupText}
                                    </div>
                                    {/* บรรทัดที่ 2: ชื่อประเภทอาวุธ */}
                                    <div className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider text-center break-words max-w-[200px]">
                                        WEAPON: {lootedItem.weaponType.replace(/-/g, ' ')}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {Object.entries(lootedItem.stats).filter(([_, v]) => (v as number) > 0).map(([k, v]) => (
                                <div key={k} className="bg-slate-800/80 p-1.5 rounded border border-slate-700">
                                    <span className="text-slate-400">{k.toUpperCase()}: </span>
                                    <span className={`font-bold ${lootedItem.rarity === 'Legendary' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                        +{v as number}
                                    </span>
                                </div>
                            ))}

                            {(lootedItem as any).elementBonus && (
                                <div className="bg-blue-900/30 p-1.5 rounded border border-blue-700/50 col-span-2">
                                    <span className="text-blue-300 font-bold">Element : </span>
                                    <span className="text-white font-bold">{(lootedItem as any).elementBonus.type} +{(lootedItem as any).elementBonus.value}%</span>
                                </div>
                            )}

                            {(lootedItem as any).raceBonus && (
                                <div className="bg-amber-900/30 p-1.5 rounded border border-amber-700/50 col-span-2">
                                    <span className="text-amber-300 font-bold">Race : </span>
                                    <span className="text-white font-bold">{(lootedItem as any).raceBonus.type} +{(lootedItem as any).raceBonus.value}%</span>
                                </div>
                            )}

                            {(lootedItem as any).type === 'skill' && (
                                <div className="col-span-2 flex justify-center items-center bg-slate-800 p-2 rounded-lg border border-slate-700 mt-2 gap-6">
                                    <div className="text-center">
                                        <div className="text-[9px] text-slate-400 uppercase">Chance</div>
                                        <div className="text-yellow-400 font-bold text-xs">{(lootedItem as any).effectChance}%</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-700"></div>
                                    <div className="text-center">
                                        <div className="text-[9px] text-slate-400 uppercase">Power</div>
                                        <div className="text-red-400 font-bold text-xs">{(lootedItem as any).effectPower}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setLootedItem(null)}
                        className="mt-6 w-full py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-xs font-bold transition-all"
                    >
                        GOT IT!
                    </button>
                </div>
            </div>
        </div>
    );
};