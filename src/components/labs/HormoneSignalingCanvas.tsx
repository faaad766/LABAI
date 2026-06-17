import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const STEPS = [
  { label: 'Hormone arrives', desc: 'Hormone (first messenger) travels via bloodstream to target cell' },
  { label: 'Receptor binding', desc: 'Hormone binds to GPCR on cell membrane — conformational change occurs' },
  { label: 'G-protein activation', desc: 'G-protein dissociates: α-subunit binds GTP and activates adenylyl cyclase' },
  { label: 'cAMP production', desc: 'Adenylyl cyclase converts ATP → cAMP (second messenger) — signal AMPLIFIED ×1000' },
  { label: 'PKA activation', desc: 'cAMP activates Protein Kinase A → phosphorylates target proteins' },
  { label: 'Cellular response', desc: 'Phosphorylated enzymes trigger cellular response — gene expression changes!' },
];

export default function HormoneSignalingCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [hormone, setHormone] = useState('adrenaline');

  const advance = () => {
    const next = Math.min(5, step + 1) as Step;
    setStep(next);
    onEvent(`${STEPS[next].label}: ${STEPS[next].desc}`);
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2 flex-wrap">
        {['adrenaline', 'glucagon', 'insulin'].map(h => (
          <button key={h} onClick={() => { setHormone(h); setStep(0); onEvent(`Selected hormone: ${h}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: hormone === h ? '#F59E0B' : '#FFFBEB', color: hormone === h ? '#FFF' : '#92400E', border: '1px solid #FDE68A' }}>
            {h}
          </button>
        ))}
      </div>

      {/* Cell diagram */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: 240, background: '#FEF9F0', border: '1px solid #FDE68A' }}>
        <svg width="100%" height="240" viewBox="0 0 520 240">
          {/* Cell membrane */}
          <ellipse cx="280" cy="140" rx="200" ry="90" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
          <text x="280" y="105" textAnchor="middle" fontSize="10" fill="#92400E" fontFamily="Inter,sans-serif">Cell membrane</text>
          {/* Nucleus */}
          <ellipse cx="280" cy="155" rx="60" ry="45" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
          <text x="280" y="158" textAnchor="middle" fontSize="10" fill="#1E3A5F" fontFamily="Inter,sans-serif">Nucleus</text>
          {/* GPCR receptor */}
          <rect x="360" y="75" width="14" height="50" rx="4" fill={step >= 1 ? '#F59E0B' : '#94A3B8'} />
          <text x="382" y="100" fontSize="9" fill="#92400E" fontFamily="Inter,sans-serif">GPCR</text>
          {/* Hormone */}
          {step >= 0 && (
            <motion.circle cx={step >= 1 ? 365 : 460} cy={95} r="10" fill="#EF4444"
              animate={{ cx: step >= 1 ? 365 : 460 }} transition={{ duration: 0.6 }}>
              <title>{hormone}</title>
            </motion.circle>
          )}
          {step >= 0 && <text x={step >= 1 ? 355 : 450} y="92" fontSize="9" fill="#DC2626" fontFamily="Inter,sans-serif">🔴H</text>}
          {/* G-protein */}
          {step >= 2 && <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} cx="310" cy="130" r="12" fill="#22C55E" />}
          {step >= 2 && <text x="300" y="133" fontSize="9" fill="white" fontFamily="Inter,sans-serif">Gα</text>}
          {/* cAMP */}
          {step >= 3 && (
            <>
              {[0, 1, 2, 3, 4].map(i => (
                <motion.circle key={i} initial={{ scale: 0, cx: 310, cy: 130 }} animate={{ scale: 1, cx: 200 + i * 20, cy: 160 }}
                  cx={200 + i * 20} cy={160} r={6} fill="#A78BFA" transition={{ delay: i * 0.1 }} />
              ))}
              <text x="215" y="185" fontSize="9" fill="#7C3AED" fontFamily="Inter,sans-serif">cAMP ×5</text>
            </>
          )}
          {/* PKA */}
          {step >= 4 && <motion.rect initial={{ scale: 0 }} animate={{ scale: 1 }} x="230" y="195" width="50" height="20" rx="4" fill="#8B5CF6" />}
          {step >= 4 && <text x="255" y="209" textAnchor="middle" fontSize="9" fill="white" fontFamily="Inter,sans-serif">PKA</text>}
          {/* Response */}
          {step >= 5 && <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="100" y="155" fontSize="11" fill="#16A34A" fontFamily="Inter,sans-serif" fontWeight="700">✓ RESPONSE!</motion.text>}
        </svg>
      </div>

      {/* Step description */}
      <div className="rounded-xl p-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <p className="font-inter text-xs font-semibold" style={{ color: '#92400E' }}>Step {step + 1}: {STEPS[step].label}</p>
        <p className="font-inter text-xs mt-1" style={{ color: '#78716C' }}>{STEPS[step].desc}</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= step ? '#F59E0B' : '#E7E5E0' }} />
        ))}
      </div>

      <div className="flex gap-2">
        {step < 5 ? (
          <button onClick={advance} className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#F59E0B', color: '#FFF' }}>
            Next Step →
          </button>
        ) : (
          <button onClick={() => { setStep(0); onEvent('Reset hormone signaling cascade'); }}
            className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#1B4332', color: '#FFF' }}>
            Restart Cascade
          </button>
        )}
      </div>
    </div>
  );
}
