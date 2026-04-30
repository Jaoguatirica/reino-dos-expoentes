import type { InventoryState } from './types';

export const initialInventory: InventoryState = {
  items: Array(30).fill(null),
  equippedWeapon: null,
  equippedArmor: null,
  equippedAccessories: [null, null],
  maxSlots: 30,
};
