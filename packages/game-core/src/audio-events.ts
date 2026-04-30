import type { GameEvent, GameEventType } from './types';

export type AudioCue =
  | 'startAdventure'
  | 'levelStart'
  | 'nextLevel'
  | 'correct'
  | 'wrong'
  | 'damage'
  | 'item'
  | 'victory'
  | 'gameOver'
  | 'completed'
  | 'timeout'
  | 'timerWarning';

export const audioCueByEventType: Partial<Record<GameEventType, AudioCue>> = {
  GAME_STARTED: 'startAdventure',
  LEVEL_STARTED: 'levelStart',
  NEXT_LEVEL_REQUESTED: 'nextLevel',
  ANSWER_CORRECT: 'correct',
  ANSWER_WRONG: 'wrong',
  PLAYER_DAMAGED: 'damage',
  LEVEL_COMPLETE: 'victory',
  GAME_OVER: 'gameOver',
  GAME_COMPLETED: 'completed',
  TIMEOUT: 'timeout',
  TIMEOUT_WARNING: 'timerWarning',
};

export function getAudioCues(events: GameEvent[]): AudioCue[] {
  return events
    .map((event) => audioCueByEventType[event.type])
    .filter((cue): cue is AudioCue => Boolean(cue));
}
