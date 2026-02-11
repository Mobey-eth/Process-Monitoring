import type { ScenarioConfig } from '../game/types';
import { audio } from '../audio/audio';

interface ScenarioIntroProps {
  scenario: ScenarioConfig;
  onStart: () => void;
  onBack: () => void;
}

export function ScenarioIntro({ scenario, onStart, onBack }: ScenarioIntroProps) {
  const handleStart = () => {
    // Unlock audio on this user gesture — required for mobile browsers
    audio.unlock();
    onStart();
  };
  return (
    <div className="scenario-intro">
      <button className="scenario-intro__back" onClick={onBack}>
        ← Back to scenarios
      </button>

      <h1 className="scenario-intro__title">
        Sample Question: {scenario.title}
      </h1>
      <p className="scenario-intro__subtitle">{scenario.subtitle}</p>

      <section className="scenario-intro__section">
        <h2>What you see</h2>
        <ul>
          {scenario.whatYouSee.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="scenario-intro__section">
        <h2>Rules to follow</h2>
        <ul>
          {scenario.rules.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="scenario-intro__section">
        <h2>Your task</h2>
        <ol>
          {scenario.task.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </section>

      <div className="scenario-intro__time">
        Time limit: <strong>{scenario.timeLimit} seconds</strong>
      </div>

      <button className="scenario-intro__start-btn" onClick={handleStart}>
        Start Practice
      </button>

      <div className="scenario-intro__keyboard-hint">
        Keyboard shortcuts available during practice:
        <span><kbd>Space</kbd> On/Off</span>
        <span><kbd>R</kbd> Reset</span>
        <span><kbd>C</kbd> Recenter</span>
        <span><kbd>S</kbd> Sys Reset</span>
        <span><kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> Valves</span>
      </div>
    </div>
  );
}
