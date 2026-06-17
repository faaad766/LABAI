import { useState, useEffect, useRef } from 'react';

export default function FluidMechanicsCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [pressure, setPressure] = useState(200); // kPa
  const [vel, setVel] = useState(3); // m/s at entry
  const [r1, setR1] = useState(0.1); // entry radius m
  const [r2, setR2] = useState(0.06); // exit radius m
  const [density, setDensity] = useState(1000); // water
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const A1 = Math.PI * r1 * r1, A2 = Math.PI * r2 * r2;
  const v2 = vel * A1 / A2; // continuity
  const p2 = pressure * 1000 + 0.5 * density * (vel * vel - v2 * v2); // Bernoulli, Pa
  const flowRate = A1 * vel;

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const yMid = H / 2;
    const h1 = 60 * r1 / 0.1, h2 = 60 * r2 / 0.1;
    const x1Start = 30, x1End = 180, x2Start = 300, x2End = W - 30;
    const taperMid = (x1End + x2Start) / 2;

    // Pipe walls
    ctx.fillStyle = '#BFDBFE';
    // Entry pipe
    ctx.fillRect(x1Start, yMid - h1, x1End - x1Start, h1 * 2);
    // Taper
    ctx.beginPath(); ctx.moveTo(x1End, yMid - h1); ctx.lineTo(taperMid, yMid - (h1+h2)/2); ctx.lineTo(x2Start, yMid - h2);
    ctx.lineTo(x2Start, yMid + h2); ctx.lineTo(taperMid, yMid + (h1+h2)/2); ctx.lineTo(x1End, yMid + h1);
    ctx.closePath(); ctx.fillStyle = '#BFDBFE'; ctx.fill();
    // Exit pipe
    ctx.fillStyle = '#BFDBFE'; ctx.fillRect(x2Start, yMid - h2, x2End - x2Start, h2 * 2);
    // Outlines
    ctx.strokeStyle = '#1E3A5F'; ctx.lineWidth = 2;
    [[-1,1]].forEach(([sign]) => {
      ctx.beginPath(); ctx.moveTo(x1Start, yMid + sign * h1); ctx.lineTo(x1End, yMid + sign * h1);
      ctx.lineTo(taperMid, yMid + sign * (h1+h2)/2); ctx.lineTo(x2Start, yMid + sign * h2); ctx.lineTo(x2End, yMid + sign * h2); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(x1Start, yMid - h1); ctx.lineTo(x1End, yMid - h1);
    ctx.lineTo(taperMid, yMid - (h1+h2)/2); ctx.lineTo(x2Start, yMid - h2); ctx.lineTo(x2End, yMid - h2); ctx.stroke();

    // Flow arrows (speed proportional to length)
    const drawArrow = (x: number, v: number, y: number) => {
      const len = v * 12;
      ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      ctx.fillStyle = '#8B5CF6';
      ctx.beginPath(); ctx.moveTo(x + len, y); ctx.lineTo(x + len - 10, y - 5); ctx.lineTo(x + len - 10, y + 5); ctx.fill();
    };
    for (let i = 0; i < 3; i++) drawArrow(50 + i * 30, vel, yMid - h1 * 0.5 + i * h1 * 0.4);
    for (let i = 0; i < 2; i++) drawArrow(320 + i * 30, v2, yMid - h2 * 0.5 + i * h2);

    // Pressure gauges
    const drawGauge = (x: number, p: number, label: string) => {
      const y = yMid - h1 * 0.8 - 50;
      ctx.strokeStyle = '#A8A29E'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(x, yMid - (x < 200 ? h1 : h2)); ctx.lineTo(x, y + 20); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = p > 150000 ? '#FEE2E2' : '#F0FDF4'; ctx.fill(); ctx.strokeStyle = '#1E3A5F'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 9px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${(p/1000).toFixed(0)}`, x, y - 2); ctx.fillText('kPa', x, y + 9);
      ctx.fillStyle = '#52796F'; ctx.font = '9px Inter,sans-serif'; ctx.fillText(label, x, y + 28); ctx.textAlign = 'left';
    };
    drawGauge(100, pressure * 1000, 'P₁');
    drawGauge(380, Math.max(0, p2), 'P₂');

    // Labels
    ctx.fillStyle = '#1C1917'; ctx.font = '10px Inter,sans-serif';
    ctx.fillText(`A₁=${A1.toFixed(4)}m²  v₁=${vel}m/s`, 30, H - 38);
    ctx.fillText(`A₂=${A2.toFixed(4)}m²  v₂=${v2.toFixed(2)}m/s`, 30, H - 22);
    ctx.fillStyle = '#8B5CF6'; ctx.font = 'bold 10px Inter,sans-serif';
    ctx.fillText('Continuity: A₁v₁=A₂v₂  |  Bernoulli: P+½ρv²=const', 30, H - 6);
  }, [pressure, vel, r1, r2, density, A1, A2, v2, p2, flowRate]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={230} className="w-full rounded-xl" style={{ border: '1px solid #BFDBFE', background: '#F8FAFC' }} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl p-3" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <p className="font-inter font-semibold" style={{ color: '#1E3A5F' }}>Flow rate Q: {flowRate.toFixed(4)} m³/s</p>
          <p style={{ color: '#3B82F6' }}>v₂ = {v2.toFixed(3)} m/s</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <p className="font-inter font-semibold" style={{ color: '#4C1D95' }}>P₂: {(p2 / 1000).toFixed(1)} kPa</p>
          <p style={{ color: p2 > 0 ? '#22C55E' : '#EF4444' }}>ΔP: {((pressure * 1000 - p2) / 1000).toFixed(1)} kPa</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ l: `Inlet v₁: ${vel} m/s`, v: vel, s: setVel, min: 0.5, max: 10, step: 0.5 },
          { l: `Pressure P₁: ${pressure} kPa`, v: pressure, s: setPressure, min: 50, max: 500, step: 10 },
          { l: `Inlet r₁: ${r1.toFixed(2)} m`, v: r1 * 100, s: (v: number) => setR1(v / 100), min: 5, max: 20 },
          { l: `Outlet r₂: ${r2.toFixed(2)} m`, v: r2 * 100, s: (v: number) => setR2(v / 100), min: 2, max: 15 }].map(({ l, v, s, min, max, step }) => (
          <div key={l} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{l}</label>
            <input type="range" min={min} max={max} step={step ?? 1} value={v} onChange={e => { s(+e.target.value); onEvent(`${l.split(':')[0]} changed. v₂=${v2.toFixed(2)} m/s, P₂=${(p2/1000).toFixed(1)} kPa`); }} style={{ accentColor: '#3B82F6' }} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
