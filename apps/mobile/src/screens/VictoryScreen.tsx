import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getProfessorMessage } from '@reino/game-content';
import { professorSpritesByKey, type SpriteSheetKey } from '@reino/assets';
import type { useGameController } from '../hooks/useGameController';
import { colors, spacing } from '../theme/tokens';

interface VictoryScreenProps {
  game: ReturnType<typeof useGameController>;
  title?: string;
}

export function VictoryScreen({ game, title = 'VITÓRIA!' }: VictoryScreenProps) {
  const professorMessage = getProfessorMessage({
    eventTypes: game.state.lastEvents.map((event) => event.type),
    combo: game.state.combo,
    property: game.level.property,
    playerHp: game.state.playerHp,
  });
  const professorSprite = professorSpritesByKey.guide;

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.starAward}>★</Text>
        <Text style={styles.starBurst}>✦  ✨  ✦</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>Regra Dominada: {game.level.rule}</Text>
        <Text style={styles.lootText}>Recompensas coletadas e mochila atualizada!</Text>
        <Text style={styles.trophy}>🏆</Text>
        <View style={styles.professorReaction}>
          <View style={styles.professorAvatar} accessibilityLabel={professorSprite.label}>
            <Image
              source={mobileSpriteSheets[professorSprite.sheetKey]}
              style={{
                width: professorSprite.sheetWidth * 3,
                height: professorSprite.sheetHeight * 3,
                transform: [
                  { translateX: -professorSprite.x * 3 },
                  { translateY: -professorSprite.y * 3 },
                ],
              }}
              resizeMode="stretch"
            />
          </View>
          <View style={styles.professorCopy}>
            <Text style={styles.professorTitle}>Professor</Text>
            <Text style={styles.professorText}>{professorMessage.text}</Text>
          </View>
        </View>
        <Pressable style={styles.button} onPress={game.state.status === 'game-over' ? game.actions.reset : game.actions.nextLevel}>
          <Text style={styles.buttonText}>{game.state.status === 'game-over' ? 'REINICIAR' : 'AVANÇAR'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const mobileSpriteSheets: Record<SpriteSheetKey, ReturnType<typeof require>> = {
  roguelike: require('../../assets/sprites/kenney-roguelike.png'),
  characters: require('../../assets/sprites/kenney-roguelike-characters.png'),
  dungeon: require('../../assets/sprites/kenney-roguelike-dungeon.png'),
  tinyDungeon: require('../../assets/sprites/kenney-tiny-dungeon.png'),
  micro: require('../../assets/sprites/kenney-micro-roguelike.png'),
  uiRpg: require('../../assets/sprites/kenney-ui-rpg.png'),
};

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  card: { gap: spacing.lg, padding: spacing.xl, borderRadius: 20, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface },
  starAward: { alignSelf: 'center', width: 88, height: 88, overflow: 'hidden', color: '#1f1600', fontSize: 66, lineHeight: 84, textAlign: 'center', borderRadius: 44, backgroundColor: colors.warning },
  starBurst: { color: colors.warning, fontSize: 28, textAlign: 'center' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  message: { color: colors.text, fontSize: 16, textAlign: 'center' },
  lootText: { color: colors.secondary, fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
  trophy: { fontSize: 64, textAlign: 'center' },
  professorReaction: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.warning, backgroundColor: 'rgba(255,235,59,0.08)' },
  professorAvatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(0,0,0,0.24)' },
  professorCopy: { flex: 1, gap: 4 },
  professorTitle: { color: colors.text, fontWeight: '900' },
  professorText: { color: colors.text, textAlign: 'center', lineHeight: 20 },
  secondaryButton: { padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: '#2a2a3a' },
  secondaryButtonText: { color: colors.text, textAlign: 'center', fontWeight: '800' },
  button: { padding: spacing.lg, borderRadius: 12, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontWeight: '900', textAlign: 'center', fontSize: 18 },
});
