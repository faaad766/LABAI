// GenericLabCanvas — interactive canvas for experiments without a dedicated custom canvas.
// Shows key concepts, an animated diagram, and interactive controls relevant to the topic.
import { useEffect, useRef, useState } from 'react';
import { getExperiment } from '@/lib/experiments';

interface Props {
  experimentId: string;
  onEvent: (e: string) => void;
}

// ── Per-experiment config ──────────────────────────────────────────────
interface Config {
  bg: string;
  accent: string;
  concepts: string[];
  controls: { label: string; action: string }[];
  drawFrame: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, state: number) => void;
}

function defaultDraw(accent: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, state: number) => {
    ctx.clearRect(0, 0, w, h);
    // Animated particle field
    const count = 18 + state * 4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t * 0.003;
      const r = 60 + Math.sin(t * 0.02 + i) * 25;
      const x = w / 2 + r * Math.cos(angle);
      const y = h / 2 + r * Math.sin(angle) * 0.55;
      ctx.beginPath();
      ctx.arc(x, y, 5 + Math.sin(t * 0.04 + i) * 2, 0, Math.PI * 2);
      ctx.fillStyle = accent + 'CC';
      ctx.fill();
    }
    // Central glow
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 50);
    g.addColorStop(0, accent + '44');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
    ctx.fill();
  };
}

