import type { GameState, GameAction, GaugeState, ScenarioConfig, GaugeConfig } from './types';

/* ── Helpers ── */

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function getBand(value: number, greenMax: number, amberMax: number): 'green' | 'amber' | 'red' {
  if (value <= greenMax) return 'green';
  if (value <= amberMax) return 'amber';
  return 'red';
}

function gaugeFromConfig(cfg: GaugeConfig): GaugeState {
  return {
    id: cfg.id,
    label: cfg.label,
    unit: cfg.unit,
    value: cfg.initialValue,
    baseline: cfg.baseline,
    greenMax: cfg.greenMax,
    amberMax: cfg.amberMax,
    valveCooldownRemaining: 0,
    band: getBand(cfg.initialValue, cfg.greenMax, cfg.amberMax),
  };
}

/* ── Initial state factory ── */

export function createInitialState(scenario: ScenarioConfig): GameState {
  const surgeTime = scenario.surgeConfig
    ? (scenario.surgeConfig.surgeWindowStart +
       Math.random() * (scenario.surgeConfig.surgeWindowEnd - scenario.surgeConfig.surgeWindowStart)) * 1000
    : Infinity;

  // Compute initial output from gauge values so they start in sync
  const avgInit = scenario.gauges.reduce((s, g) => s + g.initialValue, 0) / scenario.gauges.length;
  const avgBase = scenario.gauges.reduce((s, g) => s + g.baseline, 0) / scenario.gauges.length;
  const avgAmber = scenario.gauges.reduce((s, g) => s + g.amberMax, 0) / scenario.gauges.length;
  const dev = avgInit - avgBase;
  const maxDev = avgAmber - avgBase;
  const out = scenario.output;
  const computedOutput = out.baseline + (dev / maxDev) * (out.threshold - out.baseline);
  const initialOutput = clamp(computedOutput);

  return {
    systemOn: scenario.initialSystemOn,
    alarmActive: scenario.initialAlarmActive,
    gauges: scenario.gauges.map(gaugeFromConfig),
    outputValue: initialOutput,
    outputHistory: [initialOutput],
    timeRemaining: scenario.timeLimit * 1000,
    timeElapsed: 0,
    score: 100,
    actionLog: [],
    mistakes: [],
    bonuses: [],
    priorityGaugeId: null,
    priorityGaugeSetAt: null,
    scenarioComplete: false,
    surgeTriggered: false,
    surgeTime,
    warningMessage: null,
    warningClearAt: null,
    actionCount: 0,
    redAccumulator: 0,
    priorityIgnoreAccumulator: 0,
    lastPriorityPenaltyAt: 0,
    lastRedPenaltyAt: 0,
    systemResetUsed: false,
  };
}

/* ── The reducer ── */

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.scenarioComplete && action.type !== 'TICK') return state;

  switch (action.type) {
    case 'TICK':
      return tickState(state, action.dt, action.scenario);

    case 'TOGGLE_SYSTEM':
      return handleToggleSystem(state);

    case 'USE_VALVE':
      return handleUseValve(state, action.gaugeId);

    case 'RESET':
      return handleReset(state);

    case 'RECENTER':
      return handleRecenter(state);

    case 'SYSTEM_RESET':
      return handleSystemReset(state);

    case 'CLEAR_WARNING':
      return { ...state, warningMessage: null, warningClearAt: null };

    default:
      return state;
  }
}

/* ── TICK: advance simulation by dt ms ── */

