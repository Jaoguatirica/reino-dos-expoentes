import { useState } from 'react';
import { BattleScreen } from './screens/BattleScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { SettingsPanel } from './components/SettingsPanel';
import { useGameController } from './hooks/useGameController';
import { useGameMusic } from './hooks/useGameMusic';
import { useGameSfx } from './hooks/useGameSfx';

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const game = useGameController({ paused: settingsOpen });
  useGameSfx(game.state.lastEvents, game.progress.sfxEnabled, game.progress.sfxVolume);
  useGameMusic({ enabled: game.progress.musicEnabled, status: game.state.status, levelIndex: game.state.currentLevelIndex, volume: game.progress.musicVolume });

  const handleStart = () => {
    if (isFading) return;
    setIsFading(true);
    
    setTimeout(() => {
      game.actions.start();
    }, 500);

    setTimeout(() => {
      setIsFading(false);
    }, 3500);
  };

  return (
    <>
      <main className={game.state.status === 'menu' ? 'page page-centered' : 'page'}>
        <section id="game-container">
          <SettingsPanel game={game} open={settingsOpen} onOpenChange={setSettingsOpen} />
          {game.state.status === 'menu' && (
            <MainMenuScreen
               onStart={handleStart}
               highestUnlockedLevelIndex={game.progress.highestUnlockedLevelIndex}
               onResetProgress={game.actions.resetProgress}
             />
        )}
        {game.state.status === 'playing' && <BattleScreen game={game} />}
        {game.state.status === 'victory' && <VictoryScreen game={game} />}
        {game.state.status === 'game-over' && (
          <VictoryScreen game={game} title="GAME OVER" message="Tente novamente para conquistar o reino." />
        )}
        {game.state.status === 'completed' && (
          <VictoryScreen game={game} title="TRONO CONQUISTADO!" message="Você dominou o Reino dos Expoentes." />
        )}
      </section>
      </main>
      
      {isFading && (
        <div className="black-transition-overlay animating" />
      )}
    </>
  );
}
