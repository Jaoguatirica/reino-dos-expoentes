import { useEffect, useReducer, useRef, useState } from 'react';
import { createInitialGameState, gameReducer } from '@reino/game-core';
import type { EquipmentSlot } from '@reino/game-core';
import { defaultGameBalance, levels } from '@reino/game-content';
import { logger } from '@reino/logger';
import { clearWebProgress, loadWebProgress, saveWebProgress } from '../lib/progress-storage';

interface UseGameControllerOptions {
  paused?: boolean;
}

export function useGameController({ paused = false }: UseGameControllerOptions = {}) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialGameState(levels, defaultGameBalance));
  const [progress, setProgress] = useState(loadWebProgress);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const pendingQuestionRef = useRef(false);
  const activeQuestionRef = useRef(state.currentQuestion);

  const level = state.levels[state.currentLevelIndex];
  const effectiveTimeLimitSeconds = level.timeLimitSeconds ?? 0;

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused && pendingQuestionRef.current) {
      pendingQuestionRef.current = false;
      dispatch({ type: 'GENERATE_QUESTION' });
    }
  }, [paused]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (paused) return;

    if (state.status !== 'playing' || !effectiveTimeLimitSeconds || state.currentQuestion === null) {
      setTimeLeft(0);
      return;
    }

    const questionChanged = activeQuestionRef.current !== state.currentQuestion;
    activeQuestionRef.current = state.currentQuestion;

    setTimeLeft((current) => (questionChanged || current <= 0 ? effectiveTimeLimitSeconds : current));

    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        const next = Math.max(0, current - 0.1);
        if (next <= 0) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          dispatch({ type: 'TIMEOUT' });
          dispatch({ type: 'GENERATE_QUESTION' });
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [paused, state.status, state.currentQuestion, effectiveTimeLimitSeconds]);

  useEffect(() => {
    state.lastEvents.forEach((gameEvent) => logger.info('GameEvent', gameEvent.type, gameEvent.payload));
  }, [state.lastEvents]);

  useEffect(() => {
    if (state.status !== 'victory' && state.status !== 'completed') return;

    setProgress((current) => {
      const next = {
        ...current,
        highestUnlockedLevelIndex: Math.max(current.highestUnlockedLevelIndex, state.currentLevelIndex + 1),
      };
      saveWebProgress(next);
      return next;
    });
  }, [state.currentLevelIndex, state.status]);

  function answer(selected: number) {
    if (paused) return;
    dispatch({ type: 'ANSWER', selected });

    setTimeout(() => {
      if (pausedRef.current) {
        pendingQuestionRef.current = true;
        return;
      }
      dispatch({ type: 'GENERATE_QUESTION' });
    }, 700);
  }

  return {
    state,
    level,
    progress,
    timeLeft,
    effectiveTimeLimitSeconds,
    timerPercent: effectiveTimeLimitSeconds ? (timeLeft / effectiveTimeLimitSeconds) * 100 : 0,
    actions: {
      start: () => dispatch({ type: 'START_GAME' }),
      answer,
      nextLevel: () => dispatch({ type: 'NEXT_LEVEL' }),
      reset: () => dispatch({ type: 'RESET_GAME' }),
      equipItem: (inventoryIndex: number, slot: EquipmentSlot) => dispatch({ type: 'EQUIP_ITEM', inventoryIndex, slot }),
      unequipItem: (slot: EquipmentSlot) => dispatch({ type: 'UNEQUIP_ITEM', slot }),
      discardItem: (inventoryIndex: number) => dispatch({ type: 'DISCARD_ITEM', inventoryIndex }),
      useActiveSkill: (slot: EquipmentSlot) => dispatch({ type: 'USE_ACTIVE_SKILL', slot }),
      useConsumable: (inventoryIndex: number) => dispatch({ type: 'USE_CONSUMABLE', inventoryIndex }),
      resetProgress: () => {
        clearWebProgress();
        setProgress(loadWebProgress());
        dispatch({ type: 'RESET_GAME' });
      },
      toggleMusic: () => setProgress((current) => {
        const next = { ...current, musicEnabled: !current.musicEnabled };
        saveWebProgress(next);
        return next;
      }),
      toggleSfx: () => setProgress((current) => {
        const next = { ...current, sfxEnabled: !current.sfxEnabled };
        saveWebProgress(next);
        return next;
      }),
      setMusicVolume: (volume: number) => setProgress((current) => {
        const next = { ...current, musicVolume: clampVolume(volume) };
        saveWebProgress(next);
        return next;
      }),
      setSfxVolume: (volume: number) => setProgress((current) => {
        const next = { ...current, sfxVolume: clampVolume(volume) };
        saveWebProgress(next);
        return next;
      }),
    },
  };
}

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume));
}
