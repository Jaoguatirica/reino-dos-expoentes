import type { GameState } from './types';
import { itemsRegistry } from './items';

export interface DamageResult {
  amount: number;
  isCritical: boolean;
}

export function getCorrectAnswerDamage(combo: number, state: GameState): DamageResult {
  let base = combo >= state.balance.comboThreshold ? state.balance.comboCorrectDamage : state.balance.baseCorrectDamage;
  let isCritical = false;
  
  if (state.inventory.equippedWeapon) {
    const weaponDef = itemsRegistry[state.inventory.equippedWeapon];
    if (weaponDef && weaponDef.category === 'weapon') {
      base += weaponDef.baseDamage;
      
      // Passives & Crits
      if (weaponDef.family === 'katana') {
        const critChance = weaponDef.rarity === 'common' ? 0.15 : weaponDef.rarity === 'rare' ? 0.25 : 0.4;
        if (Math.random() < critChance) {
          base *= 2;
          isCritical = true;
        }
      }
      
      if (weaponDef.family === 'sword' && combo > 0) {
        base += 12 + combo * 3; // Buffed sword combo scaling
      }

      if (weaponDef.family === 'axe') {
        // Axes have a small chance for a "Crushing Blow" (Critical)
        if (Math.random() < 0.1) {
          base *= 2.5;
          isCritical = true;
        } else {
          base *= 1.35;
        }
      }

      if (weaponDef.family === 'dagger') {
        // Daggers hit fast, count as critical if they "backstab"
        if (Math.random() < 0.3) {
          base *= 1.8;
          isCritical = true;
        }
      }

      if (weaponDef.family === 'bow') {
        const missionProgress = state.missionCurrent / state.balance.missionTarget;
        if (missionProgress > 0.8 && Math.random() < 0.5) {
          base *= 2.2;
          isCritical = true;
        } else {
          base += (missionProgress * 25);
        }
      }
    }
  }

  return {
    amount: Math.round(base),
    isCritical
  };
}

export function getWrongAnswerDamage(state: GameState): number {
  // Scale enemy damage with level to make enemies stronger each phase.
  const levelScale = 1 + (state.currentLevelIndex * 0.15); // +15% damage per level
  let damage = Math.round(state.balance.wrongAnswerDamage * levelScale);

  if (state.inventory.equippedArmor) {
    const armorDef = itemsRegistry[state.inventory.equippedArmor];
    if (armorDef && armorDef.category === 'armor') {
      damage = Math.max(5, damage - armorDef.defense);
    }
  }

  return Math.max(1, damage);
}

export function hasPlayerLost(state: GameState): boolean {
  return state.playerHp <= 0;
}

export function hasEnemyLost(state: GameState): boolean {
  return state.enemyHp <= 0;
}
