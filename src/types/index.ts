export type SubjectId = 'biology' | 'chemistry' | 'physics' | 'mathematics' | 'computer-science' | 'virtual-lab';

export type ExperimentId =
  // Biology (30)
  | 'osmosis' | 'enzyme' | 'photosynthesis' | 'dna' | 'mitosis'
  | 'protein-synthesis' | 'genetics' | 'cellular-respiration' | 'action-potential' | 'immune-response'
  | 'blood-typing' | 'ecosystem-simulation' | 'crispr-editing' | 'hardy-weinberg' | 'neurotransmitters'
  | 'hormone-signaling' | 'natural-selection' | 'transpiration' | 'fermentation' | 'circulatory-system'
  | 'bio-microscopy' | 'membrane-potential' | 'cell-cycle' | 'plant-hormones' | 'kidney-nephron'
  | 'ecological-succession' | 'viral-replication' | 'immunology-antibody' | 'meiosis' | 'sensory-physiology'
  // Chemistry (30)
  | 'titration' | 'flame' | 'voltaic' | 'chromatography' | 'calorimetry'
  | 'le-chatelier' | 'electrolysis' | 'organic-reactions' | 'gas-laws' | 'nuclear-reactions'
  | 'ph-buffers' | 'polymerization' | 'crystal-growing' | 'electroplating' | 'soap-making'
  | 'reaction-rates' | 'entropy' | 'mass-spectrometry' | 'corrosion' | 'atomic-spectra'
  | 'redox-titration' | 'colligative-properties' | 'chemical-equilibrium' | 'oxidation-states' | 'nmr-spectroscopy'
  | 'electrochemical-cell' | 'acid-base-equilibria' | 'haber-process' | 'thin-layer-chromatography' | 'nanoparticles'
  // Physics (30)
  | 'pendulum' | 'wave-interference' | 'projectile' | 'optics-snell'
  | 'electric-fields' | 'magnetic-force' | 'carnot-cycle' | 'quantum-tunneling'
  | 'gravitational-orbits' | 'doppler-effect'
  | 'ohms-law' | 'capacitor' | 'wave-diffraction' | 'momentum-collision' | 'spring-oscillator'
  | 'fluid-mechanics' | 'solenoid' | 'rc-circuit' | 'electromagnetic-induction' | 'refraction-prism'
  | 'thermal-radiation' | 'special-relativity' | 'nuclear-fission' | 'simple-harmonic-resonance' | 'photoelectric-effect'
  | 'electric-circuits-advanced' | 'gas-kinetic-theory' | 'standing-waves' | 'lens-optics' | 'particle-physics'
  // Mathematics (30)
  | 'limits' | 'derivative' | 'integral' | 'taylor-series'
  | 'matrix-transform' | 'complex-numbers' | 'fourier-series'
  | 'probability-dist' | 'vector-fields' | 'conic-sections'
  | 'differential-equations' | 'fractals' | 'bayes-theorem' | 'linear-programming' | 'newtons-method'
  | 'eigenvalues' | 'graph-theory' | 'number-theory' | 'set-theory' | 'surface-integrals'
  | 'riemann-hypothesis' | 'topology' | 'monte-carlo' | 'modular-arithmetic' | 'golden-ratio'
  | 'group-theory' | 'information-theory' | 'chaos-theory' | 'network-centrality' | 'game-theory'
  // Computer Science (10)
  | 'binary-search' | 'sorting-algorithms' | 'stack-queue' | 'binary-tree' | 'graph-algorithms'
  | 'recursion-viz' | 'hash-table' | 'dynamic-programming' | 'big-o-notation' | 'finite-state-machine';

export type Screen = 'landing' | 'subject' | 'selection' | 'lab' | 'report' | 'quiz' | 'virtual-lab';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Subject {
  id: SubjectId;
  name: string;
  emoji: string;
  available: boolean;
  experimentCount: number;
  color: string;
}

export interface Experiment {
  id: ExperimentId;
  subjectId: SubjectId;
  emoji: string;
  name: string;
  shortDescription: string;
  description: string;
  difficulty: Difficulty;
  openingPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'ai' | 'student';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface SessionData {
  experimentId: ExperimentId;
  subjectId: SubjectId;
  chatHistory: ChatMessage[];
  interactionCount: number;
  startTime: number;
  simulationEvents: string[];
}

export interface LabReportData {
  experimentName: string;
  subjectName: string;
  date: string;
  grade: string;
  objective: string;
  observations: string;
  analysis: string;
  conclusion: string;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  experimentName: string;
  subjectId: string;
  questions: QuizQuestion[];
}
