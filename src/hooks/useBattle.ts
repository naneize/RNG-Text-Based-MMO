import { useState, useEffect, useRef } from 'react';
import { calculateDamage, getEquippedBonus } from '../utils/combat';
import type { Stats, Player, Boss } from '../types/game';
import { WEAKNESS_BONUS_RATE } from '../types/game';
import { useAchievementStore } from '../store/achievementStore';
import { resolveWeaponAbility } from '../data/weaponAbilities';

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

    // ✅ เพิ่ม 2 บรรทัดนี้ — เก็บ buff ที่มีผลข้ามหลายรอบ (เช่น ignoreDef 3 รอบ)
    interface ActiveBuff { type: 'ignoreDef'; remainingRounds: number; value: number }
    const activeBuffsRef = useRef<ActiveBuff[]>([]);

    const playerWeapon = player.equippedItems['weapon'];
    const isMatchWeakness = playerWeapon?.weaponType && (selectedBoss as any).weakness === playerWeapon.weaponType;
    const weaponWeaknessPercent = isMatchWeakness ? WEAKNESS_BONUS_RATE : 0;

    const resetBattle = () => {
        setBossHp(bossEffectiveStats.maxHp);
        setPlayerHp(finalStats.maxHp || 100);
        playerHpRef.current = finalStats.maxHp || 100;
        bossHpRef.current = bossEffectiveStats.maxHp;
        activeBuffsRef.current = []; // ✅ เพิ่มบรรทัดนี้ — กัน buff ค้างข้ามการต่อสู้ครั้งใหม่
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

    // 🟢 ลูปการต่อสู้หลัก
    useEffect(() => {
        if (!isFighting || isFinished) return;

        const timer = setInterval(() => {
            // ถ้ายูนิตใดตายแล้ว ให้หยุด
            if (bossHpRef.current <= 0 || playerHpRef.current <= 0) return;


            // 1. คำนวณโบนัสจากไอเท็มสวมใส่ล้วนๆ (ไม่รวมสกิล)
            const itemsArray = Object.values(player.equippedItems).filter(item => item !== null);
            const bonuses = getEquippedBonus(itemsArray, selectedBoss);
            const itemElementPercent = bonuses.elementPercent / 100; // เช่น 6% จากผ้าคลุม = 0.06

            // 2. จัดการสกิล
            const skill1 = player.equippedItems.skill1;
            const skill2 = player.equippedItems.skill2;

            let activeSkill = skill1 || skill2;
            if (skill1 && skill2) {
                activeSkill = Math.random() < 0.5 ? skill1 : skill2;
            }

            const skillElementBonusPercent = activeSkill?.skillCondition?.elementBonusPercent || 0;
            const targetElementAgainst = activeSkill?.skillCondition?.elementBonusAgainst;
            const isElementMatch = targetElementAgainst && selectedBoss.element === targetElementAgainst;
            const finalSkillElementBonus = isElementMatch ? skillElementBonusPercent / 100 : 0;

            const skillRaceBonusPercent = activeSkill?.skillCondition?.raceBonusPercent || 0;
            const targetRaceAgainst = activeSkill?.skillCondition?.raceBonusAgainst;
            const isRaceMatch = targetRaceAgainst && selectedBoss.race === targetRaceAgainst;
            const finalSkillRaceBonus = isRaceMatch ? skillRaceBonusPercent / 100 : 0;

            const skillData = (activeSkill && typeof activeSkill === 'object') ? {
                effectChance: activeSkill.effectChance || 0,
                effectPower: activeSkill.effectPower || 0,
                name: activeSkill.name,
                skillCondition: activeSkill.skillCondition,
                elementPercent: finalSkillElementBonus
            } : undefined;

            // 3. เริ่มต้นให้การโจมตีคิดธาตุเฉพาะจากไอเท็มสวมใส่ก่อน
            let totalElementPercent = itemElementPercent;
            let totalRacePercent = (bonuses.racePercent / 100);

            // 🟢 เช็คจาก activeBuffsRef ที่เพิ่งอัปเดตมาสดๆ ร้อนๆ ใน Step 2
            const ignoreDefBuff = activeBuffsRef.current.find(b => b.type === 'ignoreDef' && b.remainingRounds > 0);
            const currentArmorPiercePercent = ignoreDefBuff ? ignoreDefBuff.value : 0;

            // ผู้เล่นโจมตีบอส
            const playerResult = calculateDamage(
                finalStats,
                bossEffectiveStats,
                {
                    flatBonus: 0,
                    elementPercent: totalElementPercent,
                    racePercent: totalRacePercent,
                    weaponWeaknessPercent: weaponWeaknessPercent,
                    armorPiercePercent: currentArmorPiercePercent // ✅ เพิ่มบรรทัดนี้
                },
                false,
                skillData,
                playerHpRef.current,
                finalStats.maxHp,
                selectedBoss.element,
                selectedBoss.race
            );

            if (playerResult.isSkillActive) {
                totalElementPercent += finalSkillElementBonus;
                totalRacePercent += finalSkillRaceBonus;
            }


            let dmgToBoss = playerResult.isMiss ? 0 : playerResult.damage;
            let abilityLogText = '';

            // --- จังหวะที่ 1: ผู้เล่นตีบอส + ฮีลเลือดทันที ---
            if (!playerResult.isMiss) {
                useAchievementStore.getState().checkCondition('DEAL_DAMAGE', { damage: dmgToBoss });

                const attackAbility = resolveWeaponAbility(playerWeapon, 'on_attack', finalStats, bossEffectiveStats, dmgToBoss);
                const damageAbility = resolveWeaponAbility(playerWeapon, 'on_damage', finalStats, bossEffectiveStats, dmgToBoss);

                dmgToBoss += attackAbility.extraDamage + damageAbility.extraDamage;

                const healAmount = (attackAbility.healAmount || 0) + (damageAbility.healAmount || 0);
                if (healAmount > 0) {
                    const healedHp = Math.min(finalStats.maxHp || 1, playerHpRef.current + healAmount);
                    playerHpRef.current = healedHp;
                    setPlayerHp(healedHp); // อัปเดต UI ให้เลือดเด้งขึ้นตรงนี้ทันที
                }
                const rawAbilityLog = [attackAbility.log, damageAbility.log].filter(Boolean).join(' ');
                abilityLogText = healAmount > 0
                    ? `${rawAbilityLog} (10% = +${healAmount} HP)`
                    : rawAbilityLog;

                // ✅ ถ้า ability สั่งเปิด buff ใหม่ (เช่น ignoreDef) ให้เพิ่ม/รีเฟรชระยะเวลา

                const newBuff = attackAbility.buff || damageAbility.buff;
                if (newBuff) {
                    const existingIndex = activeBuffsRef.current.findIndex(b => b.type === newBuff.type);
                    const buffData = {
                        type: newBuff.type,
                        remainingRounds: newBuff.duration,
                        value: newBuff.value,
                        isNew: true
                    } as ActiveBuff; // 🟢 เติม as ActiveBuff ตรงนี้

                    if (existingIndex >= 0) {
                        activeBuffsRef.current[existingIndex] = buffData;
                    } else {
                        activeBuffsRef.current.push(buffData);
                    }
                }
            }



            const nextBossHp = Math.max(0, bossHpRef.current - dmgToBoss);
            bossHpRef.current = nextBossHp;
            setBossHp(nextBossHp);


            // ตรวจสอบว่าบอสตายหรือยัง (ถ้าบอสตายแล้ว จบเกมทันที ไม่ต้องให้บอสตีสวน)
            if (bossHpRef.current <= 0) {
                setIsFinished(true);
                setIsFighting(false);
                return;
            }

            // --- จังหวะที่ 2: หน่วงเวลาเล็กน้อยเพื่อให้เห็นเลือดผู้เล่นเด้งฮีล แล้วบอสตีสวนกลับ ---
            setTimeout(() => {
                if (!isFighting || isFinished) return;

                const bossResult = calculateDamage(bossEffectiveStats, finalStats);
                const dmgToPlayer = bossResult.isMiss ? 0 : bossResult.damage;

                if (dmgToPlayer > 0) {
                    const finalPlayerHp = Math.max(0, playerHpRef.current - dmgToPlayer);
                    playerHpRef.current = finalPlayerHp;
                    setPlayerHp(finalPlayerHp);
                }

                // ตรวจสอบเงื่อนไข Low HP สำหรับแสดงใน Log
                const maxHpValue = finalStats.maxHp || 1;
                const hpPercent = (playerHpRef.current / maxHpValue) * 100;
                const isLowHpActive = Boolean(
                    activeSkill?.skillCondition?.requiresLowHp &&
                    hpPercent < (activeSkill.skillCondition.hpThreshold || 50)
                );

                // สร้าง Log การต่อสู้
                const bonusTextParts = [];
                if (totalElementPercent > 0) bonusTextParts.push(`Elem+${Math.round(totalElementPercent * 100)}%`);

                const baseRacePercent = bonuses.racePercent / 100;
                if (baseRacePercent > 0) bonusTextParts.push(`Race+${Math.round(baseRacePercent * 100)}%`);

                if (weaponWeaknessPercent > 0) bonusTextParts.push(`Weakness+${WEAKNESS_BONUS_RATE * 100}%`);

                if (playerResult.isSkillActive) {
                    if (finalSkillElementBonus > 0) bonusTextParts.push(`SkillElem+${Math.round(finalSkillElementBonus * 100)}%`);
                    if (finalSkillRaceBonus > 0) bonusTextParts.push(`SkillRace+${Math.round(finalSkillRaceBonus * 100)}%`);
                }

                if (ignoreDefBuff) {
                    // 🟢 แสดงผลรอบที่เหลือจริงตรงๆ
                    bonusTextParts.push(`, ArmorBreak Active! (${ignoreDefBuff.remainingRounds} turns left)`);
                }

                const bonusText = bonusTextParts.length > 0 ? `(${bonusTextParts.join(' ')})` : '';

                const playerLog = playerResult.isMiss
                    ? { text: `You missed your attack on ${selectedBoss.name}!`, type: 'player' as const }
                    : {
                        text: `You dealt ${dmgToBoss} damage to ${selectedBoss.name} ${bonusText} ${playerResult.isCrit ? '(CRIT!)' : ''}
    ${playerResult.isSkillActive ? `[${activeSkill?.name} triggered!${isLowHpActive ? ' (Low HP +25% Dmg)' : ''}]` : ''} 
    ${abilityLogText}`,
                        type: 'player' as const
                    };

                const bossLog = bossResult.isMiss
                    ? { text: `${selectedBoss.name} missed its attack!`, type: 'boss' as const }
                    : { text: `${selectedBoss.name} dealt ${dmgToPlayer} damage to you ${bossResult.isCrit ? '(CRIT!)' : ''}`, type: 'boss' as const };

                setBattleLog(prev => [playerLog, bossLog, ...prev].slice(0, 10));

                // ตรวจสอบว่าผู้เล่นตายหลังจากบอสตีสวนหรือไม่
                if (playerHpRef.current <= 0) {
                    setIsFinished(true);
                    setIsFighting(false);
                    setTimeout(() => onGameOver(), 1000);
                }
            }, 200);

            // ✅ ลดจำนวนรอบที่เหลือของทุก buff ลง 1 ท้ายรอบนี้ แล้วลบตัวที่หมดอายุออก
            // 🟢 [วางไว้ล่างสุดของ setInterval]
            // ลดรอบเฉพาะ Buff ที่ทำงานผ่านเทิร์นนี้ไปแล้ว
            // 🟢 ลดรอบเมื่อจบเทิร์น
            activeBuffsRef.current = activeBuffsRef.current
                .map(b => {
                    const buffWithFlag = b as typeof b & { isNew?: boolean };
                    if (buffWithFlag.isNew) {
                        delete buffWithFlag.isNew;
                        return b;
                    }
                    return { ...b, remainingRounds: b.remainingRounds - 1 };
                })
                .filter(b => b.remainingRounds > 0);

        }, 1000);

        return () => clearInterval(timer);
    }, [isFighting, isFinished, selectedBoss, finalStats, bossEffectiveStats, player.equippedItems, onGameOver]);

    return { battleLog, isFighting, setIsFighting, bossHp, playerHp, resetBattle };
};