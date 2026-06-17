import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type FnType = 'sin' | 'cos' | 'exp' | 'ln1x';
const FN_LABELS: Record<FnType, string> = { sin: 'sin(x)', cos: 'cos(x)', exp: 'eˣ', ln1x: 'ln(1+x)' };

function factorial(n: number): number { return n <= 1 ? 1 : n * factorial(n - 1); }

function taylorCoeff(fn: FnType, n: number): number {
  if (fn === 'sin') return n % 2 === 0 ? 0 : (n % 4 === 1 ? 1 : -1) / factorial(n);
  if (fn === 'cos') return n % 2 !== 0 ? 0 : (n % 4 === 0 ? 1 : -1) / factorial(n);
  if (fn === 'exp') return 1 / factorial(n);
  // ln(1+x): c_n = (-1)^(n+1)/n for n>=1, 0 for n=0
  if (n === 0) return 0;
  return (n % 2 === 1 ? 1 : -1) / n;
}

function taylorApprox(fn: FnType, x: number, terms: number, center: number): number {
  let sum = 0;
  for (let n = 0; n < terms; n++) sum += taylorCoeff(fn, n) * Math.pow(x - center, n);
  return sum;
}

function trueFn(fn: FnType, x: number): number {
  if (fn === 'sin') return Math.sin(x);
  if (fn === 'cos') return Math.cos(x);
  if (fn === 'exp') return Math.exp(x);
  return Math.log(1 + x);
}

export default function TaylorSeriesCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fn, setFn] = useState<FnType>('sin');
  const [terms, setTerms] = useState(3);
  const [center, setCenter] = useState(0);
  const stateRef = useRef({ fn: 'sin' as FnType, terms: 3, center: 0 });

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
      const xMin = -5, xMax = 5, yMin = -4, yMax = 4;
      const tx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * cW;
      const ty = (y: number) => padT + cH - ((y - yMin) / (yMax - yMin)) * cH;

      // Grid + axes
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let x = xMin; x <= xMax; x++) { ctx.beginPath(); ctx.moveTo(tx(x), padT); ctx.lineTo(tx(x), padT + cH); ctx.stroke(); }
      for (let y = yMin; y <= yMax; y++) { ctx.beginPath(); ctx.moveTo(padL, ty(y)); ctx.lineTo(padL + cW, ty(y)); ctx.stroke(); }
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(padL, ty(0)); ctx.lineTo(padL + cW, ty(0)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx(0), padT); ctx.lineTo(tx(0), padT + cH); ctx.stroke();

      ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      for (let x = xMin; x <= xMax; x++) ctx.fillText(String(x), tx(x), padT + cH + 14);
      ctx.textAlign = 'left';

      // True function
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= 400; i++) {
        const x = xMin + (i / 400) * (xMax - xMin);
        const y = trueFn(s.fn, x);
        if (!isFinite(y) || y < yMin - 1 || y > yMax + 1) { first = true; continue; }
        first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        first = false;
      }
      ctx.stroke();

      // Taylor approximation
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2.5;
      ctx.beginPath(); first = true;
      for (let i = 0; i <= 400; i++) {
        const x = xMin + (i / 400) * (xMax - xMin);
        const y = taylorApprox(s.fn, x, s.terms, s.center);
        if (!isFinite(y) || y < yMin - 2 || y > yMax + 2) { first = true; continue; }
        first ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        first = false;
      }
      ctx.stroke();

      // Center point
      ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(tx(s.center), padT); ctx.lineTo(tx(s.center), padT + cH); ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      ctx.fillStyle = '#1B4332'; ctx.font = '700 12px Inter,sans-serif';
      ctx.fillText(`True: ${FN_LABELS[s.fn]}`, padL + 4, padT - 8);
      ctx.fillStyle = '#D97706';
      ctx.fillText(`Taylor (n=${s.terms - 1}, a=${s.center})`, padL + 140, padT - 8);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={300} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 260 }} />
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(FN_LABELS) as FnType[]).map(f => (
          <button key={f} onClick={() => { setFn(f); stateRef.current.fn = f; onEvent(`Selected function ${FN_LABELS[f]}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: fn === f ? '#1B4332' : '#F0F7F3', color: fn === f ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {FN_LABELS[f]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Terms: {terms} (degree {terms - 1})</label>
          <input type="range" min={1} max={12} value={terms}
            onChange={e => { setTerms(+e.target.value); stateRef.current.terms = +e.target.value; onEvent(`Set Taylor series to ${e.target.value} terms`); }}
            style={{ accentColor: '#F59E0B' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Center a = {center}</label>
          <input type="range" min={-3} max={3} step={0.5} value={center}
            onChange={e => { setCenter(+e.target.value); stateRef.current.center = +e.target.value; onEvent(`Changed expansion center to a = ${e.target.value}`); }}
            style={{ accentColor: '#6366F1' }} className="w-full" />
        </div>
      </div>
    </div>
  );
}
