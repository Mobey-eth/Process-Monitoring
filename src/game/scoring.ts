import type { GameState } from './types';

export interface ScoreBreakdown {
  finalScore: number;
  baseScore: number;
  totalPenalties: number;
  totalBonuses: number;
  grade: string;
  summary: string;
  timeToStabilize: number | null;
}

export function calculateFinalScore(state: GameState): ScoreBreakdown {
  const totalPenalties = state.mistakes.reduce((sum, m) => sum + m.penalty, 0);
  const totalBonuses = state.bonuses.reduce((sum, b) => sum + b.points, 0);
  const finalScore = Math.max(0, Math.min(100, state.score));

  // Bonus for low action count (efficient play)
  // Not adding to score, just noting it

  // Time to stabilize: find when alarm was cleared (if ever)
  const resetEntry = state.actionLog.find(
    e => e.action === 'RESET' && e.valid && e.detail === 'Alarm cleared'
  );
  const timeToStabilize = resetEntry ? resetEntry.time : null;

  let grade: string;
  if (finalScore >= 90) grade = 'Excellent';
  else if (finalScore >= 75) grade = 'Good';
  else if (finalScore >= 60) grade = 'Adequate';
  else if (finalScore >= 40) grade = 'Needs Improvement';
  else grade = 'Poor';

  let summary: string;
  if (finalScore >= 90) {
    summary = 'Outstanding performance. You followed the correct procedures with precision and efficiency.';
  } else if (finalScore >= 75) {
    summary = 'Good job. You handled the situation well with only minor issues.';
  } else if (finalScore >= 60) {
    summary = 'Adequate performance. Review the mistakes below to improve your response time and procedure adherence.';
  } else {
    summary = 'Review the recommended solution carefully. Focus on the sequence of actions and timing of each step.';
  }

  return {
    finalScore,
    baseScore: 100,
    totalPenalties,
    totalBonuses,
    grade,
    summary,
    timeToStabilize,
  };
}
