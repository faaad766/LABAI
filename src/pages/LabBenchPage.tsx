import React, { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, BotMessageSquare, Send, RotateCcw, CheckCircle2,
  FlaskConical, User, Sparkles, Trophy, AlertCircle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getExperiment } from '@/lib/experiments';
import { streamDrLab, generateQuiz } from '@/lib/llm';
import type { DrLabMessage } from '@/lib/llm';

// Module-level Set to prevent re-firing threshold event on remount
const _trackedThresholdIds = new Set<string>();

// ── Lazy-load all 80 canvases ─────────────────────────────────────────
const OsmosisCanvas             = lazy(() => import('@/components/labs/OsmosisCanvas'));
const EnzymeCanvas              = lazy(() => import('@/components/labs/EnzymeCanvas'));
const PhotosynthesisCanvas      = lazy(() => import('@/components/labs/PhotosynthesisCanvas'));
const DNACanvas                 = lazy(() => import('@/components/labs/DNACanvas'));
const MitosisCanvas             = lazy(() => import('@/components/labs/MitosisCanvas'));
const ProteinSynthesisCanvas    = lazy(() => import('@/components/labs/ProteinSynthesisCanvas'));
const GeneticsCanvas            = lazy(() => import('@/components/labs/GeneticsCanvas'));
const CellularRespirationCanvas = lazy(() => import('@/components/labs/CellularRespirationCanvas'));
const ActionPotentialCanvas     = lazy(() => import('@/components/labs/ActionPotentialCanvas'));
const ImmuneResponseCanvas      = lazy(() => import('@/components/labs/ImmuneResponseCanvas'));
const BloodTypingCanvas         = lazy(() => import('@/components/labs/BloodTypingCanvas'));
const EcosystemCanvas           = lazy(() => import('@/components/labs/EcosystemCanvas'));
const CrisprCanvas              = lazy(() => import('@/components/labs/CrisprCanvas'));
const HardyWeinbergCanvas       = lazy(() => import('@/components/labs/HardyWeinbergCanvas'));
const NeurotransmittersCanvas   = lazy(() => import('@/components/labs/NeurotransmittersCanvas'));
const HormoneSignalingCanvas    = lazy(() => import('@/components/labs/HormoneSignalingCanvas'));
const NaturalSelectionCanvas    = lazy(() => import('@/components/labs/NaturalSelectionCanvas'));
const TranspirationCanvas       = lazy(() => import('@/components/labs/TranspirationCanvas'));
const FermentationCanvas        = lazy(() => import('@/components/labs/FermentationCanvas'));
const CirculatorySystemCanvas   = lazy(() => import('@/components/labs/CirculatorySystemCanvas'));
const TitrationCanvas           = lazy(() => import('@/components/labs/TitrationCanvas'));
const FlameTestCanvas           = lazy(() => import('@/components/labs/FlameTestCanvas'));
const VoltaicCanvas             = lazy(() => import('@/components/labs/VoltaicCanvas'));
const ChromatographyCanvas      = lazy(() => import('@/components/labs/ChromatographyCanvas'));
const CalorimetryCanvas         = lazy(() => import('@/components/labs/CalorimetryCanvas'));
const LeChatelierCanvas         = lazy(() => import('@/components/labs/LeChatelierCanvas'));
const ElectrolysisCanvas        = lazy(() => import('@/components/labs/ElectrolysisCanvas'));
const OrganicReactionsCanvas    = lazy(() => import('@/components/labs/OrganicReactionsCanvas'));
const GasLawsCanvas             = lazy(() => import('@/components/labs/GasLawsCanvas'));
const NuclearReactionsCanvas    = lazy(() => import('@/components/labs/NuclearReactionsCanvas'));
const PhBuffersCanvas           = lazy(() => import('@/components/labs/PhBuffersCanvas'));
const PolymerizationCanvas      = lazy(() => import('@/components/labs/PolymerizationCanvas'));
const CrystalGrowingCanvas      = lazy(() => import('@/components/labs/CrystalGrowingCanvas'));
const ElectroPlatingCanvas      = lazy(() => import('@/components/labs/ElectroPlatingCanvas'));
const SoapMakingCanvas          = lazy(() => import('@/components/labs/SoapMakingCanvas'));
const ReactionRatesCanvas       = lazy(() => import('@/components/labs/ReactionRatesCanvas'));
const EntropyCanvas             = lazy(() => import('@/components/labs/EntropyCanvas'));
const MassSpectrometryCanvas    = lazy(() => import('@/components/labs/MassSpectrometryCanvas'));
const CorrosionCanvas           = lazy(() => import('@/components/labs/CorrosionCanvas'));
const AtomicSpectraCanvas       = lazy(() => import('@/components/labs/AtomicSpectraCanvas'));
const PendulumCanvas            = lazy(() => import('@/components/labs/PendulumCanvas'));
const WaveInterferenceCanvas    = lazy(() => import('@/components/labs/WaveInterferenceCanvas'));
const ProjectileCanvas          = lazy(() => import('@/components/labs/ProjectileCanvas'));
const OpticsSnellCanvas         = lazy(() => import('@/components/labs/OpticsSnellCanvas'));
const ElectricFieldsCanvas      = lazy(() => import('@/components/labs/ElectricFieldsCanvas'));
const MagneticForceCanvas       = lazy(() => import('@/components/labs/MagneticForceCanvas'));
const CarnotCycleCanvas         = lazy(() => import('@/components/labs/CarnotCycleCanvas'));
const QuantumTunnelingCanvas    = lazy(() => import('@/components/labs/QuantumTunnelingCanvas'));
const GravitationalOrbitsCanvas = lazy(() => import('@/components/labs/GravitationalOrbitsCanvas'));
const DopplerEffectCanvas       = lazy(() => import('@/components/labs/DopplerEffectCanvas'));
const OhmsLawCanvas             = lazy(() => import('@/components/labs/OhmsLawCanvas'));
const CapacitorCanvas           = lazy(() => import('@/components/labs/CapacitorCanvas'));
const WaveDiffractionCanvas     = lazy(() => import('@/components/labs/WaveDiffractionCanvas'));
const MomentumCollisionCanvas   = lazy(() => import('@/components/labs/MomentumCollisionCanvas'));
const SpringOscillatorCanvas    = lazy(() => import('@/components/labs/SpringOscillatorCanvas'));
const FluidMechanicsCanvas      = lazy(() => import('@/components/labs/FluidMechanicsCanvas'));
const SolenoidCanvas            = lazy(() => import('@/components/labs/SolenoidCanvas'));
const RcCircuitCanvas           = lazy(() => import('@/components/labs/RcCircuitCanvas'));
const ElectromagneticInductionCanvas = lazy(() => import('@/components/labs/ElectromagneticInductionCanvas'));
const RefractionPrismCanvas     = lazy(() => import('@/components/labs/RefractionPrismCanvas'));
const LimitsCanvas              = lazy(() => import('@/components/labs/LimitsCanvas'));
const DerivativeCanvas          = lazy(() => import('@/components/labs/DerivativeCanvas'));
const IntegralCanvas            = lazy(() => import('@/components/labs/IntegralCanvas'));
const TaylorSeriesCanvas        = lazy(() => import('@/components/labs/TaylorSeriesCanvas'));
const MatrixTransformCanvas     = lazy(() => import('@/components/labs/MatrixTransformCanvas'));
const ComplexNumbersCanvas      = lazy(() => import('@/components/labs/ComplexNumbersCanvas'));
const FourierSeriesCanvas       = lazy(() => import('@/components/labs/FourierSeriesCanvas'));
const ProbabilityDistCanvas     = lazy(() => import('@/components/labs/ProbabilityDistCanvas'));
const VectorFieldsCanvas        = lazy(() => import('@/components/labs/VectorFieldsCanvas'));
const ConicSectionsCanvas       = lazy(() => import('@/components/labs/ConicSectionsCanvas'));
const DifferentialEquationsCanvas = lazy(() => import('@/components/labs/DifferentialEquationsCanvas'));
const FractalsCanvas            = lazy(() => import('@/components/labs/FractalsCanvas'));
const BayesTheoremCanvas        = lazy(() => import('@/components/labs/BayesTheoremCanvas'));
const LinearProgrammingCanvas   = lazy(() => import('@/components/labs/LinearProgrammingCanvas'));
const NewtonsMethodCanvas       = lazy(() => import('@/components/labs/NewtonsMethodCanvas'));
const EigenvaluesCanvas         = lazy(() => import('@/components/labs/EigenvaluesCanvas'));
const GraphTheoryCanvas         = lazy(() => import('@/components/labs/GraphTheoryCanvas'));
const NumberTheoryCanvas        = lazy(() => import('@/components/labs/NumberTheoryCanvas'));
const SetTheoryCanvas           = lazy(() => import('@/components/labs/SetTheoryCanvas'));
const SurfaceIntegralsCanvas    = lazy(() => import('@/components/labs/SurfaceIntegralsCanvas'));

