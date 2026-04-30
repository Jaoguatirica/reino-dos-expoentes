import type { useGameController } from '../hooks/useGameController';
import { getProfessorMessage } from '@reino/game-content';
import { professorSpritesByKey } from '@reino/assets';

interface VictoryScreenProps {
  game: ReturnType<typeof useGameController>;
  title?: string;
  message?: string;
}

export function VictoryScreen({ game, title = 'VITÓRIA!', message }: VictoryScreenProps) {
  const missionCompleted = game.state.missionCurrent >= game.state.balance.missionTarget;
  const nextLevel = game.state.levels[game.state.currentLevelIndex + 1];
  const eventTypes = game.state.lastEvents.map((event) => event.type);
  const professorMessage = getProfessorMessage({
    eventTypes,
    combo: game.state.combo,
    property: game.level.property,
    playerHp: game.state.playerHp,
  });
  const professorSprite = professorSpritesByKey.guide;

  return (
    <div className="overlay-screen victory-celebration">
      <div className="mastery-medal" aria-hidden="true">OK</div>
      <span className="menu-kicker">Fase concluída</span>
      <h2>{title}</h2>
      <p className="reward-text">{message ?? `Regra dominada: ${game.level.rule}`}</p>
      <div className="victory-summary-grid">
        <div className="victory-summary-card">
          <span>Regra treinada</span>
          <strong>{ruleSummary(game.level.property)}</strong>
        </div>
        <div className="victory-summary-card">
          <span>Missão</span>
          <strong>{game.state.missionCurrent}/{game.state.balance.missionTarget}</strong>
        </div>
        <div className="victory-summary-card">
          <span>MANA final</span>
          <strong>{Math.round(game.state.mana)}/{game.state.balance.manaMax}</strong>
        </div>
      </div>
      {missionCompleted && <div className="conquest-alert">Missão concluída. Recompensas de loot adicionadas à mochila!</div>}
      <div className="professor-reaction professor-celebrate">
        <div className="professor-avatar" aria-label={professorSprite.label} title={professorSprite.label}>
          <span
            className="sprite-tile professor-avatar-tile"
            style={{
              backgroundImage: `url(${professorSprite.sheetPath})`,
              backgroundPosition: `-${professorSprite.x}px -${professorSprite.y}px`,
              width: professorSprite.width,
              height: professorSprite.height,
            }}
          />
        </div>
        <div className="professor-copy">
          <strong>Professor</strong>
          <span>{professorMessage.text}</span>
        </div>
      </div>
      {nextLevel && <p className="next-level-note">Próximo desafio: {nextLevel.name}</p>}
      <button
        className="full-width-button"
        type="button"
        onClick={game.state.status === 'game-over' ? game.actions.reset : game.actions.nextLevel}
      >
        {game.state.status === 'completed' || game.state.status === 'game-over' ? 'REINICIAR' : 'AVANÇAR'}
      </button>
    </div>
  );
}

function ruleSummary(property: ReturnType<typeof useGameController>['level']['property']) {
  switch (property) {
    case 'multiplication':
      return 'Bases iguais: some os expoentes.';
    case 'division':
      return 'Bases iguais: subtraia os expoentes.';
    case 'powerOfPower':
      return 'Potência de potência: multiplique os expoentes.';
    case 'zeroExponent':
      return 'Expoente zero transforma a base não nula em 1.';
    case 'negative':
      return 'Expoente negativo vira inverso da potência.';
    case 'complex':
      return 'Resolva por etapas e combine as regras.';
    default:
      return 'Domine as propriedades dos expoentes!';
  }
}
