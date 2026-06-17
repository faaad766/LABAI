import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function PolymerizationCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [type, setType] = useState<'addition'|'condensation'>('addition');
  const [chain, setChain] = useState<number[]>([]);
  const [mw, setMw] = useState(0);
  const [growing, setGrowing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const UNIT_MW = { addition: 28, condensation: 113 }; // ethylene / amino acid
  const COLORS = { addition: '#3B82F6', condensation: '#8B5CF6' };

  useEffect(() => {
    if (growing) {
      timerRef.current = setInterval(() => {
        setChain(c => {
          if (c.length >= 30) { setGrowing(false); return c; }
          const n = [...c, c.length];
          setMw(n.length * UNIT_MW[type]);
          if (n.length % 5 === 0) onEvent(`Chain length: ${n.length} monomers — Molecular weight: ${n.length * UNIT_MW[type]} g/mol${type === 'condensation' ? ' — releasing H₂O byproduct' : ''}`);
          return n;
        });
      }, 300);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [growing, type, onEvent]);

  const color = COLORS[type];
  const monomerLabel = type === 'addition' ? 'CH₂=CH₂' : 'NH₂-CHR-COOH';

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['addition', 'condensation'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); setChain([]); setMw(0); setGrowing(false); onEvent(`Switched to ${t} polymerization`); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
            style={{ background: type === t ? color : '#F5F5F4', color: type === t ? '#FFF' : '#1C1917', border: `1px solid ${type === t ? color : '#E7E5E0'}` }}>
            {t}
          </button>
        ))}
      </div>

      {/* Monomer display */}
      <div className="rounded-xl p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
        <p className="font-inter text-xs font-semibold mb-2" style={{ color: '#4C1D95' }}>
          Monomer: <span style={{ fontFamily: 'monospace' }}>{monomerLabel}</span>
        </p>
        <p className="font-inter text-xs" style={{ color: '#78716C' }}>
          {type === 'addition' ? 'Double bond opens → chain grows (no byproduct)' : 'Amino + carboxyl → peptide bond + H₂O released'}
        </p>
      </div>

      {/* Chain visualization */}
      <div className="rounded-xl p-3 overflow-x-auto" style={{ background: '#FAFAF9', border: '1px solid #E7E5E0', minHeight: 72 }}>
        <div className="flex items-center gap-0.5 flex-wrap">
          {chain.map((_, i) => (
            <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-0">
              <div className="w-6 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ background: color, fontSize: 8 }}>
                {type === 'addition' ? 'C₂' : 'AA'}
              </div>
              {i < chain.length - 1 && <div className="w-1 h-1 rounded-full" style={{ background: '#1C1917' }} />}
            </motion.div>
          ))}
          {growing && <div className="w-6 h-8 rounded flex items-center justify-center text-white text-xs animate-pulse" style={{ background: `${color}88` }}>...</div>}
          {chain.length === 0 && <span className="font-inter text-xs" style={{ color: '#A8A29E' }}>Chain starts here...</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Monomers', val: chain.length },
          { label: 'MW (g/mol)', val: mw },
          { label: 'DP', val: chain.length },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{label}</p>
            <p className="font-sora font-bold text-lg" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {type === 'condensation' && chain.length > 0 && (
        <div className="rounded-lg p-2 text-center" style={{ background: '#DBEAFE', border: '1px solid #93C5FD' }}>
          <span className="font-inter text-xs font-semibold" style={{ color: '#1E3A5F' }}>💧 H₂O released: {chain.length - 1} molecules</span>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => { setGrowing(g => !g); onEvent(growing ? 'Paused polymerization' : `Started ${type} polymerization reaction`); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: growing ? '#EF4444' : color, color: '#FFF' }}>
          {growing ? '⏸ Pause' : '▶ Polymerize!'}
        </button>
        <button onClick={() => { setChain([]); setMw(0); setGrowing(false); onEvent('Reset polymer chain'); }}
          className="px-4 py-3 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
