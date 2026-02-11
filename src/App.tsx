import { useState, useCallback } from 'react';
import type { ScenarioConfig, AppScreen, GameState } from './game/types';
import { scenarios } from './game/scenarios';
import { ScenarioList } from './components/ScenarioList';
import { ScenarioIntro } from './components/ScenarioIntro';
import { Panel } from './components/Panel';
import { Results } from './components/Results';
import { audio } from './audio/audio';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null);
  const [finalState, setFinalState] = useState<GameState | null>(null);
  // Key to force Panel remount on retry
  const [runKey, setRunKey] = useState(0);

  const handleSelectScenario = useCallback((scenario: ScenarioConfig) => {
    setSelectedScenario(scenario);
    setScreen('intro');
  }, []);

  const handleStart = useCallback(() => {
    setScreen('playing');
    setRunKey(k => k + 1);
  }, []);

  const handleComplete = useCallback((state: GameState) => {
    audio.stopAlarm();
    if (state.score >= 75) {
      audio.success();
    }
    setFinalState(state);
    setScreen('results');
  }, []);

  const handleTryAgain = useCallback(() => {
    setScreen('playing');
    setRunKey(k => k + 1);
  }, []);

  const handleBackToMenu = useCallback(() => {
    audio.stopAlarm();
    setSelectedScenario(null);
    setFinalState(null);
    setScreen('menu');
  }, []);

  const handleBackToIntro = useCallback(() => {
    setScreen('intro');
  }, []);

  return (
    <div className="app">
      {screen === 'menu' && (
        <ScenarioList
          scenarios={scenarios}
          onSelect={handleSelectScenario}
        />
      )}

      {screen === 'intro' && selectedScenario && (
        <ScenarioIntro
          scenario={selectedScenario}
          onStart={handleStart}
          onBack={handleBackToMenu}
        />
      )}

      {screen === 'playing' && selectedScenario && (
        <Panel
          key={runKey}
          scenario={selectedScenario}
          onComplete={handleComplete}
        />
      )}

      {screen === 'results' && selectedScenario && finalState && (
        <Results
          state={finalState}
          scenario={selectedScenario}
          onTryAgain={handleTryAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
