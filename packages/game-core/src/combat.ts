import type { GameState } from './types';
import { itemsRegistry } from './items';

export function getCorrectAnswerDamage(combo: number, state: GameState): number {
  let base = combo >= state.balance.comboThreshold ? state.balance.comboCorrectDamage : state.balance.baseCorrectDamage;
  
  if (state.inventory.equippedWeapon) {
    const weaponDef = itemsRegistry[state.inventory.equippedWeapon];
    if (weaponDef && weaponDef.category === 'weapon') {
      base += weaponDef.baseDamage;
      
      // Passives & Crits
      if (weaponDef.family === 'katana') {
        const critChance = weaponDef.rarity === 'common' ? 0.1 : weaponDef.rarity === 'rare' ? 0.2 : 0.35;
        if (Math.random() < critChance) {
          base *= 2;
        }
      }
      
      if (weaponDef.family === 'sword' && combo > 0) {
        base += 10 + combo * 2; // Extra punch with combos
      }

      if (weaponDef.family === 'axe') {
        base *= 1.3; // Raw damage multiplier
      }

      if (weaponDef.family === 'dagger') {
        // Daggers could have a chance to hit twice
        if (Math.random() < 0.25) {
          base *= 1.5;
        }
      }

      if (weaponDef.family === 'bow') {
        // Bows deal more damage if mission is almost complete
        const missionProgress = state.missionCurrent / state.balance.missionTarget;
        base += (missionProgress * 20);
      }
    }
  }

  return Math.round(base);
}

export function getWrongAnswerDamage(state: GameState): number {
  let damage = state.balance.wrongAnswerDamage;

  if (state.inventory.equippedArmor) {
    const armorDef = itemsRegistry[state.inventory.equippedArmor];
    if (armorDef && armorDef.category === 'armor') {
      damage = Math.max(5, damage - armorDef.defense);
    }
  }

  return damage;
}

export function hasPlayerLost(state: GameState): boolean {
  return state.playerHp <= 0;
}

export function hasEnemyLost(state: GameState): boolean {
  return state.enemyHp <= 0;
}
