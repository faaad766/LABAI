import { useState } from 'react';

type SetItem = string;
const PRESETS = {
  numbers: { U: ['1','2','3','4','5','6','7','8','9','10'], A: ['1','2','3','4','5','6'], B: ['4','5','6','7','8','9'] },
  letters: { U: ['a','b','c','d','e','f','g','h'], A: ['a','b','c','d'], B: ['c','d','e','f'] },
  primes: { U: ['2','3','4','5','6','7','8','9','10','11','12'], A: ['2','3','5','7','11'], B: ['2','4','6','8','10','12'] },
};

export default function SetTheoryCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('numbers');
  const { U, A, B } = PRESETS[preset];
  const union = [...new Set([...A, ...B])];
  const intersection = A.filter(x => B.includes(x));
  const diffAB = A.filter(x => !B.includes(x));
  const diffBA = B.filter(x => !A.includes(x));
  const complement = U.filter(x => !A.includes(x) && !B.includes(x));

  const Item = ({ item, inA, inB }: { item: string; inA: boolean; inB: boolean }) => (
    <span className="inline-block w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center"
      style={{ background: inA && inB ? '#8B5CF6' : inA ? '#3B82F6' : inB ? '#22C55E' : '#E7E5E0', color: (inA || inB) ? '#FFF' : '#78716C' }}>
      {item}
    </span>
  );

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map(p => (
          <button key={p} onClick={() => { setPreset(p); onEvent(`Set preset: ${p}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: preset === p ? '#8B5CF6' : '#F5F3FF', color: preset === p ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Venn diagram */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: 200, background: '#FAFAF9', border: '1px solid #E7E5E0' }}>
        <svg width="100%" height="200" viewBox="0 0 520 200">
          {/* Universe */}
          <rect x="10" y="10" width="500" height="180" rx="12" fill="none" stroke="#E7E5E0" strokeWidth="2" />
          <text x="18" y="26" fontSize="11" fill="#A8A29E" fontFamily="Inter,sans-serif">U</text>
          {/* A circle */}
          <circle cx="200" cy="100" r="80" fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth="2" />
          <text x="130" y="104" fontSize="13" fill="#3B82F6" fontFamily="Inter,sans-serif" fontWeight="700">A</text>
          {/* B circle */}
          <circle cx="320" cy="100" r="80" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="2" />
          <text x="372" y="104" fontSize="13" fill="#22C55E" fontFamily="Inter,sans-serif" fontWeight="700">B</text>
          {/* A only items */}
          {diffAB.slice(0, 4).map((item, i) => (
            <text key={item} x={140 + (i % 2) * 25} y={80 + Math.floor(i / 2) * 22} fontSize="11" fill="#1E3A5F" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="600">{item}</text>
          ))}
          {/* Intersection items */}
          {intersection.slice(0, 4).map((item, i) => (
            <text key={item} x={248 + (i % 2) * 22} y={86 + Math.floor(i / 2) * 22} fontSize="11" fill="#4C1D95" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700">{item}</text>
          ))}
          {/* B only items */}
          {diffBA.slice(0, 4).map((item, i) => (
            <text key={item} x={360 + (i % 2) * 25} y={80 + Math.floor(i / 2) * 22} fontSize="11" fill="#1B4332" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="600">{item}</text>
          ))}
          {/* Universe-only items */}
          {complement.slice(0, 3).map((item, i) => (
            <text key={item} x={455 + (i % 2) * 20} y={60 + i * 30} fontSize="10" fill="#78716C" textAnchor="middle" fontFamily="Inter,sans-serif">{item}</text>
          ))}
        </svg>
      </div>

      {/* Operations */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'A ∪ B (Union)', items: union, c: '#8B5CF6' },
          { label: 'A ∩ B (Intersection)', items: intersection, c: '#F59E0B' },
          { label: 'A − B (Difference)', items: diffAB, c: '#3B82F6' },
          { label: "A' ∩ B' (Complement)", items: complement, c: '#78716C' },
        ].map(({ label, items, c }) => (
          <button key={label} onClick={() => onEvent(`${label}: {${items.join(', ')}} (${items.length} elements)`)}
            className="rounded-xl p-3 text-left" style={{ background: '#F5F3FF', border: `1px solid ${c}20` }}>
            <p className="font-inter text-xs font-semibold mb-1" style={{ color: c }}>{label}</p>
            <p className="font-mono text-xs" style={{ color: '#1C1917' }}>{'{'}{items.join(', ')}{'}'}</p>
            <p className="font-inter text-xs mt-0.5" style={{ color: '#A8A29E' }}>|set| = {items.length}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
