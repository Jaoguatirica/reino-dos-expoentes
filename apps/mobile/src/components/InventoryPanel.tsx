import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import type { GameState, EquipmentSlot } from '@reino/game-core';
import { itemsRegistry } from '@reino/game-core';
import { colors, spacing } from '../theme/tokens';

interface InventoryPanelProps {
  state: GameState;
  actions: {
    equipItem: (index: number, slot: EquipmentSlot) => void;
    unequipItem: (slot: EquipmentSlot) => void;
    discardItem: (index: number) => void;
    useConsumable: (index: number) => void;
  };
}



function ItemIcon({ icon, size = 24 }: { icon: string; size?: number }) {
  const isImageUrl = icon.startsWith('assets/') || icon.startsWith('http');
  if (isImageUrl) {
    // Basic mapping for mobile assets
    const iconPath = icon.split('/').pop();
    return <Image source={{ uri: icon }} style={{ width: size, height: size, resizeMode: 'contain' }} />;
  }
  return <Text style={{ fontSize: size }}>{icon}</Text>;
}

export function InventoryPanel({ state, actions }: InventoryPanelProps) {
  const { inventory } = state;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    if (inventory.items[index]) {
      setSelectedIdx(index);
    }
  };

  const selectedItem = selectedIdx !== null ? itemsRegistry[inventory.items[selectedIdx] || ''] : null;

  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>EQUIPAMENTOS ATUAIS</Text>
      <View style={styles.equipmentGrid}>
        <EqSlot label="Arma" itemId={inventory.equippedWeapon} onPress={() => inventory.equippedWeapon && actions.unequipItem('weapon')} />
        <EqSlot label="Armadura" itemId={inventory.equippedArmor} onPress={() => inventory.equippedArmor && actions.unequipItem('armor')} />
        <EqSlot label="Acess. 1" itemId={inventory.equippedAccessories[0]} onPress={() => inventory.equippedAccessories[0] && actions.unequipItem('accessory1')} />
        <EqSlot label="Acess. 2" itemId={inventory.equippedAccessories[1]} onPress={() => inventory.equippedAccessories[1] && actions.unequipItem('accessory2')} />
      </View>

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>MOCHILA DE ITENS</Text>
        <Text style={styles.capacity}>{inventory.items.filter(Boolean).length} / {inventory.maxSlots}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {inventory.items.map((itemId, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.slot, itemId ? styles.slotFilled : styles.slotEmpty, selectedIdx === idx && styles.slotSelected]}
            onPress={() => handleSlotClick(idx)}
          >
            {itemId ? (
              <View style={styles.itemContent}>
                <ItemIcon icon={itemsRegistry[itemId].icon} size={24} />
                <Text style={[styles.itemName, { color: getRarityColor(itemsRegistry[itemId].rarity) }]} numberOfLines={1}>{itemsRegistry[itemId].name}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Item Details Modal */}
      <Modal visible={selectedIdx !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedIdx(null)}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <View style={styles.detailsHeader}>
                  <ItemIcon icon={selectedItem.icon} size={48} />
                  <View>
                    <Text style={[styles.detailsName, { color: getRarityColor(selectedItem.rarity) }]}>{selectedItem.name}</Text>
                    <Text style={[styles.detailsRarity, { color: getRarityColor(selectedItem.rarity) }]}>{selectedItem.rarity.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.detailsDesc}>{selectedItem.description}</Text>

                <View style={styles.statsContainer}>
                  {selectedItem.category === 'weapon' && (
                    <>
                      <StatRow label="⚔️ Dano Base" value={selectedItem.baseDamage.toString()} />
                      <StatRow label="⚡ Habilidade" value={selectedItem.activeName} />
                      <StatRow label="💎 Custo Mana" value={selectedItem.activeManaCost.toString()} />
                      <Text style={styles.activeSkillDesc}><em>{selectedItem.activeDescription}</em></Text>
                    </>
                  )}
                  {selectedItem.category === 'armor' && <StatRow label="🛡️ Defesa" value={selectedItem.defense.toString()} />}
                  <StatRow label="🏷️ Tipo" value={selectedItem.category} />
                </View>

                <View style={styles.modalActions}>
                  {selectedItem.category === 'weapon' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { actions.equipItem(selectedIdx!, 'weapon'); setSelectedIdx(null); }}>
                      <Text style={styles.actionBtnText}>EQUIPAR ARMA</Text>
                    </TouchableOpacity>
                  )}
                  {selectedItem.category === 'armor' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { actions.equipItem(selectedIdx!, 'armor'); setSelectedIdx(null); }}>
                      <Text style={styles.actionBtnText}>EQUIPAR ARMADURA</Text>
                    </TouchableOpacity>
                  )}
                  {selectedItem.category === 'accessory' && (
                    <View style={styles.dualActions}>
                      <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => { actions.equipItem(selectedIdx!, 'accessory1'); setSelectedIdx(null); }}>
                        <Text style={styles.actionBtnText}>SLOT 1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => { actions.equipItem(selectedIdx!, 'accessory2'); setSelectedIdx(null); }}>
                        <Text style={styles.actionBtnText}>SLOT 2</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedItem.category === 'consumable' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { actions.useConsumable(selectedIdx!); setSelectedIdx(null); }}>
                      <Text style={styles.actionBtnText}>USAR ITEM</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionBtn, styles.discardBtn]} onPress={() => { actions.discardItem(selectedIdx!); setSelectedIdx(null); }}>
                    <Text style={styles.actionBtnText}>DESCARTAR</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function EqSlot({ label, itemId, onPress }: { label: string; itemId: string | null; onPress: () => void }) {
  const item = itemId ? itemsRegistry[itemId] : null;
  return (
    <TouchableOpacity style={[styles.eqSlot, item && styles.eqSlotFilled]} onPress={onPress}>
      {item ? (
        <View style={styles.itemContent}>
          <ItemIcon icon={item.icon} size={18} />
          <Text style={[styles.itemNameSmall, { color: getRarityColor(item.rarity) }]} numberOfLines={1}>{item.name}</Text>
        </View>
      ) : (
        <Text style={styles.eqSlotPlaceholder}>+</Text>
      )}
      <View style={styles.eqLabelContainer}>
        <Text style={styles.eqLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return '#d1d5db';
    case 'uncommon': return '#4ade80';
    case 'rare': return '#60a5fa';
    case 'epic': return '#a855f7';
    case 'legendary': return '#fbbf24';
    case 'mythic': return '#ef4444';
    default: return '#fff';
  }
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: colors.secondary, fontSize: 13, fontWeight: '900', letterSpacing: 1.5, opacity: 0.8 },
  capacity: { color: '#cfd0df', fontSize: 12, fontWeight: 'bold' },
  equipmentGrid: { flexDirection: 'row', gap: 12, marginVertical: 15 },
  eqSlot: { flex: 1, aspectRatio: 1, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  eqSlotFilled: { borderColor: colors.secondary, backgroundColor: 'rgba(33, 214, 199, 0.08)' },
  eqSlotPlaceholder: { color: 'rgba(255,255,255,0.1)', fontSize: 24 },
  eqLabelContainer: { position: 'absolute', bottom: -8, backgroundColor: '#1a1a2e', paddingHorizontal: 6, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  eqLabel: { color: '#fff', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 100 },
  slot: { width: '22%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
  slotEmpty: { borderStyle: 'dashed' },
  slotFilled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(0,0,0,0.2)' },
  slotSelected: { borderColor: colors.secondary, backgroundColor: 'rgba(33, 214, 199, 0.1)' },
  itemContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  itemIcon: { fontSize: 24 },
  itemIconSmall: { fontSize: 18 },
  itemName: { color: colors.text, fontSize: 7, fontWeight: 'bold', textAlign: 'center', marginTop: 2 },
  itemNameSmall: { color: colors.text, fontSize: 6, fontWeight: 'bold', textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  modalContent: { width: '100%', backgroundColor: '#1a1a2e', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  detailsIconLarge: { fontSize: 48 },
  detailsName: { fontSize: 22, fontWeight: 'bold' },
  detailsRarity: { fontSize: 12, fontWeight: '900', marginTop: 4 },
  detailsDesc: { color: '#a9adbd', fontSize: 15, marginBottom: 25, lineHeight: 22 },
  activeSkillDesc: { fontSize: 13, color: '#8b8ea0', backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  statsContainer: { marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  modalActions: { gap: 12 },
  dualActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  discardBtn: { backgroundColor: 'rgba(255,107,129,0.1)', borderWidth: 1, borderColor: '#ff6b81', marginTop: 10 },
});
