import { AnswerGrid } from '../components/AnswerGrid';
import { EnemyDisplay } from '../components/EnemyDisplay';
import { InventoryPanel } from '../components/InventoryPanel';
import { QuestionCard } from '../components/QuestionCard';
import { StatusBars } from '../components/StatusBars';
import type { useGameController } from '../hooks/useGameController';
import { enemiesByLevelId, getProfessorMessage } from '@reino/game-content';
import { itemsRegistry } from '@reino/game-core';
import { professorSpritesByKey } from '@reino/assets';
import { useEffect, useRef, useState } from 'react';
import type { GameEventType } from '@reino/game-core';

interface BattleScreenProps {
  game: ReturnType<typeof useGameController>;
  isInventoryOpen: boolean;
  setIsInventoryOpen: (open: boolean) => void;
}

interface FeedbackSnapshot {
  id: number;
  eventTypes: GameEventType[];
  latestDamage?: number;
  missionGained: boolean;
  professorMessage: ReturnType<typeof getProfessorMessage>;
  itemMessage?: {
    text: string;
    rarity: string;
  };
}

export function BattleScreen({ game, isInventoryOpen, setIsInventoryOpen }: BattleScreenProps) {
  const question = game.state.currentQuestion;
  const enemy = enemiesByLevelId[game.level.id as keyof typeof enemiesByLevelId];
  const eventTypes = game.state.lastEvents.map((event) => event.type);
  const [feedbackSnapshot, setFeedbackSnapshot] = useState<FeedbackSnapshot | null>(null);
  const previousProfessorTextRef = useRef<string | undefined>(undefined);
  const activeEventTypes = feedbackSnapshot?.eventTypes ?? eventTypes;
  const latestDamage = feedbackSnapshot?.latestDamage;
  const missionGained = Boolean(feedbackSnapshot?.missionGained);
  const missionProgress = game.state.missionCurrent / game.state.balance.missionTarget;
  const missionGainClassName = missionProgress >= 1 ? 'mission-gain mission-gain-gold' : missionProgress >= 0.6 ? 'mission-gain mission-gain-warm' : 'mission-gain mission-gain-cool';
  const professorMessage = feedbackSnapshot?.professorMessage;
  const professorSprite = professorSpritesByKey.guide;
  const itemMessage = feedbackSnapshot?.itemMessage;

  // Weapon Skill Info
  const weaponId = game.state.inventory.equippedWeapon;
  const weaponDef = weaponId ? itemsRegistry[weaponId] : null;
  const canUseSkill = weaponDef && weaponDef.category === 'weapon' && game.state.mana >= weaponDef.activeManaCost;

  useEffect(() => {
    if (game.state.lastEvents.length === 0) return;

    const nextEventTypes = game.state.lastEvents.map((event) => event.type);
    const nextProfessorMessage = getProfessorMessage({
      eventTypes: nextEventTypes,
      combo: game.state.combo,
      property: game.level.property,
      playerHp: game.state.playerHp,
      previousText: previousProfessorTextRef.current,
    });
    previousProfessorTextRef.current = nextProfessorMessage.text;

    // Item Drop Feedback
    const dropEvent = game.state.lastEvents.find(e => e.type === 'ITEM_DROPPED');
    let itemMsg;
    if (dropEvent) {
      const item = itemsRegistry[dropEvent.payload?.itemId as string];
      if (item) {
        itemMsg = {
          text: `${item.name} (${item.rarity.toUpperCase()})`,
          rarity: item.rarity
        };
      }
    }

    setFeedbackSnapshot({
      id: Date.now(),
      eventTypes: nextEventTypes,
      latestDamage: [...game.state.lastEvents].reverse().find((event) => typeof event.payload?.damage === 'number')?.payload?.damage as number | undefined,
      missionGained: nextEventTypes.includes('ANSWER_CORRECT'),
      professorMessage: nextProfessorMessage,
      itemMessage: itemMsg
    });

    // Aumento do tempo do aviso conforme solicitado
    const timeout = window.setTimeout(() => setFeedbackSnapshot(null), 12000);
    return () => window.clearTimeout(timeout);
  }, [game.level.property, game.state.combo, game.state.lastEvents, game.state.playerHp]);

  const battleClassName = [
    'battle-shell',
    eventTypes.includes('PLAYER_DAMAGED') ? 'battle-shell-damaged' : '',
    eventTypes.includes('ANSWER_WRONG') || eventTypes.includes('TIMEOUT') ? 'battle-shell-error-quake' : '',
    eventTypes.includes('ANSWER_CORRECT') && game.state.combo >= 2 ? 'battle-shell-success-quake' : '',
    game.state.combo >= 3 ? 'battle-shell-combo' : '',
  ].filter(Boolean).join(' ');
  
  const enemyClassName = activeEventTypes.includes('ANSWER_CORRECT') || activeEventTypes.includes('ACTIVE_SKILL_USED') ? 'enemy-hit' : '';
  
  const feedbackClassName = eventTypes.includes('ANSWER_WRONG') || eventTypes.includes('TIMEOUT')
    ? 'feedback wrong-feedback'
    : 'feedback correct-feedback';

  if (!question) return null;

  return (
    <div id="game-ui" className={battleClassName}>
      <StatusBars state={game.state} events={game.state.lastEvents} />
      
      <div id="combat-area">
        <div className="combat-main">
          <div className="stage-name">{game.level.name}</div>
          <div className="enemy-feedback-wrap">
            <EnemyDisplay icon={game.level.icon} spriteKey={enemy?.spriteKey} className={enemyClassName} />
            {latestDamage && (activeEventTypes.includes('ANSWER_CORRECT') || activeEventTypes.includes('ACTIVE_SKILL_USED')) && (
              <span className="floating-damage">-{latestDamage}</span>
            )}
            {(activeEventTypes.includes('ANSWER_CORRECT') || activeEventTypes.includes('ACTIVE_SKILL_USED')) && (
              <span className="enemy-burst" aria-hidden="true" />
            )}
          </div>
          
          {missionGained && <div className={missionGainClassName}><span aria-hidden="true">★</span> +1 missão</div>}
          
          <QuestionCard question={question} timerPercent={game.timerPercent} />
          <AnswerGrid options={question.options} onAnswer={game.actions.answer} />

          {weaponDef && weaponDef.category === 'weapon' && (
            <div className="skill-button-container">
              <button 
                className="skill-button"
                disabled={!canUseSkill}
                onClick={() => game.actions.useActiveSkill('weapon')}
                title={weaponDef.activeDescription}
              >
                {weaponDef.activeName}
                <span className="skill-cost">{weaponDef.activeManaCost} MP</span>
              </button>
            </div>
          )}

          <div id="feedback" className={feedbackClassName}>
            {itemMessage ? (
              <span className={`item-acquired-msg rarity-${itemMessage.rarity}`}>
                NOVO ITEM: {itemMessage.text}
              </span>
            ) : (
              game.state.lastEvents.at(-1)?.type.replaceAll('_', ' ')
            )}
          </div>
        </div>
        
        <div className="side-panel-stack">
          {professorMessage && (
            <div className={`professor-reaction professor-chat-bubble professor-${professorMessage.tone}`} key={feedbackSnapshot?.id}>
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
          )}
        </div>
      </div>

      {/* Backpack Floating Button */}
      <button className="backpack-button" onClick={() => setIsInventoryOpen(true)} title="Abrir Inventário">
        🎒
      </button>

      {/* Inventory Modal */}
      {isInventoryOpen && (
        <div className="inventory-modal">
          <div className="inventory-modal-content">
            <button className="inventory-modal-close" onClick={() => setIsInventoryOpen(false)}>×</button>
            <InventoryPanel 
              state={game.state} 
              actions={{
                equipItem: game.actions.equipItem,
                unequipItem: game.actions.unequipItem,
                discardItem: game.actions.discardItem,
                useConsumable: game.actions.useConsumable,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
