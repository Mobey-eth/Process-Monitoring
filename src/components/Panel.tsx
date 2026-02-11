import { useEffect } from 'react';
import type { ScenarioConfig, GameState } from '../game/types';
import { useSimulation } from '../game/useSimulation';
import { Gauge } from './Gauge';
import { Chart } from './Chart';
import { AlarmIndicator } from './AlarmIndicator';
import { Timer } from './Timer';
import { Controls } from './Controls';
import { AudioControls } from './AudioControls';

interface PanelProps {
  scenario: ScenarioConfig;
  onComplete: (state: GameState) => void;
}

const GAUGE_KEYS: Record<string, string> = { co2: '1', n2: '2', w2: '3' };

export function Panel({ scenario, onComplete }: PanelProps) {
  const { state, actions } = useSimulation(scenario);

  // Notify parent when scenario completes
  useEffect(() => {
    if (state.scenarioComplete) {
      onComplete(state);
    }
  }, [state.scenarioComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="panel">
      {/* Top bar */}
      <div className="panel__topbar">
        <div className="panel__title">{scenario.title}</div>
        <Timer timeRemaining={state.timeRemaining} />
        <div className="panel__topbar-right">
          <AlarmIndicator active={state.alarmActive} />
          <AudioControls />
        </div>
      </div>

      {/* Warning toast */}
      {state.warningMessage && (
        <div className="panel__warning">{state.warningMessage}</div>
      )}

      {/* Main content */}
      <div className="panel__body">
        {/* Gauges */}
        <div className="panel__gauges">
          {state.gauges.map(g => (
            <Gauge
              key={g.id}
              gauge={g}
              isPriority={state.priorityGaugeId === g.id}
              onValve={() => actions.useValve(g.id)}
              keyHint={GAUGE_KEYS[g.id] || '?'}
            />
          ))}
        </div>

        {/* Chart */}
        <div className="panel__chart-area">
          <Chart
            data={state.outputHistory}
            threshold={scenario.output.threshold}
            safeMax={scenario.output.safeMax}
            label={scenario.output.label}
          />

          {/* Score display */}
          <div className="panel__score">
            Score: <strong>{Math.max(0, state.score)}</strong>
          </div>

          {/* Live action count */}
          <div className="panel__actions-count">
            Actions: {state.actionCount}
          </div>
        </div>
      </div>

      {/* Controls */}
      <Controls
        systemOn={state.systemOn}
        alarmActive={state.alarmActive}
        onToggleSystem={actions.toggleSystem}
        onReset={actions.reset}
        onRecenter={actions.recenter}
        onSystemReset={actions.systemReset}
      />

      {/* Keyboard shortcuts hint */}
      <div className="panel__shortcuts">
        <span><kbd>Space</kbd> On/Off</span>
        <span><kbd>R</kbd> Reset</span>
        <span><kbd>C</kbd> Recenter</span>
        <span><kbd>S</kbd> Sys Reset</span>
        <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Valves</span>
      </div>
    </div>
  );
}
