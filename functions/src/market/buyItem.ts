import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const MARKET_FEE_PERCENT = 0.05;

export const buyItem = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'ต้อง login ด้วยบัญชีจริงเท่านั้น');
    }

    const buyerId = request.auth.uid;
    const { listingId } = request.data as { listingId: string };

    if (!listingId) throw new HttpsError('invalid-argument', 'ไม่พบ listingId');

    return db.runTransaction(async (tx) => {
        const listingRef = db.collection('listings').doc(listingId);
        const listingSnap = await tx.get(listingRef);

        if (!listingSnap.exists) {
            throw new HttpsError('not-found', 'ไม่พบรายการนี้');
        }
        const listing = listingSnap.data()!;

        // ✅ กัน double-buy: ถ้า status ไม่ใช่ active แล้ว (โดนซื้อ/ยกเลิกไปก่อนหน้าใน transaction อื่น)
        // Firestore จะ retry transaction นี้ใหม่เมื่อพบว่าข้อมูลเปลี่ยน ทำให้เช็คนี้ทำงานถูกต้องเสมอ
        if (listing.status !== 'active') {
            throw new HttpsError('failed-precondition', 'ไอเทมนี้ถูกซื้อหรือยกเลิกไปแล้ว');
        }
        if (listing.sellerId === buyerId) {
            throw new HttpsError('invalid-argument', 'ไม่สามารถซื้อไอเทมของตัวเองได้');
        }

        const buyerRef = db.collection('players').doc(buyerId);
        const sellerRef = db.collection('players').doc(listing.sellerId);

        const buyerSnap = await tx.get(buyerRef);
        const sellerSnap = await tx.get(sellerRef);

        if (!buyerSnap.exists) throw new HttpsError('not-found', 'ไม่พบข้อมูลผู้ซื้อ');

        const buyerData = buyerSnap.data()!;
        const buyerGold: number = buyerData.player?.materials?.gold_ore || 0;

        if (buyerGold < listing.price) {
            throw new HttpsError('failed-precondition', 'Gold Ore ไม่พอ');
        }

        const sellerData = sellerSnap.exists ? sellerSnap.data()! : null;
        const sellerGold: number = sellerData?.player?.materials?.gold_ore || 0;

        const feeAmount = Math.floor(listing.price * MARKET_FEE_PERCENT);
        const sellerReceives = listing.price - feeAmount;

        const buyerInventory: any[] = buyerData.player?.inventory || [];

        // ✅ ทุก write อยู่ใน transaction เดียว — สำเร็จทั้งหมดหรือไม่สำเร็จเลย
        tx.update(buyerRef, {
            'player.materials.gold_ore': buyerGold - listing.price,
            'player.inventory': [...buyerInventory, listing.item],
        });

        if (sellerSnap.exists) {
            tx.update(sellerRef, {
                'player.materials.gold_ore': sellerGold + sellerReceives,
            });
        }

        tx.update(listingRef, {
            status: 'sold',
            buyerId,
            soldAt: Date.now(),
        });

        return { success: true, itemName: listing.item.name };
    });
});