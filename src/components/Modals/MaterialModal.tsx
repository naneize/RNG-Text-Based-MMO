import React from 'react';

interface MaterialModalProps {
    selectedMaterial: { name: string; amount?: number; type?: string };
    setSelectedMaterial: (material: null) => void;
}

export const MaterialModal = ({ selectedMaterial, setSelectedMaterial }: MaterialModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedMaterial(null)}>
            {/* ปรับกล่อง Modal ให้เป็นธีม Dark Fantasy (slate + amber) */}
            <div className="bg-stone-900 border border-amber-600/40 p-6 rounded-2xl w-full max-w-xs text-center shadow-[0_0_30px_rgba(217,119,6,0.15)] relative overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* แสงเรืองแสงตกแต่งมุมกล่อง (Ornamental Glow) */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

                <h2 className="text-lg font-extrabold text-amber-400 mb-2 tracking-wider">{selectedMaterial.name.toUpperCase()}</h2>

                <span className="inline-block bg-amber-950/60 text-amber-300 text-[10px] font-extrabold px-3 py-0.5 rounded-md uppercase tracking-widest border border-amber-800/50 mb-4">
                    MATERIAL
                </span>

                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-md" />
                    <img
                        src={`./Icons/Materials/${selectedMaterial.name.toLowerCase().replace(/ /g, '_')}.png`}
                        alt={selectedMaterial.name}
                        className="w-28 h-28 mx-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative z-10"
                        onError={(e) => {
                            console.error("Image not found:", e.currentTarget.src);
                            e.currentTarget.src = './Icons/default_material.png';
                        }}
                    />
                </div>

                {selectedMaterial.amount !== undefined && (
                    <p className="text-xs text-amber-100 mb-5 font-mono">
                        Owned: <span className="text-amber-400 font-black text-sm">{selectedMaterial.amount}</span>
                    </p>
                )}

                <button
                    onClick={() => setSelectedMaterial(null)}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-2.5 rounded-xl font-extrabold transition-all duration-200 cursor-pointer text-xs uppercase tracking-widest shadow-[0_0_12px_rgba(217,119,6,0.3)] border border-amber-400"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
};