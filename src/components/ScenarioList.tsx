import type { ScenarioConfig } from '../game/types';

interface ScenarioListProps {
  scenarios: ScenarioConfig[];
  onSelect: (scenario: ScenarioConfig) => void;
}

export function ScenarioList({ scenarios, onSelect }: ScenarioListProps) {
  return (
    <div className="scenario-list">
      <div className="scenario-list__header">
        <h1>SHL Process Monitoring Practice</h1>
        <p className="scenario-list__subtitle">
          Verify Interactive: Process Monitoring (2023 Style)
        </p>
        <p className="scenario-list__desc">
          Practice controlling a DCS operator panel. Follow the rules: isolate deviations first,
          recenter only when stable, reset only when normal, and never panic reset.
        </p>
      </div>

      <div className="scenario-list__grid">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            className="scenario-card"
            onClick={() => onSelect(s)}
          >
            <div className="scenario-card__number">Scenario {String.fromCharCode(65 + i)}</div>
            <h2 className="scenario-card__title">{s.title}</h2>
            <p className="scenario-card__subtitle">{s.subtitle}</p>
            <div className="scenario-card__meta">
              <span>Time: {s.timeLimit}s</span>
              <span>{s.gauges.length} gauges</span>
            </div>
          </button>
        ))}
      </div>

      <div className="scenario-list__footer">
        <h3>General Rules</h3>
        <ul>
          <li><strong>Isolate first:</strong> Act on the flashing (priority) gauge before others.</li>
          <li><strong>Recenter:</strong> Only when no alarm is active and no gauge is in red.</li>
          <li><strong>Reset:</strong> Only when alarm is active AND all gauges are green.</li>
          <li><strong>System Reset:</strong> Full reinit — use only after complete stabilization.</li>
          <li><strong>Don't panic:</strong> Wait for values to normalize before resetting.</li>
        </ul>
      </div>
    </div>
  );
}
