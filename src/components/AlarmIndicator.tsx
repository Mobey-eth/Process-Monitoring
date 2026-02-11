interface AlarmIndicatorProps {
  active: boolean;
}

export function AlarmIndicator({ active }: AlarmIndicatorProps) {
  return (
    <div className={`alarm-indicator ${active ? 'alarm-indicator--active' : ''}`}>
      <div className="alarm-indicator__light" />
      <span className="alarm-indicator__text">
        {active ? 'ALARM' : 'NORMAL'}
      </span>
    </div>
  );
}
