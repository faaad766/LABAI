import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ANTISERA = [
  { id: 'A', label: 'Anti-A', color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5' },
  { id: 'B', label: 'Anti-B', color: '#3B82F6', bg: '#DBEAFE', border: '#93C5FD' },
  { id: 'Rh', label: 'Anti-Rh', color: '#8B5CF6', bg: '#EDE9FE', border: '#C4B5FD' },
];

const BLOOD_TYPES = [
  { type: 'A+', antiA: true, antiB: false, antiRh: true },
  { type: 'B+', antiA: false, antiB: true, antiRh: true },
  { type: 'AB+', antiA: true, antiB: true, antiRh: true },
  { type: 'O-', antiA: false, antiB: false, antiRh: false },
];

export default function BloodTypingCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [tested, setTested] = useState<Record<string, boolean>>({});
  const sample = BLOOD_TYPES[selected];

  const handleDrop = useCallback((antiserum: string) => {
    if (tested[antiserum]) return;
    setTested(prev => ({ ...prev, [antiserum]: true }));
    const reacts = antiserum === 'A' ? sample.antiA : antiserum === 'B' ? sample.antiB : sample.antiRh;
    onEvent(`Added Anti-${antiserum} to blood sample — ${reacts ? 'AGGLUTINATION observed (positive reaction)' : 'No agglutination (negative reaction)'}`);
  }, [tested, sample, onEvent]);

  const allTested = ANTISERA.every(s => tested[s.id] !== undefined);
  const determinedType = allTested ? sample.type : null;

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="rounded-xl p-3" style={{ background: '#FFF5F5', border: '1px solid #FCA5A5' }}>
        <p className="font-inter text-xs font-semibold mb-2" style={{ color: '#1C1917' }}>Select Blood Sample</p>
        <div className="flex gap-2 flex-wrap">
          {BLOOD_TYPES.map((bt, i) => (
            <button key={bt.type} onClick={() => { setSelected(i); setTested({}); onEvent(`Selected new blood sample #${i + 1} for typing`); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: selected === i ? '#EF4444' : '#F5F5F4', color: selected === i ? '#FFF' : '#1C1917', border: `1px solid ${selected === i ? '#EF4444' : '#E7E5E0'}` }}>
              Sample {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ANTISERA.map(s => {
          const reacts = s.id === 'A' ? sample.antiA : s.id === 'B' ? sample.antiB : sample.antiRh;
          const wasTested = tested[s.id] !== undefined;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className="w-full rounded-lg p-2 text-center text-xs font-bold font-inter" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                {s.label}
              </div>
              {/* Well */}
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden"
                style={{ background: wasTested ? (reacts ? '#FCA5A5' : '#F5F5F4') : '#FEE2E2', border: `3px solid ${wasTested ? (reacts ? '#EF4444' : '#D6D3D1') : '#FCA5A5'}` }}
                onClick={() => handleDrop(s.id)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {!wasTested && (
                  <span className="font-inter text-xs text-center px-1" style={{ color: '#EF4444' }}>Drop{'\n'}here</span>
                )}
                {wasTested && reacts && (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, #EF4444 20%, #FCA5A5 60%, #FEE2E2 100%)' }}>
                    <span className="font-bold text-white text-xs">+</span>
                    {/* Agglutination clumps */}
                    {[...Array(6)].map((_, k) => (
                      <motion.div key={k} className="absolute rounded-full"
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{ width: 8, height: 8, background: '#991B1B', left: `${20 + k * 10}%`, top: `${25 + (k % 3) * 18}%` }} />
                    ))}
                  </div>
                )}
                {wasTested && !reacts && (
                  <span className="font-bold text-xs" style={{ color: '#A8A29E' }}>−</span>
                )}
              </motion.div>
              {wasTested && (
                <span className="text-xs font-semibold" style={{ color: reacts ? '#DC2626' : '#52796F' }}>
                  {reacts ? 'Agglutination ✓' : 'No reaction'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {determinedType && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-4 text-center"
            style={{ background: '#F0FDF4', border: '2px solid #22C55E' }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>Blood Type Determined</p>
            <p className="font-sora font-bold text-3xl" style={{ color: '#1B4332' }}>{determinedType}</p>
            <button onClick={() => { setTested({}); onEvent('Reset blood typing test — starting fresh'); }}
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#1B4332', color: '#FFF' }}>
              Test Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-lg p-3 text-xs font-inter" style={{ background: '#FAFAF9', border: '1px solid #E7E5E0', color: '#52796F' }}>
        💡 <strong>Drag & Drop:</strong> Click each well to add the antiserum. Clumping = antigen present on red blood cells!
      </div>
    </div>
  );
}
