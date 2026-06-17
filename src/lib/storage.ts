import type { SessionData, ExperimentId } from '@/types';

const KEYS = {
  session: (id: ExperimentId) => `labai_session_${id}`,
  lastExperiment: 'labai_last_experiment',
};

export function saveSession(data: SessionData): void {
  try {
    localStorage.setItem(KEYS.session(data.experimentId), JSON.stringify(data));
    localStorage.setItem(KEYS.lastExperiment, data.experimentId);
  } catch (e) {
    console.warn('localStorage unavailable:', e);
  }
}

export function loadSession(experimentId: ExperimentId): SessionData | null {
  try {
    const raw = localStorage.getItem(KEYS.session(experimentId));
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(experimentId: ExperimentId): void {
  try {
    localStorage.removeItem(KEYS.session(experimentId));
  } catch { /* ignore */ }
}

export function createFreshSession(experimentId: ExperimentId): SessionData {
  return {
    experimentId,
    subjectId: 'biology',
    chatHistory: [],
    interactionCount: 0,
    startTime: Date.now(),
    simulationEvents: [],
  };
}
