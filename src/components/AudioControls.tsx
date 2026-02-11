import { useState } from 'react';
import { audio } from '../audio/audio';

export function AudioControls() {
  const [enabled, setEnabled] = useState(audio.enabled);
  const [volume, setVolume] = useState(audio.volume);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    audio.setEnabled(next);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    audio.setVolume(v);
  };

  return (
    <div className="audio-controls">
      <button
        className={`audio-controls__toggle ${enabled ? '' : 'audio-controls__toggle--muted'}`}
        onClick={handleToggle}
        title={enabled ? 'Mute audio' : 'Enable audio'}
      >
        {enabled ? '🔊' : '🔇'}
      </button>
      {enabled && (
        <input
          type="range"
          className="audio-controls__slider"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolume}
        />
      )}
    </div>
  );
}
