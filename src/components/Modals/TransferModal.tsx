import { useState } from 'react';
import type { Item } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { TRANSFER_COSTS } from '../../data/transferConfig';

interface TransferModalProps {
    itemA: Item | null;
    inventory: Item[];
    onClose: () => void;
    onConfirmTransfer: (itemB: Item, statA: string, statB: string) => void;
    getRarityColor: (rarity: string) => string;
}

export const TransferModal = ({ itemA, inventory, onClose, onConfirmTransfer, getRarityColor }: TransferModalProps) => {
    const [step, setStep] = useState<'SELECT_STAT_A' | 'SELECT_TARGET_B' | 'SELECT_STAT_B'>('SELECT_STAT_A');
    const [selectedStatA, setSelectedStatA] = useState<string | null>(null);
    const [targetItemB, setTargetItemB] = useState<Item | null>(null);
    const [selectedStatB, setSelectedStatB] = useState<string | null>(null);
    const validTargets = inventory.filter(item => item.uid !== itemA?.uid && item.type === 'equipment');
    const availableStatsA = Object.entries(itemA?.stats || {}).filter(([_, v]) => v > 0);
    const materials = useGameStore((state) => state.player.materials);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const costA = (itemA && TRANSFER_COSTS[itemA.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS])
        ? TRANSFER_COSTS[itemA.rarity.toLowerCase() as keyof typeof TRANSFER_COSTS]
        : null;
    const costB = targetItemB ? TRANSFER_COSTS[targetItemB.rarity.toLowerCase()] : null;
    const actualSuccessRate = (costA && costB) ? Math.min(costA.successRate, costB.successRate) : 0;

    const activeMaterialsConfig = (costA && costB)
        ? (costA.successRate <= costB.successRate ? costA : costB) // ยิ่ง Success Rate น้อย ยิ่งแพง/ของสูง
        : (costA || costB);

    const hasEnough = activeMaterialsConfig ? activeMaterialsConfig.materials.every(req => {
        const playerHas = materials[req.id] || 0;
        return playerHas >= req.amount;
    }) : false;


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

                const result = useGameStore.getState().transferStats(itemA, targetItemB, selectedStatA, selectedStatB);

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
                        message: result?.message || "Transfer failed"
                    });
                } else {
                    setResultModal({
                        isOpen: true,
                        isSuccess: true,
                        itemAName: result.itemAName,
                        itemBName: result.itemBName,
                        removedStatA: result.removedStatA,
                        removedValA: result.removedValA,
                        gainedStatA: result.gainedStatA,
                        gainedValA: result.gainedValA,
                        removedStatB: result.removedStatB,
                        removedValB: result.removedValB,
                        gainedStatB: result.gainedStatB,
                        gainedValB: result.gainedValB,
                        message: result.message
                    });
                }
            }
        }, 50);
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-violet-700 p-6 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                {/* Header ที่โชว์ชื่อ */}
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


                {/* STEP 2: เลือก Item B */}
                {step === 'SELECT_TARGET_B' && (
                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
                        {[...validTargets].sort((a, b) => {
                            const order = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
                            return (order[b.rarity as keyof typeof order] || 0) - (order[a.rarity as keyof typeof order] || 0);
                        }).map((item) => (
                            <button
                                key={item.uid}
                                onClick={() => { setTargetItemB(item); setStep('SELECT_STAT_B'); setSelectedStatB(null); }}
                                className={`p-4 rounded-xl border-2 flex items-center gap-4 bg-slate-800 hover:bg-slate-750 transition-all group ${getRarityColor(item.rarity)}`}
                            >
                                {/* ไอคอน */}
                                <div className="w-12 h-12 flex-shrink-0 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700">
                                    <img src={item.icon} className="w-8 h-8 object-contain" />
                                </div>

                                {/* ข้อมูล */}
                                <div className="text-left flex-1">
                                    <div className="font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                                        {item.name}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(item.stats)
                                            .filter(([_, v]) => v > 0)
                                            .map(([stat, val]) => (
                                                <span key={stat} className="bg-slate-950/50 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-400 border border-slate-700/50">
                                                    {stat}: <span className="text-white">{val}</span>
                                                </span>
                                            ))}
                                        {Object.keys(item.stats).filter(k => (item.stats as any)[k] > 0).length === 0 && (
                                            <span className="text-[10px] text-slate-500 italic">No stats</span>
                                        )}
                                    </div>
                                </div>

                                {/* ลูกศรชี้เล็กๆ ให้ดูมี Interactive */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-emerald-500 font-bold text-lg">→</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}


                {/* STEP 3: เลือก Stat ปลายทางใน B */}
                {step === 'SELECT_STAT_B' && targetItemB && (
                    <div className="space-y-4">

                        {/* ส่วนแสดงค่าสถานะ (Success Rate & Materials Cost List) */}
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-700 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Success Rate:</span>
                                <span className={`font-bold ${actualSuccessRate < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                                    {actualSuccessRate}%
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-1">Required Materials:</span>
                                <div className="grid grid-cols-1 gap-1">
                                    {activeMaterialsConfig?.materials.map(req => {
                                        const currentAmount = materials[req.id] || 0;
                                        const isEnoughMat = currentAmount >= req.amount;
                                        return (
                                            <div key={req.id} className="flex justify-between items-center bg-slate-900 px-2 py-1 rounded">
                                                <span className="text-slate-300 uppercase">{req.id.replace('_', ' ')}</span>
                                                <span className={`font-bold ${isEnoughMat ? 'text-emerald-400' : 'text-red-500'}`}>
                                                    {currentAmount} / {req.amount}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* กล่อง Warning แนวนอน */}
                        <div className="bg-red-950/20 p-3 rounded-lg border border-red-500/30 flex items-center gap-3 shadow-lg">
                            <div className="text-amber-500 text-xl flex-shrink-0">⚠️</div>
                            <div className="text-[11px] text-white leading-tight flex-1">
                                <span className="font-bold text-red-400 mr-2 uppercase tracking-tight">Critical Warning:</span>
                                If the transfer <span className="text-white font-bold bg-red-950 px-1 rounded">fails</span>,
                                both{" "}
                                <span className="text-white font-bold bg-red-950 px-1 rounded mx-1">
                                    {selectedStatA ? selectedStatA.toUpperCase() : 'STAT A'}
                                </span>
                                on <span className="text-white font-bold">{itemA.name}</span> and{" "}
                                <span className="text-white font-bold bg-red-950 px-1 rounded mx-1">
                                    {selectedStatB ? selectedStatB.toUpperCase() : 'SELECTED STAT'}
                                </span>
                                on <span className="text-white font-bold">{targetItemB?.name}</span> will be{" "}
                                <span className="text-white font-bold">lost permanently</span>.
                            </div>
                        </div>

                        {/* รายการ Stat ที่เลือกได้ */}
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(targetItemB.stats).filter(([_, v]) => v > 0).map(([stat, val]) => (
                                <button key={stat}
                                    onClick={() => setSelectedStatB(stat)}
                                    className={`p-2 border rounded-lg text-white font-bold flex justify-between text-xs transition-all ${selectedStatB === stat
                                        ? 'bg-emerald-600 border-emerald-400'
                                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                        }`}>
                                    <span>{stat.toUpperCase()}</span> <span>({val})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}



                {/* ปุ่ม Action */}
                <button
                    // เพิ่มเงื่อนไข !isProcessing เพื่อไม่ให้กดซ้ำตอนกำลังโหลด
                    onClick={handleBottomAction}
                    disabled={(step === 'SELECT_STAT_B' && (!selectedStatB || !hasEnough)) || isProcessing}
                    className={`w-full mt-6 py-3 rounded-lg font-bold transition-all relative overflow-hidden ${isProcessing
                        ? 'bg-slate-800 text-slate-400 cursor-wait'
                        : (step === 'SELECT_STAT_B' && selectedStatB
                            ? (hasEnough ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-900 text-red-300 cursor-not-allowed')
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
                        )
                        }`}
                >
                    {isProcessing ? (
                        <>
                            {/* แถบ Progress Bar */}
                            <div
                                className="absolute left-0 top-0 h-full bg-emerald-500/30 transition-all duration-75"
                                style={{ width: `${progress}%` }}
                            />
                            <span className="relative z-10 animate-pulse">PROCESSING {progress}%...</span>
                        </>
                    ) : (
                        <span>
                            {!hasEnough && step === 'SELECT_STAT_B' ? 'INSUFFICIENT MATERIALS' :
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
                            {resultModal.isSuccess ? 'SWAP SUCCESS' : 'SWAP FAILED'}
                        </h2>

                        <div className="text-slate-300 space-y-3 mb-6">
                            <p className="font-semibold text-base">{resultModal.message}</p>

                            {/* ฝั่ง Item A */}
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                                <div className="text-xs text-slate-400 mb-1 truncate">{resultModal.itemAName}</div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="uppercase font-bold text-red-400">- {resultModal.removedStatA}</span>
                                    <span className="text-slate-500 line-through">{resultModal.removedValA}</span>
                                </div>
                                {resultModal.isSuccess && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="uppercase font-bold text-emerald-400">+ {resultModal.gainedStatA}</span>
                                        <span className="text-emerald-400 font-bold">{resultModal.gainedValA}</span>
                                    </div>
                                )}
                            </div>

                            {/* ฝั่ง Item B */}
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                                <div className="text-xs text-slate-400 mb-1 truncate">{resultModal.itemBName}</div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="uppercase font-bold text-red-400">- {resultModal.removedStatB}</span>
                                    <span className="text-slate-500 line-through">{resultModal.removedValB}</span>
                                </div>
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