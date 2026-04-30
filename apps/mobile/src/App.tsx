import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BattleScreen } from './screens/BattleScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { VictoryScreen } from './screens/VictoryScreen';
import { useGameController } from './hooks/useGameController';
import { useGameMusic } from './hooks/useGameMusic';
import { useGameSfx } from './hooks/useGameSfx';
import { colors, spacing } from './theme/tokens';

export function MobileApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const game = useGameController({ paused: settingsOpen || inventoryOpen });
  useGameSfx(game.state.lastEvents, game.progress.sfxEnabled, game.progress.sfxVolume);
  useGameMusic({ enabled: game.progress.musicEnabled, status: game.state.status, levelIndex: game.state.currentLevelIndex, volume: game.progress.musicVolume });

  return (
    <View style={styles.root}>
      {game.state.status === 'menu' && <MainMenuScreen game={game} />}
      {game.state.status === 'playing' && (
        <BattleScreen 
          game={game} 
          isInventoryOpen={inventoryOpen} 
          setIsInventoryOpen={setInventoryOpen} 
        />
      )}
      {game.state.status === 'victory' && <VictoryScreen game={game} />}
      {game.state.status === 'completed' && <VictoryScreen game={game} title="TRONO CONQUISTADO!" />}
      {game.state.status === 'game-over' && <VictoryScreen game={game} title="GAME OVER" />}
      
      {/* Settings Button */}
      <Pressable accessibilityLabel="Abrir configurações" style={styles.settingsButton} onPress={() => setSettingsOpen(true)}>
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>
      
      {/* Settings Modal */}
      <Modal transparent visible={settingsOpen} animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSettingsOpen(false)}>
          <Pressable style={styles.settingsPanel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Configurações</Text>
              <Pressable style={styles.closeButton} onPress={() => setSettingsOpen(false)}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <VolumeControl label={`Música: ${game.progress.musicEnabled ? 'Ligada' : 'Desligada'}`} volume={game.progress.musicVolume} onToggle={game.actions.toggleMusic} onChange={game.actions.setMusicVolume} />
            <VolumeControl label={`Efeitos: ${game.progress.sfxEnabled ? 'Ligados' : 'Desligados'}`} volume={game.progress.sfxVolume} onToggle={game.actions.toggleSfx} onChange={game.actions.setSfxVolume} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function VolumeControl({ label, volume, onToggle, onChange }: { label: string; volume: number; onToggle: () => void; onChange: (volume: number) => void }) {
  return (
    <View style={styles.volumeControl}>
      <Pressable style={styles.secondaryButton} onPress={onToggle}>
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </Pressable>
      <View style={styles.volumeRow}>
        <Pressable style={styles.volumeStepButton} onPress={() => onChange(volume - 0.1)}><Text style={styles.secondaryButtonText}>-</Text></Pressable>
        <Text style={styles.volumeText}>Volume {Math.round(volume * 100)}%</Text>
        <Pressable style={styles.volumeStepButton} onPress={() => onChange(volume + 0.1)}><Text style={styles.secondaryButtonText}>+</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  settingsButton: { position: 'absolute', top: 18, right: 18, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: '#2a2a3a' },
  settingsIcon: { color: colors.text, fontSize: 22 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(5,5,12,0.72)' },
  settingsPanel: { width: '100%', gap: spacing.md, padding: spacing.lg, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: colors.surface },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsTitle: { color: colors.secondary, fontSize: 20, fontWeight: '900' },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' },
  closeText: { color: colors.text, fontSize: 24, fontWeight: '900' },
  volumeControl: { gap: spacing.sm, padding: spacing.md, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.22)' },
  secondaryButton: { padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#2a2a3a' },
  secondaryButtonText: { color: colors.text, textAlign: 'center', fontWeight: '800' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  volumeText: { flex: 1, color: colors.text, textAlign: 'center', fontWeight: '800' },
  volumeStepButton: { width: 42, padding: spacing.sm, borderRadius: 10, backgroundColor: '#333348' },
});
