import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

// Simple expression evaluator for common functions
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

export default function LimitsCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fnExpr, setFnExpr] = useState('(x*x - 1)/(x - 1)');
  const [limitPt, setLimitPt] = useState(1);
  const [xVal, setXVal] = useState(1.5);
  const stateRef = useRef({ fnExpr: '(x*x - 1)/(x - 1)', limitPt: 1, xVal: 1.5 });

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
      const xMin = s.limitPt - 4, xMax = s.limitPt + 4;

      // Sample values for auto y-range
      const yVals: number[] = [];
      for (let i = 0; i <= 80; i++) {
        const x = xMin + (i / 80) * (xMax - xMin);
        if (Math.abs(x - s.limitPt) > 0.05) {
          const y = evalFn(s.fnExpr, x);
          if (isFinite(y)) yVals.push(y);
        }
      }
      const yMin = yVals.length ? Math.min(...yVals) - 1 : -5;
      const yMax = yVals.length ? Math.max(...yVals) + 1 : 5;
      const tx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * cW;
      const ty = (y: number) => padT + cH - ((y - yMin) / (yMax - yMin)) * cH;

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let x = Math.ceil(xMin); x <= xMax; x++) {
        ctx.beginPath(); ctx.moveTo(tx(x), padT); ctx.lineTo(tx(x), padT + cH); ctx.stroke();
        ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(x), tx(x), padT + cH + 14);
      }
      const yStep = Math.ceil((yMax - yMin) / 6);
      for (let y = Math.ceil(yMin); y <= yMax; y += yStep) {
        ctx.beginPath(); ctx.moveTo(padL, ty(y)); ctx.lineTo(padL + cW, ty(y)); ctx.stroke();
        ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(y.toFixed(1), padL - 4, ty(y) + 4);
      }
      ctx.textAlign = 'left';

      // Axes
      ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 1.5;
      if (yMin < 0 && yMax > 0) {
        ctx.beginPath(); ctx.moveTo(padL, ty(0)); ctx.lineTo(padL + cW, ty(0)); ctx.stroke();
      }
      if (xMin < 0 && xMax > 0) {
        ctx.beginPath(); ctx.moveTo(tx(0), padT); ctx.lineTo(tx(0), padT + cH); ctx.stroke();
      }

      // Function curve
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= 200; i++) {
        const x = xMin + (i / 200) * (xMax - xMin);
        if (Math.abs(x - s.limitPt) < 0.03) { first = true; continue; }
        const y = evalFn(s.fnExpr, x);
        if (!isFinite(y) || y < yMin - 2 || y > yMax + 2) { first = true; continue; }
        first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        first = false;
      }
      ctx.stroke();

      // Limit point hole
      const leftLimit = evalFn(s.fnExpr, s.limitPt - 0.001);
      const rightLimit = evalFn(s.fnExpr, s.limitPt + 0.001);
      const limitsMatch = Math.abs(leftLimit - rightLimit) < 0.05;
      const limitVal = (leftLimit + rightLimit) / 2;

      ctx.beginPath(); ctx.arc(tx(s.limitPt), ty(isFinite(limitVal) ? limitVal : yMin), 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2.5; ctx.fillStyle = '#FDFCF9'; ctx.fill(); ctx.stroke();

      // Current x point
      if (Math.abs(s.xVal - s.limitPt) > 0.05) {
        const yPoint = evalFn(s.fnExpr, s.xVal);
        if (isFinite(yPoint)) {
          // Vertical dashed line
          ctx.strokeStyle = 'rgba(245,158,11,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(tx(s.xVal), padT + cH); ctx.lineTo(tx(s.xVal), ty(yPoint)); ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(tx(s.xVal), ty(yPoint), 5, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B'; ctx.fill();
          ctx.fillStyle = '#1C1917'; ctx.font = '600 11px Inter,sans-serif';
          ctx.fillText(`f(${s.xVal.toFixed(2)}) = ${yPoint.toFixed(3)}`, tx(s.xVal) + 8, ty(yPoint) - 8);
        }
      }

      // Limit result
      ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(`lim  f(x) = ${isFinite(limitVal) ? limitVal.toFixed(3) : 'DNE'}`, padL + 2, padT - 10);
      ctx.fillStyle = '#78716C'; ctx.font = '600 10px Inter,sans-serif';
      ctx.fillText(`x→${s.limitPt}`, padL + 26, padT - 2);
      ctx.fillStyle = limitsMatch && isFinite(limitVal) ? '#1B4332' : '#DC2626';
      ctx.font = '700 12px Inter,sans-serif';
      ctx.fillText(limitsMatch && isFinite(limitVal) ? '✓ Limit exists' : '✗ Limit does not exist', W - 150, padT - 8);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={320} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 280 }} />
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Function f(x)</label>
          <input value={fnExpr} onChange={e => { setFnExpr(e.target.value); stateRef.current.fnExpr = e.target.value; onEvent(`Changed function to ${e.target.value}`); }}
            className="px-2 py-1.5 rounded-lg text-sm font-inter outline-none" style={{ border: '1.5px solid #E7E5E0', background: '#FAF8F3', color: '#1C1917' }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Limit at x = {limitPt}</label>
          <input type="range" min={-3} max={5} step={0.5} value={limitPt}
            onChange={e => { setLimitPt(+e.target.value); stateRef.current.limitPt = +e.target.value; setXVal(+e.target.value + 1.5); stateRef.current.xVal = +e.target.value + 1.5; onEvent(`Evaluating limit at x → ${e.target.value}`); }}
            style={{ accentColor: '#1B4332' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Approach x = {xVal.toFixed(2)}</label>
          <input type="range" min={limitPt - 3} max={limitPt + 3} step={0.05} value={xVal}
            onChange={e => { setXVal(+e.target.value); stateRef.current.xVal = +e.target.value; onEvent(`x approaching ${(+e.target.value).toFixed(2)} — f(x) = ${evalFn(fnExpr, +e.target.value).toFixed(3)}`); }}
            style={{ accentColor: '#F59E0B' }} className="w-full" />
        </div>
      </div>
    </div>
  );
}
