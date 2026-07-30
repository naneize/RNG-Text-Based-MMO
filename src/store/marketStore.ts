// store/marketStore.ts
import { create } from 'zustand';
import {
    collection, query, where, orderBy, onSnapshot,
    doc, runTransaction, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from './authStore';
import type { MarketListing } from '../types/marketplace';

const MARKET_LISTING_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVE_LISTINGS_PER_USER = 10;
const MARKET_FEE_PERCENT = 0.05;

interface MarketState {
    listings: MarketListing[];
    myListings: MarketListing[];
    isLoading: boolean;
    error: string | null;

    subscribeToMarket: () => () => void;
    subscribeToMyListings: (uid: string) => () => void;

    listItem: (itemUid: string, price: number, currencyType?: string) => Promise<{ success: boolean; message: string }>;
    buyItem: (listingId: string) => Promise<{ success: boolean; message: string }>;
    cancelListing: (listingId: string) => Promise<{ success: boolean; message: string }>;
}

export const useMarketStore = create<MarketState>((set) => ({
    listings: [],
    myListings: [],
    isLoading: false,
    error: null,

    subscribeToMarket: () => {
        const q = query(
            collection(db, 'listings'),
            where('status', '==', 'active'),
            orderBy('listedAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            console.log("🔥 Market Snapshot Data:", snap.docs.map(d => ({ id: d.id, ...d.data() })));

            set({ listings: snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketListing)) });
        }, (err) => {
            console.error("❌ Market Snapshot Error:", err);
            set({ error: err.message });
        });
        return unsub;
    },

    subscribeToMyListings: (uid: string) => {
        const q = query(
            collection(db, 'listings'),
            where('sellerId', '==', uid),
            where('status', '==', 'active'),
            orderBy('listedAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            set({ myListings: snap.docs.map((d) => ({ id: d.id, ...d.data() } as MarketListing)) });
        });
        return unsub;
    },

    listItem: async (itemUid: string, price: number, currencyType?: string) => {
        const uid = useAuthStore.getState().user?.uid;
        if (!uid) return { success: false, message: 'Please log in first.' };

        if (!price || price <= 0) return { success: false, message: 'Price must be greater than 0.' };

        const finalCurrency = currencyType || 'gold_ore';
        console.log('Currency received in store:', currencyType, ' | Final saved currency:', finalCurrency);

        set({ isLoading: true, error: null });
        try {
            const activeSnap = await getDocs(query(
                collection(db, 'listings'),
                where('sellerId', '==', uid),
                where('status', '==', 'active')
            ));
            if (activeSnap.size >= MAX_ACTIVE_LISTINGS_PER_USER) {
                set({ isLoading: false });
                return { success: false, message: `You can have a maximum of ${MAX_ACTIVE_LISTINGS_PER_USER} active listings.` };
            }

            await runTransaction(db, async (tx) => {
                const playerRef = doc(db, 'players', uid);
                const playerSnap = await tx.get(playerRef);
                if (!playerSnap.exists()) throw new Error('Player data not found.');

                const inventory: any[] = playerSnap.data().player?.inventory || [];
                const itemIndex = inventory.findIndex((i) => i.uid === itemUid);
                if (itemIndex === -1) throw new Error('Item not found in inventory.');

                const item = inventory[itemIndex];
                if (item.type === 'material') throw new Error('Materials cannot be listed for sale.');

                const userSnap = await tx.get(doc(db, 'users', uid));
                const sellerUsername = userSnap.data()?.username || 'Unknown';

                const newInventory = [...inventory];
                newInventory.splice(itemIndex, 1);
                tx.update(playerRef, { 'player.inventory': newInventory });

                const now = Date.now();
                const listingRef = doc(collection(db, 'listings'));
                tx.set(listingRef, {
                    sellerId: uid,
                    sellerUsername,
                    item,
                    price,
                    currencyType: finalCurrency,
                    status: 'active',
                    listedAt: now,
                    expiresAt: now + MARKET_LISTING_DURATION_MS,
                });
            });

            set({ isLoading: false });
            return { success: true, message: 'Item listed successfully!' };
        } catch (err: any) {
            set({ isLoading: false, error: err.message });
            return { success: false, message: err.message || 'Failed to list item.' };
        }
    },

    buyItem: async (listingId: string) => {
        const buyerId = useAuthStore.getState().user?.uid;
        if (!buyerId) return { success: false, message: 'Please log in first.' };

        set({ isLoading: true, error: null });
        try {
            let itemName = '';

            await runTransaction(db, async (tx) => {
                const listingRef = doc(db, 'listings', listingId);
                const listingSnap = await tx.get(listingRef);
                if (!listingSnap.exists()) throw new Error('Listing not found.');

                const listing = listingSnap.data();

                if (listing.status !== 'active') throw new Error('This item has already been sold or cancelled.');
                if (listing.sellerId === buyerId) throw new Error('You cannot buy your own item.');

                const currencyType = listing.currencyType || 'gold_ore';

                const buyerRef = doc(db, 'players', buyerId);
                const sellerRef = doc(db, 'players', listing.sellerId);

                const buyerSnap = await tx.get(buyerRef);
                const sellerSnap = await tx.get(sellerRef);
                if (!buyerSnap.exists()) throw new Error('Buyer data not found.');

                const buyerData = buyerSnap.data();
                const buyerCurrency: number = buyerData.player?.materials?.[currencyType] || 0;
                if (buyerCurrency < listing.price) throw new Error(`Insufficient ${currencyType}.`);

                const sellerCurrency: number = sellerSnap.exists() ? (sellerSnap.data().player?.materials?.[currencyType] || 0) : 0;
                const feeAmount = Math.floor(listing.price * MARKET_FEE_PERCENT);
                const sellerReceives = listing.price - feeAmount;

                const buyerInventory: any[] = buyerData.player?.inventory || [];

                tx.update(buyerRef, {
                    [`player.materials.${currencyType}`]: buyerCurrency - listing.price,
                    'player.inventory': [...buyerInventory, listing.item],
                });

                if (sellerSnap.exists()) {
                    tx.update(sellerRef, { [`player.materials.${currencyType}`]: sellerCurrency + sellerReceives });
                }

                tx.update(listingRef, { status: 'sold', buyerId, soldAt: Date.now() });
                itemName = listing.item.name;
            });

            set((state) => ({
                isLoading: false,
                listings: state.listings.filter((item) => item.id !== listingId),
                myListings: state.myListings.filter((item) => item.id !== listingId),
            }));

            return { success: true, message: `Successfully purchased ${itemName}!` };
        } catch (err: any) {
            set({ isLoading: false, error: err.message });
            return { success: false, message: err.message || 'Purchase failed.' };
        }
    },

    cancelListing: async (listingId: string) => {
        const uid = useAuthStore.getState().user?.uid;
        if (!uid) return { success: false, message: 'Please log in first.' };

        set({ isLoading: true, error: null });
        try {
            await runTransaction(db, async (tx) => {
                const listingRef = doc(db, 'listings', listingId);
                const listingSnap = await tx.get(listingRef);
                if (!listingSnap.exists()) throw new Error('Listing not found.');

                const listing = listingSnap.data();
                if (listing.status !== 'active') throw new Error('Cannot cancel this listing.');
                if (listing.sellerId !== uid) throw new Error('You are not the owner of this listing.');

                const sellerRef = doc(db, 'players', uid);
                const sellerSnap = await tx.get(sellerRef);
                const inventory: any[] = sellerSnap.data()?.player?.inventory || [];

                tx.update(sellerRef, { 'player.inventory': [...inventory, listing.item] });
                tx.update(listingRef, { status: 'cancelled' });
            });

            set({ isLoading: false });
            return { success: true, message: 'Listing cancelled successfully.' };
        } catch (err: any) {
            set({ isLoading: false, error: err.message });
            return { success: false, message: err.message || 'Failed to cancel listing.' };
        }
    },
}));