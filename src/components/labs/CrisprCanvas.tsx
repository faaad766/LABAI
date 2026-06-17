import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const TARGET_SEQ = 'ATCGGCTAGCTACGATCGA';
const GUIDE_RNA  = 'TAGCCGATCGATGCTAGCT';

type Phase = 'design' | 'scanning' | 'cut' | 'repair' | 'done';

export default function CrisprCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [phase, setPhase] = useState<Phase>('design');
  const [repairType, setRepairType] = useState<'nhej' | 'hdr'>('nhej');
  const [insertGene, setInsertGene] = useState('GCCTACGAATT');
  const [cutPos] = useState(9);

  const advance = (next: Phase, msg: string) => { setPhase(next); onEvent(msg); };

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Phase indicator */}
      <div className="flex gap-1">
        {(['design', 'scanning', 'cut', 'repair', 'done'] as Phase[]).map((p, i) => (
          <div key={p} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-1.5 rounded-full" style={{ background: ['design', 'scanning', 'cut', 'repair', 'done'].indexOf(phase) >= i ? '#8B5CF6' : '#E7E5E0' }} />
            <span className="font-inter text-xs capitalize hidden md:block" style={{ color: phase === p ? '#4C1D95' : '#A8A29E' }}>{p}</span>
          </div>
        ))}
      </div>

      {/* DNA visualization */}
      <div className="rounded-xl p-4" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
        <p className="font-inter text-xs font-semibold mb-3" style={{ color: '#4C1D95' }}>Target DNA Sequence</p>
        <div className="flex gap-0.5 flex-wrap justify-center">
          {TARGET_SEQ.split('').map((base, i) => {
            const isCut = (phase === 'cut' || phase === 'repair' || phase === 'done') && i === cutPos;
            const colors: Record<string, string> = { A: '#EF4444', T: '#3B82F6', G: '#22C55E', C: '#F59E0B' };
            return (
              <motion.div key={i}
                animate={{ y: isCut && i >= cutPos ? [0, -4, 0] : 0, opacity: phase === 'done' && i >= cutPos - 2 && i <= cutPos + 3 ? 0 : 1 }}
                className="w-7 h-7 rounded flex items-center justify-center text-white font-bold text-xs"
                style={{ background: colors[base] ?? '#94A3B8' }}>
                {base}
              </motion.div>
            );
          })}
        </div>
        {(phase === 'cut' || phase === 'repair' || phase === 'done') && (
          <div className="flex justify-center mt-2">
            <div className="w-0.5 h-6 rounded" style={{ background: '#DC2626', marginLeft: `${cutPos * 28 + 14}px` }} />
          </div>
        )}
      </div>

      {/* guide RNA */}
      {(phase === 'scanning' || phase === 'cut') && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-3" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
          <p className="font-inter text-xs font-semibold mb-2" style={{ color: '#92400E' }}>Guide RNA (gRNA)</p>
          <div className="flex gap-0.5 flex-wrap">
            {GUIDE_RNA.split('').map((b, i) => (
              <div key={i} className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ background: '#F59E0B', color: '#FFF' }}>{b}</div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Repair result */}
      {(phase === 'repair' || phase === 'done') && (
        <div className="rounded-xl p-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <p className="font-inter text-xs font-semibold mb-2" style={{ color: '#1B4332' }}>
            {repairType === 'nhej' ? 'NHEJ Repair (deletion)' : 'HDR Repair (gene insertion)'}
          </p>
          <div className="flex gap-0.5 flex-wrap">
            {(repairType === 'nhej'
              ? TARGET_SEQ.slice(0, cutPos - 1) + TARGET_SEQ.slice(cutPos + 2)
              : TARGET_SEQ.slice(0, cutPos) + insertGene + TARGET_SEQ.slice(cutPos)
            ).split('').map((b, i) => {
              const isNew = repairType === 'hdr' && i >= cutPos && i < cutPos + insertGene.length;
              return (
                <div key={i} className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                  style={{ background: isNew ? '#22C55E' : '#94A3B8', color: '#FFF' }}>{b}</div>
              );
            })}
          </div>
          {repairType === 'hdr' && <p className="font-inter text-xs mt-1" style={{ color: '#22C55E' }}>🟩 = Inserted gene sequence</p>}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {phase === 'design' && (
          <div className="flex flex-col gap-2">
            <div>
              <label className="font-inter text-xs font-semibold block mb-1" style={{ color: '#1C1917' }}>Repair Type</label>
              <div className="flex gap-2">
                {(['nhej', 'hdr'] as const).map(t => (
                  <button key={t} onClick={() => setRepairType(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase"
                    style={{ background: repairType === t ? '#8B5CF6' : '#F5F3FF', color: repairType === t ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {repairType === 'hdr' && (
              <div>
                <label className="font-inter text-xs font-semibold block mb-1" style={{ color: '#1C1917' }}>Insert Gene Sequence</label>
                <input type="text" value={insertGene} onChange={e => setInsertGene(e.target.value.toUpperCase().replace(/[^ATGC]/g, '').slice(0, 15))}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                  style={{ background: '#F9F9F8', border: '1px solid #DDD6FE', color: '#1C1917' }} />
              </div>
            )}
            <button onClick={() => advance('scanning', 'Deployed Cas9 + guide RNA — scanning DNA for target sequence')}
              className="py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#8B5CF6', color: '#FFF' }}>
              Deploy Cas9 Enzyme →
            </button>
          </div>
        )}
        {phase === 'scanning' && (
          <button onClick={() => advance('cut', 'Cas9 located PAM site and cut both DNA strands at target')}
            className="py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#EF4444', color: '#FFF' }}>
            ✂ Cut DNA
          </button>
        )}
        {phase === 'cut' && (
          <button onClick={() => advance('repair', `DNA repair initiated: ${repairType.toUpperCase()} pathway activated`)}
            className="py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#22C55E', color: '#FFF' }}>
            Initiate DNA Repair ({repairType.toUpperCase()})
          </button>
        )}
        {phase === 'repair' && (
          <button onClick={() => advance('done', 'CRISPR edit complete — modified gene incorporated into genome')}
            className="py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#1B4332', color: '#FFF' }}>
            Complete Edit ✓
          </button>
        )}
        {phase === 'done' && (
          <div className="rounded-xl p-3 text-center" style={{ background: '#F0FDF4', border: '2px solid #22C55E' }}>
            <p className="font-sora font-bold text-sm" style={{ color: '#1B4332' }}>✅ Gene Edit Successful!</p>
            <button onClick={() => { setPhase('design'); onEvent('Reset CRISPR experiment'); }}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#1B4332', color: '#FFF' }}>
              New Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
