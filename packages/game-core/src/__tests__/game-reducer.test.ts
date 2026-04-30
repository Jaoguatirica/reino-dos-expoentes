import { describe, expect, it } from 'vitest';
import { createInitialGameState, gameReducer, type LevelDefinition } from '../index';

const levels: LevelDefinition[] = [
  {
    id: 'test-level',
    name: 'Test Level',
    icon: 'x',
    property: 'multiplication',
    rule: 'rule',
    difficulty: 3,
    timeLimitSeconds: 0,
  },
  {
    id: 'test-level-2',
    name: 'Test Level 2',
    icon: 'y',
    property: 'division',
    rule: 'rule',
    difficulty: 3,
    timeLimitSeconds: 0,
  },
];

function playingState() {
  return gameReducer(createInitialGameState(levels), { type: 'START_GAME' });
}

describe('gameReducer', () => {
  it('starts the first level with a generated question and initial equipment', () => {
    const state = playingState();
    expect(state.status).toBe('playing');
    expect(state.currentQuestion).not.toBeNull();
    expect(state.inventory.items[0]).toBe('sword_common');
    expect(state.mana).toBe(0);
    expect(state.enemyHp).toBe(100);
  });

  it('correct answers increase mission progress, damage enemy and drop item', () => {
    const state = playingState();
    const next = gameReducer(state, { type: 'ANSWER', selected: state.currentQuestion!.correctValue });
    expect(next.missionCurrent).toBe(1);
    expect(next.mana).toBe(5);
    expect(next.lastEvents.some(e => e.type === 'ITEM_DROPPED')).toBe(true);
    expect(next.inventory.items.some((i, idx) => idx > 1 && i !== null)).toBe(true);
  });

  it('adds a mana bonus for combo streaks', () => {
    const state = { ...playingState(), combo: 2, mana: 10 };
    const next = gameReducer(state, { type: 'ANSWER', selected: state.currentQuestion!.correctValue });
    expect(next.combo).toBe(3);
    expect(next.mana).toBe(12); // combo bonus is 2 (defaultBalance)
  });

  it('allows equipping and unequipping items', () => {
    const state = playingState();
    const equipped = gameReducer(state, { type: 'EQUIP_ITEM', inventoryIndex: 0, slot: 'weapon' });
    expect(equipped.inventory.equippedWeapon).toBe('sword_common');
    expect(equipped.inventory.items[0]).toBeNull();

    const unequipped = gameReducer(equipped, { type: 'UNEQUIP_ITEM', slot: 'weapon' });
    expect(unequipped.inventory.equippedWeapon).toBeNull();
    expect(unequipped.inventory.items[0]).toBe('sword_common');
  });

  it('allows using active skills with mana', () => {
    const state = { ...playingState(), mana: 30 };
    const equipped = gameReducer(state, { type: 'EQUIP_ITEM', inventoryIndex: 0, slot: 'weapon' });
    
    const next = gameReducer(equipped, { type: 'USE_ACTIVE_SKILL', slot: 'weapon' });
    expect(next.mana).toBe(20); // sword_common cost is 10
    expect(next.enemyHp).toBeLessThan(100);
    expect(next.lastEvents.some(e => e.type === 'ACTIVE_SKILL_USED')).toBe(true);
  });

  it('allows using consumables', () => {
    const state = { ...playingState(), playerHp: 50 };
    // potion_health_small is at index 1
    const next = gameReducer(state, { type: 'USE_CONSUMABLE', inventoryIndex: 1 });
    expect(next.playerHp).toBe(75); // potion_health_small heals 25
    expect(next.inventory.items[1]).toBeNull();
  });

  it('moves to victory on mission complete', () => {
    const state = { ...playingState(), missionCurrent: 4 };
    const next = gameReducer(state, { type: 'ANSWER', selected: state.currentQuestion!.correctValue });
    expect(next.status).toBe('victory');
  });

  it('marks game over when player hp reaches zero', () => {
    const state = { ...playingState(), playerHp: 5 };
    const next = gameReducer(state, { type: 'ANSWER', selected: state.currentQuestion!.correctValue + 99 });
    expect(next.status).toBe('game-over');
  });

  it('emits INVENTORY_FULL when inventory is full', () => {
    const state = playingState();
    // Fill inventory
    const fullItems = Array(30).fill('potion_health_small');
    const fullState = { ...state, inventory: { ...state.inventory, items: fullItems } };
    
    const next = gameReducer(fullState, { type: 'ANSWER', selected: state.currentQuestion!.correctValue });
    expect(next.lastEvents.some(e => e.type === 'INVENTORY_FULL')).toBe(true);
    expect(next.lastEvents.some(e => e.type === 'ITEM_DROPPED')).toBe(false);
  });
});
