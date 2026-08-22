// utils/storageFallback.ts
// itch.io / CrazyGames รันเกมใน iframe แบบ sandbox (opaque origin) ซึ่งการแตะ window.localStorage
// จะโดน SecurityError ทันที — และทุก zustand persist store เรียกใช้ตอน import ทำให้ React
// crash ก่อน render เป็นจอขาว
// วิธีแก้: ถ้า localStorage ใช้ไม่ได้ ให้สลับเป็น memory storage แทน (เกมยังเล่นได้ปกติ
// แค่ไม่บันทึกความคืบหน้าข้ามรีเฟรชใน portal ที่บล็อก) — ต้อง import ไฟล์นี้เป็นไฟล์แรกสุดของ main.tsx

const createMemoryStorage = (): Storage => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => (key in store ? store[key] : null),
        setItem: (key: string, value: string) => { store[key] = String(value); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() { return Object.keys(store).length; },
    } as Storage;
};

const isStorageBlocked = (storage: 'localStorage' | 'sessionStorage'): boolean => {
    try {
        window[storage].getItem('__storage_probe__');
        return false;
    } catch {
        return true;
    }
};

for (const name of ['localStorage', 'sessionStorage'] as const) {
    if (isStorageBlocked(name)) {
        try {
            Object.defineProperty(window, name, {
                value: createMemoryStorage(),
                configurable: true,
            });
            console.warn(`${name} is blocked (sandboxed iframe) — using in-memory fallback. Progress will not persist this session.`);
        } catch {
            // บาง browser อาจกัน define ไว้ — ปล่อยผ่าน ให้ store ต่าง ๆ จัดการ error เอง
        }
    }
}
