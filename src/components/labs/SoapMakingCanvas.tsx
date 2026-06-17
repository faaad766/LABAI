import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Phase = 'setup' | 'reaction' | 'saponification' | 'micelles';
export default function SoapMakingCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [oil, setOil] = useState<'olive'|'coconut'|'palm'>('olive');
  const OIL_COLORS = { olive: '#84CC16', coconut: '#FFF', palm: '#F97316' };

  const advance = () => {
    const map: Record<Phase, Phase> = { setup: 'reaction', reaction: 'saponification', saponification: 'micelles', micelles: 'setup' };
    const next = map[phase];
    const msgs: Record<Phase, string> = {
      setup: 'Added NaOH (lye) to triglyceride oil — saponification beginning',
      reaction: 'Ester bonds cleaving — fatty acid chains separating from glycerol backbone',
      saponification: 'Saponification complete — 3 fatty acid soap molecules + 1 glycerol produced',
      micelles: 'Soap molecules self-assembling into micelles — hydrophilic heads out, hydrophobic tails in',
    };
    onEvent(msgs[phase]);
    setPhase(next);
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['olive','coconut','palm'] as const).map(o => (
          <button key={o} onClick={() => { setOil(o); setPhase('setup'); onEvent(`Selected ${o} oil as triglyceride source`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: oil === o ? OIL_COLORS[o] : '#F5F5F4', color: oil === o ? '#1C1917' : '#52796F', border: `1px solid ${oil === o ? OIL_COLORS[o] : '#E7E5E0'}` }}>
            {o} oil
          </button>
        ))}
      </div>

      {/* Phase visualization */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: 240, background: '#F9F9F8', border: '1px solid #E7E5E0' }}>
        {phase === 'setup' && (
          <svg width="100%" height="240" viewBox="0 0 520 240">
            {/* Beaker */}
            <path d="M140 50 L140 200 Q140 210 150 210 L370 210 Q380 210 380 200 L380 50 Z" fill={`${OIL_COLORS[oil]}33`} stroke={OIL_COLORS[oil]} strokeWidth="3" />
            {[0,1,2].map(i => (
              <g key={i}>
                <circle cx={200 + i * 40} cy={130} r={16} fill={`${OIL_COLORS[oil]}88`} stroke={OIL_COLORS[oil]} strokeWidth="2" />
                <line x1={200 + i * 40 - 16} y1={100} x2={200 + i * 40 - 16} y2={160} stroke="#7C3AED" strokeWidth="3" />
                <line x1={200 + i * 40 + 16} y1={100} x2={200 + i * 40 + 16} y2={160} stroke="#7C3AED" strokeWidth="3" />
                <line x1={200 + i * 40} y1={80} x2={200 + i * 40} y2={100} stroke="#7C3AED" strokeWidth="3" />
              </g>
            ))}
            <text x="260" y="55" textAnchor="middle" fontSize="12" fill="#1C1917" fontFamily="Inter,sans-serif" fontWeight="700">Triglycerides + NaOH</text>
          </svg>
        )}
        {phase === 'reaction' && (
          <svg width="100%" height="240" viewBox="0 0 520 240">
            {[0,1,2].map(i => (
              <g key={i}>
                <motion.line x1={200 + i * 40} y1={80} x2={200 + i * 40} y2={170} stroke="#EF4444" strokeWidth="3" strokeDasharray="6,4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
                <circle cx={200 + i * 40} cy={120} r={8} fill="#EF4444" opacity="0.7" />
              </g>
            ))}
            <text x="260" y="50" textAnchor="middle" fontSize="12" fill="#DC2626" fontFamily="Inter,sans-serif" fontWeight="700">⚡ Ester bonds breaking...</text>
            <text x="260" y="200" textAnchor="middle" fontSize="10" fill="#52796F" fontFamily="Inter,sans-serif">NaOH attacking carbonyl carbon</text>
          </svg>
        )}
        {phase === 'saponification' && (
          <svg width="100%" height="240" viewBox="0 0 520 240">
            <rect x="80" y="80" width="120" height="80" rx="8" fill="#DCFCE7" stroke="#22C55E" strokeWidth="2" />
            <text x="140" y="118" textAnchor="middle" fontSize="11" fill="#1B4332" fontFamily="Inter,sans-serif" fontWeight="700">Glycerol</text>
            <text x="140" y="132" textAnchor="middle" fontSize="10" fill="#52796F" fontFamily="Inter,sans-serif">C₃H₅(OH)₃</text>
            {[0,1,2].map(i => (
              <g key={i}>
                <rect x={270 + i * 5} y={60 + i * 50} width="90" height="30" rx="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                <text x={315 + i * 5} y={79 + i * 50} textAnchor="middle" fontSize="10" fill="#92400E" fontFamily="Inter,sans-serif" fontWeight="700">RCOO⁻Na⁺</text>
              </g>
            ))}
            <text x="260" y="30" textAnchor="middle" fontSize="12" fill="#1B4332" fontFamily="Inter,sans-serif" fontWeight="700">✅ Saponification complete!</text>
          </svg>
        )}
        {phase === 'micelles' && (
          <svg width="100%" height="240" viewBox="0 0 520 240">
            {/* Micelle */}
            <circle cx="260" cy="120" r="50" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" strokeDasharray="6,4" />
            <circle cx="260" cy="120" r="20" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
            <text x="260" y="124" textAnchor="middle" fontSize="9" fill="#92400E" fontFamily="Inter,sans-serif">Fat droplet</text>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const hx = 260 + 50 * Math.cos(a), hy = 120 + 50 * Math.sin(a);
              const tx = 260 + 30 * Math.cos(a), ty = 120 + 30 * Math.sin(a);
              return <g key={i}><line x1={hx} y1={hy} x2={tx} y2={ty} stroke="#F59E0B" strokeWidth="3" /><circle cx={hx} cy={hy} r={5} fill="#3B82F6" /></g>;
            })}
            <text x="260" y="20" textAnchor="middle" fontSize="11" fill="#1E3A5F" fontFamily="Inter,sans-serif" fontWeight="700">Micelle: hydrophilic heads out 🔵, tails in</text>
            <text x="260" y="220" textAnchor="middle" fontSize="10" fill="#52796F" fontFamily="Inter,sans-serif">This is how soap removes grease!</text>
          </svg>
        )}
      </div>

      <div className="rounded-xl p-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <p className="font-sora font-bold text-xs" style={{ color: '#92400E' }}>Phase: {phase}</p>
        <p className="font-inter text-xs mt-1" style={{ color: '#78716C' }}>
          {phase === 'setup' && 'NaOH (lye) will attack ester bonds in the triglyceride'}
          {phase === 'reaction' && 'The OH⁻ ion attacks the carbonyl carbon — nucleophilic acyl substitution'}
          {phase === 'saponification' && '3 fatty acid soaps + glycerol produced. Ratio: 1 triglyceride + 3 NaOH'}
          {phase === 'micelles' && 'Soap is amphiphilic: polar head loves water, nonpolar tail loves fat'}
        </p>
      </div>

      <button onClick={advance} className="py-3 rounded-xl text-sm font-sora font-bold"
        style={{ background: phase === 'micelles' ? '#1B4332' : '#F59E0B', color: '#FFF' }}>
        {phase === 'micelles' ? 'Restart →' : 'Next Step →'}
      </button>
    </div>
  );
}
