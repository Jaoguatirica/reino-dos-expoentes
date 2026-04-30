import type { useGameController } from '../hooks/useGameController';

interface SettingsPanelProps {
  game: ReturnType<typeof useGameController>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ game, open, onOpenChange }: SettingsPanelProps) {
  return (
    <>
      <button className="settings-icon-button" type="button" aria-label="Abrir configurações" onClick={() => onOpenChange(true)}>
        ⚙
      </button>
      {open && (
        <div className="settings-backdrop" role="presentation" onClick={() => onOpenChange(false)}>
          <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
            <div className="settings-header">
              <h2 id="settings-title">Configurações</h2>
              <button className="settings-close-button" type="button" aria-label="Fechar configurações" onClick={() => onOpenChange(false)}>×</button>
            </div>
            <div className="settings-control">
              <button className="secondary-button" type="button" onClick={game.actions.toggleMusic}>
                Música: {game.progress.musicEnabled ? 'Ligada' : 'Desligada'}
              </button>
              <label>
                Volume da música {Math.round(game.progress.musicVolume * 100)}%
                <input type="range" min="0" max="1" step="0.05" value={game.progress.musicVolume} onChange={(event) => game.actions.setMusicVolume(Number(event.currentTarget.value))} />
              </label>
            </div>
            <div className="settings-control">
              <button className="secondary-button" type="button" onClick={game.actions.toggleSfx}>
                Efeitos: {game.progress.sfxEnabled ? 'Ligados' : 'Desligados'}
              </button>
              <label>
                Volume dos efeitos {Math.round(game.progress.sfxVolume * 100)}%
                <input type="range" min="0" max="1" step="0.05" value={game.progress.sfxVolume} onChange={(event) => game.actions.setSfxVolume(Number(event.currentTarget.value))} />
              </label>
            </div>
            
            <div className="settings-control" style={{ border: 'none', background: 'transparent', padding: '0', marginTop: '10px' }}>
              <button 
                className="full-width-button" 
                type="button" 
                onClick={() => {
                  game.actions.reset();
                  onOpenChange(false);
                }}
                style={{ background: 'linear-gradient(135deg, #ff5252, #b00020)' }}
              >
                Voltar ao Menu Inicial
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
