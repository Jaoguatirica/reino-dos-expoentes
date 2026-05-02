import type { BalanceConfig } from '@reino/game-core';

export const defaultGameBalance: BalanceConfig = {
  playerMaxHp: 100,
  enemyMaxHp: 100,
  missionTarget: 6,
  baseCorrectDamage: 17,
  comboCorrectDamage: 21,
  comboThreshold: 2,
  wrongAnswerDamage: 20,
  shieldWrongAnswerDamage: 5,
  timeoutDamage: 10,
  manaMax: 150,
  manaStart: 0,
  manaCorrectGain: 5,
  manaComboGain: 4,
};
