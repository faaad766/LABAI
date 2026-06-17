import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle { id: number; x: number; bound: boolean }

export default function NeurotransmittersCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [fired, setFired] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [reuptake, setReuptake] = useState(false);
  const [nt, setNt] = useState<'dopamine' | 'serotonin' | 'acetylcholine'>('dopamine');
  const [blocked, setBlocked] = useState(false);
  const nextId = useRef(0);

  const NT_COLORS = { dopamine: '#F59E0B', serotonin: '#22C55E', acetylcholine: '#3B82F6' };
  const color = NT_COLORS[nt];

  const fire = () => {
    if (fired) return;
    setFired(true);
    const ps: Particle[] = Array.from({ length: 12 }, () => ({ id: nextId.current++, x: Math.random() * 80 + 10, bound: false }));
    setParticles(ps);
    onEvent(`Fired action potential — ${ps.length} ${nt} molecules released from pre-synaptic vesicles`);
    setTimeout(() => {
      setParticles(prev => prev.map(p => !blocked && p.x > 20 && p.x < 80 ? { ...p, bound: true } : p));
      onEvent(`${nt} molecules binding to post-synaptic receptors — ${blocked ? 'receptor BLOCKED (antagonist present)' : 'signal transmitted'}`);
    }, 1200);
  };

  const clearSynapse = () => {
    setReuptake(true);
    setTimeout(() => { setFired(false); setParticles([]); setReuptake(false); onEvent('Reuptake complete — neurotransmitters recycled into pre-synaptic terminal'); }, 1000);
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2 flex-wrap">
        {(['dopamine', 'serotonin', 'acetylcholine'] as const).map(n => (
          <button key={n} onClick={() => { setNt(n); setFired(false); setParticles([]); onEvent(`Switched neurotransmitter to ${n}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: nt === n ? NT_COLORS[n] : '#F5F5F4', color: nt === n ? '#FFF' : '#1C1917', border: `1px solid ${nt === n ? NT_COLORS[n] : '#E7E5E0'}` }}>
            {n}
          </button>
        ))}
      </div>

      {/* Synapse SVG */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: 220, background: '#F8FAFC', border: '1px solid #E7E5E0' }}>
        <svg width="100%" height="220" viewBox="0 0 520 220">
          {/* Pre-synaptic */}
          <rect x="30" y="20" width="160" height="80" rx="12" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
          <text x="110" y="55" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="600" fill="#1E3A5F">Pre-synaptic</text>
          <text x="110" y="70" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fill="#475569">terminal</text>
          {/* Vesicles */}
          {[60, 90, 120, 150].map((cx, i) => (
            <motion.circle key={i} cx={cx} cy={90} r={fired ? 0 : 8} fill={color} opacity={0.8}
              animate={{ r: fired ? 0 : 8 }} transition={{ duration: 0.3, delay: fired ? i * 0.1 : 0 }} />
          ))}
          {/* Synaptic cleft */}
          <rect x="30" y="108" width="440" height="28" fill="#FEF9F0" stroke="#FDE68A" strokeWidth="1" strokeDasharray="6,4" />
          <text x="250" y="126" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fill="#92400E">Synaptic Cleft</text>
          {/* Post-synaptic */}
          <rect x="30" y="144" width="440" height="60" rx="12" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="2" />
          <text x="250" y="170" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="11" fontWeight="600" fill="#1B4332">Post-synaptic membrane</text>
          {/* Receptors */}
          {[80, 160, 240, 320, 400].map((rx, i) => (
            <g key={i}>
              <rect x={rx - 10} y={136} width={20} height={18} rx="3"
                fill={particles.some(p => p.bound && Math.abs(p.x - (rx / 520 * 100)) < 12) && !blocked ? color : (blocked ? '#EF4444' : '#A78BFA')}
                opacity="0.8" />
              <text x={rx} y={148} textAnchor="middle" fontSize="9" fill="white" fontFamily="Inter,sans-serif">R</text>
            </g>
          ))}
        </svg>

        {/* Particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div key={p.id}
              initial={{ top: '42%', left: `${p.x}%`, opacity: 1 }}
              animate={reuptake ? { top: '30%', opacity: 0 } : p.bound ? { top: '60%', opacity: blocked ? 0.3 : 1 } : { top: '50%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: reuptake ? 0.6 : 1.0 }}
              className="absolute w-3 h-3 rounded-full"
              style={{ background: color, transform: 'translate(-50%, -50%)', boxShadow: `0 0 6px ${color}` }} />
          ))}
        </AnimatePresence>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={blocked} onChange={e => { setBlocked(e.target.checked); onEvent(e.target.checked ? 'Applied receptor antagonist — blocks neurotransmitter binding' : 'Removed antagonist — receptors open again'); }} />
        <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Apply Receptor Antagonist (blocker)</span>
      </label>

      <div className="flex gap-2">
        <button onClick={fire} disabled={fired}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold transition-all disabled:opacity-40"
          style={{ background: color, color: '#FFF' }}>
          ⚡ Fire Action Potential
        </button>
        {fired && (
          <button onClick={clearSynapse}
            className="px-4 py-3 rounded-xl text-sm font-inter font-semibold"
            style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
            Reuptake
          </button>
        )}
      </div>
    </div>
  );
}
