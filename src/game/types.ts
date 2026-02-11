/* ── Core type definitions for the Process Monitoring simulation ── */

export interface GaugeConfig {
  id: string;
  label: string;
  unit: string;
  baseline: number;
  initialValue: number;
  greenMax: number;
  amberMax: number;
  /** Per-tick drift when system ON (positive = upward) */
  driftRate: number;
  /** Random noise amplitude */
  noiseAmplitude: number;
  /** Per-tick decay toward baseline when system OFF */
  decayRate: number;
  /** Instant value reduction when valve used */
  valveReduction: number;
  /** Valve cooldown in ms */
  valveCooldown: number;
}

export interface GaugeState {
  id: string;
  label: string;
  unit: string;
  value: number;
  baseline: number;
  greenMax: number;
  amberMax: number;
  valveCooldownRemaining: number;
  band: 'green' | 'amber' | 'red';
}

export interface OutputConfig {
  label: string;
  baseline: number;
  initialValue: number;
  threshold: number;
  safeMax: number;
  driftRate: number;
  decayRate: number;
  noiseAmplitude: number;
}

export interface ScenarioConfig {
  id: string;
  title: string;
  subtitle: string;
  whatYouSee: string[];
  rules: string[];
  task: string[];
  timeLimit: number; // seconds
  gauges: GaugeConfig[];
  output: OutputConfig;
  initialSystemOn: boolean;
  initialAlarmActive: boolean;
  surgeConfig?: {
    gaugeId: string;
    surgeAmount: number;
    surgeWindowStart: number; // seconds after start
    surgeWindowEnd: number;
  };
  recommendedSolution: string[];
  commonMistakes: string[];
}

export interface ActionEntry {
  time: number; // elapsed ms
  action: string;
  detail?: string;
  valid: boolean;
}

export interface Mistake {
  time: number;
  type: string;
  description: string;
  penalty: number;
}

export interface Bonus {
  time: number;
  type: string;
  description: string;
  points: number;
}

export interface GameState {
  systemOn: boolean;
  alarmActive: boolean;
  gauges: GaugeState[];
  outputValue: number;
  outputHistory: number[];
  timeRemaining: number; // ms
  timeElapsed: number; // ms
  score: number;
  actionLog: ActionEntry[];
  mistakes: Mistake[];
  bonuses: Bonus[];
  priorityGaugeId: string | null;
  priorityGaugeSetAt: number | null;
  scenarioComplete: boolean;
  surgeTriggered: boolean;
  surgeTime: number;
  warningMessage: string | null;
  warningClearAt: number | null;
  actionCount: number;
  redAccumulator: number;
  priorityIgnoreAccumulator: number;
  lastPriorityPenaltyAt: number;
  lastRedPenaltyAt: number;
  systemResetUsed: boolean;
}

export type GameAction =
  | { type: 'TICK'; dt: number; scenario: ScenarioConfig }
  | { type: 'TOGGLE_SYSTEM' }
  | { type: 'USE_VALVE'; gaugeId: string }
  | { type: 'RESET' }
  | { type: 'RECENTER' }
  | { type: 'SYSTEM_RESET' }
  | { type: 'CLEAR_WARNING' };

export type AppScreen = 'menu' | 'intro' | 'playing' | 'results';
