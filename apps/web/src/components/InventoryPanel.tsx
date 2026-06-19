import { useState } from 'react';
import type { GameState, EquipmentSlot } from '@reino/game-core';
import { itemsRegistry } from '@reino/game-core';

interface InventoryPanelProps {
  state: GameState;
  actions: {
    equipItem: (index: number, slot: EquipmentSlot) => void;
    unequipItem: (slot: EquipmentSlot) => void;
    discardItem: (index: number) => void;
    useConsumable: (index: number) => void;
  };
}

export function InventoryPanel({ state, actions }: InventoryPanelProps) {
  const { inventory } = state;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    if (inventory.items[index]) {
      setSelectedIdx(index);
    } else {
      setSelectedIdx(null);
    }
  };

  const selectedItem = selectedIdx !== null ? itemsRegistry[inventory.items[selectedIdx] || ''] : null;

  return (
    <div className="inventory-panel">
      <div className="inventory-left">
        <div className="inventory-header">
          <h2 className="inventory-title">🎒 Meu Equipamento</h2>
        </div>

        <div className="equipment-area">
          <EqSlot label="Arma" itemId={inventory.equippedWeapon} onClick={() => inventory.equippedWeapon && actions.unequipItem('weapon')} />
          <EqSlot label="Armadura" itemId={inventory.equippedArmor} onClick={() => inventory.equippedArmor && actions.unequipItem('armor')} />
          <EqSlot label="Acessório 1" itemId={inventory.equippedAccessories[0]} onClick={() => inventory.equippedAccessories[0] && actions.unequipItem('accessory1')} />
          <EqSlot label="Acessório 2" itemId={inventory.equippedAccessories[1]} onClick={() => inventory.equippedAccessories[1] && actions.unequipItem('accessory2')} />
        </div>

        <div className="inventory-header">
          <h2 className="inventory-title">📦 Mochila</h2>
          <span className="inventory-capacity">{inventory.items.filter(Boolean).length} / {inventory.maxSlots}</span>
        </div>

        <div className="inventory-grid">
          {inventory.items.map((itemId, idx) => (
            <div 
              key={idx} 
              className={`inventory-slot ${itemId ? 'filled' : 'empty'} ${selectedIdx === idx ? 'selected' : ''}`}
              onClick={() => handleSlotClick(idx)}
            >
              {itemId && (
                <div className="item-content">
                  <span className="item-icon">{itemsRegistry[itemId].icon}</span>
                  <span className={`item-name-grid rarity-${itemsRegistry[itemId].rarity}`}>{itemsRegistry[itemId].name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="inventory-right">
        {selectedItem ? (
          <div className="item-details-panel">
            <div className="details-header">
              <span className="details-icon-large">{selectedItem.icon}</span>
              <div>
                <h3 className={`details-name rarity-${selectedItem.rarity}`}>{selectedItem.name}</h3>
                <span className={`details-rarity-label rarity-${selectedItem.rarity}`}>{selectedItem.rarity.toUpperCase()}</span>
              </div>
            </div>
            
            <p className="details-desc">{selectedItem.description}</p>
            
            <div className="details-stats-list">
              {selectedItem.category === 'weapon' && (
                <>
                  <div className="stat-row"><span>⚔️ Dano Base:</span> <strong>{selectedItem.baseDamage}</strong></div>
                  <div className="stat-row"><span>⚡ Habilidade:</span> <strong>{selectedItem.activeName}</strong></div>
                  <div className="stat-row"><span>💎 Custo Mana:</span> <strong>{selectedItem.activeManaCost}</strong></div>
                  <p className="active-skill-desc"><em>{selectedItem.activeDescription}</em></p>
                </>
              )}
              {selectedItem.category === 'armor' && (
                <div className="stat-row"><span>🛡️ Defesa:</span> <strong>{selectedItem.defense}</strong></div>
              )}
              <div className="stat-row"><span>🏷️ Categoria:</span> <strong>{selectedItem.category}</strong></div>
            </div>

            <div className="details-actions">
              {selectedItem.category === 'weapon' && (
                <button className="primary-button" onClick={() => { actions.equipItem(selectedIdx!, 'weapon'); setSelectedIdx(null); }}>Equipar Arma</button>
              )}
              {selectedItem.category === 'armor' && (
                <button className="primary-button" onClick={() => { actions.equipItem(selectedIdx!, 'armor'); setSelectedIdx(null); }}>Equipar Armadura</button>
              )}
              {selectedItem.category === 'accessory' && (
                <>
                  <button className="primary-button" onClick={() => { actions.equipItem(selectedIdx!, 'accessory1'); setSelectedIdx(null); }}>Equipar Slot 1</button>
                  <button className="primary-button" onClick={() => { actions.equipItem(selectedIdx!, 'accessory2'); setSelectedIdx(null); }}>Equipar Slot 2</button>
                </>
              )}
              {selectedItem.category === 'consumable' && (
                <button className="primary-button" onClick={() => { actions.useConsumable(selectedIdx!); setSelectedIdx(null); }}>Usar Item</button>
              )}
              <button className="secondary-button" onClick={() => { actions.discardItem(selectedIdx!); setSelectedIdx(null); }}>🗑️ Descartar</button>
            </div>
          </div>
        ) : (
          <div className="empty-selection-hint">
            <span style={{ fontSize: '48px', opacity: 0.2 }}>🔍</span>
            <p>Selecione um item para ver detalhes</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EqSlot({ label, itemId, onClick }: { label: string; itemId: string | null; onClick: () => void }) {
  const item = itemId ? itemsRegistry[itemId] : null;
  return (
    <div className={`eq-slot ${item ? 'filled' : ''}`} onClick={onClick}>
      {item ? (
        <div className="item-content">
          <span className="item-icon">{item.icon}</span>
          <span className={`item-name rarity-${item.rarity}`}>{item.name}</span>
        </div>
      ) : null}
      <span className="eq-slot-label">{label}</span>
    </div>
  );
}
