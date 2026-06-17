import React from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Screen } from '@/types';

const STEPS: { screen: Screen; label: string }[] = [
  { screen: 'landing', label: 'Home' },
  { screen: 'selection', label: 'Choose Experiment' },
  { screen: 'lab', label: 'Lab Bench' },
  { screen: 'report', label: 'Lab Report' },
];

export default function AppNav() {
  const { screen, setScreen } = useApp();

  const currentIdx = STEPS.findIndex((s) => s.screen === screen);

  return (
    <nav className="no-print fixed top-0 left-0 right-0 z-50 glass-panel border-b border-glass">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          type="button"
          onClick={() => setScreen('landing')}
          className="flex items-center gap-1 shrink-0"
        >
          <span className="font-sora font-bold text-xl text-white">Lab</span>
          <span className="font-sora font-bold text-xl indigo-glow">AI</span>
        </button>

        {/* Progress Steps */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {STEPS.slice(1).map((step, i) => {
            const stepIdx = STEPS.findIndex((s) => s.screen === step.screen);
            const isDone = currentIdx > stepIdx;
            const isActive = currentIdx === stepIdx;

            return (
              <React.Fragment key={step.screen}>
                {i > 0 && (
                  <div
                    className={`h-px w-8 ${isDone ? 'bg-emerald-lab' : 'bg-white/10'}`}
                  />
                )}
                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'progress-step-active bg-indigo-lab/10'
                      : isDone
                      ? 'progress-step-done'
                      : 'progress-step-inactive'
                  }`}
                >
                  {step.label}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile progress */}
        <div className="md:hidden flex items-center gap-1">
          {STEPS.slice(1).map((step, i) => {
            const stepIdx = STEPS.findIndex((s) => s.screen === step.screen);
            const isDone = currentIdx > stepIdx;
            const isActive = currentIdx === stepIdx;
            return (
              <div
                key={step.screen}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-indigo-lab scale-125' : isDone ? 'bg-emerald-lab' : 'bg-white/15'
                }`}
              />
            );
          })}
        </div>

        {/* How It Works tooltip */}
        <div className="relative group shrink-0">
          <button
            type="button"
            className="text-xs font-medium text-slate/70 hover:text-white border border-glass rounded-full px-3 py-1.5 transition-all duration-200 hover:border-indigo-lab/30"
          >
            How It Works
          </button>
          <div className="absolute right-0 top-10 w-64 glass-panel rounded-xl p-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 text-xs text-slate/80 leading-relaxed z-50">
            <p className="font-sora font-semibold text-white mb-2">How LabAI Works</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Choose an experiment from the lab</li>
              <li>Interact with the virtual simulation</li>
              <li>Dr. Lab AI guides you with questions</li>
              <li>Complete 5+ interactions to finish</li>
              <li>Receive your personalized lab report</li>
            </ol>
          </div>
        </div>
      </div>
    </nav>
  );
}
