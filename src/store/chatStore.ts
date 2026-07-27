import { create } from 'zustand';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
    deleteField,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    type Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from './authStore';
import type { Item, Player, Stats } from '../types/game';

// 1. อัปเดต Interface ให้รองรับข้อมูล playerStats
export interface ChatMessage {
    id: string;
    uid: string;
    username: string;
    text: string;
    item?: Item;
    playerStats?: {
        uid: string;
        username: string;
        finalStats: Stats;
        statBreakdown?: Record<string, { label: string; value: number }[]>;
        equippedItems?: Player['equippedItems'];
    };
    reactions?: Record<string, string>; // uid -> emoji เดียว
    createdAt: Timestamp | null;
}

interface ChatState {
    messages: ChatMessage[];
    sendMessage: (text: string, item?: Item) => Promise<void>;
    shareStatsToChat: (playerData?: Player) => Promise<void>; // 2. เพิ่มฟังก์ชันแชร์สเตตัส
    deleteMessage: (messageId: string) => Promise<void>;
    clearChat: () => Promise<void>;
    subscribeToChat: () => () => void;
    toggleReaction: (messageId: string, emoji: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],

    // 📤 ฟังก์ชันส่งข้อความ (รองรับการแนบ Item)
    sendMessage: async (text: string, item?: Item) => {
        if (!text.trim() && !item) return;

        const authState = useAuthStore.getState();
        const userProfile = authState.userProfile; // 🟢 ใช้แค่ userProfile ก็พอครับ

        if (!userProfile) {
            console.error("User profile not found");
            return;
        }

        try {
            const sanitizedItem = item ? JSON.parse(JSON.stringify(item)) : null;

            await addDoc(collection(db, 'chats'), {
                uid: userProfile.uid, // 🟢 ดึง uid จากโปรไฟล์แทน (รองรับทั้ง User จริงและ Guest)
                username: userProfile.username,
                text: text.trim(),
                item: sanitizedItem,
                reactions: {},
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error sending message:", err);
        }
    },

    // 📊 ฟังก์ชันแชร์ Stats ของตัวเองลงแชท
    // 1. ตรงส่วน Interface (ถ้ามีแยกไว้) หรือ type ของ Store ให้ใส่เครื่องหมาย ? หน้า playerData
    shareStatsToChat: async (playerData?: Player) => {
        const authState = useAuthStore.getState();
        const userProfile = authState.userProfile; // 🟢 ใช้แค่ userProfile

        if (!userProfile) {
            console.error("User profile not found");
            return;
        }

        const targetData = playerData || userProfile;

        try {
            const sanitizedStats = JSON.parse(JSON.stringify({
                uid: userProfile.uid, // 🟢 ใช้ uid จากโปรไฟล์
                username: userProfile.username,
                finalStats: (targetData as any).finalStats || {},
                statBreakdown: (targetData as any).statBreakdown || {},
                equippedItems: (targetData as any).equippedItems || {}
            }));

            await addDoc(collection(db, 'chats'), {
                uid: userProfile.uid, // 🟢 ใช้ uid จากโปรไฟล์
                username: userProfile.username,
                text: `shared their character stats!`,
                playerStats: sanitizedStats,
                reactions: {},
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error sharing stats to chat:", err);
        }
    },

    // 🗑️ ฟังก์ชันสำหรับลบข้อความทีละข้อความ
    deleteMessage: async (messageId: string) => {
        try {
            const messageRef = doc(db, 'chats', messageId);
            await deleteDoc(messageRef);
        } catch (err) {
            console.error("Error deleting message:", err);
        }
    },

    // 🗑️ ฟังก์ชันสำหรับลบข้อความแชททั้งหมดในระบบ
    clearChat: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'chats'));
            const deletePromises = querySnapshot.docs.map((document) =>
                deleteDoc(doc(db, 'chats', document.id))
            );
            await Promise.all(deletePromises);
            set({ messages: [] });
        } catch (err) {
            console.error("Error clearing chat:", err);
        }
    },

    // ❤️ ติด/ถอด reaction ของตัวเองในข้อความนี้ (รองรับ Guest)
    toggleReaction: async (messageId: string, emoji: string) => {
        const userProfile = useAuthStore.getState().userProfile;
        if (!userProfile) return;

        try {
            const messageRef = doc(db, 'chats', messageId);
            const currentMsg = useChatStore.getState().messages.find(m => m.id === messageId);
            const currentReaction = currentMsg?.reactions?.[userProfile.uid];

            if (currentReaction === emoji) {
                // กดซ้ำอีโมจิเดิม → ถอดออก
                await updateDoc(messageRef, {
                    [`reactions.${userProfile.uid}`]: deleteField()
                });
            } else {
                // ยังไม่เคย react หรือเปลี่ยนเป็นอีโมจิใหม่
                await updateDoc(messageRef, {
                    [`reactions.${userProfile.uid}`]: emoji
                });
            }
        } catch (err) {
            console.error("Error toggling reaction:", err);
        }
    },

    // 📥 ฟังก์ชันดึงข้อความแบบ Real-time
    subscribeToChat: () => {
        const q = query(
            collection(db, 'chats'),
            orderBy('createdAt', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((docItem) => {
                msgs.push({ id: docItem.id, ...docItem.data() } as ChatMessage);
            });
            set({ messages: msgs });
        }, (error) => {
            console.error("Error listening to chat:", error);
        });

        return unsubscribe;
    }
}));