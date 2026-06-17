import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type DistType = 'normal' | 'binomial' | 'poisson';

function normalPDF(x: number, mu: number, sigma: number): number {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}
function factorial(n: number): number { if (n <= 1) return 1; return n * factorial(n - 1); }
function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  const C = factorial(n) / (factorial(k) * factorial(n - k));
  return C * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
function poissonPMF(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

export default function ProbabilityDistCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distType, setDistType] = useState<DistType>('normal');
  const [mu, setMu] = useState(0); const [sigma, setSigma] = useState(1);
  const [n, setN] = useState(10); const [p, setP] = useState(0.5);
  const [lambda, setLambda] = useState(3);
  const stateRef = useRef({ distType: 'normal' as DistType, mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 3 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      const padL = 50, padR = 20, padT = 30, padB = 50;
      const cW = W - padL - padR, cH = H - padT - padB;

      // Axes
      ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + cH);
      ctx.lineTo(padL + cW, padT + cH); ctx.stroke();

      if (s.distType === 'normal') {
        const xMin = s.mu - 4 * s.sigma, xMax = s.mu + 4 * s.sigma;
        const yMax = normalPDF(s.mu, s.mu, s.sigma) * 1.1;
        const tx = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * cW;
        const ty = (y: number) => padT + cH - (y / yMax) * cH;

        // Fill curve
        ctx.beginPath();
        for (let i = 0; i <= 400; i++) {
          const x = xMin + (i / 400) * (xMax - xMin);
          const y = normalPDF(x, s.mu, s.sigma);
          i === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        }
        ctx.lineTo(tx(xMax), ty(0)); ctx.lineTo(tx(xMin), ty(0)); ctx.closePath();
        ctx.fillStyle = 'rgba(27,67,50,0.2)'; ctx.fill();

        ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 400; i++) {
          const x = xMin + (i / 400) * (xMax - xMin);
          const y = normalPDF(x, s.mu, s.sigma);
          i === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        }
        ctx.stroke();

        // X ticks
        ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
        for (let i = -3; i <= 3; i++) {
          const xv = s.mu + i * s.sigma;
          ctx.fillText(xv.toFixed(1), tx(xv), padT + cH + 14);
        }
        ctx.textAlign = 'left';

        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(`Normal(μ=${s.mu}, σ=${s.sigma})`, padL + 4, padT - 8);
        ctx.fillText(`Peak PDF = ${normalPDF(s.mu, s.mu, s.sigma).toFixed(4)}`, W - 200, padT - 8);

      } else {
        const maxK = s.distType === 'binomial' ? s.n : Math.round(s.lambda + 4 * Math.sqrt(s.lambda));
        const vals = Array.from({ length: maxK + 1 }, (_, k) =>
          s.distType === 'binomial' ? binomialPMF(k, s.n, s.p) : poissonPMF(k, s.lambda)
        );
        const yMax = Math.max(...vals) * 1.15;
        const barW = cW / (maxK + 2);
        const tx = (k: number) => padL + (k + 0.5) * barW;
        const ty = (y: number) => padT + cH - (y / yMax) * cH;

        vals.forEach((v, k) => {
          const bx = tx(k) - barW * 0.4, bw = barW * 0.8;
          const by = ty(v), bh = ty(0) - ty(v);
          const grd = ctx.createLinearGradient(0, by, 0, by + bh);
          grd.addColorStop(0, '#1B4332'); grd.addColorStop(1, 'rgba(27,67,50,0.4)');
          ctx.fillStyle = grd; ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#78716C'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(String(k), tx(k), padT + cH + 14);
          if (v > 0.02) { ctx.fillStyle = '#1C1917'; ctx.font = '9px Inter,sans-serif'; ctx.fillText(v.toFixed(2), tx(k), by - 3); }
        });
        ctx.textAlign = 'left';

        const label = s.distType === 'binomial'
          ? `Binomial(n=${s.n}, p=${s.p})`
          : `Poisson(λ=${s.lambda})`;
        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(label, padL + 4, padT - 8);
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={300} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 250 }} />
      <div className="flex gap-2 flex-wrap">
        {(['normal', 'binomial', 'poisson'] as DistType[]).map(d => (
          <button key={d} onClick={() => { setDistType(d); stateRef.current.distType = d; onEvent(`Switched to ${d} distribution`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: distType === d ? '#1B4332' : '#F0F7F3', color: distType === d ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {distType === 'normal' && (<>
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>μ (mean): {mu}</label>
            <input type="range" min={-3} max={3} step={0.5} value={mu}
              onChange={e => { setMu(+e.target.value); stateRef.current.mu = +e.target.value; onEvent(`Changed mean μ to ${e.target.value}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>σ (std): {sigma}</label>
            <input type="range" min={0.3} max={3} step={0.1} value={sigma}
              onChange={e => { setSigma(+e.target.value); stateRef.current.sigma = +e.target.value; onEvent(`Changed std deviation σ to ${e.target.value}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        </>)}
        {distType === 'binomial' && (<>
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>n (trials): {n}</label>
            <input type="range" min={2} max={20} value={n}
              onChange={e => { setN(+e.target.value); stateRef.current.n = +e.target.value; onEvent(`Changed n to ${e.target.value} trials`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>p (prob): {p.toFixed(1)}</label>
            <input type="range" min={0.1} max={0.9} step={0.05} value={p}
              onChange={e => { setP(+e.target.value); stateRef.current.p = +e.target.value; onEvent(`Changed probability p to ${(+e.target.value).toFixed(2)}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        </>)}
        {distType === 'poisson' && (
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>λ (rate): {lambda}</label>
            <input type="range" min={0.5} max={12} step={0.5} value={lambda}
              onChange={e => { setLambda(+e.target.value); stateRef.current.lambda = +e.target.value; onEvent(`Changed Poisson rate λ to ${e.target.value}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
