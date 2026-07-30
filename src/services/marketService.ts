import { doc, runTransaction, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const MARKET_LISTING_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVE_LISTINGS_PER_USER = 10;
const MARKET_FEE_PERCENT = 0.05;

// 1. ลงขายไอเทม (listItem) - เพิ่ม currencyType รองรับเลือกชนิดแร่ (ค่าเริ่มต้นเป็น gold_ore)
export async function executeListItem(uid: string, itemUid: string, price: number, currencyType: string = 'gold_ore') {
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        throw new Error('ราคาต้องเป็นตัวเลขมากกว่า 0');
    }
    if (!itemUid || typeof itemUid !== 'string') {
        throw new Error('ไม่พบ itemUid');
    }

    // เช็คจำนวนรายการ active นอก transaction เพื่อความสะดวกรวดเร็ว
    const activeListingsSnap = await getDocs(query(
        collection(db, 'listings'),
        where('sellerId', '==', uid),
        where('status', '==', 'active')
    ));
    if (activeListingsSnap.size >= MAX_ACTIVE_LISTINGS_PER_USER) {
        throw new Error(`ลงขายได้สูงสุด ${MAX_ACTIVE_LISTINGS_PER_USER} รายการพร้อมกัน`);
    }

    return await runTransaction(db, async (tx) => {
        const playerRef = doc(db, 'players', uid);
        const playerSnap = await tx.get(playerRef);

        if (!playerSnap.exists()) {
            throw new Error('ไม่พบข้อมูลผู้เล่น');
        }

        const playerData = playerSnap.data();
        const inventory: any[] = playerData.player?.inventory || [];
        const itemIndex = inventory.findIndex((i) => i.uid === itemUid);

        if (itemIndex === -1) {
            throw new Error('ไม่พบไอเทมนี้ใน inventory (อาจถูกใช้ หรือขายไปแล้ว)');
        }

        const item = inventory[itemIndex];

        if (item.type === 'material') {
            throw new Error('ไม่สามารถลงขายวัตถุดิบได้');
        }

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
            currencyType, // ✅ บันทึกชนิดแร่ที่ใช้ตั้งราคา
            status: 'active',
            listedAt: now,
            expiresAt: now + MARKET_LISTING_DURATION_MS,
        });

        return { listingId: listingRef.id };
    });
}

// 2. ซื้อไอเทม (buyItem) - ปรับให้หัก/โอนแร่ตาม currencyType ที่ผู้ขายตั้งไว้
export async function executeBuyItem(buyerId: string, listingId: string) {
    if (!listingId) throw new Error('ไม่พบ listingId');

    let itemName = '';

    await runTransaction(db, async (tx) => {
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await tx.get(listingRef);

        if (!listingSnap.exists()) {
            throw new Error('ไม่พบรายการนี้');
        }
        const listing = listingSnap.data();

        if (listing.status !== 'active') {
            throw new Error('ไอเทมนี้ถูกซื้อหรือยกเลิกไปแล้ว');
        }
        if (listing.sellerId === buyerId) {
            throw new Error('ไม่สามารถซื้อไอเทมของตัวเองได้');
        }

        // ✅ ดึงชนิดแร่ (รองรับข้อมูลเก่าที่อาจจะยังไม่มีฟิลด์นี้ ให้มองเป็น gold_ore)
        const currencyType = listing.currencyType || 'gold_ore';

        const buyerRef = doc(db, 'players', buyerId);
        const sellerRef = doc(db, 'players', listing.sellerId);

        const buyerSnap = await tx.get(buyerRef);
        const sellerSnap = await tx.get(sellerRef);

        if (!buyerSnap.exists()) throw new Error('ไม่พบข้อมูลผู้ซื้อ');

        const buyerData = buyerSnap.data();
        const buyerCurrency: number = buyerData.player?.materials?.[currencyType] || 0;

        if (buyerCurrency < listing.price) {
            throw new Error(`แร่ ${currencyType} ไม่พอ`);
        }

        const sellerData = sellerSnap.exists() ? sellerSnap.data() : null;
        const sellerCurrency: number = sellerData?.player?.materials?.[currencyType] || 0;

        const feeAmount = Math.floor(listing.price * MARKET_FEE_PERCENT);
        const sellerReceives = listing.price - feeAmount;

        const buyerInventory: any[] = buyerData.player?.inventory || [];

        // ✅ หักแร่ของผู้ซื้อตามชนิดที่ตั้งไว้
        tx.update(buyerRef, {
            [`player.materials.${currencyType}`]: buyerCurrency - listing.price,
            'player.inventory': [...buyerInventory, listing.item],
        });

        // ✅ เพิ่มแร่ให้ผู้ขายตามชนิดที่ตั้งไว้
        if (sellerSnap.exists()) {
            tx.update(sellerRef, {
                [`player.materials.${currencyType}`]: sellerCurrency + sellerReceives,
            });
        }

        tx.update(listingRef, {
            status: 'sold',
            buyerId,
            soldAt: Date.now(),
        });

        itemName = listing.item.name;
    });

    return { itemName };
}

// 3. ยกเลิกการขาย (cancelListing)
export async function executeCancelListing(userId: string, listingId: string) {
    if (!listingId) throw new Error('ไม่พบ listingId');

    await runTransaction(db, async (tx) => {
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await tx.get(listingRef);
        if (!listingSnap.exists()) throw new Error('ไม่พบรายการนี้');

        const listing = listingSnap.data();
        if (listing.status !== 'active') {
            throw new Error('ไม่สามารถยกเลิกได้ (สถานะเปลี่ยนไปแล้ว)');
        }
        if (listing.sellerId !== userId) {
            throw new Error('ไม่ใช่เจ้าของรายการนี้');
        }

        const sellerRef = doc(db, 'players', userId);
        const sellerSnap = await tx.get(sellerRef);
        const inventory: any[] = sellerSnap.data()?.player?.inventory || [];

        tx.update(sellerRef, { 'player.inventory': [...inventory, listing.item] });
        tx.update(listingRef, { status: 'cancelled' });
    });
}