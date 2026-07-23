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
        item.rarity !== 'Legendary' &&
        item.type !== 'material'

    );

    //#region เงื่อนไขการผสม
    const getCombineCost = (rarity: string): CombineCost => {
        switch (rarity) {
            case 'Common':
                return {
                    requirements: [{ material: 'iron_ore', amount: 5, }],
                    chance: 80
                };
            case 'Rare':
                return {
                    requirements: [
                        { material: 'iron_ore', amount: 10 },
                        { material: 'steel_ingot', amount: 10 },
                        { material: 'leather', amount: 10 }
                    ],
                    chance: 35
                };
            case 'Epic':
                return {
                    requirements: [
                        { material: 'steel_ingot', amount: 100 },
                        { material: 'magic_dust', amount: 100 },
                        { material: 'dragon_scale', amount: 100 }
                    ],
                    chance: 5
                };
            default:
                return { requirements: [], chance: 0 };
        }
    };

    //#endregion

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
            case 'Epic': return 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
            case 'Rare': return 'border-blue-500';
            default: return 'border-slate-700';
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

        // 1. ตรวจสอบแร่ทุกชนิดใน requirements
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

            // 2. หักแร่ทุกชนิดที่กำหนดไว้ (วนลูปหัก)
            cost.requirements.forEach(req => {
                removeMaterial(req.material, req.amount);
            });

            // 3. ลบไอเทมที่ใช้ผสม
            selectedUids.forEach(uid => removeItem(uid));


            // 4. ตรวจสอบโอกาสสำเร็จ
            const roll = Math.random() * 100;
            if (roll <= cost.chance) {
                const tierOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
                const nextRarity = tierOrder[tierOrder.indexOf(firstItem.rarity) + 1];

                let newItem;
                let attempts = 0;
                do {
                    newItem = generateRandomItem(nextRarity);
                    attempts++;
                    // เงื่อนไข: ถ้าไม่มี slot (แปลว่าเป็นแร่) หรือเป็น type/slot ที่เป็น skill ให้สุ่มใหม่
                } while ((!newItem.slot || newItem.slot === 'skill') && attempts < 10);

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
        // ถ้ามีของถูกเลือกอยู่แล้ว ต้องใช้ rarity เดียวกับที่เลือกไว้เท่านั้น
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={isCombining ? undefined : onClose}>
            <div className="bg-slate-900 border-2 border-gray-600 p-6 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {resultItem || combineFailed ? (
                    <div className="text-center py-6">
                        <div className={combineFailed ? "text-red-500 font-bold mb-4" : "text-green-500 font-bold mb-4"}>
                            {combineFailed ? "Combination Failed! Items lost." : "Combination Successful !"}
                        </div>
                        {resultItem && (
                            <>
                                <div className={`w-24 h-24 mx-auto rounded-xl border-4 ${getRarityColor(resultItem.rarity)} flex items-center justify-center mb-4 bg-slate-800`}>
                                    <img src={resultItem.icon} className="w-16 h-16" />
                                </div>
                                <div className="text-white font-bold text-xl mb-2">{resultItem.name}</div>

                                {resultItem.type !== 'material' && resultItem.type !== 'skill' && (
                                    <div className="mb-4">
                                        <span className="bg-slate-800 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-bold border border-slate-700 tracking-wider">
                                            LEVEL {resultItem.itemLevel ?? 1}
                                        </span>
                                    </div>
                                )}

                                {/* --- ส่วนที่เพิ่มเข้ามา: แสดง Stats ของไอเทมที่เพิ่งผสมได้ --- */}
                                <div className="flex flex-col gap-2 mb-6">
                                    {/* แถวที่ 1: Stats ปกติ */}
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {Object.entries(resultItem.stats || {})
                                            .filter(([_, v]) => (v as number) > 0)
                                            .map(([k, v]) => (
                                                <div key={k} className="bg-slate-800 px-3 py-1 rounded border border-slate-700 text-xs">
                                                    <span className="text-slate-400 mr-1">{k.toUpperCase()}</span>
                                                    <span className="text-emerald-400 font-bold">+{v as number}</span>
                                                </div>
                                            ))}
                                    </div>

                                    {/* แถวที่ 2: โบนัสพิเศษ (Element & Race) */}
                                    {(resultItem.elementBonus || resultItem.raceBonus) && (
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {resultItem.elementBonus && (
                                                <div className="bg-blue-900/20 px-3 py-1 rounded border border-blue-700/30 text-xs flex items-center gap-1">
                                                    <span className="text-blue-400 font-bold uppercase">{resultItem.elementBonus.type}</span>
                                                    <span className="text-emerald-400 font-bold">+{resultItem.elementBonus.value}%</span>
                                                </div>
                                            )}
                                            {resultItem.raceBonus && (
                                                <div className="bg-amber-900/20 px-3 py-1 rounded border border-amber-700/30 text-xs flex items-center gap-1">
                                                    <span className="text-amber-400 font-bold uppercase">{resultItem.raceBonus.type}</span>
                                                    <span className="text-emerald-400 font-bold">+{resultItem.raceBonus.value}%</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* -------------------------------------------------------- */}

                            </>
                        )}
                        <button onClick={() => { setResultItem(null); setCombineFailed(false); }} className="w-32 py-2 bg-yellow-600 rounded-full font-bold text-white">GOT IT</button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-yellow-500 mb-2 text-center">COMBINE STATION</h2>

                        <div className="flex gap-2 mb-4 justify-center">
                            {['Common', 'Rare', 'Epic'].map((rarity) => (
                                <button key={rarity} onClick={() => handleAutoPick(rarity)} className="px-3 py-1 bg-slate-700 text-white text-xs rounded border border-slate-500">Auto-Pick {rarity}</button>
                            ))}
                        </div>

                        {isCombining && (
                            <div className="w-full h-2 bg-slate-800 rounded-full mb-4 overflow-hidden">
                                <div className="h-full bg-yellow-500 transition-all duration-75" style={{ width: `${progress}%` }} />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4 flex-1 overflow-y-auto pr-1">
                            {validItems.map(item => (
                                <button key={item.uid} onClick={() => toggleItem(item.uid)}
                                    className={`w-20 h-28 rounded border-2 p-1 flex flex-col items-center justify-between ${selectedUids.includes(item.uid) ? 'border-green-500 bg-slate-800' : `${getRarityColor(item.rarity)} bg-slate-800/50`}`}>

                                    <img src={item.icon} className="w-8 h-8 object-contain" />

                                    {/* --- ส่วนที่เพิ่มเข้ามา: แสดง Stats --- */}
                                    <div className="text-[7px] text-slate-300 w-full leading-tight text-center">
                                        {Object.entries(item.stats)
                                            .filter(([_, v]) => (v as number) > 0)
                                            .map(([k, v]) => (
                                                <div key={k} className="flex justify-between px-1">
                                                    <span>{k.toUpperCase()}</span>
                                                    <span className="text-emerald-400 font-bold">+{v}</span>
                                                </div>
                                            ))}
                                    </div>
                                    {/* --------------------------------- */}

                                    <div className="text-[8px] font-bold text-yellow-500 truncate w-full mt-1">{item.name}</div>
                                </button>
                            ))}
                        </div>


                        {selectedUids.length === 10 && (
                            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 mb-4 mx-2">
                                <div className="flex justify-between items-center text-xs">
                                    {/* โชว์โอกาสสำเร็จ พร้อมเปลี่ยนสีตามความเสี่ยง */}
                                    {(() => {
                                        const rarity = player.inventory.find(i => i.uid === selectedUids[0])?.rarity || 'Common';
                                        const cost = getCombineCost(rarity);

                                        // ฟังก์ชันกำหนดสีตามโอกาส
                                        const getChanceColor = (chance: number) => {
                                            if (chance >= 100) return 'text-emerald-400';
                                            if (chance >= 20) return 'text-yellow-400';
                                            return 'text-red-500 font-extrabold animate-pulse';
                                        };

                                        return (
                                            <div className={`font-bold ${getChanceColor(cost.chance)}`}>
                                                Success Rate : {cost.chance}%
                                            </div>
                                        );
                                    })()}

                                    {/* โชว์แร่ที่ต้องการ */}
                                    {(() => {
                                        // 1. ดึงข้อมูล cost ทั้งหมดตาม rarity
                                        const rarity = player.inventory.find(i => i.uid === selectedUids[0])?.rarity || 'Common';
                                        const cost = getCombineCost(rarity);

                                        // 2. ถ้าไม่มีแร่ที่ต้องใช้ (เช่น Common) ให้คืนค่าว่าง
                                        if (!cost.requirements || cost.requirements.length === 0) return null;

                                        return (
                                            <div className="flex flex-wrap gap-3 items-center">
                                                <span className="text-xs text-slate-400">Requires :</span>
                                                {cost.requirements.map((req) => {
                                                    const owned = player.materials[req.material] || 0;
                                                    const isEnough = owned >= req.amount;

                                                    return (
                                                        <div key={req.material} className={`flex items-center gap-1 text-xs font-bold ${isEnough ? 'text-white' : 'text-red-500'}`}>
                                                            {/* ถ้าคุณมีไฟล์รูปไอคอนแร่ สามารถใส่ img tag ตรงนี้ได้เลย */}
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

                        {error && <div className="bg-red-900/50 text-red-200 text-xs py-1 px-2 rounded mb-2 text-center">{error}</div>}

                        <div className="flex gap-2">
                            <button onClick={handleCombine} disabled={selectedUids.length < 10 || isCombining}
                                className={`flex-1 py-2 rounded text-xs font-bold ${selectedUids.length === 10 ? 'bg-yellow-600' : 'bg-slate-700'}`}>
                                {isCombining ? 'COMBINING...' : `COMBINE (${selectedUids.length}/10)`}
                            </button>
                            <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded text-xs font-bold text-white">CANCEL</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}