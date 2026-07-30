import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

const MARKET_LISTING_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVE_LISTINGS_PER_USER = 10;

export const listItem = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'ต้อง login ด้วยบัญชีจริงเท่านั้น');
    }

    const sellerId = request.auth.uid;
    // 1. เพิ่ม currencyType เข้ามาตรงนี้
    const { itemUid, price, currencyType } = request.data as { itemUid: string; price: number; currencyType?: string };

    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        throw new HttpsError('invalid-argument', 'ราคาต้องเป็นตัวเลขมากกว่า 0');
    }
    if (!itemUid || typeof itemUid !== 'string') {
        throw new HttpsError('invalid-argument', 'ไม่พบ itemUid');
    }

    return db.runTransaction(async (tx) => {
        const playerRef = db.collection('players').doc(sellerId);
        const playerSnap = await tx.get(playerRef);

        if (!playerSnap.exists) {
            throw new HttpsError('not-found', 'ไม่พบข้อมูลผู้เล่น');
        }

        const playerData = playerSnap.data()!;
        const inventory: any[] = playerData.player?.inventory || [];
        const itemIndex = inventory.findIndex((i) => i.uid === itemUid);

        if (itemIndex === -1) {
            throw new HttpsError('not-found', 'ไม่พบไอเทมนี้ใน inventory (อาจถูกใช้ หรือขายไปแล้ว)');
        }

        const item = inventory[itemIndex];

        if (item.type === 'material') {
            throw new HttpsError('invalid-argument', 'ไม่สามารถลงขายวัตถุดิบได้');
        }

        const activeListingsSnap = await db.collection('listings')
            .where('sellerId', '==', sellerId)
            .where('status', '==', 'active')
            .get();
        if (activeListingsSnap.size >= MAX_ACTIVE_LISTINGS_PER_USER) {
            throw new HttpsError('resource-exhausted', `ลงขายได้สูงสุด ${MAX_ACTIVE_LISTINGS_PER_USER} รายการพร้อมกัน`);
        }

        const userSnap = await tx.get(db.collection('users').doc(sellerId));
        const sellerUsername = userSnap.data()?.username || 'Unknown';

        const newInventory = [...inventory];
        newInventory.splice(itemIndex, 1);
        tx.update(playerRef, { 'player.inventory': newInventory });

        // 2. ประกาศตัวแปร finalCurrency ตรงนี้ก่อนนำไปใช้งาน
        const finalCurrency = currencyType || 'gold_ore';

        const now = Date.now();
        const listingRef = db.collection('listings').doc();
        tx.set(listingRef, {
            sellerId,
            sellerUsername,
            item,
            price,
            currencyType: finalCurrency, // 3. นำมาใส่ใน object ที่จะบันทึกลง Firestore
            status: 'active',
            listedAt: now,
            expiresAt: now + MARKET_LISTING_DURATION_MS,
        });

        return { listingId: listingRef.id };
    });
});