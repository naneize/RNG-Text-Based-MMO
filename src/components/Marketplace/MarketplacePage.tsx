import { useEffect, useState } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { MarketListingCard } from './MarketListingCard';
import { SellItemModal } from './SellItemModal';
import type { EquipmentSlot } from '../../types/game';

// ประเภทสำหรับตัวกรอง (รวม 'all' สำหรับแสดงทั้งหมด)
type SlotFilter = 'all' | EquipmentSlot;

export const MarketplacePage = () => {
    const { user } = useAuthStore();
    const { player, loadUserData, subscribeToPlayer } = useGameStore();
    const {
        listings, myListings, isLoading,
        subscribeToMarket, subscribeToMyListings,
        listItem, buyItem, cancelListing,
    } = useMarketStore();

    const [tab, setTab] = useState<'browse' | 'mine'>('browse');
    const [selectedSlot, setSelectedSlot] = useState<SlotFilter>('all');
    const [showSellModal, setShowSellModal] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        const unsub = subscribeToMarket();
        return unsub;
    }, [subscribeToMarket]);

    useEffect(() => {
        if (!user?.uid) return;
        const unsub = subscribeToPlayer(user.uid);
        return () => unsub();
    }, [user?.uid, subscribeToPlayer]);

    useEffect(() => {
        if (!user?.uid) return;
        const unsub = subscribeToMyListings(user.uid);
        return unsub;
    }, [user?.uid, subscribeToMyListings]);

    const refreshPlayerData = async () => {
        if (user?.uid) await loadUserData(user.uid);
    };

    const handleBuy = async (listingId: string) => {
        const result = await buyItem(listingId);
        setToast(result.message);
        if (result.success) await refreshPlayerData();
        setTimeout(() => setToast(null), 3000);
    };

    const handleCancel = async (listingId: string) => {
        const result = await cancelListing(listingId);
        setToast(result.message);
        if (result.success) await refreshPlayerData();
        setTimeout(() => setToast(null), 3000);
    };

    const handleSell = async (itemUid: string, price: number, currencyType?: string) => {
        const result = await listItem(itemUid, price, currencyType);
        if (result.success) await refreshPlayerData();
        return result;
    };

    // ✅ Block page if user is a guest (not authenticated via real Firebase Auth)
    if (!user) {
        return (
            <div className="text-center text-slate-400 mt-20">
                <p className="text-lg font-bold text-white mb-2">Marketplace</p>
                <p>You must log in with a real account (not Guest) to use the marketplace.</p>
            </div>
        );
    }

    const currentList = tab === 'browse' ? listings : myListings;

    // กรองรายการตาม Slot ที่เลือก
    const displayList = currentList.filter((listing) => {
        if (selectedSlot === 'all') return true;
        return listing.item.slot === selectedSlot;
    });

    // รายการ Slot สำหรับสร้างปุ่ม Filter
    const filterSlots: { label: string; value: SlotFilter }[] = [
        { label: 'All', value: 'all' },
        { label: 'Weapon', value: 'weapon' },
        { label: 'Armor', value: 'armor' },
        { label: 'Helm', value: 'helm' },
        { label: 'Shield', value: 'shield' },
        { label: 'Boots', value: 'boots' },
        { label: 'Cloak', value: 'cloak' },
        { label: 'Necklace', value: 'necklace' },
        { label: 'Ring', value: 'ring' },
        { label: 'Skill', value: 'skill' },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            {toast && (
                <div className="bg-slate-800 border border-emerald-600 text-emerald-300 text-sm p-3 rounded-lg mb-4">
                    {toast}
                </div>
            )}

            {/* Top Navigation & Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setTab('browse')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition ${tab === 'browse' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                        Browse Market
                    </button>
                    <button
                        onClick={() => setTab('mine')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition ${tab === 'mine' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                        My Listings ({myListings.length})
                    </button>
                </div>
                <button
                    onClick={() => setShowSellModal(true)}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-700 hover:bg-amber-600 text-white cursor-pointer transition"
                >
                    Sell Item
                </button>
            </div>

            {/* Filter Chips by Slot */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-thin">
                {filterSlots.map((slot) => (
                    <button
                        key={slot.value}
                        onClick={() => setSelectedSlot(slot.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition ${selectedSlot === slot.value
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                    >
                        {slot.label}
                    </button>
                ))}
            </div>

            {/* Listing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {displayList.map((listing) => (
                    <MarketListingCard
                        key={listing.id}
                        listing={listing}
                        isOwner={listing.sellerId === user.uid}
                        onBuy={handleBuy}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                    />
                ))}
                {displayList.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-16">
                        {tab === 'browse' ? 'No items match this filter in the marketplace.' : "You haven't listed any items matching this filter."}
                    </div>
                )}
            </div>

            {showSellModal && (
                <SellItemModal
                    inventory={player.inventory}
                    onSell={handleSell}
                    onClose={() => setShowSellModal(false)}
                />
            )}
        </div>
    );
};