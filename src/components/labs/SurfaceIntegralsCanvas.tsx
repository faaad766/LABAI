import { useState, useEffect, useRef } from 'react';

type SurfaceType = 'paraboloid' | 'saddle' | 'sphere';
export default function SurfaceIntegralsCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [surface, setSurface] = useState<SurfaceType>('paraboloid');
  const [time, setTime] = useState(0);
  const [gridN, setGridN] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const FNS: Record<SurfaceType, { f: (u: number, v: number) => [number, number, number]; label: string; integral: string }> = {
    paraboloid: { f: (u, v) => [u, v, u * u + v * v], label: 'z = x² + y²', integral: '∫∫ f dS over paraboloid' },
    saddle: { f: (u, v) => [u, v, u * u - v * v], label: 'z = x² - y² (saddle)', integral: '∫∫ f dS over saddle' },
    sphere: { f: (u, v) => [Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)], label: 'Unit sphere', integral: '∫∫ 1 dS = 4π ≈ 12.57' },
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    let prev = performance.now();
    let t = time;
    const draw = (now: number) => {
      t += (now - prev) / 2000; prev = now;
      setTime(t);
      ctx.clearRect(0, 0, W, H);
      const { f } = FNS[surface];
      const N = gridN;
      const cx = W / 2, cy = H / 2 + 30, scale = surface === 'sphere' ? 90 : 50;
      const cosT = Math.cos(t * 0.5), sinT = Math.sin(t * 0.5);
      const project = (x: number, y: number, z: number) => {
        const rx = x * cosT - z * sinT;
        const rz = x * sinT + z * cosT;
        return { px: cx + (rx - y * 0.5) * scale, py: cy - (rz + y * 0.3) * scale, depth: rz };
      };
      const range = surface === 'sphere' ? Math.PI : 2;
      const step = (surface === 'sphere' ? Math.PI * 2 : range * 2) / N;
      const stepV = (surface === 'sphere' ? Math.PI : range * 2) / N;
      const quads: { pts: {px:number;py:number}[]; depth: number; u: number; v: number }[] = [];
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const u1 = surface === 'sphere' ? j * stepV : -range + j * (2 * range / N);
          const u2 = surface === 'sphere' ? (j + 1) * stepV : -range + (j + 1) * (2 * range / N);
          const v1 = surface === 'sphere' ? i * step : -range + i * (2 * range / N);
          const v2 = surface === 'sphere' ? (i + 1) * step : -range + (i + 1) * (2 * range / N);
          const p00 = project(...f(u1, v1));
          const p10 = project(...f(u2, v1));
          const p11 = project(...f(u2, v2));
          const p01 = project(...f(u1, v2));
          quads.push({ pts: [p00, p10, p11, p01], depth: (p00.depth + p10.depth + p11.depth + p01.depth) / 4, u: (u1 + u2) / 2, v: (v1 + v2) / 2 });
        }
      }
      quads.sort((a, b) => a.depth - b.depth);
      quads.forEach(q => {
        const hue = surface === 'paraboloid' ? 250 : surface === 'saddle' ? 130 : 210;
        const lightness = 40 + (q.depth + 1.5) * 15;
        ctx.fillStyle = `hsl(${hue},60%,${Math.max(20, Math.min(75, lightness))}%)`;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(q.pts[0].px, q.pts[0].py);
        q.pts.slice(1).forEach(p => ctx.lineTo(p.px, p.py));
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 12px Inter,sans-serif';
      ctx.fillText(FNS[surface].label, 10, 18);
      ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#52796F';
      ctx.fillText(FNS[surface].integral, 10, H - 8);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [surface, gridN]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['paraboloid','saddle','sphere'] as SurfaceType[]).map(s => (
          <button key={s} onClick={() => { setSurface(s); onEvent(`Surface: ${FNS[s].label} — ${FNS[s].integral}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: surface === s ? '#8B5CF6' : '#F5F3FF', color: surface === s ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {s}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={280} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#F8FAFC' }} />
      <div className="flex flex-col gap-1">
        <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Grid resolution: {gridN}</label>
        <input type="range" min={8} max={30} value={gridN} onChange={e => { setGridN(+e.target.value); onEvent(`Grid: ${+e.target.value}×${+e.target.value} — surface approximated with ${(+e.target.value)**2} patches`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
      </div>
      <div className="rounded-xl p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
        <p className="font-inter text-xs font-semibold" style={{ color: '#4C1D95' }}>Surface Integral:</p>
        <p className="font-mono text-xs mt-1" style={{ color: '#1C1917' }}>{FNS[surface].integral}</p>
        <p className="font-inter text-xs mt-1" style={{ color: '#78716C' }}>∫∫_S f dS = ∫∫_D f(r(u,v)) |rᵤ × rᵥ| dA</p>
      </div>
    </div>
  );
}
