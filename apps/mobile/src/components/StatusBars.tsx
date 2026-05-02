import { StyleSheet, Text, View, Image } from 'react-native';
import type { GameEvent, GameState } from '@reino/game-core';
import { colors, spacing } from '../theme/tokens';

interface StatusBarsProps {
  state: GameState;
  events?: GameEvent[];
}

export function StatusBars({ state, events = [] }: StatusBarsProps) {
  const eventTypes = events.map((event) => event.type);
  const manaPercent = (state.mana / state.balance.manaMax) * 100;
  const manaColor = manaPercent <= 0 ? '#1e1e2d' : manaPercent < 35 ? '#7c3aed' : '#00d2ff';
  const manaDelta = [...events].reverse().find((event) => event.type.startsWith('MANA_') && typeof event.payload?.amount === 'number');
  const manaHint = state.status !== 'playing' || state.mana <= 0 ? 'sem mana' : 'mana ativo';
  const manaDeltaText = manaDelta ? manaEventText(manaDelta.type, Number(manaDelta.payload?.amount)) : manaHint;

  return (
    <View style={styles.card}>
      <Bar 
        label="Herói HP" 
        value={state.playerHp} 
        color="#ff1744" 
        active={eventTypes.includes('PLAYER_DAMAGED')} 
        icon={require('../../assets/game-images/vial of health potion.png')}
      />
      <Bar 
        label="Inimigo HP" 
        value={(state.enemyHp / state.enemyMaxHp) * 100} 
        color="#ff9100" 
        active={eventTypes.includes('ANSWER_CORRECT') || eventTypes.includes('ACTIVE_SKILL_USED')} 
        icon={require('../../assets/game-images/knighte.png')}
      />
      <Bar 
        label={`Missão: ${state.missionCurrent}/${state.balance.missionTarget}`} 
        value={(state.missionCurrent / state.balance.missionTarget) * 100} 
        color="#00bcd4" 
        active={eventTypes.includes('ANSWER_CORRECT')} 
        icon={require('../../assets/game-images/bag of gold.png')}
      />
      <Bar 
        label={`Mana: ${Math.round(state.mana)}/${state.balance.manaMax}`} 
        value={manaPercent} 
        color={manaColor} 
        active={eventTypes.some((type) => type.startsWith('MANA_'))} 
        hint={manaDeltaText} 
        icon={require('../../assets/game-images/vial of green poison.png')}
      />
    </View>
  );
}

function Bar({ label, value, color, active, hint, icon }: { label: string; value: number; color: string; active?: boolean; hint?: string; icon?: any }) {
  return (
    <View style={[styles.barWrap, active && styles.activeBar]}>
      <View style={styles.labelRow}>
        {icon && <Image source={icon} style={styles.barIcon} />}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]}>
          <View style={styles.barShine} />
        </View>
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function manaEventText(type: string, amount: number) {
  if (type === 'MANA_GAINED') return `+${Math.round(amount)} MANA`;
  if (type === 'MANA_SPENT') return `-${Math.round(amount)} MANA`;
  if (type === 'MANA_DEPLETED') return 'MANA esgotada';
  return 'MANA ativo';
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)' },
  barWrap: { gap: 6, padding: 2, borderRadius: 10 },
  activeBar: { backgroundColor: 'rgba(255,255,255,0.08)' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barIcon: { width: 14, height: 14, resizeMode: 'contain' },
  label: { color: colors.text, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  hint: { color: '#cfd0df', fontSize: 11, fontWeight: '700' },
  barBg: { height: 14, overflow: 'hidden', borderRadius: 8, backgroundColor: '#202033', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  barFill: { height: '100%', borderRadius: 8, shadowColor: '#fff', shadowOpacity: 0.35, shadowRadius: 8 },
  barShine: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
});
