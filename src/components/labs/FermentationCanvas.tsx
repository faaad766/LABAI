import { useState, useEffect, useRef } from 'react';

export default function FermentationCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [glucose, setGlucose] = useState(50);
  const [yeast, setYeast] = useState(5);
  const [temp, setTemp] = useState(30);
  const [running, setRunning] = useState(false);
  const [co2, setCo2] = useState(0);
  const [ethanol, setEthanol] = useState(0);
  const [substrate, setSubstrate] = useState(50);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<{ t: number; co2: number; eth: number }[]>([{ t: 0, co2: 0, eth: 0 }]);
  const timeRef = useRef(0);

  const rateMultiplier = (yeast / 10) * ((100 - Math.abs(temp - 35)) / 100) * (substrate / 100);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        const rate = Math.max(0, rateMultiplier * 1.5);
        setCo2(c => Math.min(c + rate, 100));
        setEthanol(e => Math.min(e + rate * 0.5, 80));
        setSubstrate(s => Math.max(0, s - rate * 0.8));
        timeRef.current++;
        histRef.current = [...histRef.current.slice(-60), { t: timeRef.current, co2: Math.min(co2 + rate, 100), eth: Math.min(ethanol + rate * 0.5, 80) }];
      }, 400);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, rateMultiplier, co2, ethanol]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const h = histRef.current;
    if (h.length < 2) return;
    ['co2', 'eth'].forEach((key, ki) => {
      ctx.beginPath(); ctx.strokeStyle = ki === 0 ? '#94A3B8' : '#F59E0B'; ctx.lineWidth = 2;
      h.forEach((pt, i) => {
        const x = (i / (h.length - 1)) * W;
        const y = H - (pt[key as 'co2' | 'eth'] / 100) * (H - 10) - 5;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [co2, ethanol]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'CO₂ (mL)', val: co2.toFixed(1), color: '#64748B', bg: '#F8FAFC', border: '#CBD5E1' },
          { label: 'Ethanol (%)', val: ethanol.toFixed(1), color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
          { label: 'Glucose (%)', val: substrate.toFixed(0), color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
        ].map(({ label, val, color, bg, border }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{label}</p>
            <p className="font-sora font-bold text-2xl" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Flask visualization */}
      <div className="relative" style={{ height: 140 }}>
        <svg width="100%" height="140" viewBox="0 0 520 140">
          <path d="M220 20 L220 60 L120 130 L400 130 L300 60 L300 20 Z" fill={`rgba(251,191,36,${substrate / 100 * 0.4 + 0.1})`} stroke="#D97706" strokeWidth="3" />
          <rect x="215" y="10" width="90" height="15" rx="4" fill="#E7E5E0" stroke="#D6D3D1" strokeWidth="2" />
          {/* CO2 bubbles */}
          {running && co2 > 5 && [160, 200, 240, 280, 320].map((bx, i) => (
            <circle key={i} cx={bx} cy={80 + i * 8} r={3 + i % 3} fill="rgba(148,163,184,0.6)" />
          ))}
          <text x="260" y="90" textAnchor="middle" fontSize="11" fill="#92400E" fontFamily="Inter,sans-serif" fontWeight="600">
            {running ? '🫧 Fermenting...' : `Glucose: ${substrate.toFixed(0)}%`}
          </text>
          {/* Tube */}
          <line x1="300" y1="18" x2="380" y2="18" stroke="#94A3B8" strokeWidth="4" />
          <rect x="380" y="5" width="80" height="26" rx="6" fill="rgba(148,163,184,0.2)" stroke="#94A3B8" strokeWidth="2" />
          <text x="420" y="22" textAnchor="middle" fontSize="10" fill="#475569" fontFamily="Inter,sans-serif">CO₂: {co2.toFixed(1)}</text>
        </svg>
      </div>

      <canvas ref={canvasRef} width={520} height={100} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', background: '#FAFAF9' }} />
      <div className="flex gap-3 text-xs font-inter">
        <span className="flex items-center gap-1"><span className="w-3 h-1 inline-block rounded" style={{ background: '#94A3B8' }} />CO₂</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 inline-block rounded" style={{ background: '#F59E0B' }} />Ethanol</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `Glucose: ${glucose}g/L`, val: glucose, min: 5, max: 100, set: (v: number) => { setGlucose(v); setSubstrate(v); onEvent(`Set glucose concentration to ${v}g/L`); } },
          { label: `Yeast: ${yeast}g`, val: yeast, min: 1, max: 20, set: (v: number) => { setYeast(v); onEvent(`Set yeast amount to ${v}g`); } },
          { label: `Temp: ${temp}°C`, val: temp, min: 10, max: 50, set: (v: number) => { setTemp(v); onEvent(`Temperature set to ${v}°C — ${v < 15 ? 'too cold, yeast slow' : v > 45 ? 'too hot, yeast dying' : 'optimal range'}`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#D97706' }} className="w-full" />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setRunning(r => { onEvent(r ? 'Paused fermentation' : 'Started fermentation reaction'); return !r; }); }}
          className="flex-1 py-2.5 rounded-xl text-sm font-sora font-bold" style={{ background: running ? '#EF4444' : '#D97706', color: '#FFF' }}>
          {running ? '⏸ Pause' : '▶ Ferment!'}
        </button>
        <button onClick={() => { setRunning(false); setCo2(0); setEthanol(0); setSubstrate(glucose); timeRef.current = 0; histRef.current = [{ t: 0, co2: 0, eth: 0 }]; onEvent('Reset fermentation lab'); }}
          className="px-4 py-2.5 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
