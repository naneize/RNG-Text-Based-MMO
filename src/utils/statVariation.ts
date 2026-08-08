// utils/statVariation.ts

// ✅ ค่ากลางที่ทั้ง item generator และ UI (stat range display) ต้องใช้ตรงกันเป๊ะ
// แก้ตรงนี้ที่เดียว มีผลทั้งการสุ่มจริงและตัวเลขที่โชว์ผู้เล่นพร้อมกันเสมอ
export const VARIATION_PERCENT = 0.05;
export const MIN_VARIATION = 3; // กัน range แคบเกินไปตอน itemLevel ต่ำๆ

const getVariationAmount = (baseVal: number): number => {
    return Math.max(MIN_VARIATION, Math.floor(baseVal * VARIATION_PERCENT));
};

/**
 * สุ่มค่าจริงจากค่าฐาน (ใช้ตอน generate item จริง)
 * ใช้สูตรสมมาตรตรงไปตรงมา: สุ่มจำนวนเต็มในช่วง [-range, +range] แบบเท่ากันทั้งสองฝั่ง
 * (แก้ปัญหาเดิมที่ Math.floor() บนเลขติดลบทำให้ขอบเขตไม่สมมาตร)
 */
export const rollWithVariation = (baseVal: number): number => {
    const range = getVariationAmount(baseVal);
    const variation = Math.floor(Math.random() * (range * 2 + 1)) - range;
    return Math.max(1, baseVal + variation);
};

/**
 * คำนวณ min-max ที่เป็นไปได้จริงจากค่าฐาน (ใช้ตอนโชว์ UI)
 * ใช้สูตรเดียวกับ rollWithVariation เป๊ะ รับประกันว่าค่าที่สุ่มได้จริงไม่มีทางหลุด range นี้
 */
export const getVariationRange = (baseVal: number): { min: number; max: number } => {
    const range = getVariationAmount(baseVal);
    return {
        min: Math.max(1, baseVal - range),
        max: Math.max(1, baseVal + range),
    };
};