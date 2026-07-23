import { useState, useEffect } from 'react';
import { useCharacterDashboard } from '../../hooks/useCharacterDashboard';
import { CombineSection } from '../Modals/CombineSection';
import { CharacterStats } from './CharacterStats';
import { EquippedGear } from './EquippedGear';
import { InventorySection } from './InventorySection';
import { LootModal } from '../../components/Modals/LootedModal';
import { ItemDetailModal } from '../../components/Modals/ItemDetailModal';
import { MaterialModal } from '../../components/Modals/MaterialModal';
import { BonusDetailModal } from '../../components/Modals/BonusDetailModal';
import { TransferModal } from '../../components/Modals/TransferModal';
import { SalvageModal } from '../../components/Modals/SalvageModal';
import type { Item } from '../../types/game';



export const CharacterDashboard = () => {
    const {
        player, finalStats, statBreakdown, selectedItem, setSelectedItem, selectedMaterial, setSelectedMaterial,
        lootedItem, setLootedItem, filter, setFilter, showCombine, setShowCombine,
        showBonusModal, setShowBonusModal, isLooting, progress, synergyBonusList,
        getCombinedBonuses, getDropChance, handleLoot, slots, filterOptions,
        filteredInventory, getRarityColor, equippedItem, equipItem, unequipItem, transferItemStat,
        epicPity, legendPity
    } = useCharacterDashboard();

    const [itemA, setItemA] = useState<Item | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [itemToSalvage, setItemToSalvage] = useState<Item | null>(null);
    const [isAutoActive, setIsAutoActive] = useState(false);


    useEffect(() => {
        let autoTimer: number; // 👈 เปลี่ยนจาก NodeJS.Timeout เป็น number

        if (isAutoActive && !isLooting) {
            autoTimer = window.setTimeout(() => {
                handleLoot(true);
            }, 100);
        }

        return () => window.clearTimeout(autoTimer);
    }, [isAutoActive, isLooting, handleLoot]);


    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">
                <CharacterStats
                    player={player}
                    finalStats={finalStats}
                    statBreakdown={statBreakdown}
                    setShowBonusModal={setShowBonusModal}
                />
                <EquippedGear
                    player={player}
                    slots={slots}
                    getRarityColor={getRarityColor}
                    unequipItem={unequipItem}
                    synergyBonusList={synergyBonusList}
                    setShowCombine={setShowCombine}
                />
                <InventorySection
                    player={player}
                    filterOptions={filterOptions}
                    filter={filter}
                    setFilter={setFilter}
                    filteredInventory={filteredInventory}
                    setSelectedMaterial={setSelectedMaterial}
                    setSelectedItem={setSelectedItem}
                    getRarityColor={getRarityColor}
                    unequipItem={unequipItem}
                    isLooting={isLooting}
                    progress={progress}
                    handleLoot={handleLoot}
                    epicPity={epicPity}       // 👈 ส่งค่าตัวนี้ลงไปเพิ่ม
                    legendPity={legendPity}
                    isAutoActive={isAutoActive}       // 👈 เพิ่มตัวนี้
                    setIsAutoActive={setIsAutoActive} // 👈 และตัวนี้
                />

            </div>

            {showCombine && <CombineSection onClose={() => setShowCombine(false)} />}
            {lootedItem && (
                <LootModal
                    lootedItem={lootedItem}
                    setLootedItem={setLootedItem}
                    getDropChance={getDropChance}
                />
            )}
            {selectedItem && (
                <ItemDetailModal
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                    getRarityColor={getRarityColor}
                    getDropChance={getDropChance}
                    equippedInSlot={equippedItem}
                    equipItem={equipItem}
                    onTransferClick={() => {
                        setItemA(selectedItem);       // จำไว้ว่าชิ้นนี้คือชิ้นต้นทาง
                        setIsTransferModalOpen(true);  // เปิด Modal เลือกชิ้นที่ 2
                        setSelectedItem(null);        // ปิด Modal รายละเอียด
                    }}
                    onSalvageClick={(item) => {
                        setItemToSalvage(item);
                        setSelectedItem(null);
                    }}
                />
            )}

            {isTransferModalOpen && (
                <TransferModal
                    itemA={itemA}
                    inventory={filteredInventory}
                    getRarityColor={getRarityColor}
                    onClose={() => setIsTransferModalOpen(false)}
                    onConfirmTransfer={(itemB, statA, statB) => {
                        // เรียกใช้ฟังก์ชันที่สร้างขึ้น
                        transferItemStat(itemA!, itemB, statA, statB);

                        setIsTransferModalOpen(false);
                        // อาจเพิ่มการแจ้งเตือนหรือ Re-render หน้าจอถ้าจำเป็น
                    }}
                />
            )}

            {selectedMaterial && (
                <MaterialModal
                    selectedMaterial={selectedMaterial}
                    setSelectedMaterial={setSelectedMaterial}
                />
            )}
            {showBonusModal && (
                <BonusDetailModal
                    setShowBonusModal={setShowBonusModal}
                    getCombinedBonuses={getCombinedBonuses}
                    equippedItems={player.equippedItems}
                />
            )}

            {itemToSalvage && (
                <SalvageModal
                    item={itemToSalvage}
                    onClose={() => setItemToSalvage(null)}
                    getRarityColor={getRarityColor}
                />
            )}
        </div>
    );
};