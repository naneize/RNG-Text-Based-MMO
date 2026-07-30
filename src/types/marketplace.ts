// types/marketplace.ts
import type { Item } from './game';

export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';

export interface MarketListing {
    id: string;
    sellerId: string;
    sellerUsername: string;
    item: Item;
    price: number;
    currencyType?: string;    // หน่วยเป็น gold_ore
    status: ListingStatus;
    listedAt: number;        // epoch ms
    expiresAt: number;        // epoch ms
    buyerId?: string;
    soldAt?: number;
}

export const MARKET_LISTING_DURATION_MS = 24 * 60 * 60 * 1000; // 24 ชม.
export const MARKET_FEE_PERCENT = 0.05; // หักค่าธรรมเนียม 5% ตอนขายสำเร็จ (ปรับได้/ตั้ง 0 ถ้าไม่อยากหัก)
export const MAX_ACTIVE_LISTINGS_PER_USER = 10; // กันคนถมตลาดจนล้น