import type { GameState } from '@reino/game-core';
import type { GameEvent } from '@reino/game-core';

interface StatusBarsProps {
  state: GameState;
  events?: GameEvent[];
}

export function StatusBars({ state, events = [] }: StatusBarsProps) {
  const eventTypes = events.map((event) => event.type);
  const manaPercent = (state.mana / state.balance.manaMax) * 100;
  const manaClassName = manaPercent <= 0 ? 'focus-empty' : manaPercent < 35 ? 'focus-low' : 'focus-high';
  const manaDelta = [...events].reverse().find((event) => event.type.startsWith('MANA_') && typeof event.payload?.amount === 'number');
  const manaHint = state.status !== 'playing' || state.mana <= 0 ? 'sem mana' : 'mana ativo';
  const manaDeltaText = manaDelta ? manaEventText(manaDelta.type, Number(manaDelta.payload?.amount)) : manaHint;
  return (
    <div className="status-bar">
      <div className={`bar-container ${eventTypes.includes('PLAYER_DAMAGED') ? 'hero-hp-hit' : ''}`}>
        <div className="label">Herói <span>HP</span></div>
        <div className="progress-bg"><div className="progress-fill hp-fill" style={{ width: `${state.playerHp}%` }} /></div>
      </div>
      <div className={`bar-container ${eventTypes.includes('ANSWER_CORRECT') ? 'enemy-hp-hit' : ''}`}>
        <div className="label">Inimigo <span>HP</span></div>
        <div className="progress-bg"><div className="progress-fill enemy-hp-fill" style={{ width: `${(state.enemyHp / state.enemyMaxHp) * 100}%` }} /></div>
      </div>
      <div className={`bar-container ${eventTypes.includes('ANSWER_CORRECT') ? 'mission-pulse' : ''}`}>
        <div className="label">Missão <span>{state.missionCurrent}/{state.balance.missionTarget}</span></div>
        <div className="progress-bg">
          <div className="progress-fill xp-fill" style={{ width: `${(state.missionCurrent / state.balance.missionTarget) * 100}%` }} />
        </div>
      </div>
      <div className={`bar-container focus-container ${manaClassName} ${eventTypes.some((type) => type.startsWith('MANA_')) ? 'mission-pulse' : ''}`}>
        <div className="label">Mana <span>{Math.round(state.mana)}/{state.balance.manaMax}</span></div>
        <div className="progress-bg">
          <div className="progress-fill focus-fill" style={{ width: `${manaPercent}%` }} />
        </div>
        <div className="focus-hint">{manaDeltaText}</div>
      </div>
    </div>
  );
}

function manaEventText(type: string, amount: number) {
  if (type === 'MANA_GAINED') return `+${Math.round(amount)} MANA`;
  if (type === 'MANA_SPENT') return `-${Math.round(amount)} MANA`;
  if (type === 'MANA_DEPLETED') return 'MANA esgotada';
  return 'MANA ativo';
}
