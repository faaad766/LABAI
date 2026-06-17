import { useState } from 'react';

const MOLECULES: Record<string, { peaks: { mz: number; intensity: number; label: string }[]; formula: string; MW: number }> = {
  methanol: { formula: 'CH₃OH', MW: 32, peaks: [{ mz: 32, intensity: 30, label: 'M⁺' }, { mz: 31, intensity: 100, label: 'M−H' }, { mz: 29, intensity: 60, label: 'CHO⁺' }, { mz: 15, intensity: 80, label: 'CH₃⁺' }] },
  ethanol: { formula: 'C₂H₅OH', MW: 46, peaks: [{ mz: 46, intensity: 20, label: 'M⁺' }, { mz: 45, intensity: 35, label: 'M−1' }, { mz: 31, intensity: 100, label: 'CH₂OH⁺' }, { mz: 29, intensity: 70, label: 'CHO⁺' }, { mz: 27, intensity: 45, label: 'C₂H₃⁺' }] },
  acetone: { formula: 'C₃H₆O', MW: 58, peaks: [{ mz: 58, intensity: 100, label: 'M⁺' }, { mz: 43, intensity: 95, label: 'CH₃CO⁺' }, { mz: 42, intensity: 40, label: 'C₃H₆⁺' }, { mz: 15, intensity: 30, label: 'CH₃⁺' }] },
};

export default function MassSpectrometryCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [mol, setMol] = useState<keyof typeof MOLECULES>('acetone');
  const [ionised, setIonised] = useState(false);
  const data = MOLECULES[mol];

  const ionise = () => { setIonised(true); onEvent(`Ionised ${mol} (${data.formula}) — molecule hit by electron beam, ejecting electron to form M⁺ radical cation`); };
  const identify = () => { onEvent(`Base peak m/z=${data.peaks.find(p => p.intensity === 100)?.mz} — ${data.peaks.find(p => p.intensity === 100)?.label}. Molecular ion M⁺ at m/z=${data.MW}. MW=${data.MW} g/mol`); };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {Object.keys(MOLECULES).map(m => (
          <button key={m} onClick={() => { setMol(m as keyof typeof MOLECULES); setIonised(false); onEvent(`Selected ${m} sample for mass spectrometry`); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
            style={{ background: mol === m ? '#8B5CF6' : '#F5F3FF', color: mol === m ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {m}
          </button>
        ))}
      </div>

      {/* Instrument diagram */}
      <div className="rounded-xl p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
        <div className="flex items-center gap-2 text-xs font-inter">
          {['Injection', '→', 'Ionisation', '→', 'Acceleration', '→', 'Deflection', '→', 'Detection'].map((s, i) => (
            <span key={i} style={{ color: s === '→' ? '#A8A29E' : (i <= (ionised ? 8 : 0) ? '#4C1D95' : '#A8A29E'), fontWeight: s !== '→' ? 700 : 400, fontSize: 10 }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Mass spectrum */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: 200, background: '#1C1917' }}>
        <svg width="100%" height="200" viewBox="0 0 520 200">
          <line x1="40" y1="10" x2="40" y2="175" stroke="#E7E5E0" strokeWidth="1" />
          <line x1="40" y1="175" x2="510" y2="175" stroke="#E7E5E0" strokeWidth="1" />
          {data.peaks.map((peak, i) => {
            const x = 40 + (peak.mz / (data.MW + 10)) * 460;
            const barH = (peak.intensity / 100) * 140;
            return (
              <g key={i}>
                <rect x={x - 4} y={175 - barH} width={8} height={barH} fill={ionised ? '#A78BFA' : '#4B5563'} rx={2} />
                <text x={x} y={165 - barH} textAnchor="middle" fontSize="9" fill={ionised ? '#E9D5FF' : '#6B7280'} fontFamily="Inter,sans-serif">{peak.mz}</text>
                {peak.intensity === 100 && <text x={x} y={150 - barH} textAnchor="middle" fontSize="8" fill="#22C55E" fontFamily="Inter,sans-serif">BASE</text>}
                <text x={x} y={188} textAnchor="middle" fontSize="8" fill="#9CA3AF" fontFamily="Inter,sans-serif">{peak.label}</text>
              </g>
            );
          })}
          <text x="280" y="198" textAnchor="middle" fontSize="10" fill="#6B7280" fontFamily="Inter,sans-serif">m/z ratio</text>
          {ionised && <text x="50" y="20" fontSize="11" fill="#A78BFA" fontFamily="Inter,sans-serif" fontWeight="700">{data.formula} (MW={data.MW})</text>}
        </svg>
      </div>

      <div className="flex gap-2">
        <button onClick={ionise} disabled={ionised}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold transition-all disabled:opacity-40"
          style={{ background: '#8B5CF6', color: '#FFF' }}>
          ⚡ Ionise Sample
        </button>
        <button onClick={identify} disabled={!ionised}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold transition-all disabled:opacity-40"
          style={{ background: '#22C55E', color: '#FFF' }}>
          🔍 Identify Peaks
        </button>
      </div>
    </div>
  );
}