function tickState(state: GameState, dt: number, scenario: ScenarioConfig): GameState {
  if (state.scenarioComplete) return state;

  let s = { ...state };
  s.timeElapsed += dt;
  s.timeRemaining -= dt;

  // Clear warning if expired
  if (s.warningClearAt && s.timeElapsed >= s.warningClearAt) {
    s.warningMessage = null;
    s.warningClearAt = null;
  }

  // Time's up
  if (s.timeRemaining <= 0) {
    s.timeRemaining = 0;
    s.scenarioComplete = true;
    return s;
  }

  // Surge check (Scenario D)
  if (scenario.surgeConfig && !s.surgeTriggered && s.timeElapsed >= s.surgeTime) {
    s.surgeTriggered = true;
    s.gauges = s.gauges.map(g => {
      if (g.id === scenario.surgeConfig!.gaugeId) {
        const newVal = clamp(g.value + scenario.surgeConfig!.surgeAmount);
        return { ...g, value: newVal, band: getBand(newVal, g.greenMax, g.amberMax) };
      }
      return g;
    });
  }

  // Update gauge values
  const gaugeConfigs = new Map(scenario.gauges.map(g => [g.id, g]));
  s.gauges = s.gauges.map(g => {
    const cfg = gaugeConfigs.get(g.id)!;
    let newVal = g.value;
    let cooldown = Math.max(0, g.valveCooldownRemaining - dt);

    if (s.systemOn) {
      // Drift up + noise
      newVal += cfg.driftRate + (Math.random() - 0.5) * cfg.noiseAmplitude;
      // Random spike: ~3% chance per tick per gauge, +5 to +15 units
      if (Math.random() < 0.03) {
        newVal += 5 + Math.random() * 10;
      }
    } else {
      // Decay toward baseline
      const diff = newVal - cfg.baseline;
      newVal -= Math.sign(diff) * Math.min(Math.abs(diff), cfg.decayRate);
      newVal += (Math.random() - 0.5) * cfg.noiseAmplitude * 0.3;
    }

    newVal = clamp(newVal);
    return {
      ...g,
      value: newVal,
      valveCooldownRemaining: cooldown,
      band: getBand(newVal, g.greenMax, g.amberMax),
    };
  });

  // Update output value — derived from gauge levels so they correspond
  const outCfg = scenario.output;
  const avgGaugeVal = s.gauges.reduce((sum, g) => sum + g.value, 0) / s.gauges.length;
  const avgBaseline = s.gauges.reduce((sum, g) => sum + g.baseline, 0) / s.gauges.length;
  const avgAmberMax = s.gauges.reduce((sum, g) => sum + g.amberMax, 0) / s.gauges.length;
  const deviation = avgGaugeVal - avgBaseline;
  const maxDeviation = avgAmberMax - avgBaseline;
  // Maps gauge deviation proportionally: gauges at amber ≈ output at threshold
  const outputTarget = outCfg.baseline + (deviation / maxDeviation) * (outCfg.threshold - outCfg.baseline);

  if (s.systemOn) {
    // Smooth toward gauge-driven target + small upward drift bias
    s.outputValue += (outputTarget - s.outputValue) * 0.08
      + outCfg.driftRate * 0.3
      + (Math.random() - 0.5) * outCfg.noiseAmplitude;
  } else {
    // Decay toward baseline
    const diff = s.outputValue - outCfg.baseline;
    s.outputValue -= Math.sign(diff) * Math.min(Math.abs(diff), outCfg.decayRate);
    s.outputValue += (Math.random() - 0.5) * outCfg.noiseAmplitude * 0.3;
  }
  s.outputValue = clamp(s.outputValue);

  // Keep history (last ~150 entries = 30s at 200ms)
  s.outputHistory = [...s.outputHistory, s.outputValue];
  if (s.outputHistory.length > 150) {
    s.outputHistory = s.outputHistory.slice(-150);
  }

  // Alarm logic: triggers when any gauge red OR output > threshold
  const anyRed = s.gauges.some(g => g.band === 'red');
  const outputDanger = s.outputValue >= outCfg.threshold;
  if ((anyRed || outputDanger) && !s.alarmActive) {
    s.alarmActive = true;
    s.actionLog = [...s.actionLog, {
      time: s.timeElapsed, action: 'ALARM TRIGGERED',
      detail: anyRed ? 'Gauge in red zone' : 'Output exceeded threshold', valid: true,
    }];
  }

  // Priority gauge: first gauge to enter amber or red
  if (!s.priorityGaugeId) {
    const priority = s.gauges.find(g => g.band === 'amber' || g.band === 'red');
    if (priority) {
      s.priorityGaugeId = priority.id;
      s.priorityGaugeSetAt = s.timeElapsed;
    }
  } else {
    // Clear priority if it returned to green
    const pg = s.gauges.find(g => g.id === s.priorityGaugeId);
    if (pg && pg.band === 'green') {
      s.priorityGaugeId = null;
      s.priorityGaugeSetAt = null;
      s.priorityIgnoreAccumulator = 0;
      // Check if another gauge needs priority
      const next = s.gauges.find(g => g.band === 'amber' || g.band === 'red');
      if (next) {
        s.priorityGaugeId = next.id;
        s.priorityGaugeSetAt = s.timeElapsed;
      }
    }
  }

  // Penalty: gauge in red accumulator
  if (anyRed) {
    s.redAccumulator += dt;
    if (s.redAccumulator - s.lastRedPenaltyAt >= 3000) {
      s.lastRedPenaltyAt = s.redAccumulator;
      s.score -= 3;
      s.mistakes = [...s.mistakes, {
        time: s.timeElapsed, type: 'red-duration',
        description: 'Gauge remained in red zone for 3+ seconds.', penalty: 3,
      }];
    }
  } else {
    s.redAccumulator = 0;
    s.lastRedPenaltyAt = 0;
  }

  // Penalty: priority gauge ignored
  if (s.priorityGaugeId && s.priorityGaugeSetAt) {
    s.priorityIgnoreAccumulator += dt;
    if (s.priorityIgnoreAccumulator - s.lastPriorityPenaltyAt >= 5000) {
      s.lastPriorityPenaltyAt = s.priorityIgnoreAccumulator;
      s.score -= 5;
      s.mistakes = [...s.mistakes, {
        time: s.timeElapsed, type: 'priority-ignored',
        description: `Priority gauge (${s.priorityGaugeId.toUpperCase()}) ignored for 5+ seconds.`, penalty: 5,
      }];
    }
  }

  return s;
}

