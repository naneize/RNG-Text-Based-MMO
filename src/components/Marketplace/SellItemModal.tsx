import { useState } from 'react';
import type { Item } from '../../types/game';
import { materialLibrary } from '../../data/materialLibrary';

interface Props {
    inventory: Item[];
    onSell: (itemUid: string, price: number, currencyType: string) => Promise<{ success: boolean; message: string }>;
    onClose: () => void;
}

export const SellItemModal = ({ inventory, onSell, onClose }: Props) => {
    const [selectedUid, setSelectedUid] = useState<string | null>(null);
    const [price, setPrice] = useState<string>('');
    const [currencyType, setCurrencyType] = useState<string>('gold_ore');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const sellableItems = inventory.filter((i) => i.type !== 'material');
    const selectedItem = sellableItems.find((i) => i.uid === selectedUid);

    // Helper function to map rarity to dynamic Tailwind text color classes
    const getRarityColor = (rarity?: string) => {
        switch (rarity?.toLowerCase()) {
            case 'common':
                return 'text-slate-300';
            case 'uncommon':
                return 'text-emerald-400';
            case 'rare':
                return 'text-blue-400';
            case 'epic':
                return 'text-purple-400';
            case 'legendary':
                return 'text-amber-400';
            default:
                return 'text-slate-300';
        }
    };

    // Helper function to map rarity to dynamic Tailwind border & background classes for frames/boxes
    const getRarityBoxStyle = (rarity?: string, isSelected?: boolean) => {
        if (isSelected) {
            return 'border-emerald-500 bg-emerald-900/30';
        }
        switch (rarity?.toLowerCase()) {
            case 'common':
                return 'border-slate-600 bg-slate-800/60 hover:bg-slate-700';
            case 'uncommon':
                return 'border-emerald-600/60 bg-emerald-950/20 hover:bg-emerald-900/30';
            case 'rare':
                return 'border-blue-600/60 bg-blue-950/20 hover:bg-blue-900/30';
            case 'epic':
                return 'border-purple-600/60 bg-purple-950/20 hover:bg-purple-900/30';
            case 'legendary':
                return 'border-amber-500/80 bg-amber-950/20 hover:bg-amber-900/30';
            default:
                return 'border-slate-700 bg-slate-800 hover:bg-slate-700';
        }
    };

    const handleSubmit = async () => {
        if (!selectedUid) { setFeedback('Please select an item first.'); return; }
        const priceNum = Number(price);
        if (!priceNum || priceNum <= 0) { setFeedback('Please enter a valid price.'); return; }

        console.log('Submitting listing -> UID:', selectedUid, '| Price:', priceNum, '| Currency:', currencyType);

        setIsSubmitting(true);
        const result = await onSell(selectedUid, priceNum, currencyType);
        setIsSubmitting(false);
        setFeedback(result.message);
        if (result.success) {
            setTimeout(onClose, 800);
        }
    };

    // เตรียมข้อมูล Stats และ Skill Condition ที่ผ่านการกรองแล้วเพื่อคำนวณเส้นขีดคั่น
    const validStats = selectedItem?.stats
        ? Object.entries(selectedItem.stats).filter(([_, val]) => typeof val === 'number' && val > 0)
        : [];

    const validConditions = selectedItem?.skillCondition
        ? Object.entries(selectedItem.skillCondition).filter(([_, val]) => val !== undefined && val !== null && val !== false && val !== '')
        : [];

    const totalRows = validStats.length + validConditions.length;
    let currentIndex = 0;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-white mb-4">List Item for Sale</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Left Column: Select item from inventory */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 max-h-72 overflow-y-auto">
                        <div className="text-xs font-bold text-slate-400 mb-2">Select Item from Inventory</div>
                        <div className="grid grid-cols-2 gap-2">
                            {sellableItems.map((item) => (
                                <button
                                    key={item.uid}
                                    onClick={() => setSelectedUid(item.uid)}
                                    className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center ${getRarityBoxStyle(item.rarity, selectedUid === item.uid)}`}
                                >
                                    {item.icon && <img src={item.icon} className="w-8 h-8 mb-1 object-contain" alt={item.name} />}
                                    <div className="text-[10px] text-slate-300 truncate w-full">{item.name}</div>
                                </button>
                            ))}
                            {sellableItems.length === 0 && (
                                <div className="col-span-2 text-center text-slate-500 text-xs py-8">No sellable items found</div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Item stats details */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                            <div className="text-xs font-bold text-slate-400 mb-2">Item Details</div>
                            {selectedItem ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        {selectedItem.icon && (
                                            <img
                                                src={selectedItem.icon}
                                                className={`w-12 h-12 object-contain bg-slate-800 rounded-lg p-1 border ${getRarityBoxStyle(selectedItem.rarity).split(' ')[0]}`}
                                                alt={selectedItem.name}
                                            />
                                        )}
                                        <div>
                                            <div className="text-sm font-bold text-white">{selectedItem.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">{selectedItem.slot} · Lv.{selectedItem.itemLevel ?? 1}</div>
                                            <div className="text-[10px] font-semibold capitalize">
                                                <span className="text-slate-400">Rarity: </span>
                                                <span className={getRarityColor(selectedItem.rarity)}>{selectedItem.rarity}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ส่วนแสดง Stats และ Skill Condition พร้อมขีดคั่นแต่ละบรรทัด */}
                                    {totalRows > 0 && (
                                        <div className="mt-3 bg-slate-950/40 rounded-lg p-2 text-[10px] space-y-1 border border-slate-800/50">
                                            {/* แสดง Stats ปกติ */}
                                            {validStats.map(([key, val]) => {
                                                currentIndex++;
                                                const isNotLast = currentIndex < totalRows;
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex justify-between text-slate-300 pb-1 ${isNotLast ? 'border-b border-slate-800/60' : ''}`}
                                                    >
                                                        <span className="uppercase text-slate-400">{key}:</span>
                                                        <span className="font-bold text-emerald-400">+{val}</span>
                                                    </div>
                                                );
                                            })}

                                            {/* แสดง Skill Condition */}
                                            {validConditions.map(([key, val]) => {
                                                currentIndex++;
                                                const isNotLast = currentIndex < totalRows;
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex justify-between text-slate-300 pb-1 ${isNotLast ? 'border-b border-slate-800/60' : ''}`}
                                                    >
                                                        <span className="uppercase text-slate-400">{key}:</span>
                                                        <span className="font-semibold text-cyan-400">
                                                            {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-600 text-xs py-16">No item selected</div>
                            )}
                        </div>
                        {selectedItem && (
                            <div className="text-[10px] text-slate-500 text-right mt-2">UID: {selectedItem.uid}</div>
                        )}
                    </div>
                </div>

                {/* Price and Currency Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-slate-400 uppercase font-bold">
                            Price
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1 text-sm"
                            placeholder="e.g. 100"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Requested Currency</label>
                        <select
                            value={currencyType}
                            onChange={(e) => setCurrencyType(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1 text-sm cursor-pointer"
                        >
                            {materialLibrary.map((mat) => (
                                <option key={mat.id} value={mat.id}>
                                    {mat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {feedback && <div className="text-xs text-amber-400 mb-3">{feedback}</div>}

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-white text-sm cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedUid}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 py-2 rounded-lg text-white text-sm font-bold cursor-pointer"
                    >
                        {isSubmitting ? 'Listing...' : 'List Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};