import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

function evalFn(expr: string, x: number): number {
  try {
    const safe = expr
      .replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan').replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs').replace(/ln/g, 'Math.log')
      .replace(/exp/g, 'Math.exp').replace(/\^/g, '**');
    // eslint-disable-next-line no-new-func
    return new Function('x', `return ${safe}`)(x) as number;
  } catch { return NaN; }
}

function derivative(f: (x: number) => number, x: number, h = 0.0001): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

const PRESETS = ['x*x', 'Math.sin(x)', 'x*x*x - 2*x', 'Math.exp(x) * 0.1'];

export default function DerivativeCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fnExpr, setFnExpr] = useState('x*x');
  const [xVal, setXVal] = useState(1);
  const stateRef = useRef({ fnExpr: 'x*x', xVal: 1 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      const padL = 50, padR = 20, padT = 30, padB = 40;
      const cW = W - padL - padR, cH = H - padT - padB;
      const xMin = -4, xMax = 4;
      const fn = (x: number) => evalFn(s.fnExpr, x);

      // Y range
      const yVals = Array.from({ length: 80 }, (_, i) => {
        const x = xMin + (i / 80) * (xMax - xMin);
        return fn(x);
      }).filter(y => isFinite(y));
      const yMin = yVals.length ? Math.min(...yVals) - 1 : -5;
      const yMax = yVals.length ? Math.max(...yVals) + 1 : 5;

      const tx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * cW;
      const ty = (y: number) => padT + cH - ((y - yMin) / (yMax - yMin)) * cH;

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let x = xMin; x <= xMax; x++) {
        ctx.beginPath(); ctx.moveTo(tx(x), padT); ctx.lineTo(tx(x), padT + cH); ctx.stroke();
        ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(x), tx(x), padT + cH + 14);
      }
      ctx.textAlign = 'left';

      // Axes
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1.5;
      if (yMin < 0 && yMax > 0) { ctx.beginPath(); ctx.moveTo(padL, ty(0)); ctx.lineTo(padL + cW, ty(0)); ctx.stroke(); }
      if (xMin < 0 && xMax > 0) { ctx.beginPath(); ctx.moveTo(tx(0), padT); ctx.lineTo(tx(0), padT + cH); ctx.stroke(); }

      // Function curve
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= 300; i++) {
        const x = xMin + (i / 300) * (xMax - xMin);
        const y = fn(x);
        if (!isFinite(y) || y < yMin - 2 || y > yMax + 2) { first = true; continue; }
        first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        first = false;
      }
      ctx.stroke();

      // Point on curve
      const yPt = fn(s.xVal);
      if (isFinite(yPt)) {
        // Tangent line
        const slope = derivative(fn, s.xVal);
        if (isFinite(slope)) {
          const dx = 2;
          const x1 = s.xVal - dx, y1 = yPt - slope * dx;
          const x2 = s.xVal + dx, y2 = yPt + slope * dx;
          ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(tx(x1), ty(y1)); ctx.lineTo(tx(x2), ty(y2)); ctx.stroke();
        }

        // Point dot
        ctx.beginPath(); ctx.arc(tx(s.xVal), ty(yPt), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B'; ctx.fill();
        ctx.strokeStyle = '#D97706'; ctx.lineWidth = 2; ctx.stroke();

        // Labels
        const slope2 = derivative(fn, s.xVal);
        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(`f(${s.xVal.toFixed(2)}) = ${yPt.toFixed(3)}`, padL, padT - 10);
        ctx.fillStyle = '#D97706';
        ctx.fillText(`f'(${s.xVal.toFixed(2)}) = ${isFinite(slope2) ? slope2.toFixed(3) : 'undefined'} (slope)`, padL, padT + 8);
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={300} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 260 }} />
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p} onClick={() => { setFnExpr(p); stateRef.current.fnExpr = p; onEvent(`Changed function to ${p}`); }}
            className="px-2.5 py-1 rounded-lg text-xs font-inter font-semibold"
            style={{ background: fnExpr === p ? '#1B4332' : '#F0F7F3', color: fnExpr === p ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {p.replace('Math.', '').replace('*', '·')}
          </button>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex flex-col gap-1 flex-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Custom f(x)</label>
          <input value={fnExpr} onChange={e => { setFnExpr(e.target.value); stateRef.current.fnExpr = e.target.value; onEvent(`Entered custom function: ${e.target.value}`); }}
            className="px-2 py-1.5 rounded-lg text-sm font-inter outline-none"
            style={{ border: '1.5px solid #E7E5E0', background: '#FAF8F3', color: '#1C1917' }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>x = {xVal.toFixed(2)}</label>
          <input type="range" min={-3.5} max={3.5} step={0.05} value={xVal}
            onChange={e => { setXVal(+e.target.value); stateRef.current.xVal = +e.target.value; onEvent(`Moved tangent point to x = ${(+e.target.value).toFixed(2)}`); }}
            style={{ accentColor: '#F59E0B' }} className="w-full" />
        </div>
      </div>
    </div>
  );
}
