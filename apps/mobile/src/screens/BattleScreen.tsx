import { Image, Pressable, ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { AnswerGrid } from '../components/AnswerGrid';
import { EnemySprite } from '../components/EnemySprite';
import { InventoryPanel } from '../components/InventoryPanel';
import { QuestionCard } from '../components/QuestionCard';
import { StatusBars } from '../components/StatusBars';
import { enemiesByLevelId, getProfessorMessage } from '@reino/game-content';
import { itemsRegistry } from '@reino/game-core';
import { professorSpritesByKey, type SpriteSheetKey } from '@reino/assets';
import type { useGameController } from '../hooks/useGameController';
import { colors, spacing } from '../theme/tokens';

interface BattleScreenProps {
  game: ReturnType<typeof useGameController>;
  isInventoryOpen: boolean;
  setIsInventoryOpen: (open: boolean) => void;
}

export function BattleScreen({ game, isInventoryOpen, setIsInventoryOpen }: BattleScreenProps) {
  const question = game.state.currentQuestion;
  const enemy = enemiesByLevelId[game.level.id as keyof typeof enemiesByLevelId];
  const damaged = game.state.lastEvents.some((event) => event.type === 'PLAYER_DAMAGED');
  const eventTypes = game.state.lastEvents.map((event) => event.type);
  const successQuake = eventTypes.includes('ANSWER_CORRECT') && game.state.combo >= 2;
  const latestDamage = [...game.state.lastEvents].reverse().find((event) => typeof event.payload?.damage === 'number')?.payload?.damage as number | undefined;
  
  const professorMessage = getProfessorMessage({
    eventTypes,
    combo: game.state.combo,
    property: game.level.property,
    playerHp: game.state.playerHp,
  });
  const professorSprite = professorSpritesByKey.guide;
  const translateX = useSharedValue(0);
  const professorOpacity = useSharedValue(1);
  const professorTranslateY = useSharedValue(0);

  // Item Drop Feedback
  const dropEvent = game.state.lastEvents.find(e => e.type === 'ITEM_DROPPED');
  const [itemDropMsg, setItemDropMsg] = useState<{ text: string, rarity: string } | null>(null);

  useEffect(() => {
    if (dropEvent) {
      const item = itemsRegistry[dropEvent.payload?.itemId as string];
      if (item) {
        setItemDropMsg({
          text: `${item.name} (${item.rarity.toUpperCase()})`,
          rarity: item.rarity
        });
        const timer = setTimeout(() => setItemDropMsg(null), 12000); // 12 segundos conforme pedido
        return () => clearTimeout(timer);
      }
    }
  }, [dropEvent]);

  // Weapon Skill Info
  const weaponId = game.state.inventory.equippedWeapon;
  const weaponDef = weaponId ? itemsRegistry[weaponId] : null;
  const canUseSkill = weaponDef && weaponDef.category === 'weapon' && game.state.mana >= weaponDef.activeManaCost;

  useEffect(() => {
    if (!damaged && !successQuake) return;
    if (successQuake) {
      translateX.value = withSequence(
        withTiming(0, { duration: 20 }),
        withTiming(-3, { duration: 45 }),
        withTiming(3, { duration: 45 }),
        withTiming(0, { duration: 80 }),
      );
      return;
    }
    translateX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 80 }),
    );
  }, [damaged, successQuake, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const professorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: professorOpacity.value,
    transform: [{ translateY: professorTranslateY.value }],
  }));

  useEffect(() => {
    professorOpacity.value = 0;
    professorTranslateY.value = 8;
    professorOpacity.value = withSequence(withTiming(1, { duration: 180 }), withDelay(3200, withTiming(0, { duration: 520 })));
    professorTranslateY.value = withSequence(withTiming(0, { duration: 180 }), withDelay(3200, withTiming(-8, { duration: 520 })));
  }, [game.state.lastEvents, professorOpacity, professorTranslateY]);

  if (!question) return null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={[styles.animatedWrap, animatedStyle]}>
          <StatusBars state={game.state} events={game.state.lastEvents} />
          <Text style={styles.stage}>{game.level.name}</Text>
          <View style={styles.enemyWrap}>
            <EnemySprite icon={game.level.icon} spriteKey={enemy?.spriteKey} events={game.state.lastEvents} />
            {latestDamage && (eventTypes.includes('ANSWER_CORRECT') || eventTypes.includes('ACTIVE_SKILL_USED')) && (
              <Text style={styles.floatingDamage}>-{latestDamage}</Text>
            )}
            {(eventTypes.includes('ANSWER_CORRECT') || eventTypes.includes('ACTIVE_SKILL_USED')) && <Text style={styles.enemyBurst}>✦</Text>}
            {eventTypes.includes('ANSWER_CORRECT') && <Text style={[styles.missionGain, missionGainStyle(game.state.missionCurrent / game.state.balance.missionTarget)]}>★ +1 missão</Text>}
          </View>
          <QuestionCard question={question} timerPercent={game.timerPercent} />
          <AnswerGrid options={question.options} onAnswer={game.actions.answer} />

          {weaponDef && weaponDef.category === 'weapon' && (
            <TouchableOpacity 
              style={[styles.skillBtn, !canUseSkill && styles.skillBtnDisabled]} 
              onPress={() => game.actions.useActiveSkill('weapon')}
              disabled={!canUseSkill}
            >
              <Text style={styles.skillBtnText}>{weaponDef.activeName.toUpperCase()}</Text>
              <View style={styles.skillCostTag}>
                <Text style={styles.skillCostText}>{weaponDef.activeManaCost} MP</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.feedbackContainer}>
            {itemDropMsg ? (
              <Text style={[styles.itemDropText, { color: getRarityColor(itemDropMsg.rarity) }]}>
                ITEM ADQUIRIDO: {itemDropMsg.text}
              </Text>
            ) : (
              <Text style={styles.feedback}>{game.state.lastEvents.at(-1)?.type.replaceAll('_', ' ')}</Text>
            )}
          </View>

          <Animated.View style={[styles.professorReaction, game.state.combo >= 3 ? styles.professorCombo : null, professorAnimatedStyle]} key={`${professorMessage.text}-${game.state.lastEvents.at(-1)?.type ?? 'idle'}`}>
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
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Backpack Floating Button */}
      <TouchableOpacity style={styles.backpackBtn} onPress={() => setIsInventoryOpen(true)}>
        <Text style={styles.backpackEmoji}>🎒</Text>
      </TouchableOpacity>

      {/* Inventory Modal */}
      <Modal visible={isInventoryOpen} animationType="slide" transparent>
        <View style={styles.modalFull}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>INVENTÁRIO</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsInventoryOpen(false)}>
              <Text style={styles.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>
          <InventoryPanel 
            state={game.state} 
            actions={{
              equipItem: game.actions.equipItem,
              unequipItem: game.actions.unequipItem,
              discardItem: game.actions.discardItem,
              useConsumable: game.actions.useConsumable,
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

function missionGainStyle(progress: number) {
  if (progress >= 1) return styles.missionGainGold;
  if (progress >= 0.6) return styles.missionGainWarm;
  return styles.missionGainCool;
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return '#d1d5db';
    case 'uncommon': return '#4ade80';
    case 'rare': return '#60a5fa';
    case 'epic': return '#a855f7';
    case 'legendary': return '#fbbf24';
    case 'mythic': return '#ef4444';
    default: return '#fff';
  }
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
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: 100 },
  animatedWrap: { gap: spacing.md },
  stage: { color: colors.secondary, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  enemyWrap: { minHeight: 108, alignItems: 'center', justifyContent: 'center' },
  floatingDamage: { position: 'absolute', top: 0, color: colors.warning, fontSize: 24, fontWeight: '900', textShadowColor: '#ff9100', textShadowRadius: 10 },
  enemyBurst: { position: 'absolute', top: 28, color: colors.warning, fontSize: 58, opacity: 0.85 },
  missionGain: { position: 'absolute', bottom: 0, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999, overflow: 'hidden', color: '#151018', fontWeight: '900' },
  missionGainCool: { backgroundColor: colors.secondary },
  missionGainWarm: { backgroundColor: colors.warning },
  missionGainGold: { backgroundColor: '#ffb300' },
  feedbackContainer: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  feedback: { color: colors.secondary, textAlign: 'center', fontWeight: '800' },
  itemDropText: { fontSize: 14, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8 },
  professorReaction: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.secondary, backgroundColor: 'rgba(3,218,198,0.08)' },
  professorAvatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(0,0,0,0.24)' },
  professorCopy: { flex: 1, gap: 4 },
  professorCombo: { borderLeftColor: colors.accent, backgroundColor: 'rgba(255,0,255,0.08)' },
  professorTitle: { color: colors.text, fontWeight: '900' },
  professorText: { color: colors.text, lineHeight: 20 },
  skillBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginVertical: 10, borderBottomWidth: 4, borderBottomColor: '#1d4ed8' },
  skillBtnDisabled: { backgroundColor: '#4b5563', borderBottomColor: '#374151', opacity: 0.6 },
  skillBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  skillCostTag: { position: 'absolute', top: -8, right: 10, backgroundColor: '#00d2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#fff' },
  skillCostText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  backpackBtn: { position: 'absolute', bottom: 25, right: 25, width: 64, height: 64, borderRadius: 32, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  backpackEmoji: { fontSize: 32 },
  modalFull: { flex: 1, backgroundColor: '#0a0a14', marginTop: 40, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing.lg, borderTopWidth: 1, borderTopColor: 'rgba(124, 58, 237, 0.4)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.secondary, fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 24 },
});
