import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const cancelListing = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'ต้อง login ด้วยบัญชีจริงเท่านั้น');

    const userId = request.auth.uid;
    const { listingId } = request.data as { listingId: string };

    return db.runTransaction(async (tx) => {
        const listingRef = db.collection('listings').doc(listingId);
        const listingSnap = await tx.get(listingRef);
        if (!listingSnap.exists) throw new HttpsError('not-found', 'ไม่พบรายการนี้');

        const listing = listingSnap.data()!;
        if (listing.status !== 'active') {
            throw new HttpsError('failed-precondition', 'ไม่สามารถยกเลิกได้ (สถานะเปลี่ยนไปแล้ว)');
        }
        if (listing.sellerId !== userId) {
            throw new HttpsError('permission-denied', 'ไม่ใช่เจ้าของรายการนี้');
        }

        const sellerRef = db.collection('players').doc(userId);
        const sellerSnap = await tx.get(sellerRef);
        const inventory: any[] = sellerSnap.data()?.player?.inventory || [];

        tx.update(sellerRef, { 'player.inventory': [...inventory, listing.item] });
        tx.update(listingRef, { status: 'cancelled' });
    });
});