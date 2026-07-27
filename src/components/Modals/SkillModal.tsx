interface SkillModalProps {
    selectedSkill: { name: string; level?: number; type?: string };
    setSelectedSkill: (skill: null) => void;
}

export const SkillModal = ({ selectedSkill, setSelectedSkill }: SkillModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSkill(null)}>
            <div className="bg-slate-900 border-2 border-cyan-500 p-6 rounded-2xl w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>

                <h2 className="text-lg font-bold text-white mb-2">{selectedSkill.name.toUpperCase()}</h2>

                <span className="inline-block bg-slate-800 text-cyan-400 text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest border border-cyan-900/50 mb-4">
                    SKILL
                </span>

                <img
                    src={`/Icons/Skills/${selectedSkill.name.toLowerCase().replace(/ /g, '_')}.svg`}
                    alt={selectedSkill.name}
                    className="w-20 h-20 mx-auto mb-4 object-contain"
                    onError={(e) => {
                        console.error("Image not found:", e.currentTarget.src);
                        e.currentTarget.src = '/Icons/default_skill.svg';
                    }}
                />

                <button
                    onClick={() => setSelectedSkill(null)}
                    className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-white transition-all mt-2"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
};