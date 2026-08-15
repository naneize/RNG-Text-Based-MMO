// store/battleStore.ts
import { create } from 'zustand';
import { calculateDamage, getEquippedBonus, getEffectiveStats } from '../utils/combat';
import { resolveWeaponAbility } from '../data/weaponAbilities';
import { useAchievementStore } from './achievementStore';
import { useGameStore } from './gameStore';
import type { Stats, Player, Boss, Item } from '../types/game';
import { WEAKNESS_BONUS_RATE } from '../types/game';


interface ActiveBuff {
    type: 'ignoreDef' | 'critBoost' | 'stunBoss';
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

    clearRewards: () => set({ lastRewards: [], rewardTick: 0 }),

    toggleAutoFarm: () => set((state) => ({ isAutoFarm: !state.isAutoFarm })),

    startBattle: (boss, finalStats, equippedItems) => {
        clearBattleTimers();
        activeBuffs = [];

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

    if (!playerResult.isMiss) {
        useAchievementStore.getState().checkCondition('DEAL_DAMAGE', { damage: dmgToBoss });

        const attackAbility = resolveWeaponAbility(playerWeapon, 'on_attack', finalStatsSnapshot, bossEffectiveStats, dmgToBoss);
        const damageAbility = resolveWeaponAbility(playerWeapon, 'on_damage', finalStatsSnapshot, bossEffectiveStats, dmgToBoss);

        dmgToBoss += attackAbility.extraDamage + damageAbility.extraDamage;

        const healAmount = (attackAbility.healAmount || 0) + (damageAbility.healAmount || 0);
        if (healAmount > 0) {
            newPlayerHp = Math.min(finalStatsSnapshot.maxHp || 1, state.playerHp + healAmount);
        }
        abilityLogText = [attackAbility.log, damageAbility.log].filter(Boolean).join(' ');

        const newBuff = attackAbility.buff || damageAbility.buff;
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
    }

    const nextBossHp = Math.max(0, state.bossHp - dmgToBoss);
    set({ playerHp: newPlayerHp, bossHp: nextBossHp });

    if (nextBossHp <= 0) {
        const rewards = useGameStore.getState().handleBossDefeated(selectedBoss);
        set({ lastRewards: rewards, rewardTick: get().rewardTick + 1 });
        useAchievementStore.getState().checkCondition('BOSS_DEFEATED'); // ✅ เพิ่มบรรทัดนี้

        // ถ้าเปิด Auto-Farm อยู่ ให้รีเซ็ตทั้งเลือดบอส เลือดผู้เล่น และเคลียร์ของรอบเก่าทันที
        if (get().isAutoFarm) {
            set({
                bossHp: bossEffectiveStats.maxHp,
                playerHp: finalStatsSnapshot.maxHp || 100, // 👈 เติมเลือดผู้เล่นให้เต็มที่นี่ด้วย!
                lastRewards: [] // 👈 เคลียร์รางวัลทันทีเพื่อไม่ให้ Modal เด้งค้างตอนเปลี่ยนหน้า
            });
            return; // ข้ามการตีสวนของบอสในเทิร์นที่ตาย
        } else {
            // ถ้าไม่ได้เปิด Auto-Farm ถึงจะหยุดการต่อสู้ตามปกติ
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
        const dmgToPlayer = bossResult.isMiss ? 0 : bossResult.damage;

        const currentState = get();
        const finalPlayerHp = dmgToPlayer > 0 ? Math.max(0, currentState.playerHp - dmgToPlayer) : currentState.playerHp;

        const maxHpValue = finalStatsSnapshot.maxHp || 1;
        const hpPercent = (finalPlayerHp / maxHpValue) * 100;
        const isLowHpActive = Boolean(
            activeSkill?.skillCondition?.requiresLowHp &&
            hpPercent < (activeSkill.skillCondition.hpThreshold || 50)
        );

        const bonusTextParts: string[] = [];
        if (itemElementPercent > 0) bonusTextParts.push(`Elem+${Math.round(itemElementPercent * 100)}%`); // ✅ ใช้ itemElementPercent ตรงๆ (เฉพาะจาก equipment) แทน totalElementPercent ที่โดนบวกสกิลไปแล้ว
        const baseRacePercent = bonuses.racePercent / 100;
        if (baseRacePercent > 0) bonusTextParts.push(`Race+${Math.round(baseRacePercent * 100)}%`);
        if (weaponWeaknessPercent > 0) bonusTextParts.push(`Weakness+${WEAKNESS_BONUS_RATE * 100}%`);
        if (playerResult.isSkillActive) {
            if (finalSkillElementBonus > 0) bonusTextParts.push(`SkillElem+${Math.round(finalSkillElementBonus * 100)}%`);
            if (finalSkillRaceBonus > 0) bonusTextParts.push(`SkillRace+${Math.round(finalSkillRaceBonus * 100)}%`);
        }

        // แสดงผล Active Buff ต่างๆ ใน Log (ข้ามบัฟที่เป็น isNew ในเทิร์นนี้)
        activeBuffs.forEach(buff => {
            if (buff.type !== 'stunBoss' && buff.remainingRounds > 0 && !buff.isNew) {
                const buffName = buff.name || buff.type;
                // จัดรูปแบบให้แยกส่วนข้อความหรือระบุชัดเจน
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
                ? { text: `${selectedBoss.name} missed its attack!`, type: 'boss', isMiss: true }
                : {
                    text: `${selectedBoss.name} dealt ${dmgToPlayer} damage to you ${bossResult.isCrit ? '(CRIT!)' : ''}`,
                    type: 'boss',
                    isCrit: bossResult.isCrit
                };

        set({
            playerHp: finalPlayerHp,
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