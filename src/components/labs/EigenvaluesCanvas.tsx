import { useState, useEffect, useRef } from 'react';

export default function EigenvaluesCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [a, setA] = useState(3); const [b, setB] = useState(1);
  const [c, setC] = useState(1); const [d, setD] = useState(3);
  const [showVecs, setShowVecs] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Eigenvalues via characteristic polynomial: det(A - λI) = 0
  // (a-λ)(d-λ) - bc = 0  =>  λ² - (a+d)λ + (ad-bc) = 0
  const trace = a + d, det = a * d - b * c;
  const discriminant = trace * trace - 4 * det;
  const l1 = (trace + Math.sqrt(Math.max(0, discriminant))) / 2;
  const l2 = (trace - Math.sqrt(Math.max(0, discriminant))) / 2;
  const isReal = discriminant >= 0;
  const lComplexMag = Math.sqrt(Math.abs(det));
  const lComplexAngle = (trace / 2);

  // Eigenvectors for real eigenvalues: (A - λI)v = 0
  const ev1 = isReal && Math.abs(b) > 1e-9 ? [b, l1 - a] : [1, 0];
  const ev2 = isReal && Math.abs(b) > 1e-9 ? [b, l2 - a] : [0, 1];
  const norm = (v: number[]) => { const m = Math.sqrt(v[0] * v[0] + v[1] * v[1]); return m > 1e-9 ? [v[0] / m, v[1] / m] : v; };
  const n1 = norm(ev1), n2 = norm(ev2);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, scale = 50;
    // Grid
    ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy + i * scale); ctx.lineTo(W, cy + i * scale); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = '#A8A29E'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    // Unit circle vectors (before transformation)
    const angles = Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2);
    ctx.strokeStyle = 'rgba(147,197,253,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath();
    angles.forEach((angle, i) => {
      const x2 = cx + Math.cos(angle) * scale, y2 = cy - Math.sin(angle) * scale;
      i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
    });
    ctx.closePath(); ctx.stroke();
    // Transformed circle (ellipse under A)
    ctx.strokeStyle = 'rgba(139,92,246,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath();
    angles.forEach((angle, i) => {
      const vx = Math.cos(angle), vy = Math.sin(angle);
      const tx = a * vx + b * vy, ty = c * vx + d * vy;
      const x2 = cx + tx * scale, y2 = cy - ty * scale;
      i === 0 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2);
    });
    ctx.closePath(); ctx.stroke();
    // Eigenvectors
    if (showVecs && isReal) {
      const drawEv = (ev: number[], λ: number, col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + ev[0] * scale * Math.sign(λ), cy - ev[1] * scale * Math.sign(λ)); ctx.stroke();
        // Arrowhead
        ctx.fillStyle = col;
        const ex = cx + ev[0] * scale * Math.sign(λ), ey = cy - ev[1] * scale * Math.sign(λ);
        const angle = Math.atan2(-ev[1], ev[0]);
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(angle);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.fill();
        ctx.restore();
        ctx.fillStyle = col; ctx.font = '11px Inter,sans-serif';
        ctx.fillText(`λ=${λ.toFixed(2)}`, cx + ev[0] * scale * Math.sign(λ) + 4, cy - ev[1] * scale * Math.sign(λ) - 4);
      };
      drawEv(n1, l1, '#22C55E');
      drawEv(n2, l2, '#EF4444');
    }
    // Matrix label
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText(`A = [[${a},${b}],[${c},${d}]]`, 10, 18);
  }, [a, b, c, d, showVecs, isReal, l1, l2, n1, n2]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={260} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-2 gap-2">
        {isReal ? (
          <>
            <div className="rounded-xl p-3 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="font-inter text-xs" style={{ color: '#52796F' }}>λ₁</p>
              <p className="font-sora font-bold text-xl" style={{ color: '#22C55E' }}>{l1.toFixed(3)}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="font-inter text-xs" style={{ color: '#52796F' }}>λ₂</p>
              <p className="font-sora font-bold text-xl" style={{ color: '#EF4444' }}>{l2.toFixed(3)}</p>
            </div>
          </>
        ) : (
          <div className="rounded-xl p-3 text-center col-span-2" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <p className="font-inter text-xs" style={{ color: '#52796F' }}>Complex eigenvalues (rotation+scaling)</p>
            <p className="font-sora font-bold text-lg" style={{ color: '#8B5CF6' }}>{lComplexAngle.toFixed(2)} ± {Math.sqrt(Math.abs(discriminant) / 4).toFixed(2)}i</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[{ l: 'Trace', v: trace, c: '#8B5CF6' }, { l: 'Det', v: det.toFixed(2), c: '#1E3A5F' }].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl p-2 text-center" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <p className="font-inter text-xs" style={{ color: '#52796F' }}>{l}</p>
            <p className="font-sora font-bold text-lg" style={{ color: c }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { l: `a=${a}`, v: a, s: setA }, { l: `b=${b}`, v: b, s: setB },
          { l: `c=${c}`, v: c, s: setC }, { l: `d=${d}`, v: d, s: setD },
        ].map(({ l, v, s }) => (
          <div key={l} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{l}</label>
            <input type="range" min={-4} max={6} step={0.5} value={v} onChange={e => { s(+e.target.value); onEvent(`Matrix updated — trace=${a+d}, det=${(a*d-b*c).toFixed(1)}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={showVecs} onChange={e => setShowVecs(e.target.checked)} />
        <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Show eigenvectors</span>
      </label>
    </div>
  );
}