// Generic canvas for new experiments (shared, keyed by experimentId)
const GenericLabCanvas = lazy(() => import('@/components/labs/GenericLabCanvas'));

// Factory: wraps GenericLabCanvas, baking in the experimentId
function makeGeneric(id: string): React.ComponentType<{ onEvent: (e: string) => void }> {
  // eslint-disable-next-line react/display-name
  return ({ onEvent }) => (
    <React.Suspense fallback={<div className="flex items-center justify-center h-full text-sm opacity-40">Loading…</div>}>
      <GenericLabCanvas experimentId={id} onEvent={onEvent} />
    </React.Suspense>
  );
}

type CanvasComp = React.ComponentType<{ onEvent: (e: string) => void }>;
const CANVAS_MAP: Record<string, CanvasComp> = {
  osmosis: OsmosisCanvas, enzyme: EnzymeCanvas, photosynthesis: PhotosynthesisCanvas,
  dna: DNACanvas, mitosis: MitosisCanvas, 'protein-synthesis': ProteinSynthesisCanvas,
  genetics: GeneticsCanvas, 'cellular-respiration': CellularRespirationCanvas,
  'action-potential': ActionPotentialCanvas, 'immune-response': ImmuneResponseCanvas,
  'blood-typing': BloodTypingCanvas, 'ecosystem-simulation': EcosystemCanvas,
  'crispr-editing': CrisprCanvas, 'hardy-weinberg': HardyWeinbergCanvas,
  neurotransmitters: NeurotransmittersCanvas, 'hormone-signaling': HormoneSignalingCanvas,
  'natural-selection': NaturalSelectionCanvas, transpiration: TranspirationCanvas,
  fermentation: FermentationCanvas, 'circulatory-system': CirculatorySystemCanvas,
  titration: TitrationCanvas, flame: FlameTestCanvas, voltaic: VoltaicCanvas,
  chromatography: ChromatographyCanvas, calorimetry: CalorimetryCanvas,
  'le-chatelier': LeChatelierCanvas, electrolysis: ElectrolysisCanvas,
  'organic-reactions': OrganicReactionsCanvas, 'gas-laws': GasLawsCanvas,
  'nuclear-reactions': NuclearReactionsCanvas, 'ph-buffers': PhBuffersCanvas,
  polymerization: PolymerizationCanvas, 'crystal-growing': CrystalGrowingCanvas,
  electroplating: ElectroPlatingCanvas, 'soap-making': SoapMakingCanvas,
  'reaction-rates': ReactionRatesCanvas, entropy: EntropyCanvas,
  'mass-spectrometry': MassSpectrometryCanvas, corrosion: CorrosionCanvas,
  'atomic-spectra': AtomicSpectraCanvas, pendulum: PendulumCanvas,
  'wave-interference': WaveInterferenceCanvas, projectile: ProjectileCanvas,
  'optics-snell': OpticsSnellCanvas, 'electric-fields': ElectricFieldsCanvas,
  'magnetic-force': MagneticForceCanvas, 'carnot-cycle': CarnotCycleCanvas,
  'quantum-tunneling': QuantumTunnelingCanvas, 'gravitational-orbits': GravitationalOrbitsCanvas,
  'doppler-effect': DopplerEffectCanvas, 'ohms-law': OhmsLawCanvas,
  capacitor: CapacitorCanvas, 'wave-diffraction': WaveDiffractionCanvas,
  'momentum-collision': MomentumCollisionCanvas, 'spring-oscillator': SpringOscillatorCanvas,
  'fluid-mechanics': FluidMechanicsCanvas, solenoid: SolenoidCanvas,
  'rc-circuit': RcCircuitCanvas, 'electromagnetic-induction': ElectromagneticInductionCanvas,
  'refraction-prism': RefractionPrismCanvas, limits: LimitsCanvas,
  derivative: DerivativeCanvas, integral: IntegralCanvas,
  'taylor-series': TaylorSeriesCanvas, 'matrix-transform': MatrixTransformCanvas,
  'complex-numbers': ComplexNumbersCanvas, 'fourier-series': FourierSeriesCanvas,
  'probability-dist': ProbabilityDistCanvas, 'vector-fields': VectorFieldsCanvas,
  'conic-sections': ConicSectionsCanvas, 'differential-equations': DifferentialEquationsCanvas,
  fractals: FractalsCanvas, 'bayes-theorem': BayesTheoremCanvas,
  'linear-programming': LinearProgrammingCanvas, 'newtons-method': NewtonsMethodCanvas,
  eigenvalues: EigenvaluesCanvas, 'graph-theory': GraphTheoryCanvas,
  'number-theory': NumberTheoryCanvas, 'set-theory': SetTheoryCanvas,
  'surface-integrals': SurfaceIntegralsCanvas,
  // ── New Biology ──────────────────────────────────────────────────────
  'bio-microscopy': makeGeneric('bio-microscopy'),
  'membrane-potential': makeGeneric('membrane-potential'),
  'cell-cycle': makeGeneric('cell-cycle'),
  'plant-hormones': makeGeneric('plant-hormones'),
  'kidney-nephron': makeGeneric('kidney-nephron'),
  'ecological-succession': makeGeneric('ecological-succession'),
  'viral-replication': makeGeneric('viral-replication'),
  'immunology-antibody': makeGeneric('immunology-antibody'),
  'meiosis': makeGeneric('meiosis'),
  'sensory-physiology': makeGeneric('sensory-physiology'),
  // ── New Chemistry ────────────────────────────────────────────────────
  'redox-titration': makeGeneric('redox-titration'),
  'colligative-properties': makeGeneric('colligative-properties'),
  'chemical-equilibrium': makeGeneric('chemical-equilibrium'),
  'oxidation-states': makeGeneric('oxidation-states'),
  'nmr-spectroscopy': makeGeneric('nmr-spectroscopy'),
  'electrochemical-cell': makeGeneric('electrochemical-cell'),
  'acid-base-equilibria': makeGeneric('acid-base-equilibria'),
  'haber-process': makeGeneric('haber-process'),
  'thin-layer-chromatography': makeGeneric('thin-layer-chromatography'),
  'nanoparticles': makeGeneric('nanoparticles'),
  // ── New Physics ──────────────────────────────────────────────────────
  'thermal-radiation': makeGeneric('thermal-radiation'),
  'special-relativity': makeGeneric('special-relativity'),
  'nuclear-fission': makeGeneric('nuclear-fission'),
  'simple-harmonic-resonance': makeGeneric('simple-harmonic-resonance'),
  'photoelectric-effect': makeGeneric('photoelectric-effect'),
  'electric-circuits-advanced': makeGeneric('electric-circuits-advanced'),
  'gas-kinetic-theory': makeGeneric('gas-kinetic-theory'),
  'standing-waves': makeGeneric('standing-waves'),
  'lens-optics': makeGeneric('lens-optics'),
  'particle-physics': makeGeneric('particle-physics'),
  // ── New Mathematics ──────────────────────────────────────────────────
  'riemann-hypothesis': makeGeneric('riemann-hypothesis'),
  'topology': makeGeneric('topology'),
  'monte-carlo': makeGeneric('monte-carlo'),
  'modular-arithmetic': makeGeneric('modular-arithmetic'),
  'golden-ratio': makeGeneric('golden-ratio'),
  'group-theory': makeGeneric('group-theory'),
  'information-theory': makeGeneric('information-theory'),
  'chaos-theory': makeGeneric('chaos-theory'),
  'network-centrality': makeGeneric('network-centrality'),
  'game-theory': makeGeneric('game-theory'),
  // Computer Science (10)
  'binary-search': makeGeneric('binary-search'),
  'sorting-algorithms': makeGeneric('sorting-algorithms'),
  'stack-queue': makeGeneric('stack-queue'),
  'binary-tree': makeGeneric('binary-tree'),
  'graph-algorithms': makeGeneric('graph-algorithms'),
  'recursion-viz': makeGeneric('recursion-viz'),
  'hash-table': makeGeneric('hash-table'),
  'dynamic-programming': makeGeneric('dynamic-programming'),
  'big-o-notation': makeGeneric('big-o-notation'),
  'finite-state-machine': makeGeneric('finite-state-machine'),
};

