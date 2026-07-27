interface MaterialModalProps {
    selectedMaterial: { name: string; amount?: number; type?: string };
    setSelectedMaterial: (material: null) => void;
}

export const MaterialModal = ({ selectedMaterial, setSelectedMaterial }: MaterialModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMaterial(null)}>
            <div className="bg-slate-900 border-2 border-emerald-500 p-6 rounded-2xl w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>

                <h2 className="text-lg font-bold text-white mb-2">{selectedMaterial.name.toUpperCase()}</h2>

                <span className="inline-block bg-slate-800 text-emerald-400 text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest border border-emerald-900/50 mb-4">
                    MATERIAL
                </span>

                <img
                    src={`/Icons/Materials/${selectedMaterial.name.toLowerCase().replace(/ /g, '_')}.svg`}
                    alt={selectedMaterial.name}
                    className="w-20 h-20 mx-auto mb-4 object-contain"
                    onError={(e) => {
                        console.error("Image not found:", e.currentTarget.src);
                        e.currentTarget.src = '/Icons/default_material.svg';
                    }}
                />

                {selectedMaterial.amount !== undefined && (
                    <p className="text-xs text-slate-300 mb-4">
                        Owned: <span className="text-emerald-400 font-bold">{selectedMaterial.amount}</span>
                    </p>
                )}

                <button
                    onClick={() => setSelectedMaterial(null)}
                    className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-white transition-all mt-2"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
};