/* ── Action handlers ── */

function warn(state: GameState, msg: string): GameState {
  return {
    ...state,
    warningMessage: msg,
    warningClearAt: state.timeElapsed + 2000,
  };
}

function logAction(state: GameState, action: string, detail: string, valid: boolean): GameState {
  return {
    ...state,
    actionCount: state.actionCount + 1,
    actionLog: [...state.actionLog, { time: state.timeElapsed, action, detail, valid }],
  };
}

function handleToggleSystem(state: GameState): GameState {
  const newOn = !state.systemOn;
  let s = logAction(state, newOn ? 'SYSTEM ON' : 'SYSTEM OFF', '', true);
  s.systemOn = newOn;
  return s;
}

function handleUseValve(state: GameState, gaugeId: string): GameState {
  const gauge = state.gauges.find(g => g.id === gaugeId);
  if (!gauge) return state;

  if (gauge.valveCooldownRemaining > 0) {
    return warn(
      logAction(state, `VALVE ${gaugeId.toUpperCase()}`, 'Cooldown active', false),
      `${gauge.label} valve is cooling down!`
    );
  }

  // Penalty if not the priority gauge
  let s = logAction(state, `VALVE ${gaugeId.toUpperCase()}`, '', true);
  if (s.priorityGaugeId && s.priorityGaugeId !== gaugeId) {
    const priorityGauge = s.gauges.find(g => g.id === s.priorityGaugeId);
    if (priorityGauge && priorityGauge.band !== 'green') {
      s.score -= 5;
      s.mistakes = [...s.mistakes, {
        time: s.timeElapsed, type: 'wrong-priority',
        description: `Used ${gauge.label} valve but ${priorityGauge.label} was the priority (flashing).`, penalty: 5,
      }];
    }
  }

  // If this IS the priority gauge and acted quickly, bonus
  if (s.priorityGaugeId === gaugeId && s.priorityGaugeSetAt) {
    const reactionTime = s.timeElapsed - s.priorityGaugeSetAt;
    if (reactionTime < 3000) {
      s.score += 10;
      s.bonuses = [...s.bonuses, {
        time: s.timeElapsed, type: 'fast-isolation',
        description: `Quickly isolated ${gauge.label} (${(reactionTime / 1000).toFixed(1)}s).`, points: 10,
      }];
    }
    s.priorityIgnoreAccumulator = 0;
    s.lastPriorityPenaltyAt = 0;
  }

  // Apply valve: find the gauge config and reduce value
  s.gauges = s.gauges.map(g => {
    if (g.id !== gaugeId) return g;
    const newVal = clamp(g.value - 12); // standard reduction
    return {
      ...g,
      value: newVal,
      band: getBand(newVal, g.greenMax, g.amberMax),
      valveCooldownRemaining: 4000,
    };
  });

  return s;
}

