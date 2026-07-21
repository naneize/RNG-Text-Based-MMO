import type { Stats } from '../types/game';

export const STAT_CAPS: Partial<Record<keyof Stats, number>> = {
    critRate: 100,
    critDmg: 700,
    hit: 700,
    flee: 500
};

export function finalizeStats(rawStats: Stats): Stats {

    const stats = { ...rawStats };

    // 1. แปลง critRate ล้น -> critDmg
    if ((stats.critRate || 0) > (STAT_CAPS.critRate as number)) {
        const excess = stats.critRate - (STAT_CAPS.critRate as number);
        stats.critDmg = (stats.critDmg || 0) + excess * 0.3;
        stats.critRate = STAT_CAPS.critRate as number;
    }

    // 2. แปลง critDmg ล้น -> ATK และ HIT
    if ((stats.critDmg || 0) > (STAT_CAPS.critDmg as number)) {
        const excess = stats.critDmg - (STAT_CAPS.critDmg as number);
        stats.atk = (stats.atk || 0) + (excess * 0.2);
        stats.hit = (stats.hit || 0) + (excess * 0.1);
        stats.critDmg = STAT_CAPS.critDmg as number;
    }

    // 3. แปลง flee ล้น -> RES
    if ((stats.flee || 0) > (STAT_CAPS.flee as number)) {
        const excess = stats.flee - (STAT_CAPS.flee as number);
        // แบ่งสัดส่วนให้ RES (ลดดาเมจรวม) และ M.RES (ต้านคริ)
        stats.res = (stats.res || 0) + (excess * 0.20);
        stats.mRes = (stats.mRes || 0) + (excess * 0.10);
        stats.flee = STAT_CAPS.flee as number;
    }

    // 4. แปลง hit ล้น -> ATK 
    // หมายเหตุ: ตรงนี้ต้องระวัง ถ้า hit ได้รับค่ามาจาก critDmg ก่อนหน้า แล้วมันล้นต่อ
    // โค้ดนี้จะจับมันแปลงเป็น ATK ให้ทันทีครับ
    if ((stats.hit || 0) > (STAT_CAPS.hit as number)) {
        const excess = stats.hit - (STAT_CAPS.hit as number);
        stats.atk = (stats.atk || 0) + excess * 0.2;
        stats.hit = STAT_CAPS.hit as number;
    }

    return stats;
}