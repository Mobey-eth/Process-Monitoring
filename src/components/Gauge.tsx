import type { GaugeState } from '../game/types';

interface GaugeProps {
  gauge: GaugeState;
  isPriority: boolean;
  onValve: () => void;
  keyHint: string;
}

export function Gauge({ gauge, isPriority, onValve, keyHint }: GaugeProps) {
  const { label, value, greenMax, amberMax, valveCooldownRemaining, band } = gauge;
  const pct = Math.min(100, Math.max(0, value));
  const cooldownActive = valveCooldownRemaining > 0;
  const cooldownPct = cooldownActive ? (valveCooldownRemaining / 4000) * 100 : 0;

  // Bar color
  const barColor =
    band === 'red' ? 'var(--clr-red)' :
    band === 'amber' ? 'var(--clr-amber)' :
    'var(--clr-green)';

  return (
    <div className={`gauge ${isPriority ? 'gauge--priority' : ''}`}>
      <div className="gauge__label">{label}</div>
      <div className="gauge__bar-container">
        {/* Band backgrounds */}
        <div className="gauge__band gauge__band--red"
          style={{ height: `${100 - amberMax}%`, top: 0 }} />
        <div className="gauge__band gauge__band--amber"
          style={{ height: `${amberMax - greenMax}%`, top: `${100 - amberMax}%` }} />
        <div className="gauge__band gauge__band--green"
          style={{ height: `${greenMax}%`, top: `${100 - greenMax}%` }} />

        {/* Fill bar */}
        <div className="gauge__fill" style={{
          height: `${pct}%`,
          backgroundColor: barColor,
        }} />

        {/* Threshold lines */}
        <div className="gauge__threshold" style={{ bottom: `${greenMax}%` }} />
        <div className="gauge__threshold gauge__threshold--red" style={{ bottom: `${amberMax}%` }} />
      </div>
      <div className={`gauge__value gauge__value--${band}`}>
        {value.toFixed(1)}
      </div>
      <button
        className={`gauge__valve-btn ${cooldownActive ? 'gauge__valve-btn--cooldown' : ''}`}
        onClick={onValve}
        disabled={cooldownActive}
        title={cooldownActive ? 'Cooling down...' : `Valve ${label} [${keyHint}]`}
      >
        {cooldownActive ? (
          <span className="gauge__cooldown-bar">
            <span className="gauge__cooldown-fill" style={{ width: `${cooldownPct}%` }} />
          </span>
        ) : (
          <>Valve <kbd>{keyHint}</kbd></>
        )}
      </button>
    </div>
  );
}
