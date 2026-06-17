import { useState, useEffect, useRef } from 'react';

export default function ReactionRatesCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [temp, setTemp] = useState(25);
  const [conc, setConc] = useState(1.0);
  const [catalyst, setCatalyst] = useState(false);
  const [running, setRunning] = useState(false);
  const [product, setProduct] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<number[]>([0]);
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; reacted: boolean }[]>([]);

  const Ea = catalyst ? 30000 : 60000;
  const R = 8.314;
  const k = Math.exp(-Ea / (R * (temp + 273)));
  const rate = k * conc * (catalyst ? 100 : 10) * 5000;

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setProduct(p => {
        const newP = Math.min(100, p + rate);
        histRef.current = [...histRef.current.slice(-60), newP];
        if (Math.round(newP) % 20 === 0 && Math.round(newP) !== Math.round(p)) {
          onEvent(`${Math.round(newP)}% converted — rate ${rate.toFixed(2)}/s, T=${temp}°C${catalyst ? ', catalyst active (lowers Ea)' : ''}`);
        }
        return newP;
      });
    }, 300);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, rate, temp, catalyst, onEvent]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // Energy diagram
    const startY = H - 40, peakY = H - 40 - (catalyst ? 80 : 140), endY = H - 40 - 70;
    ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(30, startY); ctx.bezierCurveTo(100, startY, 120, peakY, W / 2, peakY);
    ctx.bezierCurveTo(W - 120, peakY, W - 100, endY, W - 30, endY); ctx.stroke();
    // Fill area
    ctx.fillStyle = 'rgba(59,130,246,0.07)';
    ctx.beginPath(); ctx.moveTo(30, startY); ctx.bezierCurveTo(100, startY, 120, peakY, W / 2, peakY);
    ctx.bezierCurveTo(W - 120, peakY, W - 100, endY, W - 30, endY); ctx.lineTo(W - 30, H); ctx.lineTo(30, H); ctx.closePath(); ctx.fill();
    // Labels
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText('Reactants', 20, startY - 8);
    ctx.fillText('Products', W - 75, endY - 8);
    ctx.fillStyle = '#EF4444'; ctx.font = '10px Inter,sans-serif';
    ctx.fillText(`Ea = ${(Ea / 1000).toFixed(0)} kJ/mol`, W / 2 - 35, peakY - 8);
    // Progress marker
    const px = 30 + (product / 100) * (W - 60);
    ctx.fillStyle = '#22C55E'; ctx.beginPath(); ctx.arc(px, startY - 5, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1B4332'; ctx.font = '10px Inter,sans-serif'; ctx.fillText(`${product.toFixed(0)}%`, px - 12, startY + 12);
    // Rate bar
    ctx.fillStyle = '#F0FDF4'; ctx.fillRect(8, 10, 180, 24); ctx.strokeStyle = '#BBF7D0'; ctx.lineWidth = 1; ctx.strokeRect(8, 10, 180, 24);
    ctx.fillStyle = '#1B4332'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(`Rate: ${rate.toFixed(2)} M/s`, 14, 26);
  }, [product, Ea, rate, catalyst]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={200} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', background: '#FAFAF9' }} />
      <div className="rounded-xl p-3 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <p className="font-inter text-xs" style={{ color: '#52796F' }}>Conversion</p>
        <p className="font-sora font-bold text-3xl" style={{ color: '#1B4332' }}>{product.toFixed(1)}%</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: `Temperature: ${temp}°C`, val: temp, min: 0, max: 100, set: (v: number) => { setTemp(v); onEvent(`Temperature: ${v}°C — Arrhenius: k increases exponentially with T`); } },
          { label: `Concentration: ${conc.toFixed(1)}M`, val: conc * 10, min: 1, max: 20, set: (v: number) => { setConc(v / 10); onEvent(`Concentration: ${(v / 10).toFixed(1)}M`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#22C55E' }} className="w-full" />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={catalyst} onChange={e => { setCatalyst(e.target.checked); onEvent(e.target.checked ? `Catalyst added — Ea reduced from 60 to 30 kJ/mol` : 'Catalyst removed — Ea back to 60 kJ/mol'); }} />
        <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Add Catalyst (halves Ea)</span>
      </label>
      <div className="flex gap-2">
        <button onClick={() => { setRunning(r => !r); onEvent(running ? 'Paused reaction' : 'Started reaction'); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: running ? '#EF4444' : '#22C55E', color: '#FFF' }}>
          {running ? '⏸ Pause' : '▶ Run Reaction'}
        </button>
        <button onClick={() => { setRunning(false); setProduct(0); histRef.current = [0]; onEvent('Reset reaction rates lab'); }}
          className="px-4 py-3 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
