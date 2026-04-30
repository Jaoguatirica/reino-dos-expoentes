export interface SpriteDefinition {
  sheetPath: string;
  sheetKey: SpriteSheetKey;
  sheetWidth: number;
  sheetHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  source: string;
}

export const spriteSheets = {
  roguelike: { path: 'assets/sprites/kenney-roguelike.png', width: 968, height: 526, source: 'kenney-roguelike-rpg-pack' },
  characters: { path: 'assets/sprites/kenney-roguelike-characters.png', width: 918, height: 203, source: 'kenney-roguelike-characters' },
  dungeon: { path: 'assets/sprites/kenney-roguelike-dungeon.png', width: 492, height: 305, source: 'kenney-roguelike-caves-dungeons' },
  tinyDungeon: { path: 'assets/sprites/kenney-tiny-dungeon.png', width: 192, height: 176, source: 'kenney-tiny-dungeon' },
  micro: { path: 'assets/sprites/kenney-micro-roguelike.png', width: 128, height: 80, source: 'kenney-micro-roguelike' },
  uiRpg: { path: 'assets/sprites/kenney-ui-rpg.png', width: 512, height: 512, source: 'kenney-ui-pack-rpg-expansion' },
} as const;

export type SpriteSheetKey = keyof typeof spriteSheets;

function tile(sheetKey: SpriteSheetKey, column: number, row: number, label: string, size = 16, step = size + 1): SpriteDefinition {
  const sheet = spriteSheets[sheetKey];
  return {
    sheetPath: sheet.path,
    sheetKey,
    sheetWidth: sheet.width,
    sheetHeight: sheet.height,
    x: column * step,
    y: row * step,
    width: size,
    height: size,
    label,
    source: sheet.source,
  };
}

function roguelikeTile(column: number, row: number, label: string): SpriteDefinition {
  return tile('roguelike', column, row, label);
}

function characterTile(column: number, row: number, label: string): SpriteDefinition {
  return tile('characters', column, row, label);
}

function dungeonTile(column: number, row: number, label: string): SpriteDefinition {
  return tile('dungeon', column, row, label);
}

function microTile(column: number, row: number, label: string): SpriteDefinition {
  return tile('micro', column, row, label, 8, 8);
}

function uiTile(column: number, row: number, label: string): SpriteDefinition {
  const step = 17;
  return tile('uiRpg', column, row, label, 16, step);
}

export const enemySpritesByKey = {
  'forest-guardian': characterTile(1, 3, 'Forest guardian'),
  'division-bat': characterTile(8, 1, 'Division cave bat'),
  'power-ghost': characterTile(1, 5, 'Power tower mage'),
  'zero-scorpion': dungeonTile(2, 3, 'Zero desert scorpion'),
  'negative-demon': characterTile(0, 9, 'Negative abyss demon'),
  'chaos-king': characterTile(1, 10, 'Chaos throne overlord'),
} as const;

export type EnemySpriteKey = keyof typeof enemySpritesByKey;

export const professorSpritesByKey = {
  guide: characterTile(0, 0, 'Professor guide'),
} as const;

export type ProfessorSpriteKey = keyof typeof professorSpritesByKey;

export const uiSpritesByKey = {
  hp: microTile(0, 0, 'HP icon'),
  enemy: microTile(1, 0, 'Enemy icon'),
  mission: microTile(2, 0, 'Mission icon'),
  focus: microTile(3, 0, 'Focus icon'),
  scroll: uiTile(0, 0, 'Scroll resource icon'),
  potion: uiTile(1, 0, 'Potion resource icon'),
} as const;

export type UiSpriteKey = keyof typeof uiSpritesByKey;

export const musicByCue = {
  menu: { path: 'assets/audio/music/post-adventure_tea_party.wav', label: 'Menu theme – Post-Adventure Tea Party' },
  forestGuardian: { path: 'assets/audio/music/stumble_around.wav', label: 'Forest guardian – Stumble Around' },
  divisionCave: { path: 'assets/audio/music/it_takes_a_hero.wav', label: 'Division cave – It Takes a Hero' },
  powerTower: { path: 'assets/audio/music/the_world_is_ours.wav', label: 'Power tower – The World Is Ours' },
  zeroDesert: { path: 'assets/audio/music/face_the_facts.wav', label: 'Zero desert – Face the Facts' },
  negativeAbyss: { path: 'assets/audio/music/sinister_abode.wav', label: 'Negative abyss – Sinister Abode' },
  chaosThrone: { path: 'assets/audio/music/space_cadet_training_montage.wav', label: 'Chaos throne – Space Cadet Training Montage' },
  battleBasic: { path: 'assets/audio/music/moms_workout_cd.wav', label: 'Basic battle – Moms Workout CD' },
  battleIntermediate: { path: 'assets/audio/music/dizzy_racing.wav', label: 'Intermediate battle – Dizzy Racing' },
  battleAdvanced: { path: 'assets/audio/music/space_cadet_training_montage.wav', label: 'Advanced battle – Space Cadet Training Montage' },
  gameComplete: { path: 'assets/audio/music/100_victories.wav', label: 'Game complete – 100 Victories' },
} as const;

export const sfxByCue = {
  startAdventure: { path: 'assets/audio/sfx/start-adventure.wav', label: 'Start adventure' },
  levelStart: { path: 'assets/audio/sfx/level-start.wav', label: 'Level start' },
  nextLevel: { path: 'assets/audio/sfx/next-level.wav', label: 'Next level' },
  correct: { path: 'assets/audio/sfx/correct.wav', label: 'Correct answer' },
  wrong: { path: 'assets/audio/sfx/wrong.wav', label: 'Wrong answer' },
  damage: { path: 'assets/audio/sfx/damage.wav', label: 'Player damage' },
  item: { path: 'assets/audio/sfx/item.wav', label: 'Item used' },
  victory: { path: 'assets/audio/sfx/victory.wav', label: 'Level victory' },
  gameOver: { path: 'assets/audio/sfx/game-over.wav', label: 'Game over' },
  completed: { path: 'assets/audio/sfx/completed.wav', label: 'Game completed' },
  timeout: { path: 'assets/audio/sfx/timeout.wav', label: 'Timeout' },
  timerWarning: { path: 'assets/audio/sfx/timer-warning.wav', label: 'Timer warning' },
  uiToggle: { path: 'assets/audio/sfx/ui-toggle.wav', label: 'UI toggle' },
} as const;

export type MusicCue = keyof typeof musicByCue;
export type SfxCue = keyof typeof sfxByCue;

export function getBattleMusicCue(levelIndex: number): MusicCue {
  const cueByLevel: MusicCue[] = ['forestGuardian', 'divisionCave', 'powerTower', 'zeroDesert', 'negativeAbyss', 'chaosThrone'];
  return cueByLevel[levelIndex] ?? 'battleBasic';
}

export const assetCatalog = {
  sprites: {
    sheets: spriteSheets,
    enemies: enemySpritesByKey,
    professor: professorSpritesByKey,
    ui: uiSpritesByKey,
  },
  audio: {
    music: musicByCue,
    sfx: sfxByCue,
  },
} as const;
