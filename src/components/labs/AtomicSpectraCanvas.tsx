import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ELEMENTS: Record<string, { lines: { lambda: number; color: string; series: string }[] }> = {
  hydrogen: { lines: [{ lambda: 656, color: '#EF4444', series: 'Hα' }, { lambda: 486, color: '#22C55E', series: 'Hβ' }, { lambda: 434, color: '#3B82F6', series: 'Hγ' }, { lambda: 410, color: '#8B5CF6', series: 'Hδ' }] },
  sodium: { lines: [{ lambda: 589, color: '#F59E0B', series: 'D1' }, { lambda: 590, color: '#D97706', series: 'D2' }, { lambda: 498, color: '#6EE7B7', series: '' }, { lambda: 568, color: '#FDE68A', series: '' }] },
  helium: { lines: [{ lambda: 587, color: '#FCD34D', series: 'D3' }, { lambda: 668, color: '#FCA5A5', series: '' }, { lambda: 502, color: '#86EFAC', series: '' }, { lambda: 471, color: '#93C5FD', series: '' }] },
};

const LEVELS = [1, 2, 3, 4, 5]; // n levels

export default function AtomicSpectraCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [element, setElement] = useState<keyof typeof ELEMENTS>('hydrogen');
  const [excited, setExcited] = useState<number | null>(null);
  const [emitting, setEmitting] = useState<number | null>(null);
  const lines = ELEMENTS[element].lines;

  const excite = (n: number) => {
    setExcited(n);
    onEvent(`Electron excited to n=${n} — absorbed ${(13.6 * (1 - 1 / (n * n))).toFixed(2)} eV of energy`);
    setTimeout(() => {
      setEmitting(n);
      const line = lines[n - 2] ?? lines[0];
      onEvent(`Electron drops from n=${n} → n=1 — emitting ${line.lambda}nm photon (${line.series || element}). ΔE = ${(13.6 * (1 - 1 / (n * n))).toFixed(2)} eV`);
      setTimeout(() => { setExcited(null); setEmitting(null); }, 1500);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {Object.keys(ELEMENTS).map(e => (
          <button key={e} onClick={() => { setElement(e as keyof typeof ELEMENTS); setExcited(null); setEmitting(null); onEvent(`Selected element: ${e}`); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
            style={{ background: element === e ? '#8B5CF6' : '#F5F3FF', color: element === e ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {e}
          </button>
        ))}
      </div>

      {/* Energy level diagram */}
      <div className="rounded-xl p-4 relative" style={{ background: '#1C1917', height: 200 }}>
        <svg width="100%" height="170" viewBox="0 0 520 170">
          {LEVELS.map(n => {
            const y = 160 - n * 28;
            const E = -13.6 / (n * n);
            return (
              <g key={n} onClick={() => excite(n)} style={{ cursor: 'pointer' }}>
                <line x1="60" y1={y} x2="360" y2={y} stroke={excited === n ? '#F59E0B' : '#4B5563'} strokeWidth={excited === n ? 3 : 1.5} strokeDasharray={n > 1 ? 'none' : 'none'} />
                <text x="6" y={y + 4} fontSize="10" fill="#9CA3AF" fontFamily="Inter,sans-serif">n={n}</text>
                <text x="365" y={y + 4} fontSize="9" fill="#6B7280" fontFamily="Inter,sans-serif">{E.toFixed(2)}eV</text>
                {/* Electron */}
                {n === 1 && (
                  <motion.circle cx={excited ? 200 : 120} cy={y} r="7" fill="#F59E0B"
                    animate={{ cy: excited ? 160 - (excited ?? 1) * 28 : y }}
                    transition={{ duration: 0.5 }} />
                )}
              </g>
            );
          })}
          {/* Emission line */}
          <AnimatePresence>
            {emitting && (
              <motion.line x1="200" y1={160 - emitting * 28} x2="200" y2="132" stroke={lines[emitting - 2]?.color ?? '#EF4444'} strokeWidth="3" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.5 }} />
            )}
          </AnimatePresence>
        </svg>
        <p className="text-xs font-inter absolute bottom-2 right-3" style={{ color: '#6B7280' }}>Click energy level to excite electron</p>
      </div>

      {/* Emission spectrum */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: 60, background: '#111' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #111 0%, #111 10%, transparent 15%, transparent 85%, #111 90%, #111 100%)' }} />
        {lines.map((line, i) => (
          <motion.div key={i}
            initial={{ opacity: 0 }} animate={{ opacity: emitting ? 1 : 0.7 }}
            className="absolute top-0 bottom-0 w-1 rounded-full"
            style={{ left: `${((line.lambda - 380) / 300) * 80 + 10}%`, background: line.color, boxShadow: `0 0 12px 4px ${line.color}` }} />
        ))}
        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3">
          <span className="text-xs font-inter" style={{ color: '#6B7280' }}>380nm</span>
          <span className="text-xs font-inter" style={{ color: '#6B7280' }}>680nm</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {lines.map((line, i) => (
          <button key={i} onClick={() => excite(i + 2)}
            className="py-2 rounded-lg text-xs font-semibold flex items-center gap-2 px-3"
            style={{ background: '#F5F3FF', border: `2px solid ${line.color}`, color: '#1C1917' }}>
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: line.color }} />
            {line.lambda}nm {line.series && `(${line.series})`}
          </button>
        ))}
      </div>
    </div>
  );
}