const CONFIGS: Record<string, Config> = {
  // Biology
  'bio-microscopy': {
    bg: '#F0F7F3', accent: '#1B4332',
    concepts: ['Resolving power vs magnification', '×40, ×100, ×400 objectives', 'Oil immersion at ×1000', 'Staining techniques'],
    controls: [{ label: 'Focus Coarse', action: 'Adjusted coarse focus' }, { label: 'Increase Mag', action: 'Increased magnification to ×400' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      // Lens circle
      ctx.beginPath(); ctx.arc(w/2, h/2, 80, 0, Math.PI*2);
      ctx.strokeStyle = '#2D6A4F'; ctx.lineWidth = 3; ctx.stroke();
      // Cell organelles
      const orgs = [{x:0,y:0,r:18,c:'#1B4332'},{x:28,y:-20,r:8,c:'#52796F'},{x:-22,y:15,r:6,c:'#84A98C'},{x:10,y:25,r:5,c:'#52796F'},{x:-30,y:-10,r:5,c:'#84A98C'}];
      orgs.forEach(o => {
        ctx.beginPath(); ctx.arc(w/2+o.x+Math.sin(t*0.01)*2, h/2+o.y+Math.cos(t*0.01)*2, o.r, 0, Math.PI*2);
        ctx.fillStyle = o.c+'99'; ctx.fill();
        ctx.strokeStyle = o.c; ctx.lineWidth=1.5; ctx.stroke();
      });
      ctx.font='11px Inter,sans-serif'; ctx.fillStyle='#1B4332'; ctx.textAlign='center';
      ctx.fillText('Cell ×400', w/2, h/2+105);
    },
  },
  'membrane-potential': {
    bg: '#EFF6FF', accent: '#1E40AF',
    concepts: ['Resting potential: −70 mV', 'Na⁺/K⁺-ATPase pump', 'Nernst equation', 'Ion concentration gradients'],
    controls: [{ label: 'Open Na⁺ Channel', action: 'Na⁺ channel opened — depolarisation' }, { label: 'Open K⁺ Channel', action: 'K⁺ channel opened — repolarisation' }],
    drawFrame: defaultDraw('#1E40AF'),
  },
  'cell-cycle': {
    bg: '#FFF7ED', accent: '#C2410C',
    concepts: ['G1 → S → G2 → M phases', 'G1/S checkpoint (p53)', 'DNA replication in S phase', 'Cyclin-CDK complexes'],
    controls: [{ label: 'Advance Phase', action: 'Cell advanced to next phase' }, { label: 'Introduce Mutation', action: 'TP53 mutation introduced — checkpoint disabled!' }],
    drawFrame: defaultDraw('#C2410C'),
  },
  'plant-hormones': {
    bg: '#F0FDF4', accent: '#16A34A',
    concepts: ['Auxin (IAA) — phototropism', 'Gibberellin — elongation & germination', 'Ethylene — fruit ripening', 'ABA — stomatal closure'],
    controls: [{ label: 'Apply Auxin', action: 'Auxin applied — shoot bends toward light' }, { label: 'Apply Ethylene', action: 'Ethylene applied — fruit ripening begun' }],
    drawFrame: defaultDraw('#16A34A'),
  },
  'kidney-nephron': {
    bg: '#FFF1F2', accent: '#BE123C',
    concepts: ['Glomerular filtration (Bowman\'s capsule)', 'PCT reabsorption of glucose', 'Loop of Henle counter-current', 'ADH controls water reabsorption'],
    controls: [{ label: 'Increase ADH', action: 'ADH increased — more water reabsorbed' }, { label: 'Simulate Filtration', action: 'Filtrate entering Bowman\'s capsule' }],
    drawFrame: defaultDraw('#BE123C'),
  },
  'ecological-succession': {
    bg: '#F0FDF4', accent: '#15803D',
    concepts: ['Primary vs secondary succession', 'Pioneer species (lichens)', 'Climax community', 'Soil formation over time'],
    controls: [{ label: 'Add Pioneers', action: 'Lichen pioneers colonising bare rock' }, { label: 'Advance 50 years', action: 'Community advanced — shrubs appear' }],
    drawFrame: defaultDraw('#15803D'),
  },
  'viral-replication': {
    bg: '#FFF7ED', accent: '#EA580C',
    concepts: ['Attachment to host receptors', 'Viral DNA injection', 'Hijacking ribosomes', 'Lysis vs lysogeny'],
    controls: [{ label: 'Inject Virus', action: 'Phage injecting DNA into host cell' }, { label: 'Trigger Lysis', action: 'Host cell lysing — 200 virions released!' }],
    drawFrame: defaultDraw('#EA580C'),
  },
  'immunology-antibody': {
    bg: '#F5F3FF', accent: '#7C3AED',
    concepts: ['Clonal selection of B cells', 'Plasma cell antibody production', 'T-helper / cytotoxic T cells', 'Memory cells → faster response'],
    controls: [{ label: 'Inject Antigen', action: 'Antigen detected — immune response activating' }, { label: 'Re-expose', action: 'Secondary exposure — rapid memory response!' }],
    drawFrame: defaultDraw('#7C3AED'),
  },
  'meiosis': {
    bg: '#FFF0F6', accent: '#9D174D',
    concepts: ['Synapsis & crossing over (Prophase I)', 'Independent assortment (Metaphase I)', 'Meiosis I reduces ploidy', '4 haploid gametes produced'],
    controls: [{ label: 'Trigger Crossing Over', action: 'Chiasmata forming — genetic recombination!' }, { label: 'Advance to Meiosis II', action: 'Meiosis II started — separating chromatids' }],
    drawFrame: defaultDraw('#9D174D'),
  },
  'sensory-physiology': {
    bg: '#FFFBEB', accent: '#B45309',
    concepts: ['Pupillary reflex (CN III)', 'Lens accommodation', 'Rods (scotopic) vs cones (photopic)', 'Optic chiasm & visual cortex'],
    controls: [{ label: 'Dim the Light', action: 'Pupils dilating — entering dim environment' }, { label: 'Focus Near Object', action: 'Lens thickening — accommodation reflex' }],
    drawFrame: defaultDraw('#B45309'),
  },
  // Chemistry
  'redox-titration': {
    bg: '#FDF4FF', accent: '#9333EA',
    concepts: ['KMnO₄ as self-indicator', 'MnO₄⁻ → Mn²⁺ (half-equation)', 'Equivalence at permanent pink', 'Molarity calculation'],
    controls: [{ label: 'Add Drop KMnO₄', action: 'Drop decolourised — Fe²⁺ still present' }, { label: 'Reach Endpoint', action: 'Permanent pink! Equivalence point reached!' }],
    drawFrame: defaultDraw('#9333EA'),
  },
  'colligative-properties': {
    bg: '#EFF6FF', accent: '#2563EB',
    concepts: ['Boiling point elevation ΔTb = Kb·m·i', 'Freezing point depression ΔTf = Kf·m·i', 'Van\'t Hoff factor i', 'Osmotic pressure π = MRT'],
    controls: [{ label: 'Add NaCl', action: 'NaCl dissolved — freezing point lowered by 3.7°C' }, { label: 'Add Sucrose', action: 'Sucrose dissolved — non-electrolyte, i=1' }],
    drawFrame: defaultDraw('#2563EB'),
  },
  'chemical-equilibrium': {
    bg: '#F0FDF4', accent: '#059669',
    concepts: ['Dynamic equilibrium (equal rates)', 'Equilibrium constant Kc', 'Reaction quotient Q vs Kc', 'Le Chatelier predicts shifts'],
    controls: [{ label: 'Add Reactant', action: 'Q < Kc — system shifts forward to restore equilibrium' }, { label: 'Increase Temperature', action: 'Endothermic reaction favoured — Kc changes' }],
    drawFrame: defaultDraw('#059669'),
  },
  'oxidation-states': {
    bg: '#FFFBEB', accent: '#D97706',
    concepts: ['OIL RIG (Oxidation Is Loss, Reduction Is Gain)', 'Rules for assigning oxidation numbers', 'Oxidising agent / reducing agent', 'Balancing half-equations'],
    controls: [{ label: 'Assign Ox. States', action: 'Oxidation states assigned — Mn goes +7→+2' }, { label: 'Balance Half-Eq.', action: 'Half-equations balanced using ion-electron method' }],
    drawFrame: defaultDraw('#D97706'),
  },
  'nmr-spectroscopy': {
    bg: '#F0F9FF', accent: '#0369A1',
    concepts: ['Chemical shift (ppm vs TMS)', 'Spin-spin splitting (n+1 rule)', 'Integration ratio = H count', 'Common shifts: CH₃≈0.9, OH≈2–5, ArH≈7–8'],
    controls: [{ label: 'Identify CH₃ Peak', action: 'CH₃ triplet at 0.9 ppm identified' }, { label: 'Check Integration', action: 'Integration ratio 3:2:1 — confirms structure' }],
    drawFrame: defaultDraw('#0369A1'),
  },
  'electrochemical-cell': {
    bg: '#FFF7ED', accent: '#C2410C',
    concepts: ['E°cell = E°cathode − E°anode', 'Daniell cell: Zn|ZnSO₄||CuSO₄|Cu', 'Salt bridge maintains neutrality', 'Spontaneous if E°cell > 0'],
    controls: [{ label: 'Connect Circuit', action: 'Electrons flowing Zn→Cu — cell EMF = 1.10 V' }, { label: 'Remove Salt Bridge', action: 'Current stops — charge build-up blocks reaction' }],
    drawFrame: defaultDraw('#C2410C'),
  },
  'acid-base-equilibria': {
    bg: '#F5F3FF', accent: '#6D28D9',
    concepts: ['Ka = [H⁺][A⁻]/[HA]', 'pH = −log[H⁺]', 'Weak acid: [H⁺] = √(Ka·C)', 'pKa = pH at half-equivalence'],
    controls: [{ label: 'Compare Strong/Weak', action: 'At 0.1 M: HCl pH=1.0, CH₃COOH pH=2.87' }, { label: 'Calculate pH', action: 'pH = ½(pKa − log C) = 2.87 for acetic acid' }],
    drawFrame: defaultDraw('#6D28D9'),
  },
  'haber-process': {
    bg: '#F0FDF4', accent: '#15803D',
    concepts: ['N₂ + 3H₂ ⇌ 2NH₃ (exothermic)', 'Higher P → more NH₃ (Le Chatelier)', 'Higher T → faster rate but less yield', 'Fe catalyst: ~450°C, 200 atm'],
    controls: [{ label: 'Raise Temperature', action: 'Yield drops — equilibrium shifts left (exothermic)' }, { label: 'Increase Pressure', action: 'Yield rises — fewer moles on product side' }],
    drawFrame: defaultDraw('#15803D'),
  },
  'thin-layer-chromatography': {
    bg: '#FAFAFA', accent: '#374151',
    concepts: ['Rf = spot distance / solvent front', 'Stationary phase: silica (polar)', 'Mobile phase: organic solvent', 'Polar compounds: low Rf'],
    controls: [{ label: 'Run TLC Plate', action: 'Solvent front rising — components separating' }, { label: 'Calculate Rf', action: 'Compound A Rf=0.45, Compound B Rf=0.72' }],
    drawFrame: defaultDraw('#374151'),
  },
  'nanoparticles': {
    bg: '#EFF6FF', accent: '#1D4ED8',
    concepts: ['SA:V ratio = 6/d for cube', 'At 1nm: ratio 6×10⁶ m⁻¹', 'Quantum confinement effects', 'Enhanced reactivity & optical properties'],
    controls: [{ label: 'Subdivide Cube', action: 'Cube halved — SA:V ratio doubled' }, { label: 'Reach Nanoscale', action: 'At 1 nm — quantum effects dominate!' }],
    drawFrame: defaultDraw('#1D4ED8'),
  },
  // Physics
  'thermal-radiation': {
    bg: '#FFF7ED', accent: '#EA580C',
    concepts: ['Planck\'s law (quantum hypothesis)', 'Wien\'s law: λ_max = b/T', 'Stefan-Boltzmann: P = σT⁴', 'UV catastrophe (classical failure)'],
    controls: [{ label: 'Heat to 5000K', action: 'Peak shifts to 580 nm — visible yellow-white' }, { label: 'Cool to 3000K', action: 'Peak shifts to 950 nm — red-orange glow' }],
    drawFrame: defaultDraw('#EA580C'),
  },
  'special-relativity': {
    bg: '#0F172A', accent: '#818CF8',
    concepts: ['Time dilation: Δt = γΔt₀', 'Length contraction: L = L₀/γ', 'γ = 1/√(1−v²/c²)', 'Mass-energy: E = mc²'],
    controls: [{ label: 'Accelerate to 0.9c', action: 'γ = 2.3 — time runs 2.3× slower on ship' }, { label: 'Accelerate to 0.99c', action: 'γ = 7.1 — dramatic time dilation visible!' }],
    drawFrame: defaultDraw('#818CF8'),
  },
  'nuclear-fission': {
    bg: '#111827', accent: '#F59E0B',
    concepts: ['U-235 + n → Ba-141 + Kr-92 + 3n', 'Mass defect → E = Δmc²', 'Critical mass & chain reaction', 'Control rods absorb neutrons'],
    controls: [{ label: 'Fire Neutron', action: 'U-235 fissioning — 3 neutrons + 200 MeV released' }, { label: 'Insert Control Rods', action: 'Neutrons absorbed — reaction subcritical' }],
    drawFrame: defaultDraw('#F59E0B'),
  },
  'simple-harmonic-resonance': {
    bg: '#F5F3FF', accent: '#7C3AED',
    concepts: ['Resonance at ω = ω₀', 'Q-factor = ω₀/Δω', 'Damping reduces amplitude', 'Phase shift at resonance: 90°'],
    controls: [{ label: 'Sweep Frequency', action: 'Approaching resonance — amplitude growing' }, { label: 'Hit Resonance', action: 'Maximum amplitude at f₀ — resonance!' }],
    drawFrame: defaultDraw('#7C3AED'),
  },
  'photoelectric-effect': {
    bg: '#1E1B4B', accent: '#A5B4FC',
    concepts: ['E = hf − φ (Einstein 1905)', 'Threshold frequency f₀ = φ/h', 'Stopping voltage V = (hf−φ)/e', 'Intensity affects current, not energy'],
    controls: [{ label: 'Increase Frequency', action: 'Photon energy rises — faster electrons ejected' }, { label: 'Below Threshold', action: 'No electrons ejected regardless of intensity!' }],
    drawFrame: defaultDraw('#A5B4FC'),
  },
  'electric-circuits-advanced': {
    bg: '#F8FAFC', accent: '#0369A1',
    concepts: ['KVL: ΣV = 0 around any loop', 'KCL: ΣI = 0 at any node', 'Superposition theorem', 'Matrix form: [R][I] = [V]'],
    controls: [{ label: 'Apply KVL Loop 1', action: 'KVL equation set up for outer loop' }, { label: 'Solve Matrix', action: 'Simultaneous equations solved — all currents found' }],
    drawFrame: defaultDraw('#0369A1'),
  },
  'gas-kinetic-theory': {
    bg: '#0F172A', accent: '#38BDF8',
    concepts: ['PV = nRT (ideal gas law)', 'KE_avg = (3/2)kT', 'Maxwell-Boltzmann distribution', 'Mean free path λ ∝ 1/(nσ)'],
    controls: [{ label: 'Raise Temperature', action: 'Distribution shifts right — faster average speed' }, { label: 'Compress Volume', action: 'Pressure increases — more wall collisions per second' }],
    drawFrame: defaultDraw('#38BDF8'),
  },
  'standing-waves': {
    bg: '#F0F9FF', accent: '#0284C7',
    concepts: ['Nodes: zero displacement', 'Antinodes: maximum displacement', 'fₙ = n·f₁ (harmonics)', 'Resonance condition: L = n·λ/2'],
    controls: [{ label: 'Pluck String', action: '1st harmonic (fundamental) — node at each end' }, { label: 'Show 3rd Harmonic', action: '3rd harmonic — 2 internal nodes visible' }],
    drawFrame: defaultDraw('#0284C7'),
  },
  'lens-optics': {
    bg: '#FFFBEB', accent: '#92400E',
    concepts: ['Lens formula: 1/v − 1/u = 1/f', 'Real image: v positive', 'Virtual image: v negative', 'Magnification m = v/u'],
    controls: [{ label: 'Place at 2f', action: 'Object at 2f — real, inverted, same size image at 2f' }, { label: 'Place inside f', action: 'Object inside f — virtual, upright, magnified image' }],
    drawFrame: defaultDraw('#92400E'),
  },
  'particle-physics': {
    bg: '#0A0A1A', accent: '#C084FC',
    concepts: ['Quarks: u,d,s,c,b,t (±⅔, ∓⅓)', 'Proton = uud, Neutron = udd', 'Colour charge (RGB) — quark confinement', '4 fundamental forces & mediating bosons'],
    controls: [{ label: 'Build Proton', action: 'uud quarks combined — proton formed (charge +1)' }, { label: 'Annihilate', action: 'Proton-antiproton annihilation → photons + pions' }],
    drawFrame: defaultDraw('#C084FC'),
  },
  // Mathematics
  'riemann-hypothesis': {
    bg: '#0A0014', accent: '#E879F9',
    concepts: ['ζ(s) = Σ 1/nˢ (Re(s) > 1)', 'Trivial zeros at s = −2, −4, −6…', 'Non-trivial zeros: Re(s) = 0.5 (conjecture)', 'Connected to prime distribution via explicit formula'],
    controls: [{ label: 'Plot ζ on Critical Line', action: 'ζ(0.5 + it) plotted — zeros at t≈14.1, 21.0…' }, { label: 'Show Prime Connection', action: 'Zeros encode prime distribution — Riemann explicit formula' }],
    drawFrame: defaultDraw('#E879F9'),
  },
  'topology': {
    bg: '#FFF0F6', accent: '#DB2777',
    concepts: ['Euler characteristic χ = V−E+F', 'χ = 2 for sphere, χ = 0 for torus', 'Homeomorphism: topological equivalence', 'Genus g: χ = 2 − 2g'],
    controls: [{ label: 'Deform to Torus', action: 'Sphere morphed to torus — χ changes from 2 to 0' }, { label: 'Verify Euler', action: 'V=8, E=12, F=6 on cube → χ = 8−12+6 = 2' }],
    drawFrame: defaultDraw('#DB2777'),
  },
  'monte-carlo': {
    bg: '#F8FAFC', accent: '#0F766E',
    concepts: ['π ≈ 4 × (inside circle / total)', 'Law of large numbers', 'Error ∝ 1/√n', 'Integration: E[f(X)] = ∫f(x)dx'],
    controls: [{ label: 'Throw 100 Darts', action: '100 points: π ≈ 3.12' }, { label: 'Throw 10,000 Darts', action: '10,000 points: π ≈ 3.1416 — converging!' }],
    drawFrame: defaultDraw('#0F766E'),
  },
  'modular-arithmetic': {
    bg: '#1E1B4B', accent: '#818CF8',
    concepts: ['a ≡ b (mod n) ↔ n | (a−b)', 'Fermat: a^(p-1) ≡ 1 (mod p)', 'RSA: e·d ≡ 1 (mod φ(n))', 'Security from integer factorisation difficulty'],
    controls: [{ label: 'Verify Fermat', action: '2^12 mod 13 = 1 — Fermat\'s little theorem confirmed' }, { label: 'Encrypt Message', action: 'Message encrypted with RSA public key' }],
    drawFrame: defaultDraw('#818CF8'),
  },
  'golden-ratio': {
    bg: '#FFFBEB', accent: '#B45309',
    concepts: ['φ = (1+√5)/2 ≈ 1.618', 'Fib(n+1)/Fib(n) → φ', 'Golden rectangle self-similar', 'Optimal packing in plant phyllotaxis'],
    controls: [{ label: 'Grow Fibonacci', action: 'Next Fibonacci number: ratio → 1.618' }, { label: 'Show Sunflower', action: '55 clockwise + 89 anticlockwise spirals — both Fibonacci!' }],
    drawFrame: defaultDraw('#B45309'),
  },
  'group-theory': {
    bg: '#EFF6FF', accent: '#1D4ED8',
    concepts: ['4 group axioms: closure, identity, inverse, associativity', 'D₄ has 8 elements', 'Subgroups and cosets', 'Cayley table encodes full structure'],
    controls: [{ label: 'Rotate 90°', action: 'R₉₀ applied — back to R₀ after 4 applications' }, { label: 'Build Cayley Table', action: 'Cayley table filled — D₄ group structure revealed' }],
    drawFrame: defaultDraw('#1D4ED8'),
  },
  'information-theory': {
    bg: '#0F172A', accent: '#34D399',
    concepts: ['H = −Σ pᵢ log₂ pᵢ (Shannon entropy)', 'Max entropy: uniform distribution', 'Huffman: optimal prefix-free code', 'H gives theoretical minimum bits per symbol'],
    controls: [{ label: 'Calculate Entropy', action: 'English text entropy ≈ 4.1 bits/char' }, { label: 'Build Huffman Tree', action: 'Huffman codes assigned — average 4.1 bits confirmed' }],
    drawFrame: defaultDraw('#34D399'),
  },
  'chaos-theory': {
    bg: '#0A0A0A', accent: '#F97316',
    concepts: ['Sensitive dependence on initial conditions', 'Strange attractor (fractal dimension)', 'Lyapunov exponent λ > 0 ↔ chaos', 'Deterministic but practically unpredictable'],
    controls: [{ label: 'Perturb by 0.001', action: 'Trajectories diverge exponentially — butterfly effect' }, { label: 'Plot Attractor', action: 'Lorenz butterfly attractor visible after 100 iterations' }],
    drawFrame: defaultDraw('#F97316'),
  },
  'network-centrality': {
    bg: '#F8FAFC', accent: '#6366F1',
    concepts: ['Degree centrality: d(v)/n−1', 'Betweenness: fraction of shortest paths', 'PageRank (eigenvector centrality)', 'Small-world property: avg path ∝ log n'],
    controls: [{ label: 'Add Hub Node', action: 'High-degree hub added — betweenness centrality soars' }, { label: 'Run PageRank', action: 'PageRank converged after 10 iterations' }],
    drawFrame: defaultDraw('#6366F1'),
  },
  'game-theory': {
    bg: '#F5F3FF', accent: '#7C3AED',
    concepts: ['Nash equilibrium: no unilateral gain', 'Dominant strategy eliminates guessing', 'Pareto efficiency vs Nash stability', 'Iterated Prisoner\'s Dilemma: tit-for-tat wins'],
    controls: [{ label: 'Play Cooperate', action: 'You cooperated — opponent defected. You got suckered!' }, { label: 'Find Nash Eq.', action: 'Nash equilibrium: both defect (3,3) — Pareto-inferior' }],
    drawFrame: defaultDraw('#7C3AED'),
  },

  // ── Computer Science ───────────────────────────────────────────────
  'binary-search': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['O(log n) time — halves search space each step', 'Requires sorted array', 'Compare mid to target → go left or right', 'At most ⌈log₂ n⌉ + 1 comparisons'],
    controls: [{ label: 'Step Search', action: 'Mid-point checked — search space halved' }, { label: 'Reset Array', action: 'New sorted array generated — search reset' }],
    drawFrame: (ctx, w, h, t, state) => {
      ctx.clearRect(0, 0, w, h);
      const arr = [3, 7, 12, 18, 24, 31, 39, 45, 52, 61];
      const n = arr.length;
      const step = Math.floor(t / 80) % 5;
      const searches = [{lo:0,hi:9,mid:4},{lo:5,hi:9,mid:7},{lo:5,hi:6,mid:5},{lo:6,hi:6,mid:6},{lo:6,hi:6,mid:6}];
      const cur = searches[Math.min(step, searches.length-1)];
      const bw = (w - 60) / n, bh = 40, by = h / 2 - 20;
      const target = 45;
      arr.forEach((val, i) => {
        const x = 30 + i * bw;
        let fill = '#E0F2FE';
        let stroke = '#BAE6FD';
        if (i < cur.lo || i > cur.hi) { fill = '#F1F5F9'; stroke = '#CBD5E1'; }
        if (i === cur.mid) { fill = '#0EA5E9'; stroke = '#0284C7'; }
        if (val === target && step >= 3) { fill = '#10B981'; stroke = '#059669'; }
        ctx.beginPath();
        ctx.roundRect(x + 2, by, bw - 4, bh, 4);
        ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = `bold ${bw > 28 ? 12 : 10}px Inter,sans-serif`;
        ctx.fillStyle = i === cur.mid ? '#fff' : '#0C4A6E';
        ctx.textAlign = 'center';
        ctx.fillText(String(val), x + bw / 2, by + 26);
        ctx.font = '9px Inter,sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(String(i), x + bw / 2, by + bh + 13);
      });
      ctx.font = 'bold 12px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#0C4A6E';
      ctx.fillText(`Target: ${target}  |  Step ${step + 1}/5  |  lo=${cur.lo}  mid=${cur.mid}  hi=${cur.hi}`, w / 2, by - 14);
      ctx.font = '11px Inter,sans-serif'; ctx.fillStyle = '#0EA5E9';
      ctx.fillText('O(log n) — Binary Search', w / 2, by + bh + 28);
    },
  },

  'sorting-algorithms': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['Bubble sort: O(n²) — swaps adjacent pairs', 'Merge sort: O(n log n) — divide & conquer', 'Quick sort: O(n log n) avg — pivot partitioning', 'Counting sort: O(n+k) — non-comparison'],
    controls: [{ label: 'Next Pass', action: 'Bubble sort pass completed — largest element settled' }, { label: 'Reset', action: 'New random array generated — ready to sort' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const n = 12;
      const pass = Math.floor(t / 100) % (n - 1);
      const vals = [8, 3, 11, 1, 7, 5, 9, 2, 10, 4, 6, 12];
      // Simulate bubble sort passes
      const arr = [...vals];
      for (let p = 0; p < pass; p++) {
        for (let j = 0; j < n - 1 - p; j++) {
          if (arr[j] > arr[j + 1]) { const tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp; }
        }
      }
      const curSwap = Math.floor((t % 100) / 10) % (n - 1 - pass);
      const bw = (w - 40) / n;
      const maxVal = 12;
      arr.forEach((val, i) => {
        const barH = ((h - 80) * val) / maxVal;
        const x = 20 + i * bw;
        const y = h - 40 - barH;
        let fill = '#7DD3FC';
        if (i >= n - pass) fill = '#10B981';
        if (i === curSwap || i === curSwap + 1) fill = '#F59E0B';
        ctx.beginPath();
        ctx.roundRect(x + 2, y, bw - 4, barH, [3, 3, 0, 0]);
        ctx.fillStyle = fill; ctx.fill();
        ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
        ctx.fillText(String(val), x + bw / 2, h - 28);
      });
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText(`Bubble Sort — Pass ${pass + 1}/${n - 1}  |  🟡 swapping  🟢 sorted`, w / 2, 18);
    },
  },

  'stack-queue': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['Stack: LIFO — push/pop from top', 'Queue: FIFO — enqueue rear, dequeue front', 'Stack use cases: recursion, undo, DFS', 'Queue use cases: BFS, task scheduling, IO'],
    controls: [{ label: 'Push / Enqueue', action: 'Element pushed onto stack & enqueued' }, { label: 'Pop / Dequeue', action: 'Top popped from stack — front dequeued from queue' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const phase = Math.floor(t / 60) % 8;
      const stackItems = ['A','B','C','D','E'].slice(0, Math.max(1, (phase % 5) + 1));
      const queueItems = ['X','Y','Z','W'].slice(0, Math.max(1, (phase % 4) + 1));
      const bh = 28, bw = 60, gap = 4;
      // Draw Stack (left)
      const sx = w / 4 - bw / 2;
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText('STACK (LIFO)', sx + bw / 2, h / 2 - stackItems.length * (bh + gap) - 20);
      stackItems.forEach((item, i) => {
        const y = h / 2 - (i + 1) * (bh + gap);
        const isTop = i === stackItems.length - 1;
        ctx.beginPath();
        ctx.roundRect(sx, y, bw, bh, 5);
        ctx.fillStyle = isTop ? '#0EA5E9' : '#BAE6FD';
        ctx.fill();
        ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = `bold 12px Inter,sans-serif`; ctx.fillStyle = isTop ? '#fff' : '#0C4A6E';
        ctx.fillText(item, sx + bw / 2, y + 19);
      });
      if (stackItems.length) {
        ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#0EA5E9';
        ctx.fillText('← TOP', sx + bw + 5, h / 2 - stackItems.length * (bh + gap) + 14);
      }
      // Draw Queue (right)
      const qx = (3 * w) / 4 - (queueItems.length * (bw / 2 + gap)) / 2;
      const qy = h / 2 - 14;
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E';
      ctx.fillText('QUEUE (FIFO)', w * 3 / 4, qy - 24);
      queueItems.forEach((item, i) => {
        const x = qx + i * (bw / 2 + gap + 4);
        const isFront = i === 0;
        ctx.beginPath();
        ctx.roundRect(x, qy, bw / 2 + 4, bh, 5);
        ctx.fillStyle = isFront ? '#10B981' : '#A7F3D0';
        ctx.fill();
        ctx.strokeStyle = '#059669'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = isFront ? '#fff' : '#065F46';
        ctx.fillText(item, x + (bw / 2 + 4) / 2, qy + 19);
      });
      ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#10B981'; ctx.textAlign = 'center';
      ctx.fillText('FRONT →                          ← REAR', w * 3 / 4, qy + bh + 14);
    },
  },

  'binary-tree': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['BST invariant: left < node < right', 'In-order traversal gives sorted sequence', 'Height O(log n) for balanced tree', 'AVL/Red-Black trees maintain balance automatically'],
    controls: [{ label: 'Insert Node', action: 'Node inserted — BST invariant maintained' }, { label: 'In-Order Walk', action: 'In-order traversal: 3→7→12→18→24→31→45' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const step = Math.floor(t / 55) % 7;
      // Tree: values at each node position
      const nodes: {val:number; x:number; y:number; highlight:boolean}[] = [
        {val:24, x:w/2,       y:38,  highlight: step===0},
        {val:12, x:w/2-80,   y:90,  highlight: step===1},
        {val:36, x:w/2+80,   y:90,  highlight: step===2},
        {val:7,  x:w/2-120,  y:142, highlight: step===3},
        {val:18, x:w/2-40,   y:142, highlight: step===4},
        {val:31, x:w/2+40,   y:142, highlight: step===5},
        {val:45, x:w/2+120,  y:142, highlight: step===6},
      ];
      const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
      // Draw edges
      edges.forEach(([a,b]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y + 14);
        ctx.lineTo(nodes[b].x, nodes[b].y - 14);
        ctx.strokeStyle = '#BAE6FD'; ctx.lineWidth = 2; ctx.stroke();
      });
      // Draw nodes
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = n.highlight ? '#0EA5E9' : '#E0F2FE';
        ctx.fill();
        ctx.strokeStyle = n.highlight ? '#0284C7' : '#7DD3FC';
        ctx.lineWidth = 2; ctx.stroke();
        ctx.font = `bold 11px Inter,sans-serif`; ctx.fillStyle = n.highlight ? '#fff' : '#0C4A6E';
        ctx.textAlign = 'center'; ctx.fillText(String(n.val), n.x, n.y + 4);
      });
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText('Binary Search Tree — In-Order Traversal', w / 2, h - 28);
      ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#0EA5E9';
      ctx.fillText('7 → 12 → 18 → 24 → 31 → 36 → 45', w / 2, h - 12);
    },
  },

  'graph-algorithms': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['BFS: level-by-level, uses queue', 'DFS: depth-first, uses stack/recursion', 'BFS finds shortest path (unweighted)', 'Dijkstra: O((V+E) log V) weighted shortest'],
    controls: [{ label: 'BFS Step', action: 'BFS: next level explored — queue updated' }, { label: 'DFS Step', action: 'DFS: going deeper — stack frame pushed' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const visitStep = Math.floor(t / 70) % 6;
      const nodePos = [
        {x:w/2, y:50},       // 0 root
        {x:w/2-90, y:120},   // 1
        {x:w/2+90, y:120},   // 2
        {x:w/2-130,y:200},   // 3
        {x:w/2-50, y:200},   // 4
        {x:w/2+60, y:200},   // 5
        {x:w/2+130,y:200},   // 6
      ];
      const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
      const bfsOrder = [0,1,2,3,4,5,6];
      const visited = new Set(bfsOrder.slice(0, visitStep + 1));
      edges.forEach(([a,b]) => {
        ctx.beginPath();
        ctx.moveTo(nodePos[a].x, nodePos[a].y);
        ctx.lineTo(nodePos[b].x, nodePos[b].y);
        const edgeVisited = visited.has(a) && visited.has(b);
        ctx.strokeStyle = edgeVisited ? '#0EA5E9' : '#CBD5E1';
        ctx.lineWidth = edgeVisited ? 2.5 : 1.5; ctx.stroke();
      });
      nodePos.forEach((p, i) => {
        const isVisited = visited.has(i);
        const isCurrent = i === visitStep;
        ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? '#F59E0B' : isVisited ? '#0EA5E9' : '#E0F2FE';
        ctx.fill();
        ctx.strokeStyle = isCurrent ? '#D97706' : '#0284C7'; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = 'bold 12px Inter,sans-serif'; ctx.fillStyle = isVisited ? '#fff' : '#0C4A6E';
        ctx.textAlign = 'center'; ctx.fillText(String(i), p.x, p.y + 4);
      });
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText(`BFS Visit Order: ${bfsOrder.slice(0, visitStep + 1).join(' → ')}`, w / 2, h - 18);
    },
  },

  'recursion-viz': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['Base case stops infinite recursion', 'Each call adds a frame to the call stack', 'O(n) space for simple recursion', 'Tail recursion: compiler can optimise to O(1) space'],
    controls: [{ label: 'Call fib(5)', action: 'Recursive call — new stack frame pushed for fib(4)' }, { label: 'Return', action: 'Base case reached — frame popped, returning result' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const depth = (Math.floor(t / 80) % 6);
      const frames = ['fib(5)', 'fib(4)', 'fib(3)', 'fib(2)', 'fib(1)', 'return 1'].slice(0, depth + 1);
      const bw = 130, bh = 28, gap = 5;
      const startX = w / 2 - bw / 2;
      const startY = h - 44;
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText('Call Stack — fib(5)', w / 2, 22);
      frames.forEach((f, i) => {
        const y = startY - i * (bh + gap);
        const isTop = i === frames.length - 1;
        ctx.beginPath();
        ctx.roundRect(startX, y, bw, bh, 5);
        ctx.fillStyle = isTop ? '#0EA5E9' : i % 2 === 0 ? '#DBEAFE' : '#E0F2FE';
        ctx.fill();
        ctx.strokeStyle = isTop ? '#0284C7' : '#93C5FD'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = `bold 12px Inter,sans-serif`;
        ctx.fillStyle = isTop ? '#fff' : '#0C4A6E'; ctx.textAlign = 'center';
        ctx.fillText(f, startX + bw / 2, y + 19);
        if (i === 0) {
          ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#94A3B8';
          ctx.fillText('← bottom of stack', startX + bw + 8, y + 18);
        }
      });
      ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillStyle = '#0EA5E9'; ctx.textAlign = 'center';
      ctx.fillText(depth === 5 ? '✅ Base case! Unwinding...' : `Stack depth: ${depth + 1}`, w / 2, h - 10);
    },
  },

  'hash-table': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['Hash fn maps key → bucket index', 'Load factor α = n/m; keep α < 0.75', 'Collision resolution: chaining or open addressing', 'Amortised O(1) insert, lookup, delete'],
    controls: [{ label: 'Insert Key', action: 'Key hashed → bucket found — O(1) insertion' }, { label: 'Lookup', action: 'Hash computed → direct bucket access — O(1) avg' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const buckets = 8;
      const entries: {bucket:number; key:string; highlight:boolean}[] = [
        {bucket:1, key:'"apple"',   highlight: false},
        {bucket:3, key:'"banana"',  highlight: false},
        {bucket:3, key:'"cherry"',  highlight: true},  // collision chained
        {bucket:5, key:'"date"',    highlight: false},
        {bucket:7, key:'"elderberry"', highlight: false},
      ];
      const active = Math.floor(t / 60) % entries.length;
      const bh = 24, bw = w - 100, bx = 50;
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText('Hash Table — 8 buckets', w / 2, 18);
      for (let i = 0; i < buckets; i++) {
        const y = 34 + i * (bh + 4);
        ctx.beginPath(); ctx.roundRect(bx, y, bw, bh, 4);
        ctx.fillStyle = '#E0F2FE'; ctx.fill();
        ctx.strokeStyle = '#BAE6FD'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'left';
        ctx.fillText(`[${i}]`, bx - 28, y + 16);
        const slotEntries = entries.filter(e => e.bucket === i);
        slotEntries.forEach((e, j) => {
          const isActive = entries.indexOf(e) === active % entries.length;
          const ex = bx + 8 + j * 95;
          ctx.beginPath(); ctx.roundRect(ex, y + 3, 88, bh - 6, 3);
          ctx.fillStyle = isActive ? '#0EA5E9' : e.highlight ? '#FEF3C7' : '#7DD3FC';
          ctx.fill();
          ctx.font = '9px Inter,sans-serif';
          ctx.fillStyle = isActive ? '#fff' : '#0C4A6E'; ctx.textAlign = 'center';
          ctx.fillText(e.key, ex + 44, y + 15);
          if (j < slotEntries.length - 1) {
            ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#F59E0B';
            ctx.fillText('→', ex + 96, y + 15);
          }
        });
      }
      ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#F59E0B'; ctx.textAlign = 'center';
      ctx.fillText('🔗 Chaining collision at bucket [3]', w / 2, h - 10);
    },
  },

  'dynamic-programming': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['Overlapping subproblems + optimal substructure', 'Memoisation: top-down with cache', 'Tabulation: bottom-up DP table', 'Fibonacci DP: O(n) vs naïve O(2ⁿ)'],
    controls: [{ label: 'Fill Next Cell', action: 'dp[i] = dp[i-1] + dp[i-2] — O(1) lookup from table' }, { label: 'Show Savings', action: 'Without DP: 1024 calls. With DP: 10 calls. 99% saving!' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const fib = [0,1,1,2,3,5,8,13,21,34];
      const filled = (Math.floor(t / 70) % fib.length) + 1;
      const cw = (w - 60) / fib.length, ch = 38;
      const startX = 30, startY = h / 2 - 30;
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText('Fibonacci DP Table — Bottom-Up Tabulation', w / 2, startY - 22);
      // Index row
      fib.forEach((_, i) => {
        ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'center';
        ctx.fillText(`n=${i}`, startX + i * cw + cw / 2, startY - 8);
      });
      fib.forEach((val, i) => {
        const x = startX + i * cw;
        const isFilled = i < filled;
        const isCurrent = i === filled - 1;
        ctx.beginPath(); ctx.roundRect(x + 2, startY, cw - 4, ch, 4);
        ctx.fillStyle = isCurrent ? '#0EA5E9' : isFilled ? '#BAE6FD' : '#F1F5F9';
        ctx.fill();
        ctx.strokeStyle = isCurrent ? '#0284C7' : '#CBD5E1'; ctx.lineWidth = 1.5; ctx.stroke();
        if (isFilled) {
          ctx.font = `bold ${cw > 26 ? 13 : 10}px Inter,sans-serif`;
          ctx.fillStyle = isCurrent ? '#fff' : '#0C4A6E'; ctx.textAlign = 'center';
          ctx.fillText(String(val), x + cw / 2, startY + 25);
        }
      });
      if (filled >= 3) {
        const ci = filled - 1;
        const cx1 = startX + (ci - 1) * cw + cw / 2;
        const cx2 = startX + (ci - 2) * cw + cw / 2;
        const cy = startY + ch + 8;
        ctx.beginPath();
        ctx.moveTo(cx1, startY + ch); ctx.lineTo(cx1, cy); ctx.lineTo(startX + ci * cw + cw/2, cy); ctx.lineTo(startX + ci * cw + cw/2, startY + ch);
        ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5; ctx.setLineDash([3,2]); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#D97706'; ctx.textAlign = 'center';
        ctx.fillText(`dp[${ci}] = dp[${ci-1}] + dp[${ci-2}] = ${fib[ci-1]}+${fib[ci-2]}=${fib[ci]}`, w/2, cy + 13);
      }
    },
  },

  'big-o-notation': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['O(1): constant — array index, hash lookup', 'O(log n): binary search, balanced BST', 'O(n): linear scan, single pass', 'O(n²): nested loops, bubble sort worst case'],
    controls: [{ label: 'Increase n', action: 'n increased — gap between complexities widens' }, { label: 'Reset', action: 'n reset to 1 — all complexities converge' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const margin = {l:44, r:16, t:22, b:36};
      const pw = w - margin.l - margin.r, ph = h - margin.t - margin.b;
      const nMax = 20;
      const curves: {label:string; fn:(n:number)=>number; color:string}[] = [
        {label:'O(1)',      fn:()=>1,              color:'#10B981'},
        {label:'O(log n)', fn:(n)=>Math.log2(n+1), color:'#0EA5E9'},
        {label:'O(n)',      fn:(n)=>n,             color:'#F59E0B'},
        {label:'O(n²)',    fn:(n)=>n*n,            color:'#EF4444'},
      ];
      const highlight = Math.floor(t / 120) % nMax;
      const scale = (v: number) => Math.min(v / (nMax * nMax), 1) * ph;
      // Axes
      ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(margin.l, margin.t); ctx.lineTo(margin.l, margin.t + ph); ctx.lineTo(margin.l + pw, margin.t + ph); ctx.stroke();
      ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'center';
      ctx.fillText('n', margin.l + pw / 2, h - 4);
      ctx.save(); ctx.translate(10, margin.t + ph / 2); ctx.rotate(-Math.PI/2);
      ctx.fillText('ops', 0, 0); ctx.restore();
      curves.forEach(c => {
        ctx.beginPath();
        for (let n = 1; n <= nMax; n++) {
          const x = margin.l + (n / nMax) * pw;
          const y = margin.t + ph - scale(c.fn(n));
          n === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = c.color; ctx.lineWidth = 2; ctx.stroke();
        // Label at end
        const ly = margin.t + ph - scale(c.fn(nMax));
        ctx.font = 'bold 9px Inter,sans-serif'; ctx.fillStyle = c.color; ctx.textAlign = 'left';
        ctx.fillText(c.label, margin.l + pw + 2, Math.max(margin.t + 8, ly));
      });
      // Vertical cursor
      if (highlight > 0) {
        const cx = margin.l + (highlight / nMax) * pw;
        ctx.beginPath(); ctx.moveTo(cx, margin.t); ctx.lineTo(cx, margin.t + ph);
        ctx.strokeStyle = '#0C4A6E44'; ctx.lineWidth = 1; ctx.setLineDash([3,2]); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
        ctx.fillText(`n=${highlight}`, cx, margin.t + ph + 14);
      }
    },
  },

  'finite-state-machine': {
    bg: '#F0F9FF', accent: '#0EA5E9',
    concepts: ['FSM: (Q, Σ, δ, q₀, F) — states, alphabet, transitions', 'Deterministic (DFA) vs Non-deterministic (NFA)', 'Regular languages recognised by DFAs', 'Used in lexers, parsers, protocol design'],
    controls: [{ label: 'Input "a"', action: 'Transition on "a" — moved to next state' }, { label: 'Input "b"', action: 'Transition on "b" — looping or advancing state' }],
    drawFrame: (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const step = Math.floor(t / 80) % 4;
      // Simple DFA: accepts strings ending in 'ab'
      const states = [
        {id:'q0', x:w*0.18, y:h/2, label:'q₀', start:true,  accept:false},
        {id:'q1', x:w*0.45, y:h/2, label:'q₁', start:false, accept:false},
        {id:'q2', x:w*0.75, y:h/2, label:'q₂', start:false, accept:true},
      ];
      const transitions = [
        {from:0, to:1, label:'a', midY:-22},
        {from:1, to:2, label:'b', midY:-22},
        {from:2, to:1, label:'a', midY:28},
        {from:1, to:0, label:'b', midY:28},
        {from:0, to:0, label:'b', loop:true},
        {from:2, to:2, label:'b', loop:true},
      ];
      const activeState = [0,1,2,2,1][step];
      // Transitions
      transitions.forEach(tr => {
        const fs = states[tr.from], ts = states[tr.to];
        if (tr.loop) {
          ctx.beginPath();
          ctx.arc(fs.x, fs.y - 28, 14, Math.PI*0.2, Math.PI*0.8);
          ctx.strokeStyle = '#BAE6FD'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
          ctx.fillText(tr.label, fs.x, fs.y - 46);
          return;
        }
        const mx = (fs.x + ts.x) / 2, my = (fs.y + ts.y) / 2 + (tr.midY ?? 0);
        ctx.beginPath();
        ctx.moveTo(fs.x + (tr.from < tr.to ? 20 : -20), fs.y);
        ctx.quadraticCurveTo(mx, my, ts.x + (tr.from < tr.to ? -20 : 20), ts.y);
        ctx.strokeStyle = '#BAE6FD'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
        ctx.fillText(tr.label, mx, my - 4);
      });
      // States
      states.forEach((s, i) => {
        const isActive = i === activeState;
        ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#0EA5E9' : '#E0F2FE';
        ctx.fill();
        ctx.strokeStyle = isActive ? '#0284C7' : '#7DD3FC'; ctx.lineWidth = 2; ctx.stroke();
        if (s.accept) {
          ctx.beginPath(); ctx.arc(s.x, s.y, 17, 0, Math.PI * 2);
          ctx.strokeStyle = isActive ? '#fff' : '#0284C7'; ctx.lineWidth = 1.5; ctx.stroke();
        }
        if (s.start) {
          ctx.beginPath(); ctx.moveTo(s.x - 36, s.y); ctx.lineTo(s.x - 22, s.y);
          ctx.strokeStyle = '#0C4A6E'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s.x - 24, s.y - 4); ctx.lineTo(s.x - 22, s.y); ctx.lineTo(s.x - 24, s.y + 4);
          ctx.stroke();
        }
        ctx.font = `bold 13px Inter,sans-serif`; ctx.fillStyle = isActive ? '#fff' : '#0C4A6E'; ctx.textAlign = 'center';
        ctx.fillText(s.label, s.x, s.y + 5);
      });
      const inputSeq = ['ε','a','ab','abb'];
      ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'center';
      ctx.fillText(`DFA — accepts strings ending in "ab"`, w / 2, 18);
      ctx.font = '11px Inter,sans-serif'; ctx.fillStyle = activeState === 2 ? '#10B981' : '#64748B';
      ctx.fillText(`Input: "${inputSeq[step]}" → ${activeState === 2 ? '✅ ACCEPT' : '⏳ processing…'}`, w / 2, h - 14);
    },
  },
};

