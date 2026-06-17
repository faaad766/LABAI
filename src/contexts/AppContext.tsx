import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Screen, SubjectId, ExperimentId, SessionData, LabReportData, ChatMessage, QuizData } from '@/types';

function saveSession(s: SessionData) {
  try { localStorage.setItem(`labai_session_${s.experimentId}`, JSON.stringify(s)); } catch { /* quota */ }
}
function clearSession(id: ExperimentId) {
  try { localStorage.removeItem(`labai_session_${id}`); } catch { /* ok */ }
}
function freshSession(experimentId: ExperimentId, subjectId: SubjectId): SessionData {
  return { experimentId, subjectId, chatHistory: [], interactionCount: 0, startTime: Date.now(), simulationEvents: [] };
}

interface AppContextValue {
  screen: Screen;
  setScreen: (s: Screen) => void;
  selectedSubject: SubjectId | null;
  selectSubject: (id: SubjectId) => void;
  selectedExperiment: ExperimentId | null;
  selectExperiment: (id: ExperimentId) => void;
  session: SessionData | null;
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAIMessage: (id: string, content: string, done?: boolean) => void;
  incrementInteraction: () => void;
  addSimulationEvent: (event: string) => void;
  resetSession: () => void;
  labReport: LabReportData | null;
  setLabReport: (r: LabReportData) => void;
  quizData: QuizData | null;
  setQuizData: (q: QuizData) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>('landing');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentId | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [labReport, setLabReport] = useState<LabReportData | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  const selectSubject = useCallback((id: SubjectId) => {
    setSelectedSubject(id);
    if (id === 'virtual-lab') {
      setScreen('virtual-lab');
    } else {
      setScreen('selection');
    }
  }, []);

  const selectExperiment = useCallback((id: ExperimentId) => {
    setSelectedExperiment(id);
    setSelectedSubject((prevSubject) => {
      const subjectId: SubjectId = prevSubject ?? 'biology';
      clearSession(id);
      const fresh = freshSession(id, subjectId);
      setSession(fresh);
      saveSession(fresh);
      return prevSubject;
    });
    setScreen('lab');
  }, []);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, chatHistory: [...prev.chatHistory, msg] };
      saveSession(updated);
      return updated;
    });
  }, []);

  const updateLastAIMessage = useCallback((id: string, content: string, done = false) => {
    setSession((prev) => {
      if (!prev) return prev;
      const history = prev.chatHistory.map((m) =>
        m.id === id ? { ...m, content, isStreaming: !done } : m
      );
      const updated = { ...prev, chatHistory: history };
      saveSession(updated);
      return updated;
    });
  }, []);

  const incrementInteraction = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, interactionCount: prev.interactionCount + 1 };
      saveSession(updated);
      return updated;
    });
  }, []);

  const addSimulationEvent = useCallback((event: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, simulationEvents: [...prev.simulationEvents.slice(-30), event] };
      saveSession(updated);
      return updated;
    });
  }, []);

  const resetSession = useCallback(() => {
    if (selectedExperiment && session) {
      clearSession(selectedExperiment);
      const fresh = freshSession(selectedExperiment, session.subjectId);
      setSession(fresh);
      saveSession(fresh);
    }
  }, [selectedExperiment, session]);

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      selectedSubject, selectSubject,
      selectedExperiment, selectExperiment,
      session,
      addChatMessage, updateLastAIMessage,
      incrementInteraction, addSimulationEvent,
      resetSession,
      labReport, setLabReport,
      quizData, setQuizData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
