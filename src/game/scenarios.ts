import type { ScenarioConfig } from './types';

const defaultGauges = (overrides?: Partial<Record<string, Partial<import('./types').GaugeConfig>>>) => {
  const base: import('./types').GaugeConfig[] = [
    {
      id: 'co2', label: 'CO₂', unit: '%',
      baseline: 40, initialValue: 42,
      greenMax: 60, amberMax: 80,
      driftRate: 0.15, noiseAmplitude: 0.8, decayRate: 0.3,
      valveReduction: 12, valveCooldown: 4000,
    },
    {
      id: 'n2', label: 'N₂', unit: '%',
      baseline: 38, initialValue: 40,
      greenMax: 60, amberMax: 80,
      driftRate: 0.12, noiseAmplitude: 0.6, decayRate: 0.25,
      valveReduction: 12, valveCooldown: 4000,
    },
    {
      id: 'w2', label: 'W₂', unit: '%',
      baseline: 35, initialValue: 36,
      greenMax: 60, amberMax: 80,
      driftRate: 0.10, noiseAmplitude: 0.5, decayRate: 0.2,
      valveReduction: 12, valveCooldown: 4000,
    },
  ];
  if (overrides) {
    return base.map(g => ({ ...g, ...(overrides[g.id] || {}) }));
  }
  return base;
};