function getConfig(id: string): Config {
  return CONFIGS[id] ?? {
    bg: '#FAF8F3',
    accent: '#1B4332',
    concepts: ['Explore the simulation', 'Interact with the controls', 'Ask Dr. Lab for explanations'],
    controls: [{ label: 'Run Simulation', action: 'Simulation started' }],
    drawFrame: defaultDraw('#1B4332'),
  };
}

export default function GenericLabCanvas({ experimentId, onEvent }: Props) {
  const experiment = getExperiment(experimentId);
  const cfg = getConfig(experimentId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [simState, setSimState] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      cfg.drawFrame(ctx!, canvas!.width, canvas!.height, frame, simState);
      frame++;
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [cfg, simState]);

  const handleControl = (ctrl: { label: string; action: string }) => {
    setSimState(s => Math.min(s + 1, 5));
    setLog(prev => [ctrl.action, ...prev].slice(0, 6));
    onEvent(ctrl.action);
  };

  if (!experiment) return null;

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-0 p-4" style={{ background: cfg.bg }}>
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <span style={{ fontSize: 28 }}>{experiment.emoji}</span>
        <div>
          <h2 className="font-sora font-bold text-base text-balance" style={{ color: '#1C1917' }}>
            {experiment.name}
          </h2>
          <p className="font-inter text-xs text-pretty" style={{ color: '#78716C' }}>
            {experiment.shortDescription}
          </p>
        </div>
      </div>

      {/* Canvas animation */}
      <div className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: cfg.accent + '11', border: `1px solid ${cfg.accent}33`, height: 180 }}>
        <canvas
          ref={canvasRef}
          width={380}
          height={160}
          style={{ maxWidth: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Key concepts */}
      <div className="shrink-0 rounded-xl p-3" style={{ background: '#fff', border: `1px solid ${cfg.accent}22` }}>
        <p className="font-sora font-semibold text-xs mb-2" style={{ color: cfg.accent }}>
          Key Concepts
        </p>
        <div className="grid grid-cols-1 gap-1">
          {cfg.concepts.map(c => (
            <div key={c} className="flex items-start gap-2 font-inter text-xs" style={{ color: '#44403C' }}>
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ background: cfg.accent }} />
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0">
        <p className="font-sora font-semibold text-xs mb-2" style={{ color: '#78716C' }}>
          Interactive Controls
        </p>
        <div className="flex flex-wrap gap-2">
          {cfg.controls.map(ctrl => (
            <button
              key={ctrl.label}
              onClick={() => handleControl(ctrl)}
              className="px-3 py-1.5 rounded-lg font-inter font-medium text-xs transition-all active:scale-95 hover:opacity-90"
              style={{ background: cfg.accent, color: '#fff' }}
            >
              {ctrl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event log */}
      {log.length > 0 && (
        <div className="flex-1 min-h-0 rounded-xl p-3 overflow-y-auto"
          style={{ background: cfg.accent + '08', border: `1px solid ${cfg.accent}22` }}>
          <p className="font-sora font-semibold text-xs mb-2" style={{ color: cfg.accent }}>
            Simulation Log
          </p>
          {log.map((entry, i) => (
            <div key={i} className="font-inter text-xs py-0.5 flex items-start gap-2" style={{ color: '#57534E' }}>
              <span style={{ color: cfg.accent }}>→</span>
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