function handleReset(state: GameState): GameState {
  if (!state.alarmActive) {
    return warn(
      logAction(state, 'RESET', 'No alarm active', false),
      'No alarm to reset!'
    );
  }

  // Check if all gauges are in green (normal)
  const allGreen = state.gauges.every(g => g.band === 'green');
  if (!allGreen) {
    // Panic reset
    let s = logAction(state, 'RESET', 'Panic reset - values not normal', false);
    s.score -= 15;
    s.mistakes = [...s.mistakes, {
      time: s.timeElapsed, type: 'panic-reset',
      description: 'Pressed Reset while gauges were not in the green band — panic reset!', penalty: 15,
    }];
    return warn(s, 'PANIC RESET! Wait for green before resetting.');
  }

  // Valid reset
  let s = logAction(state, 'RESET', 'Alarm cleared', true);
  s.alarmActive = false;
  s.score += 10;
  s.bonuses = [...s.bonuses, {
    time: s.timeElapsed, type: 'stable-reset',
    description: 'Reset performed correctly after values stabilized.', points: 10,
  }];
  return s;
}

function handleRecenter(state: GameState): GameState {
  if (state.alarmActive) {
    let s = logAction(state, 'RECENTER', 'Alarm active', false);
    s.score -= 10;
    s.mistakes = [...s.mistakes, {
      time: s.timeElapsed, type: 'recenter-during-alarm',
      description: 'Used Recenter while alarm was active — not allowed!', penalty: 10,
    }];
    return warn(s, 'Cannot Recenter while alarm is active!');
  }

  // Check no gauges in red
  if (state.gauges.some(g => g.band === 'red')) {
    let s = logAction(state, 'RECENTER', 'Gauge in red', false);
    s.score -= 5;
    s.mistakes = [...s.mistakes, {
      time: s.timeElapsed, type: 'recenter-while-red',
      description: 'Used Recenter while a gauge was in the red zone.', penalty: 5,
    }];
    return warn(s, 'Cannot Recenter — a gauge is in the red zone!');
  }

  // Valid recenter: nudge all gauges toward baseline
  let s = logAction(state, 'RECENTER', 'Values nudged toward baseline', true);
  s.gauges = s.gauges.map(g => {
    const diff = g.value - g.baseline;
    const nudge = diff * 0.3; // reduce drift by 30%
    const newVal = clamp(g.value - nudge);
    return { ...g, value: newVal, band: getBand(newVal, g.greenMax, g.amberMax) };
  });
  return s;
}

function handleSystemReset(state: GameState): GameState {
  // System reset: full re-initialization. Penalty if used while unstable.
  const allGreen = state.gauges.every(g => g.band === 'green');

  if (!allGreen) {
    let s = logAction(state, 'SYSTEM RESET', 'Values not stable', false);
    s.score -= 15;
    s.mistakes = [...s.mistakes, {
      time: s.timeElapsed, type: 'premature-system-reset',
      description: 'System Reset used before full stabilization — values were not in green.', penalty: 15,
    }];
    return warn(s, 'System Reset denied — stabilize first!');
  }

  // Valid system reset
  let s = logAction(state, 'SYSTEM RESET', 'System reinitialized', true);
  s.systemOn = false;
  s.alarmActive = false;
  s.systemResetUsed = true;
  // Reset gauges closer to baseline
  s.gauges = s.gauges.map(g => {
    const newVal = g.baseline + (Math.random() - 0.5) * 4;
    return { ...g, value: clamp(newVal), band: 'green' as const, valveCooldownRemaining: 0 };
  });
  return s;
}