const SUBJECT_THEME: Record<string, { bg: string; border: string; text: string; accent: string; headerBg: string }> = {
  biology:           { bg: '#F0F7F3', border: '#BBF7D0', text: '#1B4332', accent: '#22C55E', headerBg: '#DCFCE7' },
  chemistry:         { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', accent: '#F59E0B', headerBg: '#FEF3C7' },
  physics:           { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E3A5F', accent: '#3B82F6', headerBg: '#DBEAFE' },
  mathematics:       { bg: '#F5F3FF', border: '#DDD6FE', text: '#4C1D95', accent: '#8B5CF6', headerBg: '#EDE9FE' },
  'computer-science':{ bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E', accent: '#0EA5E9', headerBg: '#E0F2FE' },
};

// ── Chat message type ─────────────────────────────────────────────────
interface ChatMsg {
  id: string;
  role: 'ai' | 'user';
  text: string;
  ts: string;
  isStreaming?: boolean;
  isAuto?: boolean; // auto-triggered by sim event
}

export default function LabBenchPage() {
  const { setScreen, selectedSubject, selectedExperiment, session,
          addSimulationEvent, incrementInteraction, setQuizData, resetSession } = useApp();
  const experiment = selectedExperiment ? getExperiment(selectedExperiment) : null;
  const theme = SUBJECT_THEME[selectedSubject ?? 'biology'];

  const [messages, setMessages]         = useState<ChatMsg[]>([]);
  const [inputText, setInputText]       = useState('');
  const [streamingIds, setStreamingIds] = useState<Set<string>>(new Set());
  const [interactionCount, setInteractionCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileChat, setMobileChat]     = useState(false);
  const [rateLimited, setRateLimited]   = useState(false);

  const chatEndRef    = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accRef        = useRef<Record<string, string>>({});
  const historyRef    = useRef<DrLabMessage[]>([]);
  const inputRef      = useRef<HTMLInputElement>(null);

  const REQUIRED  = 5;
  const canFinish = interactionCount >= REQUIRED;
  const isAIActive = streamingIds.size > 0;

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingIds]);

  useEffect(() => {
    if (!canFinish || !selectedExperiment) return;
    const key = `${selectedExperiment}_${session?.startTime ?? ''}`;
    if (_trackedThresholdIds.has(key)) return;
    _trackedThresholdIds.add(key);
    if (typeof pendo !== 'undefined') {
      pendo.track('experiment_progress_threshold_reached', {
        experimentId: selectedExperiment,
        experimentName: experiment?.name ?? '',
        subjectId: selectedSubject ?? '',
        interactionCount,
        requiredCount: REQUIRED,
        sessionDurationMs: Date.now() - (session?.startTime ?? Date.now()),
      });
    }
  }, [canFinish, selectedExperiment, experiment, selectedSubject, interactionCount, session]);

  // ── Core streaming — pure Q&A, never auto-triggered ───────────────
  const streamAI = useCallback((userPrompt: string) => {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    accRef.current[msgId] = '';
    setRateLimited(false);
    setStreamingIds(prev => new Set(prev).add(msgId));

    setMessages(prev => [...prev, {
      id: msgId, role: 'ai', text: '', ts: now(), isStreaming: true, isAuto: false,
    }]);

    const historySnapshot = historyRef.current.slice(-12);

    streamDrLab({
      userPrompt,
      history: historySnapshot,
      onChunk: (chunk) => {
        accRef.current[msgId] = (accRef.current[msgId] ?? '') + chunk;
        const acc = accRef.current[msgId];
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: acc, isStreaming: true } : m));
      },
      onComplete: () => {
        const final = accRef.current[msgId] ?? '';
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: final, isStreaming: false } : m));
        historyRef.current = [
          ...historySnapshot,
          { role: 'user' as const, content: userPrompt },
          { role: 'assistant' as const, content: final },
        ].slice(-20);
        setStreamingIds(prev => { const s = new Set(prev); s.delete(msgId); return s; });
        delete accRef.current[msgId];
        if (typeof pendo !== 'undefined') {
          pendo.track('ai_tutor_response_completed', {
            experimentId: selectedExperiment ?? '',
            subjectId: selectedSubject ?? '',
            responseStatus: 'success',
            isRateLimited: false,
            responseLength: final.length,
          });
        }
      },
      onError: (err) => {
        const isRateLimit = err?.message === 'rate_limit' || String(err).includes('429');
        if (isRateLimit) {
          setRateLimited(true);
          setMessages(prev => prev.map(m => m.id === msgId
            ? { ...m, text: '⏳ Too many requests — please wait a moment and try again.', isStreaming: false }
            : m));
        } else {
          setMessages(prev => prev.map(m => m.id === msgId
            ? { ...m, text: "Sorry, I couldn't connect. Please check your internet and try again.", isStreaming: false }
            : m));
        }
        setStreamingIds(prev => { const s = new Set(prev); s.delete(msgId); return s; });
        delete accRef.current[msgId];
        if (typeof pendo !== 'undefined') {
          pendo.track('ai_tutor_response_completed', {
            experimentId: selectedExperiment ?? '',
            subjectId: selectedSubject ?? '',
            responseStatus: 'error',
            isRateLimited: isRateLimit,
            responseLength: 0,
          });
        }
      },
    });
  }, [selectedExperiment, selectedSubject]);

  // ── Track sim interactions for progress — NO auto AI call ─────────
  const handleSimEvent = useCallback((event: string) => {
    addSimulationEvent(event);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setInteractionCount(c => c + 1);
      incrementInteraction();
    }, 800);
  }, [addSimulationEvent, incrementInteraction]);

  // ── User sends a question ─────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    inputRef.current?.focus();

    setMessages(prev => [...prev, {
      id: `u_${Date.now()}`, role: 'user', text, ts: now(), isAuto: false,
    }]);
    historyRef.current = [...historyRef.current, { role: 'user' as const, content: text }].slice(-20);

    if (typeof pendo !== 'undefined') {
      pendo.track('ai_tutor_question_sent', {
        experimentId: selectedExperiment ?? '',
        experimentName: experiment?.name ?? '',
        subjectId: selectedSubject ?? '',
        questionText: text.slice(0, 200),
        interactionCount: interactionCount + 1,
        chatHistoryLength: historyRef.current.length,
      });
    }

    const prompt =
      `The student is asking about the "${experiment?.name}" experiment: "${text}". ` +
      `Answer directly in under 80 words. Be clear, educational, and connect to the simulation.`;
    streamAI(prompt);
    setInteractionCount(c => c + 1);
    incrementInteraction();
  }, [inputText, experiment, streamAI, incrementInteraction, selectedExperiment, selectedSubject, interactionCount]);

  const handleReset = () => {
    if (typeof pendo !== 'undefined') {
      pendo.track('experiment_session_reset', {
        experimentId: selectedExperiment ?? '',
        subjectId: selectedSubject ?? '',
        interactionCountBeforeReset: interactionCount,
        messagesCountBeforeReset: messages.length,
        sessionDurationMs: Date.now() - (session?.startTime ?? Date.now()),
      });
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setMessages([]);
    setInputText('');
    setInteractionCount(0);
    setStreamingIds(new Set());
    historyRef.current = [];
    accRef.current = {};
    setRateLimited(false);
    resetSession();
  };

  const finishExperiment = async () => {
    if (typeof pendo !== 'undefined') {
      pendo.track('quiz_generation_initiated', {
        experimentId: selectedExperiment ?? '',
        experimentName: experiment?.name ?? '',
        subjectId: selectedSubject ?? '',
        interactionCount,
        chatMessagesCount: messages.length,
      });
    }
    setIsGenerating(true);
    const chatContext = messages.filter(m => m.role === 'ai' && m.text.length > 20)
      .slice(-3).map(m => m.text).join(' ');
    try {
      const questions = await generateQuiz({
        experimentName: experiment?.name ?? 'Lab Experiment',
        subjectId: experiment?.subjectId ?? selectedSubject ?? 'science',
        chatContext,
      });
      setQuizData({
        experimentName: experiment?.name ?? 'Lab Experiment',
        subjectId: experiment?.subjectId ?? selectedSubject ?? '',
        questions,
      });
      setScreen('quiz');
    } catch {
      // fallback
      setQuizData({
        experimentName: experiment?.name ?? 'Lab Experiment',
        subjectId: experiment?.subjectId ?? selectedSubject ?? '',
        questions: [],
      });
      setScreen('quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const SimCanvas = experiment ? CANVAS_MAP[experiment.id] : null;

  const quickQuestions = experiment ? [
    `What is the key principle of ${experiment.name}?`,
    'How does this relate to real life?',
    'What would happen if I changed a variable?',
  ] : [];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#FAF8F3' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-3 md:px-5 py-2.5 flex items-center gap-3 shrink-0"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E7E5E0', zIndex: 10 }}>
        <button onClick={() => setScreen('selection')}
          className="flex items-center gap-1 text-xs font-inter transition-colors shrink-0 px-2.5 py-1.5 rounded-lg"
          style={{ color: '#52796F', background: '#F0F7F3' }}>
          <ChevronLeft size={14} /><span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg leading-none shrink-0">{experiment?.emoji}</span>
          <div className="flex flex-col min-w-0">
            <span className="font-sora font-semibold text-sm leading-tight truncate" style={{ color: '#1C1917' }}>
              {experiment?.name}
            </span>
            <span className="font-inter text-xs" style={{ color: '#A8A29E' }}>
              {experiment?.subjectId ? experiment.subjectId.charAt(0).toUpperCase() + experiment.subjectId.slice(1) : ''}
              {experiment?.difficulty ? ` · ${experiment.difficulty}` : ''}
            </span>
          </div>
        </div>

        <button onClick={() => setMobileChat(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-inter lg:hidden shrink-0 relative"
          style={{ color: theme.text, background: theme.bg, border: `1px solid ${theme.border}` }}>
          <BotMessageSquare size={14} />
          Dr. Lab
          {isAIActive && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: '#F59E0B' }} />
          )}
        </button>

        <button onClick={handleReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-inter transition-all shrink-0"
          style={{ color: '#78716C', background: '#F5F5F4', border: '1px solid #E7E5E0' }}>
          <RotateCcw size={12} /><span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── LEFT: Canvas ───────────────────────────────────────── */}
        <div className={`flex flex-col min-h-0 transition-all ${mobileChat ? 'hidden' : 'flex-1'} lg:flex lg:flex-1`}
          style={{ background: '#FDFCF9', borderRight: '1px solid #E7E5E0' }}>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-5">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64 rounded-2xl"
                style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-2 text-sm font-inter" style={{ color: theme.text }}>
                  <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
                  <span className="ml-2">Loading simulation…</span>
                </div>
              </div>
            }>
              {SimCanvas ? (
                <div className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${theme.border}`, background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <SimCanvas onEvent={handleSimEvent} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 rounded-2xl text-sm font-inter"
                  style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
                  Experiment not found
                </div>
              )}
            </Suspense>
          </div>

          <AnimatePresence>
            {canFinish && (
              <motion.div className="px-4 pb-4 pt-2 shrink-0 lg:hidden"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <button onClick={finishExperiment} disabled={isGenerating}
                  className="w-full font-sora font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: theme.accent, color: '#FFF', boxShadow: `0 4px 14px ${theme.accent}55` }}>
                  {isGenerating
                    ? <><span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" /><span className="ml-2">Generating quiz…</span></>
                    : <><Trophy size={15} /> Take Quiz</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Progress card + Dr. Lab Q&A ─────────────────── */}
        <div className={`flex flex-col shrink-0 min-h-0 w-full lg:w-[380px] xl:w-[420px] ${mobileChat ? 'flex' : 'hidden'} lg:flex`}
          style={{ background: '#FFFFFF' }}>

          {/* Progress card */}
          <div className="px-4 py-3 shrink-0" style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <FlaskConical size={13} color={theme.text} />
                <span className="font-sora font-bold text-xs" style={{ color: theme.text }}>Experiment Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-sora font-bold text-sm" style={{ color: theme.accent }}>
                  {Math.min(interactionCount, REQUIRED)}/{REQUIRED}
                </span>
                {canFinish && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 size={16} color={theme.accent} />
                  </motion.div>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 mb-2">
              {Array.from({ length: REQUIRED }).map((_, i) => (
                <motion.div key={i} className="h-2 flex-1 rounded-full"
                  animate={{ background: i < interactionCount ? theme.accent : '#E7E5E0' }}
                  transition={{ duration: 0.4, delay: i * 0.04 }} />
              ))}
            </div>
            <p className="font-inter text-xs" style={{ color: theme.text, opacity: 0.75 }}>
              {canFinish
                ? '✅ Ready! Take the knowledge quiz to complete this experiment.'
                : `Interact with the simulation — ${REQUIRED - Math.min(interactionCount, REQUIRED)} more to unlock the quiz`}
            </p>
          </div>

          {/* Dr. Lab header */}
          <div className="px-4 py-2.5 shrink-0 flex items-center gap-3"
            style={{ background: '#FAFAF9', borderBottom: '1px solid #F0EDE8' }}>
            <div className="relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: theme.bg, border: `1.5px solid ${theme.border}` }}>
                <BotMessageSquare size={15} color={theme.text} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ background: rateLimited ? '#F59E0B' : isAIActive ? '#3B82F6' : '#22C55E' }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-sora font-bold text-sm" style={{ color: '#1C1917' }}>Dr. Lab</span>
              <p className="font-inter text-xs" style={{ color: '#A8A29E' }}>
                {rateLimited ? '⏳ Rate limited — wait a moment' : isAIActive ? 'Answering…' : 'Ask any science question'}
              </p>
            </div>
            {isAIActive && (
              <div className="flex gap-0.5">
                <span className="thinking-dot" style={{ background: theme.accent }} />
                <span className="thinking-dot" style={{ background: theme.accent }} />
                <span className="thinking-dot" style={{ background: theme.accent }} />
              </div>
            )}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 min-h-0">
            {messages.length === 0 && !isAIActive && (
              <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: theme.bg, border: `1.5px solid ${theme.border}` }}>
                  <Sparkles size={24} color={theme.accent} />
                </div>
                <p className="font-sora font-semibold text-sm text-center text-balance" style={{ color: '#1C1917' }}>
                  Your AI Science Tutor
                </p>
                <p className="font-inter text-xs text-center text-pretty" style={{ color: '#A8A29E', lineHeight: 1.6 }}>
                  Ask Dr. Lab anything about this experiment — concepts, mechanisms, real-world applications.
                </p>
                <div className="flex flex-col gap-1.5 w-full mt-1">
                  {quickQuestions.map(q => (
                    <button key={q} onClick={() => { setInputText(q); inputRef.current?.focus(); }}
                      className="text-left px-3 py-2 rounded-xl text-xs font-inter transition-all"
                      style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}>
                      💬 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: msg.role === 'ai' ? theme.bg : '#1C1917',
                      border: msg.role === 'ai' ? `1px solid ${theme.border}` : 'none',
                    }}>
                    {msg.role === 'ai'
                      ? <BotMessageSquare size={10} color={theme.text} />
                      : <User size={10} color="#FFF" />}
                  </div>
                  <div className={`flex flex-col gap-0.5 max-w-[84%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-3 py-2.5 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      style={{
                        background: msg.role === 'ai' ? theme.bg : '#1C1917',
                        border: msg.role === 'ai' ? `1px solid ${theme.border}` : 'none',
                      }}>
                      <p className="font-inter text-xs leading-relaxed text-pretty"
                        style={{ color: msg.role === 'ai' ? '#1C1917' : '#FFFFFF' }}>
                        {msg.text || (streamingIds.has(msg.id) ? '' : '—')}
                        {streamingIds.has(msg.id) && (
                          <span className="inline-block w-0.5 h-3 ml-0.5 rounded-full animate-pulse align-middle"
                            style={{ background: msg.role === 'ai' ? theme.accent : '#FFFFFF' }} />
                        )}
                      </p>
                    </div>
                    <p className="font-inter text-xs px-1" style={{ color: '#C4C0BB' }}>{msg.ts}</p>
                  </div>
                </motion.div>
              ))}

              {isAIActive && (
                <motion.div key="thinking" className="flex gap-2"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                    <BotMessageSquare size={10} color={theme.text} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1"
                    style={{ background: theme.bg, border: `1px solid ${theme.border}` }}>
                    <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Rate limit alert */}
          <AnimatePresence>
            {rateLimited && (
              <motion.div className="mx-3 mb-2 px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AlertCircle size={12} color="#D97706" />
                <p className="font-inter text-xs" style={{ color: '#92400E' }}>
                  Too many requests. Wait ~30s then try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input — always enabled */}
          <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid #F0EDE8', background: '#FAFAF9' }}>
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask Dr. Lab a question…"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-xs font-inter outline-none transition-all"
                style={{ background: '#FFFFFF', border: '1.5px solid #E7E5E0', color: '#1C1917' }}
                onFocus={e => { e.currentTarget.style.borderColor = theme.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E7E5E0'; }}
              />
              <button onClick={handleSend} disabled={!inputText.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                style={{ background: inputText.trim() ? theme.accent : '#E7E5E0' }}>
                <Send size={14} color="#FFFFFF" />
              </button>
            </div>
          </div>

          {/* Quiz / locked button */}
          <div className="px-4 pb-4 pt-2 shrink-0 hidden lg:block">
            <AnimatePresence mode="wait">
              {canFinish ? (
                <motion.button key="finish" onClick={finishExperiment} disabled={isGenerating}
                  className="w-full font-sora font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: theme.accent, color: '#FFF', boxShadow: `0 4px 18px ${theme.accent}55` }}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  {isGenerating
                    ? <><span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" /><span className="ml-2">Generating quiz…</span></>
                    : <><Trophy size={16} /> Take Knowledge Quiz</>}
                </motion.button>
              ) : (
                <motion.div key="locked" className="w-full font-inter text-xs py-3 text-center rounded-xl"
                  style={{ background: '#F5F5F4', color: '#A8A29E', border: '1px dashed #D6D3D1' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {REQUIRED - Math.min(interactionCount, REQUIRED)} more interaction{REQUIRED - Math.min(interactionCount, REQUIRED) !== 1 ? 's' : ''} to unlock quiz
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
