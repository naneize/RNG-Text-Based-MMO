import { create } from 'zustand';
import { useGameStore } from './gameStore';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    setPersistence,
    inMemoryPersistence, // 🟢 นำเข้าตัวจัดการเซสชันแบบแยกแท็บ
    type User,
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
    uid: string;
    email: string | null;
    username: string;
    role?: 'developer' | 'player'; // 🟢 เพิ่มฟิลด์เก็บยศ
}

interface AuthState {
    user: User | null;
    userProfile: UserProfile | null;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;

    checkUsernameExists: (username: string) => Promise<boolean>;
    saveUsername: (username: string) => Promise<boolean>;
    fetchUserProfile: (uid: string) => Promise<void>;

    loginAsGuest: () => void;
}

// 🚀 กำหนดรายชื่ออีเมลที่เป็น Developer ของคุณตรงนี้
const DEVELOPER_EMAILS = [
    "nanza9073@gmail.com", // ⚠️ เปลี่ยนเป็นอีเมลจริงที่คุณใช้ล็อกอิน
];

export const isUserDeveloper = (email?: string | null) => {
    if (!email) return false;
    return DEVELOPER_EMAILS.includes(email);
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    userProfile: null,
    isLoading: true,
    error: null,

    login: async (email, password) => {
        set({ error: null });
        try {
            // 🟢 ตั้งค่าให้เซสชันจำกัดอยู่แค่ในแท็บนี้เท่านั้นก่อนเข้าสู่ระบบ
            await setPersistence(auth, inMemoryPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await get().fetchUserProfile(userCredential.user.uid);
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    // 🟢 ฟังก์ชันจำลองการเข้าสู่ระบบแบบ Guest
    loginAsGuest: () => {
        set({ error: null });

        // สร้างข้อมูลโปรไฟล์จำลองชั่วคราว
        const guestProfile: UserProfile = {
            uid: 'guest_' + Date.now(),
            email: null,
            username: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
        };



        // เซ็ตสถานะให้เหมือนล็อกอินผ่านแล้ว โดยใช้ object ปลอมหรือเซ็ต userProfile ตรงๆ
        set({
            user: null, // ไม่มี Firebase User จริง
            userProfile: guestProfile,
            isLoading: false,
        });

        // (ทางเลือก) ถ้าต้องการเซ็ตชื่อผู้เล่นใน gameStore พร้อมกันด้วย
        useGameStore.setState((state) => ({
            player: {
                ...state.player,
                name: guestProfile.username,
            }
        }));
    },

    register: async (email, password) => {
        set({ error: null });
        try {
            // 🟢 ตั้งค่าให้เซสชันจำกัดอยู่แค่ในแท็บนี้เท่านั้นก่อนสมัครสมาชิก
            await setPersistence(auth, inMemoryPersistence);
            await createUserWithEmailAndPassword(auth, email, password);
            set({ userProfile: null }); // สมัครใหม่ยังไม่มีชื่อ ต้องไปหน้าตั้งชื่อ
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    loginWithGoogle: async () => {
        set({ error: null });
        try {
            // 🟢 ตั้งค่าให้เซสชันจำกัดอยู่แค่ในแท็บนี้เท่านั้นก่อนล็อกอินด้วย Google
            await setPersistence(auth, inMemoryPersistence);
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            await get().fetchUserProfile(userCredential.user.uid);
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    logout: async () => {
        try {
            const currentUid = useAuthStore.getState().user?.uid;

            // ถ้ามี UID จริงๆ ค่อยสั่งเซฟข้อมูลลง Firestore
            if (currentUid) {
                await useGameStore.getState().saveUserData(currentUid);
                await signOut(auth);
            }
        } catch (error) {
            console.error("Failed to save game data before logout:", error);
        }

        // ล้างสเตตัสทั้งหมด (ไม่ว่าจะเป็น User จริงหรือ Guest ก็เคลียร์เกลี้ยงเหมือนกัน)
        set({ user: null, userProfile: null });
        useGameStore.getState().resetGame();
    },

    clearError: () => set({ error: null }),

    // 🔍 ฟังก์ชันเช็คว่าชื่อซ้ำไหม (Return true ถ้ามีคนใช้แล้ว)
    checkUsernameExists: async (username: string): Promise<boolean> => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (err) {
            console.error("Error checking username:", err);
            return false;
        }
    },

    // 👤 ฟังก์ชันดึงข้อมูลโปรไฟล์จาก Firestore
    fetchUserProfile: async (uid: string) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data() as UserProfile;

                // 🟢 เช็คและกำกับยศ Developer จากอีเมลตอนดึงข้อมูล
                const isDev = isUserDeveloper(data.email);
                const profileWithRole = {
                    ...data,
                    role: isDev ? ('developer' as const) : ('player' as const)
                };

                set({ userProfile: profileWithRole });
            } else {
                set({ userProfile: null });
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            set({ userProfile: null });
        }
    },

    // 💾 ฟังก์ชันบันทึกชื่อลง Firestore โดยใช้ UID เป็น Document ID
    saveUsername: async (username: string): Promise<boolean> => {
        const currentUser = get().user;
        if (!currentUser) return false;

        set({ error: null });
        try {
            const isExists = await get().checkUsernameExists(username);
            if (isExists) {
                set({ error: 'This username is already taken.' });
                return false;
            }

            const userRef = doc(db, 'users', currentUser.uid);

            // 🟢 เช็คยศ Developer ตอนสร้างโปรไฟล์
            const isDev = isUserDeveloper(currentUser.email);

            const profileData: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email,
                username: username,
                role: isDev ? 'developer' : 'player', // บันทึก role ลงไป
            };

            await setDoc(userRef, {
                ...profileData,
                createdAt: new Date().toISOString()
            }, { merge: true });

            set({ userProfile: profileData });
            return true;
        } catch (err: any) {
            set({ error: 'Failed to save username. Please try again.' });
            return false;
        }
    }
}));

// แปล error code ของ Firebase ให้อ่านง่ายขึ้น (ภาษาอังกฤษ)
function mapFirebaseError(code: string): string {
    switch (code) {
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email is already in use.';
        case 'auth/weak-password':
            return 'Password is too weak (at least 6 characters).';
        case 'auth/popup-closed-by-user':
            return 'Google Sign-In popup was closed before completion.';
        default:
            return 'An error occurred. Please try again.';
    }
}


// ผูก listener เช็ค session ค้าง — เรียกครั้งเดียวตอนแอปเริ่มทำงาน (ใน main.tsx)
export const initAuthListener = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            let profile: UserProfile | null = null;
            if (userSnap.exists()) {
                const data = userSnap.data() as UserProfile;
                const isDev = isUserDeveloper(firebaseUser.email);
                profile = {
                    ...data,
                    role: isDev ? 'developer' : 'player'
                };
            }

            useAuthStore.setState({
                user: firebaseUser,
                userProfile: profile,
                isLoading: false
            });

            await useGameStore.getState().loadUserData(firebaseUser.uid);

        } else {
            useAuthStore.setState({ user: null, userProfile: null, isLoading: false });
            useGameStore.getState().resetGame();
        }
    });
};