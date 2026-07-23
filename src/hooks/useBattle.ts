import { useState, useEffect, useRef } from 'react';
import { calculateDamage, getEquippedBonus } from '../utils/combat';
import type { Stats, Player, Boss } from '../types/game';
import { WEAKNESS_BONUS_RATE } from '../types/game';

export const useBattle = (
    player: Player,
    selectedBoss: Boss,
    finalStats: Stats,
    bossEffectiveStats: Stats,
    onGameOver: () => void
) => {
    const [battleLog, setBattleLog] = useState<{ text: string, type: 'player' | 'boss' }[]>([]);
    const [isFighting, setIsFighting] = useState(false);
    const [bossHp, setBossHp] = useState(bossEffectiveStats.maxHp);
    const [playerHp, setPlayerHp] = useState(finalStats.maxHp || 100);
    const [isFinished, setIsFinished] = useState(false);

    // 🟢 ใช้ Ref ควบคุมค่าเลือดผู้เล่นให้สดใหม่เสมอ ป้องกันปัญหา Stale Closure ใน setInterval
    const playerHpRef = useRef(playerHp);
    playerHpRef.current = playerHp;

    const bossHpRef = useRef(bossHp);
    bossHpRef.current = bossHp;

    const playerWeapon = player.equippedItems['weapon'];
    const isMatchWeakness = playerWeapon?.weaponType && (selectedBoss as any).weakness === playerWeapon.weaponType;
    const weaponWeaknessPercent = isMatchWeakness ? WEAKNESS_BONUS_RATE : 0;

    const resetBattle = () => {
        setBossHp(bossEffectiveStats.maxHp);
        setPlayerHp(finalStats.maxHp || 100);
        playerHpRef.current = finalStats.maxHp || 100;
        bossHpRef.current = bossEffectiveStats.maxHp;
        setBattleLog([]);
        setIsFinished(false);
        setIsFighting(false);
    };

    // จัดการอัปเดต Max HP เริ่มต้น
    useEffect(() => {
        if (finalStats.maxHp && finalStats.maxHp > 0) {
            setPlayerHp(prev => (prev === 0 || prev > finalStats.maxHp ? finalStats.maxHp : prev));
        }
    }, [finalStats.maxHp]);

    // 🟢 ลูปการต่อสู้หลักแยกออกมาชัดเจน ไม่ซ้อนทับกันมั่ว
    useEffect(() => {
        if (!isFighting || isFinished) return;

        const timer = setInterval(() => {
            // ถ้ายูนิตใดตายแล้ว ให้หยุด
            if (bossHpRef.current <= 0 || playerHpRef.current <= 0) return;

            // 1. คำนวณโบนัสจากไอเท็มสวมใส่ล้วนๆ (ไม่รวมสกิล)
            const itemsArray = Object.values(player.equippedItems).filter(item => item !== null);
            const bonuses = getEquippedBonus(itemsArray, selectedBoss);
            const itemElementPercent = bonuses.elementPercent / 100; // เช่น 6% จากผ้าคลุม = 0.06
            const totalRacePercent = (bonuses.racePercent / 100);

            // 2. จัดการสกิล
            const equippedSingleSkill = player.equippedItems['skill'];
            const skill1 = player.equippedItems.skill1;
            const skill2 = player.equippedItems.skill2;

            let activeSkill = equippedSingleSkill || skill1 || skill2;
            if (skill1 && skill2) {
                activeSkill = Math.random() < 0.5 ? skill1 : skill2;
            }

            const skillElementBonusPercent = activeSkill?.skillCondition?.elementBonusPercent || 0;
            const targetElementAgainst = activeSkill?.skillCondition?.elementBonusAgainst;
            const isElementMatch = targetElementAgainst && selectedBoss.element === targetElementAgainst;
            const finalSkillElementBonus = isElementMatch ? skillElementBonusPercent / 100 : 0;

            const skillData = (activeSkill && typeof activeSkill === 'object') ? {
                effectChance: activeSkill.effectChance || 0,
                effectPower: activeSkill.effectPower || 0,
                name: activeSkill.name,
                skillCondition: activeSkill.skillCondition,
                elementPercent: finalSkillElementBonus
            } : undefined;

            // 3. เริ่มต้นให้การโจมตีคิดธาตุเฉพาะจากไอเท็มสวมใส่ก่อน
            let totalElementPercent = itemElementPercent;

            // 2. บอสตีผู้เล่นก่อนเพื่อหาดาเมจและอัปเดตเลือดผู้เล่นทันที
            const bossResult = calculateDamage(bossEffectiveStats, finalStats);
            const dmgToPlayer = bossResult.isMiss ? 0 : bossResult.damage;

            const nextPlayerHp = Math.max(0, playerHpRef.current - dmgToPlayer);
            playerHpRef.current = nextPlayerHp;
            setPlayerHp(nextPlayerHp);

            // 3. ตรวจสอบเงื่อนไข Low HP จากเลือดปัจจุบันที่อัปเดตแล้ว
            const maxHpValue = finalStats.maxHp || 1;
            const hpPercent = (nextPlayerHp / maxHpValue) * 100;

            console.log("--- CLEAN HP CHECK ---", { nextPlayerHp, maxHpValue, hpPercent });

            const isLowHpActive = Boolean(
                activeSkill?.skillCondition?.requiresLowHp &&
                hpPercent < (activeSkill.skillCondition.hpThreshold || 50)
            );

            // 4. ผู้เล่นสวนกลับบอส
            const playerResult = calculateDamage(
                finalStats,
                bossEffectiveStats,
                {
                    flatBonus: 0,
                    elementPercent: totalElementPercent, // ส่งค่าพื้นฐานไปก่อน
                    racePercent: totalRacePercent,
                    weaponWeaknessPercent: weaponWeaknessPercent
                },
                false,
                skillData,
                nextPlayerHp,
                finalStats.maxHp,
                selectedBoss.element,
                selectedBoss.race
            );

            if (playerResult.isSkillActive) {
                totalElementPercent += finalSkillElementBonus;
            }

            const dmgToBoss = playerResult.isMiss ? 0 : playerResult.damage;
            const nextBossHp = Math.max(0, bossHpRef.current - dmgToBoss);
            bossHpRef.current = nextBossHp;
            setBossHp(nextBossHp);

            // 5. สร้าง Log การต่อสู้

            const bonusTextParts = [];
            if (totalElementPercent > 0) bonusTextParts.push(`Elem+${Math.round(totalElementPercent * 100)}%`);
            if (totalRacePercent > 0) bonusTextParts.push(`Race+${Math.round(totalRacePercent * 100)}%`);
            if (weaponWeaknessPercent > 0) bonusTextParts.push(`Weakness+${WEAKNESS_BONUS_RATE * 100}%`);
            const bonusText = bonusTextParts.length > 0 ? `(${bonusTextParts.join(' ')})` : '';

            const playerLog = playerResult.isMiss
                ? { text: `You missed your attack on ${selectedBoss.name}!`, type: 'player' as const }
                : {
                    text: `You dealt ${dmgToBoss} damage to ${selectedBoss.name} ${bonusText} ${playerResult.isCrit ? '(CRIT!)' : ''} ${playerResult.isSkillActive ? `[${activeSkill?.name} triggered!${isLowHpActive ? ' (Low HP +25% Dmg)' : ''}]` : ''}`,
                    type: 'player' as const
                };

            const bossLog = bossResult.isMiss
                ? { text: `${selectedBoss.name} missed its attack!`, type: 'boss' as const }
                : { text: `${selectedBoss.name} dealt ${dmgToPlayer} damage to you ${bossResult.isCrit ? '(CRIT!)' : ''}`, type: 'boss' as const };

            setBattleLog(prev => [playerLog, bossLog, ...prev].slice(0, 10));

            // ตรวจสอบเงื่อนไขจบเกมภายในลูป
            if (nextPlayerHp <= 0 || nextBossHp <= 0) {
                setIsFinished(true);
                setIsFighting(false);
                if (nextPlayerHp <= 0) {
                    setTimeout(() => onGameOver(), 1000);
                }
            }

        }, 1000);

        return () => clearInterval(timer);
    }, [isFighting, isFinished, selectedBoss, finalStats, bossEffectiveStats, player.equippedItems, onGameOver]);

    return { battleLog, isFighting, setIsFighting, bossHp, playerHp, resetBattle };
};