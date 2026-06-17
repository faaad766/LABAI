import { useState } from 'react';

export default function BayesTheoremCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [prior, setPrior] = useState(0.01);
  const [sensitivity, setSensitivity] = useState(0.99);
  const [specificity, setSpecificity] = useState(0.95);

  // P(Disease | Positive) = P(Pos|Dis)*P(Dis) / P(Pos)
  const pDisPos = sensitivity * prior;
  const pNoDisPos = (1 - specificity) * (1 - prior);
  const pPos = pDisPos + pNoDisPos;
  const posterior = pDisPos / pPos;
  const ppv = posterior;
  const falsePositive = pNoDisPos / pPos;

  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Formula */}
      <div className="rounded-xl p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
        <p className="font-inter text-xs font-semibold" style={{ color: '#4C1D95' }}>Bayes' Theorem:</p>
        <p className="font-mono text-xs mt-1" style={{ color: '#1C1917' }}>P(D|+) = P(+|D)·P(D) / P(+)</p>
      </div>

      {/* Probability tree */}
      <div className="relative rounded-xl" style={{ height: 220, background: '#FAFAF9', border: '1px solid #E7E5E0' }}>
        <svg width="100%" height="220" viewBox="0 0 520 220">
          {/* Root */}
          <circle cx="70" cy="110" r="20" fill="#8B5CF6" />
          <text x="70" y="114" textAnchor="middle" fontSize="9" fill="white" fontFamily="Inter,sans-serif">Pop</text>
          {/* Disease branch */}
          <line x1="90" y1="100" x2="220" y2="60" stroke="#EF4444" strokeWidth="2" />
          <text x="155" y="70" fontSize="9" fill="#EF4444" fontFamily="Inter,sans-serif">{pct(prior)}</text>
          <circle cx="235" cy="55" r="18" fill="#EF4444" />
          <text x="235" y="59" textAnchor="middle" fontSize="8" fill="white" fontFamily="Inter,sans-serif">Dis</text>
          {/* No Disease branch */}
          <line x1="90" y1="120" x2="220" y2="160" stroke="#22C55E" strokeWidth="2" />
          <text x="155" y="150" fontSize="9" fill="#22C55E" fontFamily="Inter,sans-serif">{pct(1 - prior)}</text>
          <circle cx="235" cy="165" r="18" fill="#22C55E" />
          <text x="235" y="169" textAnchor="middle" fontSize="8" fill="white" fontFamily="Inter,sans-serif">No</text>
          {/* Test results */}
          <line x1="253" y1="50" x2="360" y2="30" stroke="#EF4444" strokeWidth="1.5" />
          <text x="305" y="28" fontSize="9" fill="#EF4444" fontFamily="Inter,sans-serif">{pct(sensitivity)} TP</text>
          <line x1="253" y1="60" x2="360" y2="80" stroke="#A8A29E" strokeWidth="1.5" />
          <text x="305" y="78" fontSize="9" fill="#A8A29E" fontFamily="Inter,sans-serif">{pct(1 - sensitivity)} FN</text>
          <line x1="253" y1="160" x2="360" y2="130" stroke="#F97316" strokeWidth="1.5" />
          <text x="290" y="140" fontSize="9" fill="#F97316" fontFamily="Inter,sans-serif">{pct(1 - specificity)} FP</text>
          <line x1="253" y1="170" x2="360" y2="190" stroke="#22C55E" strokeWidth="1.5" />
          <text x="290" y="195" fontSize="9" fill="#22C55E" fontFamily="Inter,sans-serif">{pct(specificity)} TN</text>
          {/* Result circles */}
          {[{ x: 375, y: 28, c: '#EF4444', l: 'TP' }, { x: 375, y: 78, c: '#A8A29E', l: 'FN' }, { x: 375, y: 130, c: '#F97316', l: 'FP' }, { x: 375, y: 192, c: '#22C55E', l: 'TN' }].map(({ x, y, c, l }) => (
            <g key={l}><circle cx={x} cy={y} r="16" fill={c} /><text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="white" fontFamily="Inter,sans-serif">{l}</text></g>
          ))}
          {/* PPV highlight */}
          <rect x="410" y="10" width="105" height="55" rx="8" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="2" />
          <text x="462" y="30" textAnchor="middle" fontSize="10" fill="#4C1D95" fontFamily="Inter,sans-serif" fontWeight="700">P(D|+) =</text>
          <text x="462" y="48" textAnchor="middle" fontSize="13" fill="#8B5CF6" fontFamily="Inter,sans-serif" fontWeight="800">{pct(ppv)}</text>
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Prior P(Disease)', val: pct(prior), c: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
          { label: 'Positive Predictive Value', val: pct(ppv), c: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
          { label: 'False positive rate', val: pct(falsePositive), c: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
          { label: 'P(positive test)', val: pct(pPos), c: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
        ].map(({ label, val, c, bg, border }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="font-inter text-xs" style={{ color: '#52796F' }}>{label}</p>
            <p className="font-sora font-bold text-lg" style={{ color: c }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `Prior: ${pct(prior)}`, val: prior * 100, min: 0.1, max: 50, set: (v: number) => { setPrior(v / 100); onEvent(`Prior (disease prevalence): ${pct(v / 100)} — posterior: ${pct((sensitivity * v/100) / ((sensitivity * v/100) + (1-specificity)*(1-v/100)))}`); } },
          { label: `Sensitivity: ${pct(sensitivity)}`, val: sensitivity * 100, min: 50, max: 100, set: (v: number) => { setSensitivity(v / 100); onEvent(`Sensitivity (true positive rate): ${pct(v/100)}`); } },
          { label: `Specificity: ${pct(specificity)}`, val: specificity * 100, min: 50, max: 100, set: (v: number) => { setSpecificity(v / 100); onEvent(`Specificity (true negative rate): ${pct(v/100)}`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} step={0.1} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
