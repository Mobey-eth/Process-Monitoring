interface TimerProps {
  timeRemaining: number; // ms
}

export function Timer({ timeRemaining }: TimerProps) {
  const totalSeconds = Math.max(0, Math.ceil(timeRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const low = totalSeconds <= 10;

  return (
    <div className={`timer ${low ? 'timer--low' : ''}`}>
      <span className="timer__icon">⏱</span>
      <span className="timer__digits">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
