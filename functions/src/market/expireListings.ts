import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const expireListings = onSchedule('every 60 minutes', async () => {
    const now = Date.now();
    const expiredSnap = await db.collection('listings')
        .where('status', '==', 'active')
        .where('expiresAt', '<=', now)
        .get();

    if (expiredSnap.empty) return;

    for (const doc of expiredSnap.docs) {
        // ทำทีละรายการแยก transaction กัน (กันชนกับ buyItem ที่อาจกำลังซื้อพอดี)
        await db.runTransaction(async (tx) => {
            const listingRef = doc.ref;
            const listingSnap = await tx.get(listingRef);
            const listing = listingSnap.data();
            if (!listing || listing.status !== 'active') return; // โดนซื้อ/ยกเลิกไปแล้วระหว่างนี้

            const sellerRef = db.collection('players').doc(listing.sellerId);
            const sellerSnap = await tx.get(sellerRef);
            if (sellerSnap.exists) {
                const inventory: any[] = sellerSnap.data()?.player?.inventory || [];
                tx.update(sellerRef, { 'player.inventory': [...inventory, listing.item] });
            }
            tx.update(listingRef, { status: 'expired' });
        });
    }
});