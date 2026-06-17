import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

function evalFn(expr: string, x: number): number {
  try {
    const safe = expr
      .replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos')
      .replace(/abs/g, 'Math.abs').replace(/sqrt/g, 'Math.sqrt')
      .replace(/\^/g, '**');
    // eslint-disable-next-line no-new-func
    return new Function('x', `return ${safe}`)(x) as number;
  } catch { return NaN; }
}

export default function IntegralCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fnExpr, setFnExpr] = useState('x*x');
  const [aLow, setALow] = useState(-2);
  const [bHigh, setBHigh] = useState(2);
  const [rects, setRects] = useState(20);
  const stateRef = useRef({ fnExpr: 'x*x', aLow: -2, bHigh: 2, rects: 20 });

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

      const yVals = Array.from({ length: 100 }, (_, i) => fn(xMin + (i / 100) * (xMax - xMin))).filter(isFinite);
      const yMin = Math.min(0, yVals.length ? Math.min(...yVals) - 0.5 : -4);
      const yMax = yVals.length ? Math.max(...yVals) + 0.5 : 4;
      const tx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * cW;
      const ty = (y: number) => padT + cH - ((y - yMin) / (yMax - yMin)) * cH;

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let x = xMin; x <= xMax; x++) { ctx.beginPath(); ctx.moveTo(tx(x), padT); ctx.lineTo(tx(x), padT + cH); ctx.stroke(); }

      // Axes
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(padL, ty(0)); ctx.lineTo(padL + cW, ty(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx(0), padT); ctx.lineTo(tx(0), padT + cH); ctx.stroke();

      // Riemann rectangles
      const dx = (s.bHigh - s.aLow) / s.rects;
      let riemannSum = 0;
      for (let i = 0; i < s.rects; i++) {
        const xi = s.aLow + (i + 0.5) * dx;
        const yi = fn(xi);
        if (!isFinite(yi)) continue;
        riemannSum += yi * dx;
        const rx = tx(s.aLow + i * dx);
        const rw = (tx(s.bHigh) - tx(s.aLow)) / s.rects;
        const ry = ty(Math.max(0, yi));
        const rh = Math.abs(ty(0) - ty(yi));
        ctx.fillStyle = yi >= 0 ? 'rgba(27,67,50,0.25)' : 'rgba(220,38,38,0.2)';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = yi >= 0 ? 'rgba(27,67,50,0.4)' : 'rgba(220,38,38,0.4)';
        ctx.lineWidth = 0.5; ctx.strokeRect(rx, ry, rw, rh);
      }

      // Function curve
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= 400; i++) {
        const x = xMin + (i / 400) * (xMax - xMin);
        const y = fn(x);
        if (!isFinite(y) || y < yMin - 2 || y > yMax + 2) { first = true; continue; }
        first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        first = false;
      }
      ctx.stroke();

      // Bound lines
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(tx(s.aLow), padT); ctx.lineTo(tx(s.aLow), padT + cH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx(s.bHigh), padT); ctx.lineTo(tx(s.bHigh), padT + cH); ctx.stroke();
      ctx.setLineDash([]);

      // x-axis labels
      ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      for (let x = xMin; x <= xMax; x++) ctx.fillText(String(x), tx(x), padT + cH + 14);
      ctx.textAlign = 'left';

      // Labels
      ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(`∫[${s.aLow}, ${s.bHigh}] ${s.fnExpr} dx`, padL, padT - 10);
      ctx.fillStyle = '#1B4332';
      ctx.fillText(`Riemann Sum (n=${s.rects}): ${riemannSum.toFixed(4)}`, padL, padT + 10);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={300} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 260 }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 col-span-2">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>f(x)</label>
          <input value={fnExpr} onChange={e => { setFnExpr(e.target.value); stateRef.current.fnExpr = e.target.value; onEvent(`Changed integrand to ${e.target.value}`); }}
            className="px-2 py-1.5 rounded-lg text-sm font-inter outline-none" style={{ border: '1.5px solid #E7E5E0', background: '#FAF8F3', color: '#1C1917' }} />
        </div>
        {[{ label: `Lower bound a: ${aLow}`, val: aLow, set: setALow, key: 'aLow' as const, min: -4, max: bHigh - 0.5, step: 0.5, event: 'Changed lower bound' },
          { label: `Upper bound b: ${bHigh}`, val: bHigh, set: setBHigh, key: 'bHigh' as const, min: aLow + 0.5, max: 4, step: 0.5, event: 'Changed upper bound' },
          { label: `Rectangles n: ${rects}`, val: rects, set: setRects, key: 'rects' as const, min: 2, max: 100, step: 2, event: 'Changed rectangle count to' },
        ].map(({ label, val, set, key, min, max, step, event }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e => { set(+e.target.value); stateRef.current[key] = +e.target.value; onEvent(`${event} ${e.target.value}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
