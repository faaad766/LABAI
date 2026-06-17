import { useState, useEffect, useRef } from 'react';

type EqType = 'exponential' | 'logistic' | 'harmonic';
export default function DifferentialEquationsCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [type, setType] = useState<EqType>('logistic');
  const [r, setR] = useState(0.5);
  const [K, setK] = useState(100);
  const [x0, setX0] = useState(10);
  const [omega, setOmega] = useState(2);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const EQ_LABELS: Record<EqType, string> = {
    exponential: "dx/dt = rx",
    logistic: "dx/dt = rx(1 - x/K)",
    harmonic: "d²x/dt² = -ω²x",
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const steps = W - 60;
    const dt = 0.05;
    const points: [number, number][] = [];
    let x = x0, v = 0;
    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      let val = 0;
      if (type === 'exponential') { x += r * x * dt; val = x; }
      else if (type === 'logistic') { x += r * x * (1 - x / K) * dt; val = x; }
      else { const ax = -omega * omega * x; v += ax * dt; x += v * dt; val = x + x0; }
      points.push([t, val]);
    }
    const vals = points.map(p => p[1]);
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const scaleY = (H - 40) / (maxV - minV + 1e-9);
    // Grid
    ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(f => {
      const y = H - 20 - f * (H - 40);
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 10, y); ctx.stroke();
      ctx.fillStyle = '#A8A29E'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText((minV + f * (maxV - minV)).toFixed(1), 2, y + 4);
    });
    // Curve
    ctx.beginPath(); ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2.5;
    points.forEach(([t, val], i) => {
      const x2 = 40 + (t / (points[points.length-1][0])) * (W - 50);
      const y2 = H - 20 - (val - minV) * scaleY;
      i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
    });
    ctx.stroke();
    // Equilibrium line (logistic)
    if (type === 'logistic') {
      const ky = H - 20 - (K - minV) * scaleY;
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(40, ky); ctx.lineTo(W - 10, ky); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#D97706'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`K=${K}`, W - 36, ky - 4);
    }
    // Axes
    ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, 10); ctx.lineTo(40, H - 20); ctx.stroke();
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText('t', W - 15, H - 16); ctx.fillText('x', 44, 14);
    ctx.fillStyle = '#8B5CF6'; ctx.font = '11px Inter,sans-serif';
    ctx.fillText(EQ_LABELS[type], 45, 28);
  }, [type, r, K, x0, omega]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['exponential','logistic','harmonic'] as EqType[]).map(t => (
          <button key={t} onClick={() => { setType(t); onEvent(`Equation: ${EQ_LABELS[t]}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: type === t ? '#8B5CF6' : '#F5F3FF', color: type === t ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {t}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={220} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-2 gap-3">
        {type !== 'harmonic' ? (
          <>
            <div className="flex flex-col gap-1">
              <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Growth rate r: {r}</label>
              <input type="range" min={0.1} max={2} step={0.1} value={r} onChange={e => { setR(+e.target.value); onEvent(`r=${+e.target.value}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
            </div>
            {type === 'logistic' && (
              <div className="flex flex-col gap-1">
                <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Carrying capacity K: {K}</label>
                <input type="range" min={20} max={200} value={K} onChange={e => { setK(+e.target.value); onEvent(`K=${+e.target.value} — population ceiling`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Angular freq ω: {omega}</label>
            <input type="range" min={0.5} max={5} step={0.5} value={omega} onChange={e => { setOmega(+e.target.value); onEvent(`ω=${+e.target.value}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Initial value x₀: {x0}</label>
          <input type="range" min={1} max={50} value={x0} onChange={e => { setX0(+e.target.value); onEvent(`x₀=${+e.target.value}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
        </div>
      </div>
    </div>
  );
}
