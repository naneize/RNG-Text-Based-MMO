interface MaterialModalProps {
    selectedMaterial: { name: string; amount: number };
    setSelectedMaterial: (mat: null) => void;
}

export const MaterialModal = ({ selectedMaterial, setSelectedMaterial }: MaterialModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMaterial(null)}>
            <div className="bg-slate-900 border-2 border-emerald-500 p-6 rounded-2xl w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>

                <h2 className="text-lg font-bold text-white mb-2">{selectedMaterial.name.toUpperCase()}</h2>

                <span className="inline-block bg-slate-800 text-emerald-400 text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest border border-emerald-900/50 mb-4">
                    MATERIALS
                </span>

                {/* ใส่ Path รูปภาพของคุณที่นี่ */}
                <img
                    src={`/Icons/Materials/${selectedMaterial.name.toLowerCase().replace(' ', '_')}.svg`}
                    alt={selectedMaterial.name}
                    className="w-20 h-20 mx-auto mb-4 object-contain"
                    onError={(e) => {
                        console.error("Image not found:", e.currentTarget.src); // เอาไว้เช็คใน Console ว่ามันไปเรียก Path ไหน
                        e.currentTarget.src = '/Icons/default_material.svg';
                    }}
                />

                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-6">
                    <div className="text-[10px] text-slate-400 uppercase">You Own</div>
                    <div className="text-2xl font-bold text-white">{selectedMaterial.amount}</div>
                </div>

                <button
                    onClick={() => setSelectedMaterial(null)}
                    className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-white transition-all"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
};