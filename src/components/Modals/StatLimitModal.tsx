import { STAT_CAPS } from '../../utils/statCalculator';

interface StatLimitModalProps {
    onClose: () => void;
}



export const StatLimitModal = ({ onClose }: StatLimitModalProps) => {

    const conversionRules = [
        { name: 'CRIT RATE', cap: STAT_CAPS.critRate, effect: 'Excess converted to +0.3% Crit Dmg per 1.' },
        { name: 'CRIT DMG', cap: STAT_CAPS.critDmg, effect: 'Excess converted to +0.2 ATK and +0.1 HIT.' },
        { name: 'FLEE', cap: STAT_CAPS.flee, effect: 'Excess converted to +0.2 RES and +0.1 M.RES.' },
        { name: 'HIT', cap: STAT_CAPS.hit, effect: 'Excess converted to +0.2 ATK.' },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-purple-900 p-6 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-purple-400 font-bold text-lg mb-4 text-center border-b border-purple-900/30 pb-2">
                    STAT LIMITS & RULES
                </h3>

                {conversionRules.map((rule, i) => (
                    <div key={i} className="border-b border-slate-700/50 pb-2 last:border-none">
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                            <span className="text-slate-300">{rule.name}</span>
                            <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                                {/* เช็คชื่อถ้าเป็น CRIT RATE ให้ใส่ % ต่อท้าย */}
                                MAX: {rule.cap}{rule.name === 'CRIT RATE' ? '%' : ''}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-relaxed pl-2 border-l-2 border-purple-500/40">
                            {rule.effect}
                        </div>
                    </div>
                ))}

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-white text-xs font-bold border border-slate-700 transition-colors"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
};