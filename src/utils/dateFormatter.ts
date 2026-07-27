// src/utils/dateFormatter.ts
import { Timestamp } from 'firebase/firestore';

export const formatMessageTime = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
};

export const formatFullDate = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleString();
};