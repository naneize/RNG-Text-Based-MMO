import type { Stats } from '../types/game';

export const STAT_CAPS: Partial<Record<keyof Stats, number>> = {
    critRate: 95,
    critDmg: 700,
    hit: 2000,
    flee: 1500
};

export function finalizeStats(rawStats: Stats): Stats {
    const stats = { ...rawStats };

    // 1. แปลง critRate ล้น -> critDmg
    // (สมมติ Cap CritRate คือ 95)
    const critRateCap = STAT_CAPS.critRate as number;
    if ((stats.critRate || 0) > critRateCap) {
        const excess = stats.critRate - critRateCap;
        // ปรับอัตราส่วนแปลงให้คุ้มค่าขึ้น เช่น ล้น 1% ได้ Crit DMG +1 หรือ +1.5
        const bonusCritDmg = Math.round(excess * 1.0);

        stats.critDmg = (stats.critDmg || 0) + bonusCritDmg;
        stats.critRate = critRateCap;
    }

    // 2. แปลง critDmg ล้น -> ATK และ HIT
    // (สมมติ Cap CritDmg คือ 700)
    const critDmgCap = STAT_CAPS.critDmg as number;
    if ((stats.critDmg || 0) > critDmgCap) {
        const excess = stats.critDmg - critDmgCap;

        // ใช้ Math.round() ป้องกันเลขทศนิยมยุ่งเหยิง
        const bonusAtk = Math.round(excess * 0.2);
        const bonusHit = Math.round(excess * 0.1);

        stats.atk = (stats.atk || 0) + bonusAtk;
        stats.hit = (stats.hit || 0) + bonusHit;
        stats.critDmg = critDmgCap;
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