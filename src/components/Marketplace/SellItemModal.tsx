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
                return 'text-stone-300';
            case 'uncommon':
                return 'text-emerald-400';
            case 'rare':
                return 'text-blue-400';
            case 'epic':
                return 'text-purple-400';
            case 'legendary':
                return 'text-amber-400';
            default:
                return 'text-stone-300';
        }
    };

    // Helper function to map rarity to dynamic Tailwind border & background classes for frames/boxes
    const getRarityBoxStyle = (rarity?: string, isSelected?: boolean) => {
        if (isSelected) {
            return 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-500/50 shadow-[0_0_10px_rgba(217,119,6,0.3)]';
        }
        switch (rarity?.toLowerCase()) {
            case 'common':
                return 'border-stone-600 bg-stone-800/60 hover:bg-stone-700';
            case 'uncommon':
                return 'border-emerald-600/60 bg-emerald-950/20 hover:bg-emerald-900/30';
            case 'rare':
                return 'border-blue-600/60 bg-blue-950/20 hover:bg-blue-900/30';
            case 'epic':
                return 'border-purple-600/60 bg-purple-950/20 hover:bg-purple-900/30';
            case 'legendary':
                return 'border-amber-500/80 bg-amber-950/20 hover:bg-amber-900/30';
            default:
                return 'border-stone-700 bg-stone-800 hover:bg-stone-700';
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-serif" onClick={onClose}>
            <div className="bg-stone-900 border border-amber-900/50 rounded-2xl p-6 w-full max-w-2xl shadow-[0_0_25px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-amber-100 mb-4 border-b border-amber-950 pb-2">List Item for Sale</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Left Column: Select item from inventory */}
                    <div className="bg-stone-950/60 border border-amber-950 rounded-xl p-3 max-h-72 overflow-y-auto scrollbar-thin">
                        <div className="text-xs font-bold text-amber-500/70 mb-2">Select Item from Inventory</div>
                        <div className="grid grid-cols-2 gap-2">
                            {sellableItems.map((item) => (
                                <button
                                    key={item.uid}
                                    onClick={() => setSelectedUid(item.uid)}
                                    className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center ${getRarityBoxStyle(item.rarity, selectedUid === item.uid)}`}
                                >
                                    {item.icon && <img src={item.icon} className="w-8 h-8 mb-1 object-contain drop-shadow" alt={item.name} />}
                                    <div className="text-[10px] text-amber-200 truncate w-full">{item.name}</div>
                                </button>
                            ))}
                            {sellableItems.length === 0 && (
                                <div className="col-span-2 text-center text-amber-600/60 text-xs py-8 italic">No sellable items found</div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Item stats details */}
                    <div className="bg-stone-950/60 border border-amber-950 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                            <div className="text-xs font-bold text-amber-500/70 mb-2">Item Details</div>
                            {selectedItem ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        {selectedItem.icon && (
                                            <img
                                                src={selectedItem.icon}
                                                className={`w-12 h-12 object-contain bg-stone-900 rounded-lg p-1 border ${getRarityBoxStyle(selectedItem.rarity).split(' ')[0]}`}
                                                alt={selectedItem.name}
                                            />
                                        )}
                                        <div>
                                            <div className="text-sm font-bold text-amber-100">{selectedItem.name}</div>
                                            <div className="text-[10px] text-amber-500/70 uppercase">{selectedItem.slot} · Lv.{selectedItem.itemLevel ?? 1}</div>
                                            <div className="text-[10px] font-semibold capitalize">
                                                <span className="text-amber-600">Rarity: </span>
                                                <span className={getRarityColor(selectedItem.rarity)}>{selectedItem.rarity}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ส่วนแสดง Stats และ Skill Condition พร้อมขีดคั่นแต่ละบรรทัด */}
                                    {totalRows > 0 && (
                                        <div className="mt-3 bg-stone-900/60 rounded-lg p-2 text-[10px] space-y-1 border border-amber-950">

                                            {/* แสดง Stats ปกติ */}
                                            {validStats.map(([key, val]) => {
                                                currentIndex++;
                                                const isNotLast = currentIndex < totalRows;
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex justify-between pb-1 ${isNotLast ? 'border-b border-amber-950' : ''}`}
                                                    >
                                                        {/* เปลี่ยนชื่อ Stat เป็นโทนสีทองอำพัน */}
                                                        <span className="uppercase text-amber-200 font-medium">{key}:</span>

                                                        {/* เปลี่ยนตัวเลข Stat เป็นสีทองสว่าง หรือสีที่คุณต้องการ */}
                                                        <span className="font-bold text-amber-300">+{val}</span>
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
                                                        className={`flex justify-between text-amber-200/80 pb-1 ${isNotLast ? 'border-b border-amber-950' : ''}`}
                                                    >
                                                        <span className="uppercase text-amber-600">{key}:</span>
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
                                <div className="text-center text-amber-600/50 text-xs py-16 italic">No item selected</div>
                            )}
                        </div>
                        {selectedItem && (
                            <div className="text-[10px] text-amber-600/60 text-right mt-2">UID: {selectedItem.uid}</div>
                        )}
                    </div>
                </div>

                {/* Price and Currency Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-amber-500/80 uppercase font-bold">
                            Price
                        </label>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, ''); // กรองให้พิมพ์ได้เฉพาะตัวเลข
                                setPrice(val);
                            }}
                            className="w-full bg-stone-950 border border-amber-900/50 rounded-lg p-2 text-amber-100 mt-1 text-sm focus:outline-none focus:border-amber-500"
                            placeholder="e.g. 100"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-amber-500/80 uppercase font-bold">Requested Currency</label>
                        <select
                            value={currencyType}
                            onChange={(e) => setCurrencyType(e.target.value)}
                            className="w-full bg-stone-950 border border-amber-900/50 rounded-lg p-2 text-amber-100 mt-1 text-sm cursor-pointer focus:outline-none focus:border-amber-500"
                        >
                            {materialLibrary.map((mat) => (
                                <option key={mat.id} value={mat.id}>
                                    {mat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {feedback && <div className="text-xs text-amber-400 mb-3 bg-amber-950/40 p-2 rounded border border-amber-900/40">{feedback}</div>}

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 bg-stone-800 hover:bg-stone-700 border border-amber-900/40 py-2 rounded-lg text-amber-200 text-sm cursor-pointer transition">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedUid}
                        className="flex-1 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 py-2 rounded-lg text-amber-50 text-sm font-bold cursor-pointer transition border border-amber-600/50 shadow-[0_0_10px_rgba(217,119,6,0.3)]"
                    >
                        {isSubmitting ? 'Listing...' : 'List Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};