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
        const user = authState.user;
        const userProfile = authState.userProfile;

        if (!user || !userProfile) {
            console.error("User not authenticated or profile not found");
            return;
        }

        try {
            const sanitizedItem = item ? JSON.parse(JSON.stringify(item)) : null;

            await addDoc(collection(db, 'chats'), {
                uid: user.uid,
                username: userProfile.username,
                text: text.trim(),
                item: sanitizedItem,
                reactions: {}, // เริ่มต้นไม่มีใคร react
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
        const user = authState.user;
        const userProfile = authState.userProfile;

        if (!user || !userProfile) {
            console.error("User not authenticated or profile not found");
            return;
        }

        // 2. ถ้าไม่ได้ส่ง playerData เข้ามา ให้ fallback ไปใช้ userProfile หรือข้อมูลปัจจุบันแทน
        const targetData = playerData || userProfile;

        try {
            const sanitizedStats = JSON.parse(JSON.stringify({
                uid: user.uid,
                username: userProfile.username,
                finalStats: (targetData as any).finalStats || {},
                statBreakdown: (targetData as any).statBreakdown || {},
                equippedItems: (targetData as any).equippedItems || {}
            }));

            await addDoc(collection(db, 'chats'), {
                uid: user.uid,
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

    // ❤️ ติด/ถอด reaction ของตัวเองในข้อความนี้
    toggleReaction: async (messageId: string, emoji: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            const messageRef = doc(db, 'chats', messageId);
            const currentMsg = useChatStore.getState().messages.find(m => m.id === messageId);
            const currentReaction = currentMsg?.reactions?.[user.uid];

            if (currentReaction === emoji) {
                // กดซ้ำอีโมจิเดิม → ถอดออก
                await updateDoc(messageRef, {
                    [`reactions.${user.uid}`]: deleteField()
                });
            } else {
                // ยังไม่เคย react หรือเปลี่ยนเป็นอีโมจิใหม่
                await updateDoc(messageRef, {
                    [`reactions.${user.uid}`]: emoji
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