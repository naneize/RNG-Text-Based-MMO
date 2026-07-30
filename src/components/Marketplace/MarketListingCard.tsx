import type { MarketListing } from '../../types/marketplace';
import { materialLibrary } from '../../data/materialLibrary';

interface Props {
    listing: MarketListing;
    isOwner: boolean;
    onBuy: (listingId: string) => void;
    onCancel: (listingId: string) => void;
    isLoading: boolean;
}

// Helper function to map rarity to dynamic Tailwind text color classes for the rarity value
const getRarityTextColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
        case 'common': return 'text-slate-300';
        case 'uncommon': return 'text-emerald-400';
        case 'rare': return 'text-blue-400';
        case 'epic': return 'text-purple-400';
        case 'legendary': return 'text-amber-400';
        default: return 'text-slate-300';
    }
};

// Helper function to map rarity to dynamic Tailwind border & background classes for the card frame
const getRarityCardStyle = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
        case 'common': return 'border-slate-600 bg-slate-900/90';
        case 'uncommon': return 'border-emerald-600/60 bg-emerald-950/20';
        case 'rare': return 'border-blue-600/60 bg-blue-950/20';
        case 'epic': return 'border-purple-600/60 bg-purple-950/20';
        case 'legendary': return 'border-amber-600/80 bg-amber-800/20';
        default: return 'border-slate-700 bg-slate-900';
    }
};

// ฟังก์ชันหาชื่อแร่ตาม currencyType
const getCurrencyName = (currencyId: string) => {
    const mat = materialLibrary.find((m) => m.id === currencyId);
    return mat ? mat.name : 'Gold Ore';
};

export const MarketListingCard = ({ listing, isOwner, onBuy, onCancel, isLoading }: Props) => {
    const { item } = listing;
    const currencyType = listing.currencyType || 'gold_ore';

    // เตรียมรายการ Stats และ Skill Condition ที่ผ่านการกรองแล้ว เพื่อนำมาวนลูปใส่เส้นคั่นด้านล่าง
    const validStats = item.stats
        ? Object.entries(item.stats).filter(([_, val]) => typeof val === 'number' && val > 0)
        : [];

    const validConditions = item.skillCondition
        ? Object.entries(item.skillCondition).filter(([_, val]) => val !== undefined && val !== null && val !== false && val !== '')
        : [];

    const totalRows = validStats.length + validConditions.length;
    let currentIndex = 0;

    return (
        <div className={`border rounded-xl p-4 flex flex-col gap-2 ${getRarityCardStyle(item.rarity)}`}>
            <div className="flex items-center gap-3">
                {item.icon ? (
                    <img src={item.icon} alt={item.name} className="w-12 h-12 object-contain" />
                ) : (
                    <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center text-slate-500 text-[10px]">?</div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase">
                        {item.slot} · Lv.{item.itemLevel ?? 1}
                    </div>
                    {/* แสดงระดับไอเทม (Rarity) โดยตัวอักษร Rarity: เป็นสีมาตรฐาน และชื่อระดับเปลี่ยนสีตามความหายาก */}
                    <div className="text-[10px] font-semibold capitalize">
                        <span className="text-slate-400">Rarity: </span>
                        <span className={getRarityTextColor(item.rarity)}>{item.rarity}</span>
                    </div>
                </div>
            </div>

            {/* แสดง Stats และ Skill Condition ย่อของไอเทม พร้อมเพิ่มเส้นขีดใต้แต่ละช่อง */}
            {totalRows > 0 && (
                <div className="bg-slate-950/40 rounded-lg p-2 text-[10px] space-y-1 border border-slate-800/50">
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

                    {/* แสดง Skill Condition (ใช้สีฟ้า cyan-400 แยกความแตกต่าง) */}
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

            <div className="text-[10px] text-slate-500">
                Seller: <span className="text-slate-300">{listing.sellerUsername}</span>
            </div>

            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                    <span>{listing.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-300 font-medium">({getCurrencyName(currencyType)})</span>
                </div>

                {isOwner ? (
                    <button
                        onClick={() => onCancel(listing.id)}
                        disabled={isLoading}
                        className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                        Cancel
                    </button>
                ) : (
                    <button
                        onClick={() => onBuy(listing.id)}
                        disabled={isLoading}
                        className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                        Buy
                    </button>
                )}
            </div>
        </div>
    );
};