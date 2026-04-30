import { Image, StyleSheet, Text, View } from 'react-native';
import { enemySpritesByKey, type EnemySpriteKey, type SpriteSheetKey } from '@reino/assets';
import type { GameEvent } from '@reino/game-core';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

interface EnemySpriteProps {
  icon: string;
  spriteKey?: string;
  events?: GameEvent[];
}

const spriteSheets: Record<SpriteSheetKey, ReturnType<typeof require>> = {
  roguelike: require('../../assets/sprites/kenney-roguelike.png'),
  characters: require('../../assets/sprites/kenney-roguelike-characters.png'),
  dungeon: require('../../assets/sprites/kenney-roguelike-dungeon.png'),
  tinyDungeon: require('../../assets/sprites/kenney-tiny-dungeon.png'),
  micro: require('../../assets/sprites/kenney-micro-roguelike.png'),
  uiRpg: require('../../assets/sprites/kenney-ui-rpg.png'),
};
const scale = 5;

export function EnemySprite({ icon, spriteKey, events = [] }: EnemySpriteProps) {
  const sprite = spriteKey && spriteKey in enemySpritesByKey
    ? enemySpritesByKey[spriteKey as EnemySpriteKey]
    : null;
  const hit = events.some((event) => event.type === 'ANSWER_CORRECT');
  const scaleValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    if (!hit) return;
    scaleValue.value = withSequence(withTiming(1.18, { duration: 120 }), withTiming(1, { duration: 180 }));
    rotateValue.value = withSequence(withTiming(-4, { duration: 80 }), withTiming(4, { duration: 80 }), withTiming(0, { duration: 120 }));
  }, [hit, rotateValue, scaleValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }, { rotate: `${rotateValue.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      {sprite ? (
        <View
          accessibilityLabel={sprite.label}
          style={[
            styles.spriteViewport,
            { width: sprite.width * scale, height: sprite.height * scale },
          ]}
        >
          <Image
            source={spriteSheets[sprite.sheetKey]}
            style={{
              width: sprite.sheetWidth * scale,
              height: sprite.sheetHeight * scale,
              transform: [
                { translateX: -sprite.x * scale },
                { translateY: -sprite.y * scale },
              ],
            }}
            resizeMode="stretch"
          />
        </View>
      ) : (
        <Text style={styles.icon}>{icon}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 76 },
  spriteViewport: {
    overflow: 'hidden',
  },
});
