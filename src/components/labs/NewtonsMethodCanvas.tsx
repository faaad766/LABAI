import { useState, useRef, useEffect } from 'react';

type Fn = 'cubic' | 'sin' | 'poly';
const FNS: Record<Fn, { f: (x: number) => number; df: (x: number) => number; label: string }> = {
  cubic: { f: x => x * x * x - 2 * x - 5, df: x => 3 * x * x - 2, label: 'f(x) = x³ - 2x - 5' },
  sin: { f: x => Math.sin(x) - x / 2, df: x => Math.cos(x) - 0.5, label: 'f(x) = sin(x) - x/2' },
  poly: { f: x => x * x * x * x - 3 * x * x + 2, df: x => 4 * x * x * x - 6 * x, label: 'f(x) = x⁴ - 3x² + 2' },
};

export default function NewtonsMethodCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [fn, setFn] = useState<Fn>('cubic');
  const [x0, setX0] = useState(3.0);
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState<{ x: number; fx: number; xNext: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { f, df, label } = FNS[fn];

  const iterate = () => {
    const xCur = history.length > 0 ? history[history.length - 1].xNext : x0;
    const fx = f(xCur), dfx = df(xCur);
    if (Math.abs(dfx) < 1e-12) return;
    const xNext = xCur - fx / dfx;
    setHistory(h => [...h, { x: xCur, fx, xNext }]);
    setStep(s => s + 1);
    onEvent(`Step ${step + 1}: x=${xCur.toFixed(5)}, f(x)=${fx.toFixed(5)}, x_new=${xNext.toFixed(5)} — Error: ${Math.abs(xNext - xCur).toFixed(6)}`);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    const xMin = -4, xMax = 6, yMin = -10, yMax = 15;
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * (W - 40) + 20;
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * (H - 20) - 10;
    ctx.clearRect(0, 0, W, H);
    // Grid
    ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1;
    for (let gx = xMin; gx <= xMax; gx++) { ctx.beginPath(); ctx.moveTo(sx(gx), 0); ctx.lineTo(sx(gx), H); ctx.stroke(); }
    ctx.strokeStyle = '#A8A29E'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, sy(0)); ctx.lineTo(W, sy(0)); ctx.stroke();
    // Function curve
    ctx.beginPath(); ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2.5;
    for (let px = 0; px < W; px++) {
      const x = xMin + (px / W) * (xMax - xMin);
      const y = f(x);
      const py = sy(y);
      (px === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Newton steps
    history.forEach(({ x: xi, fx, xNext }, i) => {
      // Vertical drop
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(sx(xi), sy(0)); ctx.lineTo(sx(xi), sy(fx)); ctx.stroke();
      // Tangent line
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      const slope = df(xi);
      const x1 = xi - 2, x2 = xi + 2;
      ctx.beginPath(); ctx.moveTo(sx(x1), sy(fx + slope * (x1 - xi))); ctx.lineTo(sx(x2), sy(fx + slope * (x2 - xi))); ctx.stroke();
      // New point
      ctx.beginPath(); ctx.arc(sx(xNext), sy(0), 5, 0, Math.PI * 2);
      ctx.fillStyle = i === history.length - 1 ? '#22C55E' : '#EF4444'; ctx.fill();
    });
    ctx.setLineDash([]);
    // Starting point
    ctx.beginPath(); ctx.arc(sx(x0), sy(f(x0)), 6, 0, Math.PI * 2); ctx.fillStyle = '#3B82F6'; ctx.fill();
    // Labels
    ctx.fillStyle = '#8B5CF6'; ctx.font = '11px Inter,sans-serif'; ctx.fillText(label, 25, 18);
    if (history.length > 0) {
      const last = history[history.length - 1].xNext;
      ctx.fillStyle = '#16A34A'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`Root ≈ ${last.toFixed(6)}`, W / 2 - 50, H - 6);
    }
  }, [history, x0, f, df, label, step]);

  const reset = () => { setHistory([]); setStep(0); onEvent(`Reset Newton's method. Starting x₀=${x0}`); };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['cubic','sin','poly'] as Fn[]).map(t => (
          <button key={t} onClick={() => { setFn(t); reset(); onEvent(`Function: ${FNS[t].label}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: fn === t ? '#8B5CF6' : '#F5F3FF', color: fn === t ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {t}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={240} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#FAFAF9' }} />
      <div className="flex flex-col gap-1">
        <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Starting point x₀: {x0}</label>
        <input type="range" min={-3} max={5} step={0.1} value={x0} onChange={e => { setX0(+e.target.value); reset(); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
      </div>
      {history.length > 0 && (
        <div className="rounded-xl p-3 max-h-28 overflow-y-auto" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          {history.map((h, i) => (
            <p key={i} className="font-mono text-xs" style={{ color: '#4C1D95' }}>
              Step {i + 1}: x={h.x.toFixed(5)} → {h.xNext.toFixed(5)} (Δ={Math.abs(h.xNext - h.x).toFixed(6)})
            </p>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={iterate} className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#8B5CF6', color: '#FFF' }}>
          ↻ Iterate (Step {step + 1})
        </button>
        <button onClick={reset} className="px-4 py-3 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
