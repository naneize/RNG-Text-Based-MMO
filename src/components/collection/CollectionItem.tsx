import React, { useState } from 'react';
import type { ItemTemplate, CollectionRecord } from '../../types/game';
import { CollectionModal } from '../Modals/CollectionModal';

interface Props {
    template: ItemTemplate;
    record: CollectionRecord | undefined;
    isUnlocked: boolean;
}

export const CollectionItem = ({ template, record, isUnlocked }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${isUnlocked
                    ? 'bg-slate-800 border-cyan-500/50 hover:border-cyan-400 hover:bg-slate-700'
                    : 'bg-slate-900 border-slate-800 opacity-40 grayscale hover:opacity-60'
                    }`}
                onClick={() => isUnlocked && setIsModalOpen(true)}
            >
                <img
                    src={template.icon}
                    alt={template.name}
                    className={`w-12 h-12 mx-auto mb-2 transition-all ${!isUnlocked ? 'brightness-50' : ''}`}
                />

                {/* ชื่อไอเทม */}
                <h3 className={`text-[10px] font-bold text-center uppercase truncate ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                    {template.name}
                </h3>

                {/* จำนวนที่พบ วางไว้ใต้ชื่อแบบคลีนๆ */}
                {isUnlocked && record && (
                    <p className="text-[9px] text-center text-emerald-400 mt-0.5 font-bold">
                        FOUND: {record.foundCount}
                    </p>
                )}
            </div>

            {isModalOpen && (
                <CollectionModal
                    template={template}
                    record={record}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
};