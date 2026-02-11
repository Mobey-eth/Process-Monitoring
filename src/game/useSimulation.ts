import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, ScenarioConfig } from './types';
import { createInitialState, gameReducer } from './engine';
import { audio } from '../audio/audio';

const TICK_INTERVAL = 200; // ms

export interface SimulationActions {
  toggleSystem: () => void;
  useValve: (gaugeId: string) => void;
  reset: () => void;
  recenter: () => void;
  systemReset: () => void;
}

export function useSimulation(scenario: ScenarioConfig) {
  const [state, dispatch] = useReducer(gameReducer, scenario, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track alarm and amber state for audio
  const prevAlarmRef = useRef(state.alarmActive);
  const prevAmberSetRef = useRef<Set<string>>(new Set());

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', dt: TICK_INTERVAL, scenario });
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [scenario]);

  // Alarm audio sync
  useEffect(() => {
    if (state.alarmActive && !prevAlarmRef.current) {
      audio.startAlarm();
    } else if (!state.alarmActive && prevAlarmRef.current) {
      audio.stopAlarm();
    }
    prevAlarmRef.current = state.alarmActive;
  }, [state.alarmActive]);

  // Warning beep when a gauge first enters amber
  useEffect(() => {
    const prevAmber = prevAmberSetRef.current;
    const currentAmber = new Set(
      state.gauges.filter(g => g.band === 'amber' || g.band === 'red').map(g => g.id)
    );
    // Play warning if any gauge just entered amber/red that wasn't before
    for (const id of currentAmber) {
      if (!prevAmber.has(id)) {
        audio.warning();
        break; // one beep per tick is enough
      }
    }
    prevAmberSetRef.current = currentAmber;
  }, [state.gauges]);

  // Stop alarm on unmount
  useEffect(() => {
    return () => audio.stopAlarm();
  }, []);

  // Warning auto-clear
  useEffect(() => {
    if (state.warningMessage && state.warningClearAt) {
      const delay = state.warningClearAt - state.timeElapsed;
      if (delay > 0) {
        const t = setTimeout(() => dispatch({ type: 'CLEAR_WARNING' }), delay);
        return () => clearTimeout(t);
      }
    }
  }, [state.warningMessage, state.warningClearAt, state.timeElapsed]);

  // Action handlers
  const toggleSystem = useCallback(() => {
    audio.click();
    dispatch({ type: 'TOGGLE_SYSTEM' });
  }, []);

  const useValve = useCallback((gaugeId: string) => {
    const g = stateRef.current.gauges.find(g => g.id === gaugeId);
    if (g && g.valveCooldownRemaining > 0) {
      audio.error();
    } else {
      audio.click();
    }
    dispatch({ type: 'USE_VALVE', gaugeId });
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    if (!s.alarmActive || !s.gauges.every(g => g.band === 'green')) {
      audio.error();
    } else {
      audio.click();
    }
    dispatch({ type: 'RESET' });
  }, []);

  const recenter = useCallback(() => {
    const s = stateRef.current;
    if (s.alarmActive || s.gauges.some(g => g.band === 'red')) {
      audio.error();
    } else {
      audio.click();
    }
    dispatch({ type: 'RECENTER' });
  }, []);

  const systemReset = useCallback(() => {
    const s = stateRef.current;
    if (!s.gauges.every(g => g.band === 'green')) {
      audio.error();
    } else {
      audio.click();
    }
    dispatch({ type: 'SYSTEM_RESET' });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (stateRef.current.scenarioComplete) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggleSystem();
          break;
        case 'r':
        case 'R':
          reset();
          break;
        case 'c':
        case 'C':
          recenter();
          break;
        case 's':
        case 'S':
          systemReset();
          break;
        case '1':
          useValve('co2');
          break;
        case '2':
          useValve('n2');
          break;
        case '3':
          useValve('w2');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSystem, reset, recenter, systemReset, useValve]);

  const actions: SimulationActions = {
    toggleSystem,
    useValve,
    reset,
    recenter,
    systemReset,
  };

  return { state, actions };
}
