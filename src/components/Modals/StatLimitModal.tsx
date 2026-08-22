import { STAT_CAPS } from '../../utils/statCalculator';

interface StatLimitModalProps {
    onClose: () => void;
}

export const StatLimitModal = ({ onClose }: StatLimitModalProps) => {
    const conversionRules = [
        { name: 'CRIT RATE', cap: STAT_CAPS.critRate, effect: 'Excess converted to +1 Crit Dmg per 1.' },
        { name: 'CRIT DMG', cap: STAT_CAPS.critDmg, effect: 'Excess converted to +0.2 ATK and +0.1 HIT.' },
        { name: 'FLEE', cap: STAT_CAPS.flee, effect: 'Excess converted to +0.2 RES and +0.1 M.RES.' },
        { name: 'HIT', cap: STAT_CAPS.hit, effect: 'Excess converted to +0.2 ATK.' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4" onClick={onClose}>
            <div className="bg-stone-950 border border-amber-900/80 p-6 rounded-2xl w-full max-w-sm shadow-2xl shadow-amber-950/40 text-amber-100" onClick={e => e.stopPropagation()}>

                {/* หัวข้อธีม Amber */}
                <h3 className="text-amber-400 font-extrabold text-base tracking-wider mb-4 text-center border-b border-amber-950 pb-2 uppercase">
                    Stat Limits & Rules
                </h3>

                <div className="space-y-3">
                    {conversionRules.map((rule, i) => (
                        <div key={i} className="border-b border-stone-800/80 pb-2.5 last:border-none">
                            <div className="flex justify-between items-center text-xs font-bold mb-1">
                                <span className="text-stone-300">{rule.name}</span>
                                <span className="text-amber-400 bg-stone-900 px-2 py-0.5 rounded text-[10px] border border-amber-950/80 font-mono">
                                    MAX: {rule.cap}{rule.name === 'CRIT RATE' ? '%' : ''}
                                </span>
                            </div>
                            {/* เส้นขอบซ้ายเปลี่ยนเป็นสี Amber ให้รับกับธีม */}
                            <div className="text-[10px] text-stone-400 leading-relaxed pl-2 border-l-2 border-amber-600/60">
                                {rule.effect}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ปุ่มปิดดีไซน์ใหม่ตามต้นแบบ */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-amber-900/80 rounded-xl text-amber-300 text-xs font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                >
                    Close
                </button>
            </div>
        </div>
    );
};