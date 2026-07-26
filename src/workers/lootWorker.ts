// src/workers/lootWorker.ts
let autoInterval: any = null;
let isCoolingDown = false;

self.onmessage = (e: MessageEvent) => {
    const { action, duration = 2500 } = e.data;

    if (action === 'START_AUTO') {
        clearInterval(autoInterval);
        isCoolingDown = false;

        const intervalTime = 30;
        let elapsedTime = 0;
        const COOLDOWN_TIME = 800; // 🟢 ระยะเวลาพักหลังหลอดเต็ม (หน่วยเป็นมิลลิวินาที เช่น 800 = 0.8 วินาที)

        autoInterval = setInterval(() => {
            // ถ้ากำลังพักคูลดาวน์อยู่ ให้หยุดวิ่งเวลาชั่วคราว
            if (isCoolingDown) return;

            elapsedTime += intervalTime;
            const progress = Math.min((elapsedTime / duration) * 100, 100);

            // ส่งค่า progress กลับไปอัปเดตหลอด UI
            self.postMessage({ action: 'PROGRESS', progress });

            // เมื่อหลอดวิ่งครบ 100%
            if (elapsedTime >= duration) {
                // 1. ส่งสัญญาณบอก Main Thread ให้สุ่มและหยิบของเข้ากระเป๋า
                self.postMessage({ action: 'TICK_ROLL' });

                // 2. เริ่มเข้าสู่โหมดพักคูลดาวน์
                isCoolingDown = true;
                elapsedTime = 0;

                // 3. ตั้งเวลาค้างหลอดไว้ที่ 0 หรือ 100% ตามต้องการ แล้วค่อยปลดล็อกเริ่มรอบใหม่
                setTimeout(() => {
                    isCoolingDown = false;
                }, COOLDOWN_TIME);
            }
        }, intervalTime);
    }

    if (action === 'STOP_AUTO') {
        clearInterval(autoInterval);
        isCoolingDown = false;
        autoInterval = null;
    }
};