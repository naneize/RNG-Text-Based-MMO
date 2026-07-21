import { useState, useEffect } from 'react';
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
    const [playerHp, setPlayerHp] = useState(finalStats.maxHp);
    const [isFinished, setIsFinished] = useState(false);

    const playerWeapon = player.equippedItems['weapon'];
    const isMatchWeakness = playerWeapon?.weaponType && (selectedBoss as any).weakness === playerWeapon.weaponType;
    const weaponWeaknessPercent = isMatchWeakness ? WEAKNESS_BONUS_RATE : 0;

    const hasWeaponWeakness = weaponWeaknessPercent > 0;

    const resetBattle = () => {
        setBossHp(bossEffectiveStats.maxHp);
        setPlayerHp(finalStats.maxHp);
        setBattleLog([]);
        setIsFinished(false);
        setIsFighting(false);
    };

    useEffect(() => {
        if (!isFighting || isFinished) return;

        const timer = setInterval(() => {
            // ใช้ฟังก์ชัน setState แบบ callback เพื่ออ่านค่าล่าสุดเสมอโดยไม่ต้องพึ่งพา Dependency
            setBossHp(prevBossHp => {
                if (prevBossHp <= 0) return 0;

                const itemsArray = Object.values(player.equippedItems).filter(item => item !== null);
                const bonuses = getEquippedBonus(itemsArray, selectedBoss);

                const hasElementBonus = bonuses.elementPercent > 0;
                const hasRaceBonus = bonuses.racePercent > 0;

                const bonusTextParts = [];
                if (hasElementBonus) bonusTextParts.push(`Elem+${bonuses.elementPercent}%`);
                if (hasRaceBonus) bonusTextParts.push(`Race+${bonuses.racePercent}%`);
                if (hasWeaponWeakness) bonusTextParts.push(`Weakness+${WEAKNESS_BONUS_RATE * 100}%`);

                const bonusText = bonusTextParts.length > 0 ? `(${bonusTextParts.join(' ')})` : '';

                const activeSkill = player.equippedItems.skill;
                const skillData = (activeSkill && typeof activeSkill === 'object') ? {
                    effectChance: activeSkill.effectChance || 0,
                    effectPower: activeSkill.effectPower || 0,
                    name: activeSkill.name
                } : undefined;

                const playerResult = calculateDamage(
                    finalStats,
                    bossEffectiveStats,
                    {
                        flatBonus: 0,
                        elementPercent: bonuses.elementPercent / 100,
                        racePercent: bonuses.racePercent / 100,
                        weaponWeaknessPercent: weaponWeaknessPercent // <--- เพิ่มตรงนี้เข้าไปครับ
                    },
                    false,
                    skillData
                );

                const bossResult = calculateDamage(bossEffectiveStats, finalStats);

                const dmgToBoss = playerResult.isMiss ? 0 : playerResult.damage;
                const dmgToPlayer = bossResult.isMiss ? 0 : bossResult.damage;

                // อัปเดต Player HP ภายในนี้
                setPlayerHp(prevPlayerHp => Math.max(0, prevPlayerHp - dmgToPlayer));

                // อัปเดต Log

                const playerLog = playerResult.isMiss
                    ? { text: `You missed your attack on ${selectedBoss.name}!`, type: 'player' as const }
                    : {
                        text: `You dealt ${dmgToBoss} damage to ${selectedBoss.name} ${bonusText} ${playerResult.isCrit ? '(CRIT!)' : ''} ${playerResult.isSkillActive ? `[${activeSkill?.name} triggered!]` : ''}`,
                        type: 'player' as const
                    };

                const bossLog = bossResult.isMiss
                    ? { text: `${selectedBoss.name} missed its attack!`, type: 'boss' as const }
                    : { text: `${selectedBoss.name} dealt ${dmgToPlayer} damage to you ${bossResult.isCrit ? '(CRIT!)' : ''}`, type: 'boss' as const }; setBattleLog(prev => [playerLog, bossLog, ...prev].slice(0, 10));

                return Math.max(0, prevBossHp - dmgToBoss);
            });
        }, 1000);

        return () => clearInterval(timer);
        // เอา bossHp, playerHp ออกจาก Dependency เพื่อป้องกันการ Re-run timer
    }, [isFighting, selectedBoss, finalStats, bossEffectiveStats, player.equippedItems]);

    useEffect(() => {
        if (isFinished) return; // ถ้าจบแล้วไม่ต้องทำอะไรอีก

        if (playerHp <= 0) {
            setIsFinished(true); // ล็อคไว้
            setIsFighting(false);
            const timeout = setTimeout(() => {
                onGameOver();
            }, 1000);
            return () => clearTimeout(timeout);
        }


    }, [playerHp, bossHp, onGameOver, selectedBoss, isFinished]);

    return { battleLog, isFighting, setIsFighting, bossHp, playerHp, resetBattle };
};