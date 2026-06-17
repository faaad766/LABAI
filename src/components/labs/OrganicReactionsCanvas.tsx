import { useState } from 'react';
import MoleculeViewer from '@/components/labs/MoleculeViewer';

interface Props { onEvent: (e: string) => void; }

type Reactant = 'alkene' | 'alcohol' | 'haloalkane';
type ReactionType = 'addition' | 'substitution' | 'elimination';
type Reagent = 'HBr' | 'H2O' | 'NaOH' | 'H2SO4' | 'KOH/alc';

const REACTIONS: Record<string, {
  product: string; mechanism: string; arrows: Array<{ from: string; to: string; label: string }>;
  condition: string; msg: string;
}> = {
  'alkene-addition-HBr': {
    product: 'Bromoalkane (CH₃CHBrCH₃)', mechanism: 'Electrophilic Addition',
    arrows: [{ from: 'C=C π bond', to: 'Br⁻', label: 'π electrons attack Br⁺' }],
    condition: 'No catalyst needed', msg: 'Alkene + HBr — electrophilic addition: the C=C π bond donates electrons to the electrophile H⁺, forming a carbocation intermediate, then Br⁻ attacks. Markovnikov\'s rule: Br adds to the more substituted carbon',
  },
  'alkene-addition-H2O': {
    product: 'Alcohol (CH₃CHOHCH₃)', mechanism: 'Acid-Catalysed Hydration',
    arrows: [{ from: 'C=C', to: 'OH', label: 'H₂O adds across double bond' }],
    condition: 'H₂SO₄ catalyst, 300°C', msg: 'Alkene + H₂O (with H₂SO₄ catalyst) — hydration reaction. The alkene double bond breaks, water adds across it. This is how ethanol is manufactured industrially from ethene',
  },
  'alcohol-substitution-HBr': {
    product: 'Bromoalkane + H₂O', mechanism: 'Nucleophilic Substitution (SN2)',
    arrows: [{ from: 'Br⁻ (nucleophile)', to: 'C–OH (leaving group)', label: 'Br⁻ attacks C, OH leaves' }],
    condition: 'HBr or KBr + H₂SO₄',
    msg: 'Alcohol + HBr — nucleophilic substitution. The Br⁻ ion acts as nucleophile, attacking the carbon attached to OH. The hydroxyl group leaves as water. The mechanism is SN2 for primary alcohols',
  },
  'haloalkane-substitution-NaOH': {
    product: 'Alcohol + NaBr', mechanism: 'Nucleophilic Substitution (SN2)',
    arrows: [{ from: 'OH⁻ (nucleophile)', to: 'C–Br (leaving group)', label: 'OH⁻ attacks C, Br⁻ leaves' }],
    condition: 'Aqueous NaOH, heat', msg: 'Haloalkane + NaOH(aq) — nucleophilic substitution. The hydroxide ion (OH⁻) is the nucleophile that attacks the δ+ carbon bearing the halogen. The halide leaves as Br⁻. Product is an alcohol',
  },
  'haloalkane-elimination-KOH/alc': {
    product: 'Alkene + KBr + H₂O', mechanism: 'Elimination (E2)',
    arrows: [{ from: 'KOH (base)', to: 'β-H', label: 'Base abstracts H, C–Br bond breaks' }],
    condition: 'Alcoholic KOH, heat', msg: 'Haloalkane + KOH(alc) — elimination reaction. The strong base removes an H from a β-carbon while the halide leaves simultaneously (E2 mechanism), forming a C=C double bond. Condition switch: aqueous NaOH gives substitution; alcoholic KOH gives elimination',
  },
  'alcohol-elimination-H2SO4': {
    product: 'Alkene + H₂O', mechanism: 'Acid-Catalysed Dehydration',
    arrows: [{ from: 'H₂SO₄ (catalyst)', to: 'OH', label: 'Protonates OH, water leaves' }],
    condition: 'Conc. H₂SO₄, 170°C', msg: 'Alcohol + conc H₂SO₄ at 170°C — dehydration. The acid protonates the OH group, converting it to a good leaving group (H₂O). β-hydrogen removed, C=C alkene formed. At lower temp (140°C), ether forms instead — temperature controls selectivity',
  },
};

const REACTANTS: Array<{ id: Reactant; label: string; formula: string }> = [
  { id: 'alkene', label: 'Alkene', formula: 'CH₃CH=CH₂' },
  { id: 'alcohol', label: 'Alcohol', formula: 'CH₃CH₂OH' },
  { id: 'haloalkane', label: 'Haloalkane', formula: 'CH₃CH₂Br' },
];

const REACTION_TYPES: Array<{ id: ReactionType; label: string }> = [
  { id: 'addition', label: 'Addition' },
  { id: 'substitution', label: 'Substitution' },
  { id: 'elimination', label: 'Elimination' },
];

const REAGENTS: Array<{ id: Reagent; label: string }> = [
  { id: 'HBr', label: 'HBr' },
  { id: 'H2O', label: 'H₂O' },
  { id: 'NaOH', label: 'NaOH (aq)' },
  { id: 'H2SO4', label: 'H₂SO₄' },
  { id: 'KOH/alc', label: 'KOH/alc' },
];

function CurlyArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center my-2">
      <svg width="80" height="32" viewBox="0 0 80 32">
        <path d="M 10 16 Q 40 4 70 16" fill="none" stroke="#1B4332" strokeWidth="2" markerEnd="url(#arr)" />
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#1B4332" />
          </marker>
        </defs>
      </svg>
      <span className="font-inter text-xs" style={{ color: '#52796F' }}>{label}</span>
    </div>
  );
}

export default function OrganicReactionsCanvas({ onEvent }: Props) {
  const [reactant, setReactant]     = useState<Reactant>('alkene');
  const [reactionType, setReactionType] = useState<ReactionType>('addition');
  const [reagent, setReagent]       = useState<Reagent>('HBr');
  const [result, setResult]         = useState<typeof REACTIONS[string] | null>(null);

  const runReaction = () => {
    const key = `${reactant}-${reactionType}-${reagent}`;
    const r = REACTIONS[key];
    setResult(r ?? null);
    if (r) onEvent(r.msg);
    else onEvent(`${reactant} + ${reagent} via ${reactionType} — this combination is not a standard reaction. Try alkene + HBr (addition), haloalkane + NaOH (substitution), or haloalkane + KOH/alc (elimination)`);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto" style={{ background: '#FDFCF9' }}>
      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="font-sora font-semibold text-sm mb-2" style={{ color: '#1C1917' }}>1. Reactant</div>
          <div className="flex flex-col gap-1.5">
            {REACTANTS.map(r => (
              <button key={r.id} onClick={() => setReactant(r.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                style={{ background: reactant === r.id ? '#F0F7F3' : '#fff', border: `1px solid ${reactant === r.id ? '#1B4332' : '#E7E5E0'}` }}>
                <span className="font-sora font-semibold text-sm" style={{ color: '#1C1917' }}>{r.label}</span>
                <span className="font-inter text-xs ml-auto" style={{ color: '#52796F' }}>{r.formula}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-sora font-semibold text-sm mb-2" style={{ color: '#1C1917' }}>2. Reaction Type</div>
          <div className="flex flex-col gap-1.5">
            {REACTION_TYPES.map(rt => (
              <button key={rt.id} onClick={() => setReactionType(rt.id)}
                className="px-3 py-2 rounded-lg text-left font-sora font-semibold text-sm transition-all"
                style={{ background: reactionType === rt.id ? '#1B4332' : '#fff', color: reactionType === rt.id ? '#fff' : '#1C1917', border: `1px solid ${reactionType === rt.id ? '#1B4332' : '#E7E5E0'}` }}>
                {rt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-sora font-semibold text-sm mb-2" style={{ color: '#1C1917' }}>3. Reagent</div>
          <div className="flex flex-col gap-1.5">
            {REAGENTS.map(rg => (
              <button key={rg.id} onClick={() => setReagent(rg.id)}
                className="px-3 py-2 rounded-lg text-left font-inter text-sm transition-all"
                style={{ background: reagent === rg.id ? '#FEF3C7' : '#fff', color: reagent === rg.id ? '#92400E' : '#57534E', border: `1px solid ${reagent === rg.id ? '#FDE68A' : '#E7E5E0'}` }}>
                {rg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Run button */}
      <button onClick={runReaction} className="btn-primary w-full md:w-auto">
        ⚗️ Start Reaction →
      </button>

      {/* Result panel */}
      {result && (
        <div className="lab-card p-5 animate-fade-slide-up" style={{ borderLeft: '3px solid #1B4332' }}>
          <div className="font-sora font-bold text-base mb-1" style={{ color: '#1C1917' }}>{result.mechanism}</div>
          <div className="font-inter text-xs mb-3" style={{ color: '#52796F' }}>Condition: {result.condition}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-lg px-3 py-2 font-inter text-sm" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
              {REACTANTS.find(r => r.id === reactant)?.formula} + {reagent}
            </div>
            {result.arrows.map((a, i) => <CurlyArrow key={i} label={a.label} />)}
            <div className="rounded-lg px-3 py-2 font-inter text-sm" style={{ background: '#F0F7F3', border: '1px solid #BBF7D0', color: '#166534' }}>
              {result.product}
            </div>
          </div>
        </div>
      )}

      {/* Quick reference */}
      <div className="rounded-xl p-4" style={{ background: '#FAF8F3', border: '1px solid #E7E5E0' }}>
        <div className="font-sora font-semibold text-xs mb-2" style={{ color: '#1C1917' }}>Quick Reference</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-inter text-xs" style={{ color: '#57534E' }}>
          <div><strong>Addition</strong> — adds atoms across C=C double bond</div>
          <div><strong>Substitution</strong> — replaces one atom/group with another</div>
          <div><strong>Elimination</strong> — removes atoms to form a double bond</div>
        </div>
      </div>
      {/* 3D Molecule Viewers */}
      <div className="flex gap-4 flex-wrap justify-center pt-1">
        <MoleculeViewer molecule="ethanol"  size={120} showLabel />
        <MoleculeViewer molecule="benzene"  size={120} showLabel />
        <MoleculeViewer molecule="co2"      size={110} showLabel />
      </div>
    </div>
  );
}