export const scenarios: ScenarioConfig[] = [
  /* ── A: Chemical Reactor Control ── */
  {
    id: 'chemical-reactor',
    title: 'Chemical Reactor Control',
    subtitle: 'Output creeping above safe limits',
    whatYouSee: [
      'The reactor output is steadily climbing above 70% and approaching the 80% danger threshold.',
      'All three gas gauges are slightly elevated but still within normal range.',
      'The system is currently ON and producing.',
    ],
    rules: [
      'Turn the system OFF immediately when output exceeds safe limits.',
      'Wait for output to drop below 75% (safe threshold) before resetting.',
      'Do NOT press Reset while values are still elevated — this is a "panic reset".',
      'Once values are in the green, press Reset to clear any alarm, then turn ON.',
    ],
    task: [
      'Step 1: Turn system OFF to halt production.',
      'Step 2: Monitor output — wait until it drops below 75%.',
      'Step 3: Press Reset to clear the alarm.',
      'Step 4: Turn the system back ON.',
    ],
    timeLimit: 40,
    gauges: defaultGauges({
      co2: { initialValue: 48, driftRate: 0.2 },
      n2: { initialValue: 45, driftRate: 0.18 },
      w2: { initialValue: 42, driftRate: 0.14 },
    }),
    output: {
      label: 'Reactor Output',
      baseline: 50, initialValue: 72,
      threshold: 80, safeMax: 75,
      driftRate: 0.25, decayRate: 0.4,
      noiseAmplitude: 0.5,
    },
    initialSystemOn: true,
    initialAlarmActive: false,
    recommendedSolution: [
      '1. Immediately press OFF — output is creeping toward danger.',
      '2. Watch the output chart — it will start decaying.',
      '3. Wait until output drops below 75% (the safe line).',
      '4. Press RESET to clear the alarm that triggered.',
      '5. Press ON to resume production safely.',
      '6. If individual gauges crept into amber, use their valves.',
    ],
    commonMistakes: [
      'Pressing Reset while output is still above 75% (panic reset, −15 pts).',
      'Turning system back ON before output is stable.',
      'Using Recenter while alarm is active.',
      'Not acting quickly enough — letting output reach red.',
    ],
  },

  /* ── B: Gas Mixture Balance ── */
  {
    id: 'gas-balance',
    title: 'Gas Mixture Balance',
    subtitle: 'Three gauges drifting out of balance',
    whatYouSee: [
      'All three gas gauges (CO₂, N₂, W₂) are drifting upward at different rates.',
      'CO₂ is rising fastest and will enter warning first.',
      'Output is currently stable near baseline.',
    ],
    rules: [
      'Prioritize the FIRST gauge that enters warning (flashing outline).',
      'Use that gauge\'s valve before addressing others.',
      'If you fix a non-priority gauge first, you receive a penalty.',
      'Use Recenter only when all gauges are in green/amber with no alarm.',
    ],
    task: [
      'Step 1: Watch gauges — identify which enters warning first.',
      'Step 2: Use that gauge\'s valve immediately.',
      'Step 3: Address other gauges as they drift.',
      'Step 4: Use Recenter when stable to fine-tune.',
      'Step 5: Keep all gauges in green until time runs out.',
    ],
    timeLimit: 75,
    gauges: defaultGauges({
      co2: { initialValue: 50, driftRate: 0.35, noiseAmplitude: 1.0 },
      n2: { initialValue: 45, driftRate: 0.25, noiseAmplitude: 0.8 },
      w2: { initialValue: 40, driftRate: 0.18, noiseAmplitude: 0.6 },
    }),
    output: {
      label: 'Process Output',
      baseline: 50, initialValue: 50,
      threshold: 85, safeMax: 80,
      driftRate: 0.08, decayRate: 0.2,
      noiseAmplitude: 0.6,
    },
    initialSystemOn: true,
    initialAlarmActive: false,
    recommendedSolution: [
      '1. Keep system ON — no need to turn off initially.',
      '2. CO₂ will reach warning first (it drifts fastest).',
      '3. Immediately use CO₂ valve when it starts flashing.',
      '4. Watch N₂ — it will reach warning next. Use N₂ valve.',
      '5. W₂ drifts slowest, handle it if needed.',
      '6. Once all gauges are stable in green, use Recenter.',
      '7. Maintain until time expires.',
    ],
    commonMistakes: [
      'Using N₂ or W₂ valve before addressing flashing CO₂ (−5 pts).',
      'Pressing Reset when no alarm is active.',
      'Turning system OFF unnecessarily — gauges can be managed with valves.',
      'Ignoring the priority gauge for too long (−5 pts per 5s).',
    ],
  },

  /* ── C: Alarm Response ── */
  {
    id: 'alarm-response',
    title: 'Alarm Response',
    subtitle: 'System offline with active alarm',
    whatYouSee: [
      'The system is currently OFF.',
      'The ALARM indicator is flashing — an alarm condition exists.',
      'CO₂ gauge is elevated at ~72%, near the amber/red boundary.',
    ],
    rules: [
      'The alarm can only be cleared when the system is running AND gauges are stable.',
      'Turn the system ON first — the alarm condition resolves when the system stabilizes.',
      'Do NOT attempt Reset while gauges are still in amber or red.',
      'Wait for all gauges to return to green before pressing Reset.',
    ],
    task: [
      'Step 1: Turn the system ON.',
      'Step 2: Use valves to bring elevated gauges down if needed.',
      'Step 3: Wait for gauges to reach green band.',
      'Step 4: Press Reset to clear the alarm.',
    ],
    timeLimit: 50,
    gauges: defaultGauges({
      co2: { initialValue: 72, driftRate: 0.10, decayRate: 0.05 },
      n2: { initialValue: 55, driftRate: 0.08 },
      w2: { initialValue: 48, driftRate: 0.06 },
    }),
    output: {
      label: 'Process Output',
      baseline: 50, initialValue: 60,
      threshold: 85, safeMax: 80,
      driftRate: 0.05, decayRate: 0.15,
      noiseAmplitude: 0.4,
    },
    initialSystemOn: false,
    initialAlarmActive: true,
    recommendedSolution: [
      '1. Press ON to start the system.',
      '2. CO₂ is at 72% (amber) — use CO₂ valve to bring it down.',
      '3. Monitor all gauges — they will drift slowly while ON.',
      '4. Wait until ALL gauges are in the green band.',
      '5. Press RESET to clear the alarm.',
      '6. Continue monitoring until time expires.',
    ],
    commonMistakes: [
      'Pressing Reset immediately while system is OFF (invalid action, −15 pts).',
      'Pressing Reset while CO₂ is still in amber (panic reset, −15 pts).',
      'Not using CO₂ valve — relying on natural decay which is too slow.',
      'Turning system OFF again after just turning it ON.',
    ],
  },

  /* ── D: Sudden Surge ── */
  {
    id: 'sudden-surge',
    title: 'Sudden Surge',
    subtitle: 'Unexpected N₂ spike mid-operation',
    whatYouSee: [
      'The system is running normally — all gauges are in the green.',
      'At some point between 10–20 seconds, N₂ will suddenly spike into the red zone.',
      'You must react quickly to the surge.',
    ],
    rules: [
      'When the surge happens, turn OFF immediately to stop production.',
      'Use the N₂ valve to help bring the spiked gauge down faster.',
      'Wait for N₂ to return to normal (green) before pressing Reset.',
      'Then turn the system back ON and monitor.',
    ],
    task: [
      'Step 1: Monitor — system starts normally.',
      'Step 2: When N₂ spikes, press OFF immediately.',
      'Step 3: Use N₂ valve.',
      'Step 4: Wait for N₂ to return to green.',
      'Step 5: Press Reset, then turn ON.',
      'Step 6: Monitor remaining time.',
    ],
    timeLimit: 60,
    gauges: defaultGauges({
      co2: { initialValue: 38, driftRate: 0.08 },
      n2: { initialValue: 36, driftRate: 0.06 },
      w2: { initialValue: 34, driftRate: 0.05 },
    }),
    output: {
      label: 'Reactor Output',
      baseline: 50, initialValue: 48,
      threshold: 85, safeMax: 80,
      driftRate: 0.06, decayRate: 0.3,
      noiseAmplitude: 0.4,
    },
    initialSystemOn: true,
    initialAlarmActive: false,
    surgeConfig: {
      gaugeId: 'n2',
      surgeAmount: 50,
      surgeWindowStart: 10,
      surgeWindowEnd: 20,
    },
    recommendedSolution: [
      '1. Let the system run — everything is normal initially.',
      '2. When N₂ suddenly spikes (you\'ll see it jump into red, alarm triggers):',
      '3. Immediately press OFF.',
      '4. Press the N₂ valve to accelerate the drop.',
      '5. Watch N₂ decay back toward baseline.',
      '6. Once N₂ is in green, press RESET to clear alarm.',
      '7. Press ON to resume production.',
      '8. Monitor until time expires.',
    ],
    commonMistakes: [
      'Not turning OFF quickly enough after the surge (values stay in red longer).',
      'Pressing Reset while N₂ is still in red or amber (panic reset, −15 pts).',
      'Using the wrong valve (CO₂ or W₂ instead of N₂).',
      'Pressing System Reset instead of the normal Reset sequence.',
    ],
  },
];
