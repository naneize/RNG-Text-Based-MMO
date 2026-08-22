// store/battleStore.ts
import { create } from 'zustand';
import { calculateDamage, getEquippedBonus, getEffectiveStats } from '../utils/combat';
import { resolveEquipmentTraits, clearTraitCooldowns, type TraitContext } from '../data/equipmentTraits';
import { useAchievementStore } from './achievementStore';
import { useGameStore } from './gameStore';
import type { Stats, Player, Boss, Item } from '../types/game';
import { WEAKNESS_BONUS_RATE } from '../types/game';


interface ActiveBuff {
    type: 'ignoreDef' | 'critBoost' | 'stunBoss' | 'damageMitigation' | 'atkBoost' | 'regen';
    remainingRounds: number;
    value: number;
    name?: string;
    isNew?: boolean;
}

interface BattleLogEntry {
    text: string;
    type: 'player' | 'boss';
    isMiss?: boolean;
    isStun?: boolean;
    isCrit?: boolean;
}

interface BattleState {
    selectedBoss: Boss | null;
    bossEffectiveStats: Stats | null;
    finalStatsSnapshot: Stats | null;
    equippedItemsSnapshot: Player['equippedItems'] | null;
    playerHp: number;
    bossHp: number;
    isFighting: boolean;
    isFinished: boolean;
    isAutoFarm: boolean;
    battleLog: BattleLogEntry[];
    lastRewards: any[];
    rewardTick: number;
    newRollCapUnlocked: number | null;


    startBattle: (boss: Boss, finalStats: Stats, equippedItems: Player['equippedItems']) => void;
    setFighting: (value: boolean) => void;
    setAutoFarm: (value: boolean) => void;
    leaveBattle: () => void;
    toggleAutoFarm: () => void;
    clearRewards: () => void;

}

let battleIntervalId: ReturnType<typeof setInterval> | null = null;
let battleTimeoutId: ReturnType<typeof setTimeout> | null = null;
let activeBuffs: ActiveBuff[] = [];
let battleRound = 0; // ตัวนับรอบปัจจุบัน (1 tick = 1 รอบ) ใช้คำนวณ cooldown ของ trait

const clearBattleTimers = () => {
    if (battleIntervalId) clearInterval(battleIntervalId);
    if (battleTimeoutId) clearTimeout(battleTimeoutId);
    battleIntervalId = null;
    battleTimeoutId = null;
};

export const useBattleStore = create<BattleState>((set, get) => ({
    selectedBoss: null,
    bossEffectiveStats: null,
    finalStatsSnapshot: null,
    equippedItemsSnapshot: null,
    playerHp: 0,
    bossHp: 0,
    isFighting: false,
    isFinished: false,
    isAutoFarm: false,
    battleLog: [],
    lastRewards: [],
    rewardTick: 0,
    newRollCapUnlocked: null,

    clearRewards: () => set({ lastRewards: [], rewardTick: 0 }),

    toggleAutoFarm: () => set((state) => ({ isAutoFarm: !state.isAutoFarm })),

    startBattle: (boss, finalStats, equippedItems) => {
        clearBattleTimers();
        activeBuffs = [];
        battleRound = 0;
        clearTraitCooldowns();

        set({ lastRewards: [], rewardTick: 0 });

        const bossEffectiveStats = getEffectiveStats(boss.stats);

        set({
            selectedBoss: boss,
            bossEffectiveStats,
            finalStatsSnapshot: finalStats,
            equippedItemsSnapshot: equippedItems,
            playerHp: finalStats.maxHp || 100,
            bossHp: bossEffectiveStats.maxHp,
            isFighting: true,
            isFinished: false,
            battleLog: [],
        });

        battleIntervalId = setInterval(() => runBattleTick(get, set), 1000);
    },

    setFighting: (value) => {
        const state = get();
        if (value && !state.isFinished) {
            if (!battleIntervalId) {
                battleIntervalId = setInterval(() => runBattleTick(get, set), 1000);
            }
            set({ isFighting: true });
        } else {
            clearBattleTimers();
            set({ isFighting: false });
        }
    },

    setAutoFarm: (value) => set({ isAutoFarm: value }),

    leaveBattle: () => {
        clearBattleTimers();
        activeBuffs = [];
        battleRound = 0;
        clearTraitCooldowns();
        set({
            selectedBoss: null,
            bossEffectiveStats: null,
            finalStatsSnapshot: null,
            equippedItemsSnapshot: null,
            isFighting: false,
            isFinished: false,
            battleLog: [],
        });
    },
}));

