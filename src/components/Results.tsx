import type { GameState, ScenarioConfig } from '../game/types';
import { calculateFinalScore } from '../game/scoring';

interface ResultsProps {
  state: GameState;
  scenario: ScenarioConfig;
  onTryAgain: () => void;
  onBackToMenu: () => void;
}

export function Results({ state, scenario, onTryAgain, onBackToMenu }: ResultsProps) {
  const breakdown = calculateFinalScore(state);

  return (
    <div className="results">
      <h1 className="results__title">Results: {scenario.title}</h1>

      {/* Score card */}
      <div className={`results__score-card results__score-card--${
        breakdown.finalScore >= 75 ? 'good' : breakdown.finalScore >= 50 ? 'ok' : 'poor'
      }`}>
        <div className="results__score-number">{breakdown.finalScore}</div>
        <div className="results__score-label">/100</div>
        <div className="results__grade">{breakdown.grade}</div>
      </div>

      <p className="results__summary">{breakdown.summary}</p>

      {/* Stats */}
      <div className="results__stats">
        <div className="results__stat">
          <span className="results__stat-label">Actions taken</span>
          <span className="results__stat-value">{state.actionCount}</span>
        </div>
        <div className="results__stat">
          <span className="results__stat-label">Time to stabilize</span>
          <span className="results__stat-value">
            {breakdown.timeToStabilize
              ? `${(breakdown.timeToStabilize / 1000).toFixed(1)}s`
              : 'N/A'}
          </span>
        </div>
        <div className="results__stat">
          <span className="results__stat-label">Penalties</span>
          <span className="results__stat-value results__stat-value--penalty">
            −{breakdown.totalPenalties}
          </span>
        </div>
        <div className="results__stat">
          <span className="results__stat-label">Bonuses</span>
          <span className="results__stat-value results__stat-value--bonus">
            +{breakdown.totalBonuses}
          </span>
        </div>
      </div>

      {/* Action Log */}
      <section className="results__section">
        <h2>Action Timeline</h2>
        <div className="results__log">
          {state.actionLog.length === 0 ? (
            <p className="results__empty">No actions recorded.</p>
          ) : (
            state.actionLog.map((entry, i) => (
              <div key={i} className={`results__log-entry ${entry.valid ? '' : 'results__log-entry--invalid'}`}>
                <span className="results__log-time">
                  {(entry.time / 1000).toFixed(1)}s
                </span>
                <span className="results__log-action">{entry.action}</span>
                {entry.detail && (
                  <span className="results__log-detail">{entry.detail}</span>
                )}
                {!entry.valid && <span className="results__log-badge">INVALID</span>}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Mistakes */}
      {state.mistakes.length > 0 && (
        <section className="results__section">
          <h2>Mistakes</h2>
          <ul className="results__mistakes">
            {state.mistakes.map((m, i) => (
              <li key={i} className="results__mistake">
                <span className="results__mistake-penalty">−{m.penalty}</span>
                <span className="results__mistake-desc">{m.description}</span>
                <span className="results__mistake-time">at {(m.time / 1000).toFixed(1)}s</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bonuses */}
      {state.bonuses.length > 0 && (
        <section className="results__section">
          <h2>Bonuses Earned</h2>
          <ul className="results__bonuses">
            {state.bonuses.map((b, i) => (
              <li key={i} className="results__bonus">
                <span className="results__bonus-points">+{b.points}</span>
                <span className="results__bonus-desc">{b.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended Solution */}
      <section className="results__section results__section--solution">
        <h2>Correct Approach (Explained)</h2>
        <ol className="results__solution">
          {scenario.recommendedSolution.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      {/* Common Mistakes */}
      <section className="results__section">
        <h2>Common Mistakes</h2>
        <ul className="results__common-mistakes">
          {scenario.commonMistakes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>

      {/* Actions */}
      <div className="results__actions">
        <button className="results__btn results__btn--retry" onClick={onTryAgain}>
          Try Again
        </button>
        <button className="results__btn results__btn--menu" onClick={onBackToMenu}>
          Back to Scenarios
        </button>
      </div>
    </div>
  );
}
