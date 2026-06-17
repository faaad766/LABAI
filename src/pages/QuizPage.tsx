import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, RotateCcw, Home, Trophy, FlaskConical } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const SUBJECT_THEME: Record<string, { bg: string; border: string; text: string; accent: string; light: string }> = {
  biology:     { bg: '#F0F7F3', border: '#BBF7D0', text: '#1B4332', accent: '#16A34A', light: '#DCFCE7' },
  chemistry:   { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', accent: '#D97706', light: '#FEF3C7' },
  physics:     { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E3A5F', accent: '#2563EB', light: '#DBEAFE' },
  mathematics: { bg: '#F5F3FF', border: '#DDD6FE', text: '#4C1D95', accent: '#7C3AED', light: '#EDE9FE' },
};

const GRADE_INFO: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  A: { label: 'Excellent!',        emoji: '🏆', color: '#166534', bg: '#DCFCE7' },
  B: { label: 'Great Job!',        emoji: '🌟', color: '#1B4332', bg: '#F0F7F3' },
  C: { label: 'Good Effort!',      emoji: '👍', color: '#92400E', bg: '#FEF3C7' },
  D: { label: 'Keep Practicing!',  emoji: '📚', color: '#9F1239', bg: '#FFE4E6' },
};

export default function QuizPage() {
  const { quizData, setScreen, selectedSubject, selectedExperiment } = useApp();
  const theme = SUBJECT_THEME[selectedSubject ?? 'biology'];

  const [current, setCurrent]         = useState(0);
  const [selected, setSelected]       = useState<number | null>(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [answers, setAnswers]         = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!quizData || quizData.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F3' }}>
        <div className="text-center">
          <p className="font-inter text-sm mb-4" style={{ color: '#A8A29E' }}>No quiz data. Complete an experiment first.</p>
          <button onClick={() => setScreen('subject')}
            className="px-4 py-2 rounded-xl text-sm font-inter"
            style={{ background: theme.accent, color: '#FFF' }}>
            Back to Subjects
          </button>
        </div>
      </div>
    );
  }

  const questions = quizData.questions;
  const q = questions[current];

  const handleSelect = (idx: number) => {
    if (confirmed) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    const isCorrect = selected === q.correctIndex;
    pendo.track('quiz_answer_submitted', {
      experimentId: quizData.experimentName,
      subjectId: quizData.subjectId,
      questionIndex: current + 1,
      totalQuestions: questions.length,
      isCorrect,
    });
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected];
    if (current + 1 >= questions.length) {
      setAnswers(newAnswers);
      setShowResults(true);
      const score = newAnswers.filter((a, i) => a === questions[i].correctIndex).length;
      const pct   = Math.round((score / questions.length) * 100);
      const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : 'D';
      pendo.track('quiz_completed', {
        experimentName: quizData.experimentName,
        subjectId: quizData.subjectId,
        score,
        totalQuestions: questions.length,
        percentCorrect: pct,
        grade,
      });
    } else {
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  if (showResults) {
    const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const pct   = Math.round((score / questions.length) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : 'D';
    const gi    = GRADE_INFO[grade];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#FAF8F3' }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#FFF', borderBottom: '1px solid #E7E5E0' }}>
          <button onClick={() => setScreen('subject')} className="flex items-center gap-1.5 text-sm font-inter" style={{ color: '#52796F' }}>
            <Home size={14} /> Home
          </button>
          <span className="flex-1 font-sora font-semibold text-sm text-center" style={{ color: '#1C1917' }}>Quiz Results</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-8 max-w-xl mx-auto w-full">
          {/* Score card */}
          <motion.div className="rounded-2xl p-6 mb-6 text-center"
            style={{ background: gi.bg, border: `1.5px solid ${theme.border}` }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="text-5xl mb-3">{gi.emoji}</div>
            <div className="font-sora font-bold text-4xl mb-1" style={{ color: gi.color }}>{pct}%</div>
            <div className="font-sora font-bold text-lg mb-1" style={{ color: gi.color }}>{gi.label}</div>
            <div className="font-inter text-sm" style={{ color: '#78716C' }}>
              {score} of {questions.length} correct · {quizData.experimentName}
            </div>
            <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-sora font-bold"
              style={{ background: theme.accent, color: '#FFF' }}>
              Grade {grade}
            </div>
          </motion.div>

          {/* Per-question review */}
          <div className="flex flex-col gap-3 mb-8">
            {questions.map((qu, i) => {
              const ans      = answers[i];
              const correct  = qu.correctIndex;
              const isRight  = ans === correct;
              return (
                <motion.div key={i} className="rounded-xl p-4"
                  style={{ background: '#FFF', border: `1px solid ${isRight ? '#BBF7D0' : '#FECDD3'}` }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <div className="flex items-start gap-2 mb-2">
                    {isRight
                      ? <CheckCircle2 size={15} color="#16A34A" className="shrink-0 mt-0.5" />
                      : <XCircle     size={15} color="#DC2626" className="shrink-0 mt-0.5" />}
                    <p className="font-inter text-xs font-semibold text-pretty" style={{ color: '#1C1917' }}>
                      Q{i + 1}. {qu.question}
                    </p>
                  </div>
                  {!isRight && ans !== null && (
                    <p className="font-inter text-xs mb-1 ml-5" style={{ color: '#DC2626' }}>
                      Your answer: {qu.options[ans]}
                    </p>
                  )}
                  <p className="font-inter text-xs ml-5" style={{ color: '#16A34A' }}>
                    ✓ {qu.options[correct]}
                  </p>
                  <p className="font-inter text-xs mt-1.5 ml-5 text-pretty" style={{ color: '#78716C' }}>
                    {qu.explanation}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={() => setScreen('lab')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-sora font-bold text-sm"
              style={{ background: theme.bg, border: `1.5px solid ${theme.border}`, color: theme.text }}>
              <RotateCcw size={14} /> Retry Lab
            </button>
            <button onClick={() => setScreen('subject')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-sora font-bold text-sm text-white"
              style={{ background: theme.accent }}>
              <Home size={14} /> New Subject
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz question view ──────────────────────────────────────────────
  const isCorrect = confirmed && selected === q.correctIndex;
  const isWrong   = confirmed && selected !== q.correctIndex;

  const optionBg = (idx: number) => {
    if (!confirmed) return selected === idx ? theme.bg : '#FFF';
    if (idx === q.correctIndex) return '#DCFCE7';
    if (idx === selected)       return '#FFE4E6';
    return '#FFF';
  };
  const optionBorder = (idx: number) => {
    if (!confirmed) return selected === idx ? theme.accent : '#E7E5E0';
    if (idx === q.correctIndex) return '#86EFAC';
    if (idx === selected)       return '#FECDD3';
    return '#E7E5E0';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF8F3' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 shrink-0"
        style={{ background: '#FFF', borderBottom: '1px solid #E7E5E0' }}>
        <button onClick={() => setScreen('lab')} className="flex items-center gap-1.5 text-xs font-inter"
          style={{ color: '#52796F' }}>
          <ChevronLeft size={14} /> Back to Lab
        </button>
        <div className="flex-1 text-center">
          <span className="font-sora font-semibold text-sm" style={{ color: '#1C1917' }}>
            Knowledge Check
          </span>
        </div>
        <span className="font-inter text-xs" style={{ color: '#A8A29E' }}>
          {current + 1}/{questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: '#E7E5E0' }}>
        <motion.div className="h-1" style={{ background: theme.accent }}
          animate={{ width: `${((current) / questions.length) * 100}%` }}
          transition={{ duration: 0.4 }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl mx-auto w-full">
        {/* Experiment badge */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
            <FlaskConical size={13} color={theme.text} />
          </div>
          <span className="font-inter text-xs" style={{ color: theme.text }}>{quizData.experimentName}</span>
          <span className="ml-auto font-sora font-bold text-xs px-2 py-1 rounded-full"
            style={{ background: theme.light, color: theme.text }}>
            Q{current + 1} of {questions.length}
          </span>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}>
            <div className="mb-5 p-4 rounded-2xl" style={{ background: '#FFF', border: `1px solid #E7E5E0` }}>
              <p className="font-sora font-semibold text-sm leading-relaxed text-balance" style={{ color: '#1C1917' }}>
                {q.question}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2.5 mb-5">
              {q.options.map((opt, idx) => (
                <button key={idx} onClick={() => handleSelect(idx)}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all flex items-start gap-3"
                  style={{
                    background: optionBg(idx),
                    border: `1.5px solid ${optionBorder(idx)}`,
                    cursor: confirmed ? 'default' : 'pointer',
                  }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5"
                    style={{
                      background: confirmed
                        ? idx === q.correctIndex ? '#16A34A' : idx === selected ? '#DC2626' : '#E7E5E0'
                        : selected === idx ? theme.accent : '#E7E5E0',
                      color: (confirmed && (idx === q.correctIndex || idx === selected)) || selected === idx ? '#FFF' : '#78716C',
                    }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="font-inter text-sm text-pretty flex-1" style={{ color: '#1C1917' }}>{opt}</span>
                  {confirmed && idx === q.correctIndex && <CheckCircle2 size={16} color="#16A34A" className="shrink-0 mt-0.5" />}
                  {confirmed && idx === selected && idx !== q.correctIndex && <XCircle size={16} color="#DC2626" className="shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {confirmed && (
                <motion.div className="rounded-xl p-4 mb-5"
                  style={{ background: isCorrect ? '#F0F7F3' : '#FFF5F5', border: `1px solid ${isCorrect ? '#BBF7D0' : '#FECDD3'}` }}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    {isCorrect ? <CheckCircle2 size={14} color="#16A34A" /> : <XCircle size={14} color="#DC2626" />}
                    <span className="font-sora font-bold text-xs" style={{ color: isCorrect ? '#166534' : '#9F1239' }}>
                      {isCorrect ? 'Correct!' : `Correct answer: ${q.options[q.correctIndex]}`}
                    </span>
                  </div>
                  <p className="font-inter text-xs text-pretty" style={{ color: '#57534E' }}>{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm / Next */}
            {!confirmed ? (
              <button onClick={handleConfirm} disabled={selected === null}
                className="w-full py-3.5 rounded-xl font-sora font-bold text-sm disabled:opacity-40 transition-all"
                style={{ background: selected !== null ? theme.accent : '#E7E5E0', color: '#FFF' }}>
                Check Answer
              </button>
            ) : (
              <button onClick={handleNext}
                className="w-full py-3.5 rounded-xl font-sora font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: theme.accent, color: '#FFF' }}>
                {current + 1 >= questions.length ? (
                  <><Trophy size={15} /> See Results</>
                ) : (
                  <>Next Question <ChevronRight size={15} /></>
                )}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
