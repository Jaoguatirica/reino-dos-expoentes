import { getCorrectAnswerDamage, getWrongAnswerDamage, hasEnemyLost, hasPlayerLost } from './combat';
import { event } from './events';
import { generateQuestion } from './questions';
import { initialInventory } from './inventory';
import { itemsRegistry } from './items';
import type { BalanceConfig, GameAction, GameEvent, GameState, LevelDefinition, EquipmentSlot } from './types';

export const defaultBalance: BalanceConfig = {
  playerMaxHp: 100,
  enemyMaxHp: 100,
  missionTarget: 5,
  baseCorrectDamage: 18,
  comboCorrectDamage: 24,
  comboThreshold: 2,
  wrongAnswerDamage: 15,
  shieldWrongAnswerDamage: 5,
  timeoutDamage: 10,
  manaMax: 100,
  manaStart: 0,
  manaCorrectGain: 8,
  manaComboGain: 12,
};

export function createInitialGameState(
  levels: LevelDefinition[],
  balance: BalanceConfig = defaultBalance,
): GameState {
  const initialInv = { ...initialInventory, items: [...initialInventory.items] };
  initialInv.items[0] = 'sword_common';
  initialInv.items[1] = 'potion_health_small';
  
  return {
    status: 'menu',
    levels,
    balance,
    currentLevelIndex: 0,
    playerHp: balance.playerMaxHp,
    mana: balance.manaStart,
    enemyHp: balance.enemyMaxHp,
    enemyMaxHp: balance.enemyMaxHp,
    currentQuestion: null,
    usedQuestionTexts: [],
    combo: 0,
    inventory: initialInv,
    missionCurrent: 0,
    lastEvents: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return startLevel(
        { ...state, status: 'playing', currentLevelIndex: 0, playerHp: state.balance.playerMaxHp, mana: state.balance.manaStart },
        [event('GAME_STARTED')],
      );
    case 'GENERATE_QUESTION':
      return withQuestion(state);
    case 'ANSWER':
      return answerQuestion(state, action.selected);
    case 'TIMEOUT':
      return timeoutQuestion(state);
    case 'NEXT_LEVEL':
      return nextLevel(state);
    case 'RESET_GAME':
      return createInitialGameState(state.levels, state.balance);
    case 'EQUIP_ITEM':
      return equipItem(state, action.inventoryIndex, action.slot);
    case 'UNEQUIP_ITEM':
      return unequipItem(state, action.slot);
    case 'DISCARD_ITEM':
      return discardItem(state, action.inventoryIndex);
    case 'USE_ACTIVE_SKILL':
      return useActiveSkill(state, action.slot);
    case 'USE_CONSUMABLE':
      return useConsumable(state, action.inventoryIndex);
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

function startLevel(state: GameState, introEvents: GameEvent[] = []): GameState {
  const lastEvents = [...introEvents, event('LEVEL_STARTED', { levelIndex: state.currentLevelIndex })];
  // Enemy HP scales with currentLevelIndex
  const scaledHp = Math.round(state.balance.enemyMaxHp * (1 + state.currentLevelIndex * 0.5));
  return withQuestion({
    ...state,
    status: 'playing',
    enemyHp: scaledHp,
    enemyMaxHp: scaledHp,
    missionCurrent: 0,
    usedQuestionTexts: [],
    lastEvents,
  }, lastEvents);
}

function withQuestion(state: GameState, lastEvents: GameEvent[] = []): GameState {
  if (state.status !== 'playing') return state;

  const usedQuestionTexts = state.usedQuestionTexts ?? [];
  const currentQuestion = generateQuestion(state.levels[state.currentLevelIndex], Math.random, usedQuestionTexts);

  return {
    ...state,
    currentQuestion,
    usedQuestionTexts: [...usedQuestionTexts, currentQuestion.text],
    lastEvents,
  };
}

function answerQuestion(state: GameState, selected: number): GameState {
  if (state.status !== 'playing' || !state.currentQuestion) return state;

  if (selected === state.currentQuestion.correctValue) {
    const combo = state.combo + 1;
    const { amount: damage, isCritical } = getCorrectAnswerDamage(combo, state);
    const manaGain = combo >= state.balance.comboThreshold ? state.balance.manaComboGain : state.balance.manaCorrectGain;
    const mana = Math.min(state.balance.manaMax, state.mana + manaGain);
    const manaGained = mana - state.mana;
    
    // Drop logic on every hit
    const { newInventory, dropEvent } = tryDropItem(state);

    const nextState: GameState = {
      ...state,
      combo,
      missionCurrent: Math.min(state.balance.missionTarget, state.missionCurrent + 1),
      enemyHp: Math.max(0, state.enemyHp - damage),
      mana,
      inventory: newInventory,
      lastEvents: [
        event('ANSWER_CORRECT', { combo, damage, isCritical }), 
        ...(manaGained > 0 ? [event('MANA_GAINED', { amount: manaGained })] : []),
        ...(dropEvent ? [dropEvent] : [])
      ],
    };
    return resolveVictory(nextState);
  }

  const damage = getWrongAnswerDamage(state);
  const nextState: GameState = {
    ...state,
    combo: 0,
    playerHp: Math.max(0, state.playerHp - damage),
    lastEvents: [
      event('ANSWER_WRONG', { selected, correctValue: state.currentQuestion.correctValue }),
      ...hpDamageEvents(damage),
    ],
  };
  return resolveGameOver(nextState);
}

function tryDropItem(state: GameState): { newInventory: GameState['inventory'], dropEvent: GameEvent | null } {
  const newItems = [...state.inventory.items];
  let dropEvent: GameEvent | null = null;
  
  // Taxa de drop reduzida para 75% conforme pedido
  if (Math.random() > 0.75) {
    return { newInventory: state.inventory, dropEvent: null };
  }
  const emptySlot = newItems.findIndex(i => i === null);
  if (emptySlot !== -1) {
    const dropId = rollLoot(state.currentLevelIndex);
    newItems[emptySlot] = dropId;
    dropEvent = event('ITEM_DROPPED', { itemId: dropId });
  } else {
    // Inventário cheio
    dropEvent = event('INVENTORY_FULL');
  }

  return { 
    newInventory: { ...state.inventory, items: newItems },
    dropEvent 
  };
}

function timeoutQuestion(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const damage = state.balance.timeoutDamage;
  const nextState: GameState = {
    ...state,
    combo: 0,
    playerHp: Math.max(0, state.playerHp - damage),
    lastEvents: [event('TIMEOUT'), ...hpDamageEvents(damage)],
  };
  return resolveGameOver(nextState);
}

function resolveVictory(state: GameState): GameState {
  const enemyLost = hasEnemyLost(state);
  const missionCompleted = state.missionCurrent >= state.balance.missionTarget;
  
  if (!enemyLost && !missionCompleted) return state;
  const lastEvents = [...state.lastEvents];

  if (missionCompleted) {
    lastEvents.push(event('LEVEL_COMPLETE', { missionCompleted }));
  }

  return {
    ...state,
    status: 'victory',
    lastEvents,
  };
}

function rollLoot(levelIndex: number): string {
  // Pesos melhorados para raridades maiores conforme o nível
  const rarities: {rarity: string, weight: number}[] = [
    { rarity: 'common', weight: 100 },
    { rarity: 'uncommon', weight: 80 + levelIndex * 15 },
    { rarity: 'rare', weight: 40 + levelIndex * 25 },
    { rarity: 'epic', weight: 15 + levelIndex * 20 },
    { rarity: 'legendary', weight: 8 + levelIndex * 15 },
    { rarity: 'mythic', weight: 2 + levelIndex * 8 },
  ];

  const totalWeight = rarities.reduce((acc, r) => acc + r.weight, 0);
  let roll = Math.random() * totalWeight;
  
  let selectedRarity = 'common';
  // Ordenar do mais raro para o mais comum para o roll
  const sortedRarities = [...rarities].sort((a, b) => {
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    return order.indexOf(b.rarity) - order.indexOf(a.rarity);
  });

  for (const r of sortedRarities) {
    if (roll < r.weight) {
      selectedRarity = r.rarity;
      break;
    }
    roll -= r.weight;
  }

  const pool = Object.values(itemsRegistry).filter(i => i.rarity === selectedRarity);
  if (pool.length === 0) return 'potion_health_small';
  
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function resolveGameOver(state: GameState): GameState {
  if (!hasPlayerLost(state)) return state;
  return {
    ...state,
    status: 'game-over',
    lastEvents: [...state.lastEvents, event('GAME_OVER')],
  };
}

function nextLevel(state: GameState): GameState {
  if (state.status === 'game-over' || state.status === 'completed') {
    return gameReducer(createInitialGameState(state.levels, state.balance), { type: 'START_GAME' });
  }

  const nextLevelIndex = state.currentLevelIndex + 1;
  if (nextLevelIndex >= state.levels.length) {
    return {
      ...state,
      status: 'completed',
      lastEvents: [event('GAME_COMPLETED')],
    };
  }

  return startLevel({
    ...state,
    currentLevelIndex: nextLevelIndex,
    playerHp: state.balance.playerMaxHp,
  }, [event('NEXT_LEVEL_REQUESTED')]);
}

function hpDamageEvents(hpDamage: number): GameEvent[] {
  if (hpDamage <= 0) return [];
  return [event('PLAYER_DAMAGED', { damage: hpDamage })];
}

function equipItem(state: GameState, index: number, slot: EquipmentSlot): GameState {
  const item = state.inventory.items[index];
  if (!item) return state;

  const def = itemsRegistry[item];
  if (!def || (def.category !== 'weapon' && def.category !== 'armor' && def.category !== 'accessory')) return state;

  const newItems = [...state.inventory.items];
  let currentEquipped = null;
  
  // Validate slot and category
  if (slot === 'weapon' && def.category === 'weapon') currentEquipped = state.inventory.equippedWeapon;
  else if (slot === 'armor' && def.category === 'armor') currentEquipped = state.inventory.equippedArmor;
  else if ((slot === 'accessory1' || slot === 'accessory2') && def.category === 'accessory') {
    currentEquipped = slot === 'accessory1' ? state.inventory.equippedAccessories[0] : state.inventory.equippedAccessories[1];
  }
  else return state; // Invalid equip category

  newItems[index] = currentEquipped;

  return {
    ...state,
    inventory: {
      ...state.inventory,
      items: newItems,
      equippedWeapon: slot === 'weapon' ? item : state.inventory.equippedWeapon,
      equippedArmor: slot === 'armor' ? item : state.inventory.equippedArmor,
      equippedAccessories: [
        slot === 'accessory1' ? item : state.inventory.equippedAccessories[0],
        slot === 'accessory2' ? item : state.inventory.equippedAccessories[1]
      ]
    },
    lastEvents: [...state.lastEvents, event('ITEM_EQUIPPED', { itemId: item })]
  };
}

function unequipItem(state: GameState, slot: EquipmentSlot): GameState {
  const emptySlot = state.inventory.items.findIndex(i => i === null);
  if (emptySlot === -1) return state;

  let item = null;
  if (slot === 'weapon') item = state.inventory.equippedWeapon;
  if (slot === 'armor') item = state.inventory.equippedArmor;
  if (slot === 'accessory1') item = state.inventory.equippedAccessories[0];
  if (slot === 'accessory2') item = state.inventory.equippedAccessories[1];

  if (!item) return state;

  const newItems = [...state.inventory.items];
  newItems[emptySlot] = item;

  return {
    ...state,
    inventory: {
      ...state.inventory,
      items: newItems,
      equippedWeapon: slot === 'weapon' ? null : state.inventory.equippedWeapon,
      equippedArmor: slot === 'armor' ? null : state.inventory.equippedArmor,
      equippedAccessories: [
        slot === 'accessory1' ? null : state.inventory.equippedAccessories[0],
        slot === 'accessory2' ? null : state.inventory.equippedAccessories[1]
      ]
    },
    lastEvents: [...state.lastEvents, event('ITEM_UNEQUIPPED', { itemId: item })]
  };
}

function discardItem(state: GameState, index: number): GameState {
  if (!state.inventory.items[index]) return state;
  const item = state.inventory.items[index];
  const newItems = [...state.inventory.items];
  newItems[index] = null;
  return {
    ...state,
    inventory: { ...state.inventory, items: newItems },
    lastEvents: [...state.lastEvents, event('ITEM_DISCARDED', { itemId: item })]
  };
}

function useActiveSkill(state: GameState, slot: EquipmentSlot): GameState {
  let item = null;
  if (slot === 'weapon') item = state.inventory.equippedWeapon;
  
  if (!item) return state;
  const def = itemsRegistry[item];
  if (!def || def.category !== 'weapon') return state;
  
  const cost = def.activeManaCost;
  if (state.mana < cost) return state;

  const damage = Math.round(def.baseDamage * 3); 

  const nextState: GameState = {
    ...state,
    mana: state.mana - cost,
    enemyHp: Math.max(0, state.enemyHp - damage),
    lastEvents: [...state.lastEvents, event('ACTIVE_SKILL_USED', { skillName: def.activeName }), event('MANA_SPENT', { amount: cost })]
  };

  return resolveVictory(nextState);
}

function useConsumable(state: GameState, index: number): GameState {
  const item = state.inventory.items[index];
  if (!item) return state;
  const def = itemsRegistry[item];
  if (!def || def.category !== 'consumable') return state;

  const newItems = [...state.inventory.items];
  newItems[index] = null;

  let nextState = { ...state, inventory: { ...state.inventory, items: newItems } };

  if (def.effectType === 'heal') {
    nextState.playerHp = Math.min(state.balance.playerMaxHp, state.playerHp + def.effectValue);
  } else if (def.effectType === 'mana') {
    nextState.mana = Math.min(state.balance.manaMax, state.mana + def.effectValue);
  }

  nextState.lastEvents = [...state.lastEvents, event('ITEM_USED', { itemId: item })];
  return nextState;
}