function runBattleTick(get: () => BattleState, set: (partial: Partial<BattleState>) => void) {
    const state = get();
    const { selectedBoss, bossEffectiveStats, finalStatsSnapshot, equippedItemsSnapshot } = state;
    if (!selectedBoss || !bossEffectiveStats || !finalStatsSnapshot || !equippedItemsSnapshot) return;
    if (state.bossHp <= 0 || state.playerHp <= 0) return;

    battleRound += 1;

    useAchievementStore.getState().checkCondition('CHECK_FIRST_BATTLE');

    const playerWeapon = equippedItemsSnapshot.weapon;
    const isMatchWeakness = playerWeapon?.weaponType && (selectedBoss as any).weakness === playerWeapon.weaponType;
    const weaponWeaknessPercent = isMatchWeakness ? WEAKNESS_BONUS_RATE : 0;

    const itemsArray = Object.values(equippedItemsSnapshot).filter((item): item is Item => item !== null);
    const bonuses = getEquippedBonus(itemsArray, selectedBoss);
    const itemElementPercent = bonuses.elementPercent / 100;

    const skill1 = equippedItemsSnapshot.skill1;
    const skill2 = equippedItemsSnapshot.skill2;
    let activeSkill = skill1 || skill2;
    if (skill1 && skill2) activeSkill = Math.random() < 0.5 ? skill1 : skill2;

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
        elementPercent: finalSkillElementBonus,
    } : undefined;

    let totalElementPercent = itemElementPercent;
    let totalRacePercent = bonuses.racePercent / 100;

    const ignoreDefBuff = activeBuffs.find(b => b.type === 'ignoreDef' && b.remainingRounds > 0);
    const currentArmorPiercePercent = ignoreDefBuff ? ignoreDefBuff.value : 0;

    const critBoostBuff = activeBuffs.find(b => b.type === 'critBoost' && b.remainingRounds > 0);
    const attackerStatsForThisTurn = critBoostBuff
        ? { ...finalStatsSnapshot, critRate: (finalStatsSnapshot.critRate || 0) + critBoostBuff.value }
        : finalStatsSnapshot;

    const playerResult = calculateDamage(
        attackerStatsForThisTurn,
        bossEffectiveStats,
        {
            flatBonus: 0,
            elementPercent: totalElementPercent,
            racePercent: totalRacePercent,
            weaponWeaknessPercent,
            armorPiercePercent: currentArmorPiercePercent,
        },
        false,
        skillData,
        state.playerHp,
        finalStatsSnapshot.maxHp,
        selectedBoss.element,
        selectedBoss.race
    );



    let dmgToBoss = playerResult.isMiss ? 0 : playerResult.damage;
    let abilityLogText = '';
    let newPlayerHp = state.playerHp;

    // 0. Trigger on_turn_start traits (เช่น Regen HP จาก Cloak/Helm/Ring)
    const turnStartContext: TraitContext = {
        attacker: finalStatsSnapshot,
        defender: bossEffectiveStats,
        baseDamage: 0,
        playerHp: newPlayerHp,
        playerMaxHp: finalStatsSnapshot.maxHp || 100,
            currentRound: battleRound,
    };
    const turnStartTraits = resolveEquipmentTraits(equippedItemsSnapshot, 'on_turn_start', turnStartContext);
    if (turnStartTraits.healAmount && turnStartTraits.healAmount > 0) {
        newPlayerHp = Math.min(finalStatsSnapshot.maxHp || 100, newPlayerHp + turnStartTraits.healAmount);
    }

    if (!playerResult.isMiss) {
        useAchievementStore.getState().checkCondition('DEAL_DAMAGE', { damage: dmgToBoss });

        const attackContext: TraitContext = {
            attacker: finalStatsSnapshot,
            defender: bossEffectiveStats,
            baseDamage: dmgToBoss,
            playerHp: newPlayerHp,
            playerMaxHp: finalStatsSnapshot.maxHp || 100,
            currentRound: battleRound,
            isCrit: playerResult.isCrit,
            isMiss: playerResult.isMiss,
        };

        const attackTraits = resolveEquipmentTraits(equippedItemsSnapshot, 'on_attack', attackContext);
        const damageTraits = resolveEquipmentTraits(equippedItemsSnapshot, 'on_damage_dealt', attackContext);

        dmgToBoss += (attackTraits.extraDamage || 0) + (damageTraits.extraDamage || 0);

        const healAmount = (attackTraits.healAmount || 0) + (damageTraits.healAmount || 0);
        if (healAmount > 0) {
            newPlayerHp = Math.min(finalStatsSnapshot.maxHp || 1, newPlayerHp + healAmount);
        }
        abilityLogText = [turnStartTraits.log, attackTraits.log, damageTraits.log].filter(Boolean).join(' ');

        const newBuff = attackTraits.buff || damageTraits.buff;
        if (newBuff) {
            const existingIndex = activeBuffs.findIndex(b => b.type === newBuff.type);
            const buffData: ActiveBuff = {
                type: newBuff.type,
                name: newBuff.name,
                remainingRounds: newBuff.duration,
                value: newBuff.value,
                isNew: true
            };
            if (existingIndex >= 0) activeBuffs[existingIndex] = buffData;
            else activeBuffs.push(buffData);
        }
    } else if (turnStartTraits.log) {
        abilityLogText = turnStartTraits.log;
    }

    const nextBossHp = Math.max(0, state.bossHp - dmgToBoss);
    set({ playerHp: newPlayerHp, bossHp: nextBossHp });

    if (nextBossHp <= 0) {
        // ✅ ดึงค่า Cap เดิม (ถ้ายังไม่มีเริ่มที่ 300 ตามที่ผู้เล่นมีตอนเริ่มเกม)
        const oldRollCap = useGameStore.getState().player.unlockedRollCap || 300;

        // คำนวณ Cap ใหม่ให้ไต่ระดับจากบอสเลเวล 90 ไปจนถึง 200 และล็อกเพดานสูงสุดไว้ที่ไม่เกิน 900
        const calculatedCap = 350 + Math.floor(((selectedBoss.level - 90) / 110) * 550);
        const newRollCap = Math.min(Math.max(calculatedCap, oldRollCap), 900);

        const didUnlockIncrease = newRollCap > oldRollCap;

        // ✅ อัปเดต Roll Cap เฉพาะเมื่อค่าสูงขึ้นจริง
        if (didUnlockIncrease) {
            useGameStore.getState().unlockRollCap(newRollCap);
        }

        const rewards = useGameStore.getState().handleBossDefeated(selectedBoss);
        set({
            lastRewards: rewards,
            rewardTick: get().rewardTick + 1,
            newRollCapUnlocked: didUnlockIncrease ? newRollCap : null,
        });
        useAchievementStore.getState().checkCondition('BOSS_DEFEATED');

        // ถ้าเปิด Auto-Farm อยู่ ให้รีเซ็ตเลือดและเคลียร์รางวัล
        if (get().isAutoFarm) {
            set({
                bossHp: bossEffectiveStats.maxHp,
                playerHp: finalStatsSnapshot.maxHp || 100,
                lastRewards: []
            });
            return;
        } else {
            set({ isFighting: false, isFinished: true });
            clearBattleTimers();
            return;
        }
    }

    // --- จังหวะที่ 2: บอสตีสวนกลับ (หน่วง 200ms) ---
    battleTimeoutId = setTimeout(() => {
        const stunBuff = activeBuffs.find(b => b.type === 'stunBoss' && b.remainingRounds > 0);
        const bossResult = stunBuff
            ? { damage: 0, isMiss: true, isCrit: false, isSkillActive: false }
            : calculateDamage(bossEffectiveStats, finalStatsSnapshot);
        const baseDmgToPlayer = bossResult.isMiss ? 0 : bossResult.damage;

        let actualDmgToPlayer = baseDmgToPlayer;
        let traitDefendLog = '';
        let reflectDmgToBoss = 0;
        const currentState = get();
        let finalPlayerHp = currentState.playerHp;

        const defendContext: TraitContext = {
            attacker: bossEffectiveStats,
            defender: finalStatsSnapshot,
            baseDamage: baseDmgToPlayer,
            playerHp: finalPlayerHp,
            playerMaxHp: finalStatsSnapshot.maxHp || 100,
            currentRound: battleRound,
            isCrit: bossResult.isCrit,
            isMiss: bossResult.isMiss,
        };

        if (bossResult.isMiss) {
            // หลบการโจมตีได้ (on_dodge จาก Boots: Counter Attack / Crit Buff)
            const dodgeTraits = resolveEquipmentTraits(equippedItemsSnapshot, 'on_dodge', defendContext);
            if (dodgeTraits.extraDamage && dodgeTraits.extraDamage > 0) {
                reflectDmgToBoss += dodgeTraits.extraDamage;
            }
            if (dodgeTraits.buff) {
                const existingIndex = activeBuffs.findIndex(b => b.type === dodgeTraits.buff!.type);
                const buffData: ActiveBuff = {
                    type: dodgeTraits.buff.type,
                    name: dodgeTraits.buff.name,
                    remainingRounds: dodgeTraits.buff.duration,
                    value: dodgeTraits.buff.value,
                    isNew: true
                };
                if (existingIndex >= 0) activeBuffs[existingIndex] = buffData;
                else activeBuffs.push(buffData);
            }
            if (dodgeTraits.log) traitDefendLog += ` ${dodgeTraits.log}`;
        } else if (baseDmgToPlayer > 0) {
            // โดนโจมตี (on_take_damage จาก Armor/Shield: Damage Reduction, Thorns, Emergency Shield)
            const takeDmgTraits = resolveEquipmentTraits(equippedItemsSnapshot, 'on_take_damage', defendContext);

            if (takeDmgTraits.damageReductionPercent && takeDmgTraits.damageReductionPercent > 0) {
                const reduction = Math.floor(actualDmgToPlayer * (takeDmgTraits.damageReductionPercent / 100));
                actualDmgToPlayer = Math.max(1, actualDmgToPlayer - reduction);
            }
            if (takeDmgTraits.damageReductionFlat && takeDmgTraits.damageReductionFlat > 0) {
                actualDmgToPlayer = Math.max(1, actualDmgToPlayer - takeDmgTraits.damageReductionFlat);
            }

            if (takeDmgTraits.reflectDamage && takeDmgTraits.reflectDamage > 0) {
                reflectDmgToBoss += takeDmgTraits.reflectDamage;
            }

            finalPlayerHp = Math.max(0, finalPlayerHp - actualDmgToPlayer);

            if (takeDmgTraits.healAmount && takeDmgTraits.healAmount > 0) {
                finalPlayerHp = Math.min(finalStatsSnapshot.maxHp || 100, finalPlayerHp + takeDmgTraits.healAmount);
            }

            if (takeDmgTraits.log) traitDefendLog += ` ${takeDmgTraits.log}`;
        }

        // หักเลือดบอสถ้ามีดาเมจสะท้อน/สวนกลับ
        let currentBossHp = currentState.bossHp;
        if (reflectDmgToBoss > 0) {
            currentBossHp = Math.max(0, currentBossHp - reflectDmgToBoss);
        }

        const maxHpValue = finalStatsSnapshot.maxHp || 1;
        const hpPercent = (finalPlayerHp / maxHpValue) * 100;
        const isLowHpActive = Boolean(
            activeSkill?.skillCondition?.requiresLowHp &&
            hpPercent < (activeSkill.skillCondition.hpThreshold || 50)
        );

        const bonusTextParts: string[] = [];
        if (itemElementPercent > 0) bonusTextParts.push(`Elem+${Math.round(itemElementPercent * 100)}%`);
        const baseRacePercent = bonuses.racePercent / 100;
        if (baseRacePercent > 0) bonusTextParts.push(`Race+${Math.round(baseRacePercent * 100)}%`);
        if (weaponWeaknessPercent > 0) bonusTextParts.push(`Weakness+${WEAKNESS_BONUS_RATE * 100}%`);
        if (playerResult.isSkillActive) {
            if (finalSkillElementBonus > 0) bonusTextParts.push(`SkillElem+${Math.round(finalSkillElementBonus * 100)}%`);
            if (finalSkillRaceBonus > 0) bonusTextParts.push(`SkillRace+${Math.round(finalSkillRaceBonus * 100)}%`);
        }

        activeBuffs.forEach(buff => {
            if (buff.type !== 'stunBoss' && buff.remainingRounds > 0 && !buff.isNew) {
                const buffName = buff.name || buff.type;
                bonusTextParts.push(`[${buffName} Active! (${buff.remainingRounds} turns left)]`);
            }
        });

        const bonusText = bonusTextParts.length > 0 ? `(${bonusTextParts.join(' ')})` : '';

        const playerLog: BattleLogEntry = playerResult.isMiss
            ? { text: `You missed your attack on ${selectedBoss.name}!`, type: 'player', isMiss: true }
            : {
                text: `You dealt ${dmgToBoss} damage to ${selectedBoss.name} ${bonusText} ${playerResult.isCrit ? '(CRIT!)' : ''} ${playerResult.isSkillActive ? `[${activeSkill?.name} triggered!${isLowHpActive ? ' (Low HP +25% Dmg)' : ''}]` : ''} ${abilityLogText}`,
                type: 'player',
                isCrit: playerResult.isCrit
            };

        const bossLog: BattleLogEntry = stunBuff
            ? { text: `${selectedBoss.name} is stunned and cannot attack!`, type: 'boss', isStun: true }
            : bossResult.isMiss
                ? { text: `${selectedBoss.name} missed its attack!${traitDefendLog}`, type: 'boss', isMiss: true }
                : {
                    text: `${selectedBoss.name} dealt ${actualDmgToPlayer} damage to you ${bossResult.isCrit ? '(CRIT!)' : ''}${traitDefendLog}`,
                    type: 'boss',
                    isCrit: bossResult.isCrit
                };

        set({
            playerHp: finalPlayerHp,
            bossHp: currentBossHp,
            battleLog: [bossLog, playerLog, ...get().battleLog].slice(0, 10),
        });

        if (finalPlayerHp <= 0) {
            clearBattleTimers();
            set({ isFighting: false, isFinished: true, isAutoFarm: false });
        }

        // --- ลดจำนวนรอบ buff ท้ายเทิร์น ---
        activeBuffs = activeBuffs
            .map(b => {
                if (b.type === 'stunBoss') {
                    return { ...b, remainingRounds: b.remainingRounds - 1 };
                }
                if (b.isNew) {
                    const { isNew, ...rest } = b;
                    return rest;
                }
                return { ...b, remainingRounds: b.remainingRounds - 1 };
            })
            .filter(b => b.remainingRounds > 0);
    }, 200);
}