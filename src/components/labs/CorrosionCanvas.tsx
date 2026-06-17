import { useState, useEffect, useRef } from 'react';

const METALS = [
  { name: 'Gold (Au)', E0: 1.50, color: '#F59E0B' },
  { name: 'Copper (Cu)', E0: 0.34, color: '#B45309' },
  { name: 'Hydrogen', E0: 0.00, color: '#94A3B8' },
  { name: 'Iron (Fe)', E0: -0.44, color: '#78716C' },
  { name: 'Zinc (Zn)', E0: -0.76, color: '#6366F1' },
  { name: 'Magnesium (Mg)', E0: -2.37, color: '#22C55E' },
];

export default function CorrosionCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [metal1, setMetal1] = useState(3); // Fe
  const [metal2, setMetal2] = useState(4); // Zn
  const [corroding, setCorroding] = useState(false);
  const [corrosion, setCorrosion] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const m1 = METALS[metal1], m2 = METALS[metal2];
  const Ecell = m1.E0 - m2.E0;
  const anode = Ecell > 0 ? m2 : m1;
  const cathode = Ecell > 0 ? m1 : m2;

  useEffect(() => {
    if (corroding) {
      timerRef.current = setInterval(() => {
        setCorrosion(c => {
          const newC = Math.min(100, c + Math.abs(Ecell) * 5);
          if (Math.round(newC) % 20 === 0 && Math.round(newC) !== Math.round(c)) {
            onEvent(`${anode.name} corroding (${corrosion.toFixed(0)}% degraded). Cell potential: ${Math.abs(Ecell).toFixed(2)}V. ${cathode.name} protected.`);
          }
          return newC;
        });
      }, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [corroding, Ecell, anode.name, cathode.name, corrosion, onEvent]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // Electrolyte
    ctx.fillStyle = '#DBEAFE'; ctx.beginPath(); ctx.roundRect(30, 60, W - 60, 120, 12); ctx.fill();
    ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 2; ctx.strokeRect(30, 60, W - 60, 120);
    ctx.fillStyle = '#1E3A5F'; ctx.font = '11px Inter,sans-serif'; ctx.fillText('Electrolyte (NaCl aq)', W / 2 - 60, H / 2 + 10);
    // Metal 1
    const c1Degraded = anode.name === m1.name ? corrosion / 100 : 0;
    ctx.fillStyle = m1.color; ctx.globalAlpha = 1 - c1Degraded * 0.7;
    ctx.fillRect(50, 30, 60, 140);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2; ctx.strokeRect(50, 30, 60, 140);
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(m1.name.split('(')[0], 52, 22);
    ctx.fillText(`E°=${m1.E0.toFixed(2)}V`, 52, H - 5);
    // Metal 2
    const c2Degraded = anode.name === m2.name ? corrosion / 100 : 0;
    ctx.fillStyle = m2.color; ctx.globalAlpha = 1 - c2Degraded * 0.7;
    ctx.fillRect(W - 110, 30, 60, 140);
    ctx.globalAlpha = 1;
    ctx.strokeRect(W - 110, 30, 60, 140);
    ctx.fillStyle = '#1C1917'; ctx.fillText(m2.name.split('(')[0], W - 108, 22);
    ctx.fillText(`E°=${m2.E0.toFixed(2)}V`, W - 108, H - 5);
    // Wire
    ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(110, 30); ctx.lineTo(W - 110, 30); ctx.stroke();
    // Ecell
    ctx.fillStyle = '#FEF3C7'; ctx.fillRect(W / 2 - 40, 16, 80, 22); ctx.strokeStyle = '#D97706'; ctx.lineWidth = 1.5; ctx.strokeRect(W / 2 - 40, 16, 80, 22);
    ctx.fillStyle = '#92400E'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillText(`${Math.abs(Ecell).toFixed(2)}V`, W / 2 - 15, 31);
    // Electron flow arrow
    if (corroding) {
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2;
      const dir = Ecell > 0 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(W / 2 - 30 * dir, 26); ctx.lineTo(W / 2 + 20 * dir, 26); ctx.stroke();
      ctx.fillStyle = '#EF4444'; ctx.beginPath(); ctx.moveTo(W / 2 + 20 * dir, 22); ctx.lineTo(W / 2 + 30 * dir, 26); ctx.lineTo(W / 2 + 20 * dir, 30); ctx.fill();
      ctx.fillStyle = '#DC2626'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText('e⁻', W / 2 - 8, 21);
    }
    // Labels
    ctx.fillStyle = '#DC2626'; ctx.font = 'bold 10px Inter,sans-serif';
    if (anode.name === m1.name) ctx.fillText('ANODE (corrodes)', 45, 160);
    else ctx.fillText('CATHODE (protected)', 38, 160);
    if (anode.name === m2.name) ctx.fillText('ANODE (corrodes)', W - 115, 160);
    else ctx.fillText('CATHODE (protected)', W - 118, 160);
  }, [corrosion, corroding, m1, m2, Ecell, anode]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="grid grid-cols-2 gap-3">
        {[{ label: 'Metal 1', val: metal1, set: (v: number) => { setMetal1(v); setCorroding(false); setCorrosion(0); onEvent(`Metal 1: ${METALS[v].name}`); } },
          { label: 'Metal 2', val: metal2, set: (v: number) => { setMetal2(v); setCorroding(false); setCorrosion(0); onEvent(`Metal 2: ${METALS[v].name}`); } }].map(({ label, val, set }) => (
          <div key={label}>
            <label className="font-inter text-xs font-semibold block mb-1" style={{ color: '#1C1917' }}>{label}</label>
            <select value={val} onChange={e => set(+e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs font-inter" style={{ background: '#F5F5F4', border: '1px solid #E7E5E0', color: '#1C1917' }}>
              {METALS.map((m, i) => <option key={m.name} value={i}>{m.name} (E°={m.E0}V)</option>)}
            </select>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={190} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0' }} />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3 text-center" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="font-inter text-xs" style={{ color: '#52796F' }}>Anode (corrodes)</p>
          <p className="font-sora font-bold text-sm" style={{ color: '#DC2626' }}>{anode.name}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <p className="font-inter text-xs" style={{ color: '#52796F' }}>Cell potential</p>
          <p className="font-sora font-bold text-xl" style={{ color: '#1B4332' }}>{Math.abs(Ecell).toFixed(2)}V</p>
        </div>
      </div>
      <div className="rounded-lg p-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-inter text-xs font-semibold" style={{ color: '#DC2626' }}>{anode.name} corrosion</span>
          <span className="font-inter text-xs" style={{ color: '#A8A29E' }}>{corrosion.toFixed(0)}%</span>
        </div>
        <div className="w-full h-3 rounded-full" style={{ background: '#FEE2E2' }}>
          <div className="h-3 rounded-full transition-all" style={{ width: `${corrosion}%`, background: '#EF4444' }} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setCorroding(r => !r); onEvent(corroding ? 'Paused corrosion' : `Started galvanic corrosion — ${anode.name} oxidises in NaCl electrolyte`); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: corroding ? '#EF4444' : '#78716C', color: '#FFF' }}>
          {corroding ? '⏸ Pause' : '🔩 Start Corrosion'}
        </button>
        <button onClick={() => { setCorroding(false); setCorrosion(0); onEvent('Reset corrosion experiment'); }}
          className="px-4 py-3 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
