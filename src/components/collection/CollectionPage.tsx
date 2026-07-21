import React, { useState } from 'react';
import { itemLibrary } from '../../data/itemLibrary';
import { SKILL_POOL } from '../../data/skills'; // 1. นำเข้า SKILL_POOL
import { CollectionItem } from './CollectionItem';
import type { CollectionRecord } from '../../types/game';

interface Props {
    collectionData: CollectionRecord[];
}

const CATEGORIES = ['all', 'weapon', 'armor', 'shield', 'helm', 'boots', 'cloak', 'ring', 'necklace', 'skill', 'material'] as const;
type Category = typeof CATEGORIES[number];

export const CollectionPage = ({ collectionData }: Props) => {
    const [activeCategory, setActiveCategory] = useState<Category>('all');

    // 2. รวมรายการทั้งหมดเข้าด้วยกัน
    const allItems = [...itemLibrary, ...SKILL_POOL];

    // 3. กรองไอเทมจาก allItems
    const filteredLibrary = activeCategory === 'all'
        ? allItems
        : allItems.filter(item =>
            item.slot === activeCategory || item.type === activeCategory
        );

    // 4. คำนวณความคืบหน้าโดยใช้ allItems.length
    const totalCount = allItems.length;
    const unlockedCount = collectionData.filter(r => r.isUnlocked).length;
    const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    return (
        <div className="p-6 bg-slate-950 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-6 text-center text-cyan-400">ITEM COLLECTION</h1>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1 rounded-full text-xs font-bold uppercase transition ${activeCategory === cat ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="max-w-md mx-auto mb-8 bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div className="text-center text-slate-400 text-sm mb-8">
                <p>
                    COLLECTED: <span className="text-cyan-400 font-bold">{unlockedCount}</span>
                    <span className="mx-2 text-slate-600">/</span>
                    TOTAL: <span className="text-white font-bold">{totalCount}</span>
                </p>
                <p className="text-[10px] mt-1 uppercase tracking-widest">{Math.round(progress)}% COMPLETED</p>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-w-5xl mx-auto">
                {filteredLibrary.map((template) => {
                    const record = collectionData.find(r => r.itemId === template.id);

                    return (
                        <CollectionItem
                            key={template.id}
                            template={template}
                            record={record}
                            isUnlocked={!!record?.isUnlocked}
                        />
                    );
                })}
            </div>
        </div>
    );
};