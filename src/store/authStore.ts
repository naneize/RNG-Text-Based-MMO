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
import { useAchievementStore } from './achievementStore';

interface UserProfile {
    uid: string;
    email: string | null;
    username: string;
    role?: 'developer' | 'player'; // 🟢 เพิ่มฟิลด์เก็บยศ
    equippedTitle?: string;          // 🟢 ฉายาที่กำลังใส่
    unlockedTitles?: string[];   // 🟢 รายการฉายาที่มีทั้งหมด
    avatar?: string;
    frame?: string;
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

    setEquippedTitle: (title: string) => void;
    setAvatar: (avatarPath: string) => Promise<void>;
    setFrame: (framePath: string) => Promise<void>;

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

    register: async (email, password) => {
        set({ error: null });
        try {
            await setPersistence(auth, inMemoryPersistence);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await useAchievementStore.getState().loadAchievements(userCredential.user.uid); // ✅ แทน resetAchievements()
            set({ userProfile: null });
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    login: async (email, password) => {

        set({ error: null });
        try {
            await setPersistence(auth, inMemoryPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await get().fetchUserProfile(userCredential.user.uid);
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    // 🟢 ฟังก์ชันจำลองการเข้าสู่ระบบแบบ Guest
    loginAsGuest: () => {
        // 🟢 ล้าง Achievement ของไอดีเก่าทิ้งก่อนสลับเป็น Guest
        useAchievementStore.getState().resetAchievements();

        set({ error: null });
        const guestProfile: UserProfile = {
            uid: 'guest_' + Date.now(),
            email: null,
            username: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
        };

        set({
            user: null,
            userProfile: guestProfile,
            isLoading: false,
        });

        useGameStore.setState((state) => ({
            player: {
                ...state.player,
                name: guestProfile.username,
            }
        }));

        import('../firebase').then(({ analytics }) => {
            if (analytics) {
                import('firebase/analytics').then(({ setUserProperties, logEvent }) => {
                    setUserProperties(analytics!, { account_type: 'guest' });
                    logEvent(analytics!, 'guest_session_start');
                });
            }
        });
    },


    loginWithGoogle: async () => {

        set({ error: null });
        try {
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
            if (currentUid) {
                await useGameStore.getState().saveUserData(currentUid);
                await signOut(auth);
            }
        } catch (error) {
            console.error("Failed to save game data before logout:", error);
        }

        set({ user: null, userProfile: null });
        useGameStore.getState().resetGame();

        // 🟢 แก้บรรทัดนี้ให้ทำงานจริง:
        useAchievementStore.getState().resetAchievements();
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
        await useAchievementStore.getState().loadAchievements(uid);

        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data() as UserProfile;

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
    },

    setEquippedTitle: async (title: string) => {
        const currentUser = get().user;
        const currentProfile = get().userProfile;

        // อัปเดตลง State ในเครื่องทันที
        set((state) => ({
            userProfile: state.userProfile ? { ...state.userProfile, equippedTitle: title } : null
        }));

        // 🟢 เพิ่มส่วนบันทึกลง Firestore ตรงนี้ครับ
        if (currentUser && currentProfile) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await setDoc(userRef, { equippedTitle: title }, { merge: true });
            } catch (err) {
                console.error("Failed to save equippedTitle to Firestore:", err);
            }
        }
    },
    // 🟢 3. เพิ่มฟังก์ชันสำหรับอัปเดตและบันทึก Avatar ลง Firestore
    setAvatar: async (avatarPath: string) => {
        const currentUser = get().user;
        const currentProfile = get().userProfile;

        // อัปเดตลง State ในเครื่องก่อนทันที (เพื่อให้ UI เปลี่ยนไวๆ)
        set((state) => ({
            userProfile: state.userProfile ? { ...state.userProfile, avatar: avatarPath } : null
        }));

        // ถ้าเป็น User จริง (ไม่ใช่ Guest) ให้บันทึกลง Firestore ด้วย
        if (currentUser && currentProfile) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await setDoc(userRef, { avatar: avatarPath }, { merge: true });
            } catch (err) {
                console.error("Failed to save avatar to Firestore:", err);
            }
        }
    },
    // 🟢 เพิ่มฟังก์ชันสำหรับอัปเดตและบันทึก Frame ลง Firestore
    setFrame: async (framePath: string) => {
        const currentUser = get().user;
        const currentProfile = get().userProfile;

        // อัปเดตลง State ในเครื่องทันที
        set((state) => ({
            userProfile: state.userProfile ? { ...state.userProfile, frame: framePath } : null
        }));

        // บันทึกลง Firestore (ถ้ามี)
        if (currentUser && currentProfile) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await setDoc(userRef, { frame: framePath }, { merge: true });
            } catch (err) {
                console.error("Failed to save frame to Firestore:", err);
            }
        }
    },
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
        try {
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

                // 1. อัปเดตสถานะ Auth ลงใน Store ก่อน
                useAuthStore.setState({
                    user: firebaseUser,
                    userProfile: profile,
                    isLoading: false
                });

                // 2. โหลดข้อมูลเกมและ Achievement หลังจาก State พร้อมแล้ว
                await useGameStore.getState().loadUserData(firebaseUser.uid);
                await useAchievementStore.getState().loadAchievements(firebaseUser.uid);

            } else {
                // กรณีที่ไม่ได้ Login หรือทำการ Logout
                useAuthStore.setState({ user: null, userProfile: null, isLoading: false });

                // เคลียร์ข้อมูลเกมและ Achievement ทิ้ง เพื่อไม่ให้ข้อมูลค้างเวลาเปลี่ยนไอดี
                useGameStore.getState().resetGame();
                useAchievementStore.getState().resetAchievements(); // 👈 แนะนำให้เพิ่มบรรทัดนี้ด้วย
            }
        } catch (error) {
            console.error("Auth listener error:", error);
            // ป้องกันแอปค้างหน้า Loading ถ้าเกิด Error ระหว่างดึงข้อมูลจาก Firestore
            useAuthStore.setState({
                user: null,
                userProfile: null,
                isLoading: false
            });
        }
    });
};