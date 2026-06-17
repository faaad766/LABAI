import { useState, useEffect, useRef } from 'react';

export default function WaveDiffractionCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [lambda, setLambda] = useState(500);
  const [slitWidth, setSlitWidth] = useState(2);
  const [slitSep, setSlitSep] = useState(5);
  const [type, setType] = useState<'single'|'double'>('double');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const rafRef = useRef<number>(0);

  const lambdaColor = lambda < 450 ? '#7C3AED' : lambda < 490 ? '#3B82F6' : lambda < 560 ? '#22C55E' : lambda < 590 ? '#F59E0B' : '#EF4444';
  const fringeSpacing = (lambda * 1e-9 * 1) / (slitSep * 1e-6) * 1000;

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      tRef.current += 0.05;
      const t = tRef.current;
      // Barrier
      ctx.fillStyle = '#374151'; ctx.fillRect(W / 2 - 4, 0, 8, H);
      // Slit(s)
      const cy = H / 2;
      const sw = slitWidth * 8;
      const ss = slitSep * 8;
      if (type === 'single') {
        ctx.clearRect(W / 2 - 4, cy - sw / 2, 8, sw);
        ctx.fillStyle = '#FAFAF9'; ctx.fillRect(W / 2 - 4, cy - sw / 2, 8, sw);
      } else {
        ctx.clearRect(W / 2 - 4, cy - ss / 2 - sw / 2, 8, sw);
        ctx.clearRect(W / 2 - 4, cy + ss / 2 - sw / 2, 8, sw);
        ctx.fillStyle = '#FAFAF9';
        ctx.fillRect(W / 2 - 4, cy - ss / 2 - sw / 2, 8, sw);
        ctx.fillRect(W / 2 - 4, cy + ss / 2 - sw / 2, 8, sw);
      }
      // Incoming waves (left)
      for (let i = 0; i < 6; i++) {
        const phase = ((t * 0.8 - i) % 1 + 1) % 1;
        const x = (W / 2 - 10) * phase;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H);
        ctx.strokeStyle = `rgba(${lambdaColor.replace('#','').match(/../g)!.map(h=>parseInt(h,16)).join(',')},0.3)`;
        ctx.lineWidth = 1.5; ctx.stroke();
      }
      // Diffraction pattern (right)
      const screenX = W - 60;
      for (let y = 0; y < H; y++) {
        const theta = Math.atan2(y - cy, screenX - W / 2);
        let intensity = 0;
        if (type === 'single') {
          const b = (Math.PI * slitWidth * 1e-6 * Math.sin(theta)) / (lambda * 1e-9);
          intensity = b === 0 ? 1 : Math.pow(Math.sin(b) / b, 2);
        } else {
          const a2 = (Math.PI * slitSep * 1e-6 * Math.sin(theta)) / (lambda * 1e-9);
          intensity = Math.pow(Math.cos(a2), 2);
        }
        const alpha = Math.min(1, intensity * 0.9);
        ctx.fillStyle = `rgba(${lambdaColor.replace('#','').match(/../g)!.map(h=>parseInt(h,16)).join(',')},${alpha})`;
        ctx.fillRect(screenX, y, 50, 1);
      }
      // Screen label
      ctx.fillStyle = '#1C1917'; ctx.font = '10px Inter,sans-serif'; ctx.fillText('Screen', screenX, 12);
      // Fringe spacing
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`Fringe spacing: ${fringeSpacing.toFixed(1)}mm`, 10, H - 8);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [lambda, slitWidth, slitSep, type, lambdaColor, fringeSpacing]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['single','double'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); onEvent(`${t === 'double' ? "Young's double slit" : 'Single slit'} diffraction — λ=${lambda}nm, slit ${slitWidth}μm`); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize"
            style={{ background: type === t ? '#3B82F6' : '#EFF6FF', color: type === t ? '#FFF' : '#1E3A5F', border: '1px solid #BFDBFE' }}>
            {t} slit
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={260} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', background: '#111' }} />
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `λ: ${lambda}nm`, val: lambda, min: 380, max: 700, set: (v: number) => { setLambda(v); onEvent(`Wavelength: ${v}nm`); } },
          { label: `Slit: ${slitWidth}μm`, val: slitWidth, min: 1, max: 10, set: (v: number) => { setSlitWidth(v); onEvent(`Slit width: ${v}μm`); } },
          { label: `Sep: ${slitSep}μm`, val: slitSep, min: 2, max: 20, set: (v: number) => { setSlitSep(v); onEvent(`Slit separation: ${v}μm — fringe spacing changes`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: lambdaColor } as React.CSSProperties} className="w-full" />
          </div>
        ))}
      </div>
      <p className="font-inter text-xs text-center" style={{ color: '#A8A29E' }}>λ = ax/D → fringe spacing x = λD/a = {fringeSpacing.toFixed(2)}mm</p>
    </div>
  );
}
