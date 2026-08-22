import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateRandomItem } from '../../utils/itemGenerator';

interface CombineSectionProps {
    onClose: () => void;
}

interface Requirement {
    material: string;
    amount: number;
}

interface CombineCost {
    requirements: Requirement[];
    chance: number;
}

export const CombineSection = ({ onClose }: CombineSectionProps) => {
    const { player, addItem, removeItem, removeMaterial } = useGameStore();
    const [selectedUids, setSelectedUids] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [isCombining, setIsCombining] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultItem, setResultItem] = useState<any | null>(null);
    const [combineFailed, setCombineFailed] = useState(false);

    const validItems = player.inventory.filter(item =>
        item.slot !== 'material' &&
        item.rarity === 'Epic' // หรือปรับตามเราริตี้ที่ต้องการ
    );

    //#region เงื่อนไขการผสม
    const getCombineCost = (rarity: string): CombineCost => {
        switch (rarity) {
            case 'Epic':
                return {
                    requirements: [
                        { material: 'iron_ore', amount: 150 },
                        { material: 'steel_ingot', amount: 100 },
                        { material: 'magic_dust', amount: 100 },
                        { material: 'mithril', amount: 100 }
                    ],
                    chance: 100
                };
            default:
                return { requirements: [], chance: 0 };
        }
    };
    //#endregion

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]';
            case 'Epic': return 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            case 'Rare': return 'border-amber-600/60';
            default: return 'border-amber-950/80';
        }
    };

    const toggleItem = (uid: string) => {
        if (isCombining) return;
        const itemToToggle = player.inventory.find(i => i.uid === uid);
        if (!itemToToggle) return;

        if (selectedUids.length > 0) {
            const firstSelectedItem = player.inventory.find(i => i.uid === selectedUids[0]);
            if (firstSelectedItem?.rarity !== itemToToggle.rarity) {
                setError("You must select items of the same rarity!");
                setTimeout(() => setError(null), 3000);
                return;
            }
        }

        if (selectedUids.includes(uid)) {
            setSelectedUids(selectedUids.filter(sUid => sUid !== uid));
        } else if (selectedUids.length < 10) {
            setSelectedUids([...selectedUids, uid]);
        }
    };

    const handleCombine = () => {
        if (selectedUids.length < 10 || isCombining) return;

        const firstItem = player.inventory.find(i => i.uid === selectedUids[0]);
        if (!firstItem) return;

        const allSameRarity = selectedUids.every(uid => {
            const item = player.inventory.find(i => i.uid === uid);
            return item?.rarity === firstItem.rarity;
        });

        if (!allSameRarity) {
            setError("Items of different rarities cannot be mixed. Please select again");
            setTimeout(() => setError(null), 3000);
            setSelectedUids([]);
            return;
        }

        const cost = getCombineCost(firstItem.rarity);

        const isMaterialEnough = cost.requirements.every(req =>
            (player.materials[req.material] || 0) >= req.amount
        );

        if (!isMaterialEnough) {
            const missing = cost.requirements.find(req =>
                (player.materials[req.material] || 0) < req.amount
            );
            setError(`Materials not enough for ${missing?.material.replace('_', ' ')}. Need ${missing?.amount}`);
            setTimeout(() => setError(null), 3000);
            return;
        }

        setIsCombining(true);
        setCombineFailed(false);
        setProgress(0);

        const timer = setInterval(() => {
            setProgress(prev => prev + 10);
        }, 100);

        setTimeout(() => {
            clearInterval(timer);

            cost.requirements.forEach(req => {
                removeMaterial(req.material, req.amount);
            });

            selectedUids.forEach(uid => removeItem(uid));

            const roll = Math.random() * 100;
            if (roll <= cost.chance) {
                const tierOrder = ['Epic', 'Legendary'];
                const nextRarity = tierOrder[tierOrder.indexOf(firstItem.rarity) + 1];

                const selectedItems = player.inventory.filter(i => selectedUids.includes(i.uid));
                const totalLevel = selectedItems.reduce((sum, item) => sum + (item.itemLevel || 1), 0);
                const averageLevel = Math.max(1, Math.round(totalLevel / selectedItems.length));

                let newItem;
                let attempts = 0;
                do {
                    newItem = generateRandomItem(nextRarity, averageLevel);
                    attempts++;
                } while ((!newItem.slot || newItem.slot === 'skill' || newItem.slot === 'material') && attempts < 10);

                addItem(newItem);
                setResultItem(newItem);
            } else {
                setCombineFailed(true);
            }

            setIsCombining(false);
            setSelectedUids([]);
        }, 1000);
    };

    const handleAutoPick = (rarity: string) => {
        if (selectedUids.length > 0) {
            const currentRarity = player.inventory.find(i => i.uid === selectedUids[0])?.rarity;
            if (currentRarity && currentRarity !== rarity) {
                setError("You must select items of the same rarity!");
                setTimeout(() => setError(null), 3000);
                return;
            }
        }

        const candidates = validItems.filter(item => item.rarity === rarity && !selectedUids.includes(item.uid));
        const needed = 10 - selectedUids.length;
        if (needed <= 0) return;
        const toPick = candidates.slice(0, needed);
        setSelectedUids([...selectedUids, ...toPick.map(i => i.uid)]);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={isCombining ? undefined : onClose}>
            <div className="bg-stone-950 border-2 border-amber-900/60 p-6 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                {resultItem || combineFailed ? (
                    <div className="text-center py-6 flex flex-col items-center justify-center flex-1">
                        <div className={`font-bold mb-4 text-base tracking-wide ${combineFailed ? "text-rose-500" : "text-amber-400"}`}>
                            {combineFailed ? "Combination Failed! Items lost." : "Combination Successful !"}
                        </div>
                        {resultItem && (
                            <>
                                <div className={`w-24 h-24 mx-auto rounded-xl border-2 ${getRarityColor(resultItem.rarity)} flex items-center justify-center mb-4 bg-stone-900 shadow-xl`}>
                                    <img src={resultItem.icon} className="w-16 h-16 object-contain drop-shadow-md" />
                                </div>
                                <div className="text-amber-100 font-bold text-xl mb-2 tracking-wide">{resultItem.name}</div>

                                {resultItem.type !== 'material' && resultItem.type !== 'skill' && (
                                    <div className="mb-4">
                                        <span className="bg-amber-950/50 text-amber-300 text-[10px] px-3 py-1 rounded-full font-bold border border-amber-800/60 tracking-wider shadow-sm">
                                            LEVEL {resultItem.itemLevel ?? 1}
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 mb-6 w-full max-w-md">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {Object.entries(resultItem.stats || {})
                                            .filter(([_, v]) => (v as number) > 0)
                                            .map(([k, v]) => (
                                                <div key={k} className="bg-stone-900 px-3 py-1 rounded-lg border border-amber-950/80 text-xs shadow-sm">
                                                    <span className="text-amber-500/80 mr-1 font-bold">{k.toUpperCase()}</span>
                                                    <span className="text-amber-300 font-extrabold font-mono">+{v as number}</span>
                                                </div>
                                            ))}
                                    </div>

                                    {(resultItem.elementBonus || resultItem.raceBonus) && (
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {resultItem.elementBonus && (
                                                <div className="bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-900/40 text-xs flex items-center gap-1 shadow-sm">
                                                    <span className="text-blue-400 font-bold uppercase">{resultItem.elementBonus.type}</span>
                                                    <span className="text-amber-300 font-extrabold font-mono">+{resultItem.elementBonus.value}%</span>
                                                </div>
                                            )}
                                            {resultItem.raceBonus && (
                                                <div className="bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-900/40 text-xs flex items-center gap-1 shadow-sm">
                                                    <span className="text-amber-400 font-bold uppercase">{resultItem.raceBonus.type}</span>
                                                    <span className="text-amber-300 font-extrabold font-mono">+{resultItem.raceBonus.value}%</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        <button onClick={() => { setResultItem(null); setCombineFailed(false); }} className="w-32 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl font-bold text-stone-950 transition-all text-xs cursor-pointer shadow-md border border-amber-400/50">GOT IT</button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-extrabold text-amber-100 mb-2 text-center tracking-wide">COMBINE STATION</h2>

                        <div className="flex gap-2 mb-4 justify-center">
                            {['Epic'].map((rarity) => (
                                <button
                                    key={rarity}
                                    onClick={() => handleAutoPick(rarity)}
                                    className={`px-4 py-1.5 bg-stone-900 text-amber-200 text-xs font-bold rounded-lg border border-amber-900/60 hover:bg-amber-950/40 transition cursor-pointer shadow-sm`}
                                >
                                    AUTO-PICK {rarity.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {isCombining && (
                            <div className="w-full h-2 bg-stone-900 rounded-full mb-4 overflow-hidden border border-amber-950">
                                <div className="h-full bg-amber-500 transition-all duration-75 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${progress}%` }} />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2.5 mb-4 flex-1 overflow-y-auto pr-1 content-start">
                            {validItems.map(item => {
                                const isSelected = selectedUids.includes(item.uid);
                                return (
                                    <button key={item.uid} onClick={() => toggleItem(item.uid)}
                                        className={`w-20 h-28 rounded-xl border-2 p-1.5 flex flex-col items-center justify-between relative overflow-hidden transition cursor-pointer shadow-md ${isSelected ? 'border-emerald-500 bg-stone-900 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : `${getRarityColor(item.rarity)} bg-stone-900/90`}`}>

                                        {item.type !== 'skill' && item.slot !== 'skill' && (
                                            <span className="absolute top-1 left-1 bg-stone-950 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-amber-950 leading-none z-20 shadow-sm">
                                                Lv.{item.itemLevel ?? 1}
                                            </span>
                                        )}

                                        <img src={item.icon} className="w-8 h-8 object-contain mt-1 drop-shadow" />

                                        <div className="text-[7px] text-amber-200/80 w-full leading-tight text-center font-mono">
                                            {Object.entries(item.stats)
                                                .filter(([_, v]) => (v as number) > 0)
                                                .map(([k, v]) => (
                                                    <div key={k} className="flex justify-between px-0.5">
                                                        <span className="text-amber-500/70">{k.toUpperCase()}</span>
                                                        <span className="text-amber-300 font-bold">+{v}</span>
                                                    </div>
                                                ))}
                                        </div>

                                        <div className="text-[8px] font-extrabold text-amber-100 truncate w-full mt-0.5 text-center">{item.name}</div>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedUids.length === 10 && (
                            <div className="bg-stone-900 p-3 rounded-xl border border-amber-900/60 mb-4 mx-2 shadow-inner">
                                <div className="flex flex-col gap-2 text-xs">
                                    {(() => {
                                        const rarity = player.inventory.find(i => i.uid === selectedUids[0])?.rarity || 'Common';
                                        const cost = getCombineCost(rarity);

                                        const getChanceColor = (chance: number) => {
                                            if (chance >= 100) return 'text-emerald-400';
                                            if (chance >= 20) return 'text-amber-400';
                                            return 'text-rose-500 font-extrabold animate-pulse';
                                        };

                                        return (
                                            <div className={`font-bold text-center sm:text-left ${getChanceColor(cost.chance)}`}>
                                                Success Rate : {cost.chance}%
                                            </div>
                                        );
                                    })()}

                                    {(() => {
                                        const rarity = player.inventory.find(i => i.uid === selectedUids[0])?.rarity || 'Common';
                                        const cost = getCombineCost(rarity);

                                        if (!cost.requirements || cost.requirements.length === 0) return null;

                                        return (
                                            <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start pt-1 border-t border-amber-950/80">
                                                <span className="text-xs text-amber-500/80 font-bold">Requires :</span>
                                                {cost.requirements.map((req) => {
                                                    const owned = player.materials[req.material] || 0;
                                                    const isEnough = owned >= req.amount;

                                                    return (
                                                        <div
                                                            key={req.material}
                                                            className={`flex items-center gap-1 text-xs font-bold font-mono ${isEnough ? 'text-emerald-400' : 'text-rose-500'}`}
                                                        >
                                                            <span>{req.material.replace('_', ' ').toUpperCase()}</span>
                                                            <span>({owned}/{req.amount})</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {error && <div className="bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs py-1.5 px-3 rounded-xl mb-2 text-center font-medium shadow-sm">{error}</div>}

                        <div className="flex gap-3">
                            <button onClick={handleCombine} disabled={selectedUids.length < 10 || isCombining}
                                className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-md ${selectedUids.length === 10 ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-stone-900 text-amber-500/50 border border-amber-950 cursor-not-allowed'}`}>
                                {isCombining ? 'COMBINING...' : `COMBINE (${selectedUids.length}/10)`}
                            </button>
                            <button onClick={onClose} className="px-5 py-3 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 rounded-xl text-xs font-bold text-amber-200 border border-amber-950 transition cursor-pointer shadow-sm">CANCEL</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};