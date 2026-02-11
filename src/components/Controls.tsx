interface ControlsProps {
  systemOn: boolean;
  alarmActive: boolean;
  onToggleSystem: () => void;
  onReset: () => void;
  onRecenter: () => void;
  onSystemReset: () => void;
}

export function Controls({
  systemOn,
  alarmActive,
  onToggleSystem,
  onReset,
  onRecenter,
  onSystemReset,
}: ControlsProps) {
  return (
    <div className="controls">
      <button
        className={`controls__btn controls__btn--power ${systemOn ? 'controls__btn--on' : 'controls__btn--off'}`}
        onClick={onToggleSystem}
        title="Toggle system [Space]"
      >
        <span className="controls__btn-icon">{systemOn ? '⏻' : '⏻'}</span>
        <span>{systemOn ? 'ON' : 'OFF'}</span>
        <kbd>Space</kbd>
      </button>

      <button
        className="controls__btn controls__btn--reset"
        onClick={onReset}
        title="Reset alarm [R]"
      >
        Reset
        <kbd>R</kbd>
      </button>

      <button
        className="controls__btn controls__btn--recenter"
        onClick={onRecenter}
        title="Recenter values [C]"
      >
        Recenter
        <kbd>C</kbd>
      </button>

      <button
        className="controls__btn controls__btn--sysreset"
        onClick={onSystemReset}
        title="System Reset [S]"
      >
        Sys Reset
        <kbd>S</kbd>
      </button>

      {alarmActive && (
        <div className="controls__alarm-note">
          Alarm active — Reset only after all gauges return to green
        </div>
      )}
    </div>
  );
}
