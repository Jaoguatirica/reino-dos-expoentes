export type ExponentProperty =
  | 'multiplication'
  | 'division'
  | 'powerOfPower'
  | 'zeroExponent'
  | 'negative'
  | 'complex';

export type GameStatus = 'menu' | 'playing' | 'victory' | 'game-over' | 'completed';

export type GameEventType =
  | 'GAME_STARTED'
  | 'LEVEL_STARTED'
  | 'NEXT_LEVEL_REQUESTED'
  | 'ANSWER_CORRECT'
  | 'ANSWER_WRONG'
  | 'PLAYER_DAMAGED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'GAME_COMPLETED'
  | 'TIMEOUT'
  | 'TIMEOUT_WARNING'
  | 'MANA_GAINED'
  | 'MANA_SPENT'
  | 'MANA_DEPLETED'
  | 'ITEM_EQUIPPED'
  | 'ITEM_UNEQUIPPED'
  | 'ITEM_DISCARDED'
  | 'ITEM_DROPPED'
  | 'ACTIVE_SKILL_USED'
  | 'INVENTORY_FULL'
  | 'ITEM_USED';

export interface LevelDefinition {
  id: string;
  name: string;
  icon: string;
  property: ExponentProperty;
  rule: string;
  difficulty: number;
  timeLimitSeconds: number;
}

export interface BalanceConfig {
  playerMaxHp: number;
  enemyMaxHp: number; // Base enemy hp
  missionTarget: number;
  baseCorrectDamage: number;
  comboCorrectDamage: number;
  comboThreshold: number;
  wrongAnswerDamage: number;
  shieldWrongAnswerDamage: number;
  timeoutDamage: number;
  manaMax: number;
  manaStart: number;
  manaCorrectGain: number;
  manaComboGain: number;
}

export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'consumable';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type WeaponFamily = 'sword' | 'katana' | 'dagger' | 'bow' | 'axe';
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory1' | 'accessory2';

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  description: string;
}

export interface InventoryState {
  items: (string | null)[];
  equippedWeapon: string | null;
  equippedArmor: string | null;
  equippedAccessories: [string | null, string | null];
  maxSlots: number;
}

export interface Question {
  text: string;
  correctValue: number;
  options: number[];
}

export type QuestionSeed = Pick<Question, 'text' | 'correctValue'>;

export interface GameEvent {
  type: GameEventType;
  payload?: Record<string, unknown>;
}

export interface GameState {
  status: GameStatus;
  levels: LevelDefinition[];
  balance: BalanceConfig;
  currentLevelIndex: number;
  playerHp: number;
  mana: number;
  enemyHp: number;
  enemyMaxHp: number; // Enemy HP scales per mission
  currentQuestion: Question | null;
  usedQuestionTexts: string[];
  combo: number;
  inventory: InventoryState;
  missionCurrent: number;
  lastEvents: GameEvent[];
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'ANSWER'; selected: number }
  | { type: 'TIMEOUT' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'RESET_GAME' }
  | { type: 'GENERATE_QUESTION' }
  | { type: 'EQUIP_ITEM'; inventoryIndex: number; slot: EquipmentSlot }
  | { type: 'UNEQUIP_ITEM'; slot: EquipmentSlot }
  | { type: 'DISCARD_ITEM'; inventoryIndex: number }
  | { type: 'USE_ACTIVE_SKILL'; slot: EquipmentSlot }
  | { type: 'USE_CONSUMABLE'; inventoryIndex: number };

export interface BaseItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
}

export interface WeaponDefinition extends BaseItemDefinition {
  category: 'weapon';
  family: WeaponFamily;
  baseDamage: number;
  passiveName: string;
  passiveDescription: string;
  activeName: string;
  activeDescription: string;
  activeManaCost: number;
}

export interface ArmorDefinition extends BaseItemDefinition {
  category: 'armor';
  defense: number;
}

export interface AccessoryDefinition extends BaseItemDefinition {
  category: 'accessory';
}

export interface ConsumableDefinition extends BaseItemDefinition {
  category: 'consumable';
  effectType: 'heal' | 'mana' | 'buff';
  effectValue: number;
}

export type ItemDefinition = WeaponDefinition | ArmorDefinition | AccessoryDefinition | ConsumableDefinition;

export type RandomSource = () => number;

