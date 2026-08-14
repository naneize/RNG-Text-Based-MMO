import { useState } from 'react';
import type { Item, Stats } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { TRANSFER_COSTS, PROTECTION_COSTS } from '../../data/transferConfig';

interface TransferModalProps {
    itemA: Item | null;
    inventory: Item[];
    onClose: () => void;
    onConfirmTransfer: (itemB: Item, statA: keyof Stats, statB: keyof Stats) => void;
    getRarityColor: (rarity: string) => string;
}

export const TransferModal = ({ itemA, inventory, onClose, getRarityColor }: TransferModalProps) => {
    const [step, setStep] = useState<'SELECT_STAT_A' | 'SELECT_TARGET_B' | 'SELECT_STAT_B'>('SELECT_STAT_A');
    const [selectedStatA, setSelectedStatA] = useState<string | null>(null);
    const [targetItemB, setTargetItemB] = useState<Item | null>(null);
    const [selectedStatB, setSelectedStatB] = useState<string | null>(null);
    const [statSearchFilter, setStatSearchFilter] = useState<string>('ALL');
    const [textSearch] = useState<string>('');
    const validTargets = inventory.filter(item => item.uid !== itemA?.uid && item.type === 'equipment');
    const availableStatsA = Object.entries(itemA?.stats || {}).filter(([_, v]) => v > 0);
    const materials = useGameStore((state) => state.player.materials);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [protectA, setProtectA] = useState(false);
    const [protectB, setProtectB] = useState(false);

    const costA = (itemA && TRANSFER_COSTS[itemA.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS])
        ? TRANSFER_COSTS[itemA.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS]
        : null;
    const costB = targetItemB ? TRANSFER_COSTS[targetItemB.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS] : null;
    const actualSuccessRate = (costA && costB) ? Math.min(costA.successRate, costB.successRate) : 0;

    const activeMaterialsConfig = (costA && costB)
        ? (costA.successRate <= costB.successRate ? costA : costB) // ยิ่ง Success Rate น้อย ยิ่งแพง/ของสูง
        : (costA || costB);

    const hasEnough = activeMaterialsConfig ? activeMaterialsConfig.materials.every(req => {
        const playerHas = materials[req.id] || 0;
        return playerHas >= req.amount;
    }) : false;

    // ✅ ต้นทุน protection ของแต่ละฝั่ง (ว่างเปล่าถ้าไม่ได้ติ๊ก)
    const protectionCostA = protectA && itemA ? (PROTECTION_COSTS[itemA.rarity.toLowerCase()] || []) : [];
    const protectionCostB = protectB && targetItemB ? (PROTECTION_COSTS[targetItemB.rarity.toLowerCase()] || []) : [];

    // ✅ เช็คว่าพอทั้ง transfer cost + protection cost รวมกันไหม
    const hasEnoughWithProtection = (() => {
        if (!activeMaterialsConfig) return false;
        const combined = new Map<string, number>();
        [...activeMaterialsConfig.materials, ...protectionCostA, ...protectionCostB].forEach(m => {
            combined.set(m.id, (combined.get(m.id) || 0) + m.amount);
        });
        return Array.from(combined.entries()).every(([id, amount]) => (materials[id] || 0) >= amount);
    })();

    const [resultModal, setResultModal] = useState<{
        isOpen: boolean;
        isSuccess: boolean;
        itemAName: string;
        itemBName: string;
        removedStatA: string;
        removedValA: number;
        gainedStatA?: string;
        gainedValA?: number;
        removedStatB: string;
        removedValB: number;
        gainedStatB?: string;
        gainedValB?: number;
        protectedA?: boolean; // ✅ เพิ่ม
        protectedB?: boolean; // ✅ เพิ่ม
        message: string;
    } | null>(null);

    if (!itemA) return null;

    // ส่วนหัวข้อที่ปรับปรุงให้โชว์ชื่ออุปกรณ์
    const getHeaderText = () => {
        switch (step) {
            case 'SELECT_STAT_A': return `Select stat from ${itemA.name}`;
            case 'SELECT_TARGET_B': return 'Select target item';
            case 'SELECT_STAT_B': return `Select stat in ${targetItemB?.name} to replace`;
            default: return '';
        }
    };

    const handleBottomAction = () => {
        switch (step) {
            case 'SELECT_STAT_A':
                onClose();
                break;

            case 'SELECT_TARGET_B':
                setStep('SELECT_STAT_A');
                break;

            case 'SELECT_STAT_B':
                if (selectedStatB && targetItemB && selectedStatA) {
                    // เปลี่ยนจากการเรียกตรงๆ เป็นการเรียกผ่านฟังก์ชันที่ควบคุม Progress Bar
                    handleConfirmTransfer();

                    // อย่าเพิ่งสั่ง onClose() ตรงนี้ เพราะต้องรอให้มันโหลดเสร็จก่อน
                    // เดี๋ยวเราจะสั่ง onClose() ในฟังก์ชัน handleConfirmTransfer แทน
                } else {
                    setStep('SELECT_TARGET_B');
                }
                break;
        }
    };

    const handleConfirmTransfer = () => {
        setIsProcessing(true);
        let current = 0;

        const interval = setInterval(() => {
            current += 5;
            setProgress(current);

            if (current >= 100) {
                clearInterval(interval);
                setIsProcessing(false);
                setProgress(0);

                // ✅ ส่ง protectA, protectB เข้าไปด้วย
                const result = useGameStore.getState().transferStats(itemA, targetItemB, selectedStatA!, selectedStatB!, protectA, protectB);

                if (!result || !result.success) {
                    setResultModal({
                        isOpen: true,
                        isSuccess: false,
                        itemAName: result?.itemAName || itemA.name,
                        itemBName: result?.itemBName || targetItemB!.name,
                        removedStatA: result?.removedStatA || selectedStatA!,
                        removedValA: result?.removedValA ?? 0,
                        removedStatB: result?.removedStatB || selectedStatB!,
                        removedValB: result?.removedValB ?? 0,
                        protectedA: result?.protectedA ?? false, // ✅ เพิ่ม
                        protectedB: result?.protectedB ?? false, // ✅ เพิ่ม
                        message: result?.message || "Transfer failed"
                    });
                } else {
                    setResultModal({
                        isOpen: true,
                        isSuccess: true,
                        itemAName: result.itemAName ?? "",
                        itemBName: result.itemBName ?? "",
                        removedStatA: result.removedStatA ?? "",
                        removedValA: result.removedValA ?? 0,
                        gainedStatA: result.gainedStatA ?? "",
                        gainedValA: result.gainedValA ?? 0,
                        removedStatB: result.removedStatB ?? "",
                        removedValB: result.removedValB ?? 0,
                        gainedStatB: result.gainedStatB ?? "",
                        gainedValB: result.gainedValB ?? 0,
                        message: result.message ?? ""
                    });
                }
            }
        }, 50);


    };

    const getSuccessRateColor = (rate: number) => {
        if (rate >= 70) return 'text-emerald-400';
        if (rate >= 40) return 'text-amber-400';
        if (rate >= 20) return 'text-orange-400';
        return 'text-red-500 animate-pulse';
    };

    // 🔍 ดึงรายการ Stat ทั้งหมดที่มีอยู่ในไอเทมในกระเป๋า เพื่อมาทำปุ่ม Filter หรือ Dropdown
    const allAvailableStatsInInventory = Array.from(
        new Set(
            validTargets.flatMap(item => Object.entries(item.stats).filter(([_, v]) => v > 0).map(([s]) => s))
        )
    );

    // 🔍 กรองรายการไอเทมเป้าหมายตาม Stat และชื่อที่ค้นหา
    const filteredTargets = validTargets.filter(item => {
        const keyword = textSearch.toLowerCase();

        // เช็คว่าชื่อไอเทมมีคำที่พิมพ์ไหม หรือมี Stat ไหนที่ชื่อตรงกับคำที่พิมพ์ไหม
        const matchesText = item.name.toLowerCase().includes(keyword) ||
            Object.keys(item.stats).some(stat =>
                stat.toLowerCase().includes(keyword) &&
                (item.stats[stat as keyof typeof item.stats] ?? 0) > 0
            );

        const matchesStat = statSearchFilter === 'ALL' ||
            ((item.stats[statSearchFilter as keyof typeof item.stats] ?? 0) > 0);


        return matchesText && matchesStat;
    }).sort((a, b) => {
        const order = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
        return (order[b.rarity as keyof typeof order] || 0) - (order[a.rarity as keyof typeof order] || 0);
    });

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-violet-700 p-6 rounded-2xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>                {/* Header ที่โชว์ชื่อ */}
                <h2 className="text-white font-bold text-lg mb-6 text-center uppercase tracking-wider">
                    {getHeaderText()}
                </h2>

                {/* STEP 1: เลือก Stat จาก A */}
                {step === 'SELECT_STAT_A' && (
                    <div className="grid grid-cols-2 gap-2">
                        {availableStatsA.map(([stat, val]) => (
                            <button key={stat} onClick={() => { setSelectedStatA(stat); setStep('SELECT_TARGET_B'); }}
                                className="p-3 bg-slate-800 hover:bg-violet-900 border border-slate-700 rounded-lg flex justify-between text-white font-bold transition-all">
                                <span>{stat.toUpperCase()}</span> <span>+{val}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 2: เลือก Item B แบบเน้นค้นหาเฉพาะ Stat */}
                {step === 'SELECT_TARGET_B' && (
                    <div className="space-y-3">
                        {/* 🏷️ Quick Filter ปุ่มคลิกเลือก Stat ไวๆ + Dropdown */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 font-medium">Filter by Stat:</span>
                                <span className="text-[12px] text-slate-400 font-medium">
                                    {statSearchFilter === 'ALL' ? 'Showing All Stats' : `Filtered: ${statSearchFilter.toUpperCase()}`}
                                </span>
                            </div>

                            {/* แถบปุ่ม Quick Filter กดเลือก Stat ยอดฮิตได้ทันที */}
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800">
                                <button
                                    onClick={() => setStatSearchFilter('ALL')}
                                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${statSearchFilter === 'ALL'
                                        ? 'bg-violet-600 text-white shadow-[0_0_8px_rgba(124,58,237,0.4)]'
                                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    ALL
                                </button>
                                {allAvailableStatsInInventory.map(stat => (
                                    <button
                                        key={stat}
                                        onClick={() => setStatSearchFilter(stat)}
                                        className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-all ${statSearchFilter === stat
                                            ? 'bg-violet-600 text-white shadow-[0_0_8px_rgba(124,58,237,0.4)]'
                                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        {stat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* รายการไอเทมเป้าหมายที่กรองตาม Stat แล้ว */}
                        <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto pr-2 mt-2">
                            {filteredTargets.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-xs italic">
                                    No items found with this stat.
                                </div>
                            ) : (
                                filteredTargets.map((item) => (
                                    <button
                                        key={item.uid}
                                        onClick={() => { setTargetItemB(item); setStep('SELECT_STAT_B'); setSelectedStatB(null); }}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-4 bg-slate-800 hover:bg-slate-750 transition-all group ${getRarityColor(item.rarity)}`}
                                    >
                                        <div className="w-12 h-12 flex-shrink-0 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
                                            <img src={item.icon} className="w-8 h-8 object-contain" />
                                        </div>

                                        <div className="text-left flex-1">
                                            <div className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                                                {item.name}
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(item.stats)
                                                    .filter(([_, v]) => v > 0)
                                                    .map(([stat, val]) => (
                                                        <span key={stat} className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${stat === statSearchFilter ? 'bg-violet-950 text-violet-300 border-violet-500' : 'bg-slate-950/50 text-slate-400 border-slate-700/50'}`}>
                                                            {stat}: <span className="text-white">{val}</span>
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-emerald-500 font-bold text-lg">→</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}



                {/* STEP 3: เลือก Stat ปลายทางใน B (จัดระเบียบเป็น Grid 2 คอลัมน์) */}
                {step === 'SELECT_STAT_B' && targetItemB && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">

                        {/* 📌 คอลัมน์ซ้าย: Success Rate, Materials & Warning */}
                        <div className="space-y-3 md:col-span-2">
                            {/* ส่วนแสดงค่าสถานะ (Success Rate & Materials Cost List) */}
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-700 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-medium">Success Rate :</span>
                                    <span className={`font-bold text-sm tracking-wide ${getSuccessRateColor(actualSuccessRate)}`}>
                                        {actualSuccessRate}%
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 block mb-1 font-medium">
                                        Required Materials {(protectA || protectB) && <span className="text-sky-400">(Includes protection cost)</span>} :
                                    </span>
                                    <div className="grid grid-cols-1 gap-1">
                                        {(() => {
                                            // ✅ รวม transfer cost + protection cost ของทั้ง 2 ฝั่งเป็น map เดียว (บวกจำนวนถ้า id ซ้ำกัน)
                                            const combined = new Map<string, number>();
                                            (activeMaterialsConfig?.materials || []).forEach(m => {
                                                combined.set(m.id, (combined.get(m.id) || 0) + m.amount);
                                            });
                                            protectionCostA.forEach(m => {
                                                combined.set(m.id, (combined.get(m.id) || 0) + m.amount);
                                            });
                                            protectionCostB.forEach(m => {
                                                combined.set(m.id, (combined.get(m.id) || 0) + m.amount);
                                            });

                                            return Array.from(combined.entries()).map(([id, amount]) => {
                                                const currentAmount = materials[id] || 0;
                                                const isEnoughMat = currentAmount >= amount;
                                                // เช็คว่า material นี้มาจาก protection ล้วนๆ (ไม่ได้อยู่ใน transfer cost เดิม) เพื่อ badge แยกให้เห็นชัด
                                                const isFromProtectionOnly = !(activeMaterialsConfig?.materials || []).some(m => m.id === id);

                                                return (
                                                    <div key={id} className="flex justify-between items-center bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800/50">
                                                        <span className="text-slate-300 uppercase text-[11px] font-mono tracking-wider flex items-center gap-1">
                                                            {id.replace('_', ' ')}
                                                            {isFromProtectionOnly && <span className="text-sky-400 text-[9px]"></span>}
                                                        </span>
                                                        <span className={`font-bold font-mono text-[11px] ${isEnoughMat ? 'text-emerald-400' : 'text-red-500'}`}>
                                                            {currentAmount} / {amount}
                                                        </span>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* ✅ กล่อง Protection ใหม่ */}
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-sky-700/40 space-y-2">
                                <div className="text-xs font-semibold text-sky-300 mb-1">Protection (Optional):</div>

                                <label className="flex items-start justify-between text-xs cursor-pointer gap-2">
                                    <span className="text-slate-300 flex-1">
                                        Protect {itemA.name}
                                        <span className="block text-slate-500 text-[10px] mt-0.5">
                                            {protectionCostA.length > 0
                                                ? protectionCostA.map(m => `${m.id.replace('_', ' ')} x${m.amount}`).join(', ')
                                                : (PROTECTION_COSTS[itemA.rarity.toLowerCase()] || []).map(m => `${m.id.replace('_', ' ')} x${m.amount}`).join(', ')}
                                        </span>
                                    </span>
                                    <input type="checkbox" checked={protectA} onChange={(e) => setProtectA(e.target.checked)} className="mt-1" />
                                </label>

                                <label className="flex items-start justify-between text-xs cursor-pointer gap-2">
                                    <span className="text-slate-300 flex-1">
                                        Protect {targetItemB.name}
                                        <span className="block text-slate-500 text-[10px] mt-0.5">
                                            {protectionCostB.length > 0
                                                ? protectionCostB.map(m => `${m.id.replace('_', ' ')} x${m.amount}`).join(', ')
                                                : (PROTECTION_COSTS[targetItemB.rarity.toLowerCase()] || []).map(m => `${m.id.replace('_', ' ')} x${m.amount}`).join(', ')}
                                        </span>
                                    </span>
                                    <input type="checkbox" checked={protectB} onChange={(e) => setProtectB(e.target.checked)} className="mt-1" />
                                </label>
                            </div>

                            {/* กล่อง Warning — ✅ แก้ให้ตอบสนองตาม protectA/protectB */}
                            <div className="bg-red-950/20 p-3 rounded-lg border border-red-500/30 flex items-start gap-2.5 shadow-lg">
                                <div className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠️</div>
                                <div className="text-[11px] text-slate-300 leading-relaxed flex-1">
                                    <strong className="text-red-400 uppercase tracking-wide mr-1">
                                        Critical Warning:
                                    </strong>
                                    If the transfer <span className="text-red-400 font-bold underline">fails</span>,{" "}
                                    {protectA && protectB ? (
                                        <span className="text-emerald-400 font-bold">
                                            Both stats have been protected. No stats will be lost despite the failed transfer.
                                        </span>
                                    ) : (
                                        <>
                                            {!protectA && (
                                                <>
                                                    <strong className="text-white bg-red-900/50 px-1 py-0.5 rounded border border-red-700/50 font-mono text-[10px]">
                                                        {selectedStatA ? selectedStatA.toUpperCase() : 'STAT A'}
                                                    </strong>{" "}
                                                    will be <strong className="text-red-400 font-bold uppercase">lost permanently</strong>.{" "}
                                                </>
                                            )}
                                            {protectA && (
                                                <span className="text-emerald-400 font-semibold">
                                                    {selectedStatA?.toUpperCase()} is protected.{" "}
                                                </span>
                                            )}
                                            {!protectB && (
                                                <>
                                                    <strong className="text-white bg-red-900/50 px-1 py-0.5 rounded border border-red-700/50 font-mono text-[10px]">
                                                        {selectedStatB ? selectedStatB.toUpperCase() : 'SELECTED STAT'}
                                                    </strong>{" "}
                                                    will be <strong className="text-red-400 font-bold uppercase">lost permanently</strong>.
                                                </>
                                            )}
                                            {protectB && (
                                                <span className="text-emerald-400 font-semibold">
                                                    {selectedStatB?.toUpperCase()} is protected.
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>


                        </div>

                        {/* 📌 คอลัมน์ขวา: รายการ Stat ปลายทาง (จัดเรียงเป็น 2 คอลัมน์ย่อยด้านใน) */}
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700 flex flex-col h-full md:col-span-3">                            <span className="text-xs text-slate-400 font-medium mb-2 block">Select Stat to Overwrite :</span>
                            <div className="grid grid-cols-3 gap-2 content-start">
                                {Object.entries(targetItemB.stats).filter(([_, v]) => v > 0).map(([stat, val]) => (
                                    <button key={stat}
                                        onClick={() => setSelectedStatB(stat)}
                                        className={`p-2.5 border rounded-lg text-white font-bold flex justify-between items-center text-xs transition-all ${selectedStatB === stat
                                            ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                            : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                            }`}>
                                        <span className="truncate">{stat.toUpperCase()}</span>
                                        <span className="text-slate-300 ml-1">({val})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {/* ปุ่ม Action ด้านล่าง */}
                <button
                    onClick={handleBottomAction}
                    disabled={(step === 'SELECT_STAT_B' && (!selectedStatB || !hasEnoughWithProtection)) || isProcessing}
                    className={`w-full mt-6 py-3 rounded-lg font-bold transition-all relative overflow-hidden ${isProcessing
                        ? 'bg-slate-800 text-slate-400 cursor-wait'
                        : (step === 'SELECT_STAT_B' && selectedStatB
                            ? (hasEnoughWithProtection ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-900 text-red-300 cursor-not-allowed')
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                        )
                        }`}
                >
                    {isProcessing ? (
                        <>
                            <div
                                className="absolute left-0 top-0 h-full bg-emerald-500/30 transition-all duration-75"
                                style={{ width: `${progress}%` }}
                            />
                            <span className="relative z-10 animate-pulse">PROCESSING {progress}%...</span>
                        </>
                    ) : (
                        <span>
                            {!hasEnoughWithProtection && step === 'SELECT_STAT_B' ? 'INSUFFICIENT MATERIALS' :
                                (step === 'SELECT_STAT_A' ? 'CLOSE' :
                                    step === 'SELECT_TARGET_B' ? 'BACK' :
                                        selectedStatB ? 'CONFIRM TRANSFER' : 'SELECT STAT TO OVERWRITE')}
                        </span>
                    )}
                </button>
            </div>

            {resultModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
                    <div className={`bg-slate-800 border-2 p-6 rounded-xl w-full max-w-sm shadow-2xl ${resultModal.isSuccess ? 'border-emerald-500' : 'border-red-500'
                        }`}>
                        <h2 className={`text-xl font-bold mb-4 ${resultModal.isSuccess ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {resultModal.isSuccess ? 'TRANSFER SUCCESS' : 'TRANSFER FAILED'}
                        </h2>

                        <div className="text-slate-300 space-y-3 mb-6">
                            <p className="font-semibold text-base">{resultModal.message}</p>

                            {/* ฝั่ง Item A — ✅ แก้ให้เช็ค protectedA */}
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                                <div className="text-xs text-slate-400 mb-1 truncate">{resultModal.itemAName}</div>
                                {!resultModal.isSuccess && resultModal.protectedA ? (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="uppercase font-bold text-sky-400">{resultModal.removedStatA} PROTECTED</span>
                                        <span className="text-sky-400">{resultModal.removedValA}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="uppercase font-bold text-red-400">- {resultModal.removedStatA}</span>
                                        <span className="text-slate-500 line-through">{resultModal.removedValA}</span>
                                    </div>
                                )}
                                {resultModal.isSuccess && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="uppercase font-bold text-emerald-400">+ {resultModal.gainedStatA}</span>
                                        <span className="text-emerald-400 font-bold">{resultModal.gainedValA}</span>
                                    </div>
                                )}
                            </div>

                            {/* ฝั่ง Item B — ✅ แก้ให้เช็ค protectedB */}
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                                <div className="text-xs text-slate-400 mb-1 truncate">{resultModal.itemBName}</div>
                                {!resultModal.isSuccess && resultModal.protectedB ? (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="uppercase font-bold text-sky-400">{resultModal.removedStatB} PROTECTED</span>
                                        <span className="text-sky-400">{resultModal.removedValB}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="uppercase font-bold text-red-400">- {resultModal.removedStatB}</span>
                                        <span className="text-slate-500 line-through">{resultModal.removedValB}</span>
                                    </div>
                                )}
                                {resultModal.isSuccess && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="uppercase font-bold text-emerald-400">+ {resultModal.gainedStatB}</span>
                                        <span className="text-emerald-400 font-bold">{resultModal.gainedValB}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setResultModal(null);
                                if (resultModal.isSuccess) onClose();
                            }}
                            className={`w-full py-2 rounded-lg font-bold ${resultModal.isSuccess ? 'bg-emerald-600' : 'bg-red-800'
                                }`}
                        >
                            {resultModal.isSuccess ? 'GREAT!' : 'I UNDERSTAND'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};