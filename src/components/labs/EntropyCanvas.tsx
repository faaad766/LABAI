import { useState, useEffect, useRef } from 'react';

export default function EntropyCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const [dH, setDH] = useState(-50);
  const [temp, setTemp] = useState(298);
  const [particles, setParticles] = useState<{ x: number; y: number; vx: number; vy: number; type: 0|1 }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  const dS = open ? 45 : 5;
  const dG = dH - (temp * dS / 1000);
  const spontaneous = dG < 0;

  const init = (isOpen: boolean) => {
    const ps = Array.from({ length: 40 }, (_, i) => ({
      x: isOpen ? Math.random() * 240 + 20 : (i < 20 ? Math.random() * 120 + 20 : Math.random() * 120 + 160),
      y: Math.random() * 140 + 30,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      type: (i < 20 ? 0 : 1) as 0|1,
    }));
    setParticles(ps);
  };

  useEffect(() => { init(false); }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = 180;
    let ps = [...particles];
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Container
      ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 3;
      ctx.strokeRect(10, 20, W - 20, H - 30);
      if (!open) {
        ctx.fillStyle = '#1C1917'; ctx.fillRect(W / 2 - 2, 20, 4, H - 30);
      }
      ctx.fillStyle = '#E7E5E0'; ctx.fillRect(W / 2 - 2, 20, 4, H - 30);
      if (!open) { ctx.fillStyle = '#1C1917'; ctx.fillRect(W / 2 - 2, 20, 4, H - 30); }
      else { ctx.fillStyle = 'rgba(34,197,94,0.3)'; ctx.fillRect(W / 2 - 4, 20, 8, H - 30); }

      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        const boundary = open ? { lo: 12, hi: W - 14 } : (p.type === 0 ? { lo: 12, hi: W / 2 - 4 } : { lo: W / 2 + 4, hi: W - 14 });
        if (p.x < boundary.lo || p.x > boundary.hi) { p.vx *= -1; p.x = Math.max(boundary.lo, Math.min(boundary.hi, p.x)); }
        if (p.y < 22 || p.y > H - 12) { p.vy *= -1; p.y = Math.max(22, Math.min(H - 12, p.y)); }
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.type === 0 ? '#3B82F6' : '#EF4444'; ctx.fill();
      });
      setParticles([...ps]);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [open]);

  const toggle = () => {
    const newOpen = !open;
    setOpen(newOpen);
    init(newOpen);
    onEvent(newOpen ? 'Partition removed — entropy increases as gases mix spontaneously (ΔS > 0)' : 'Partition replaced — gases separated, entropy decreased');
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={180} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0' }} />

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'ΔH (kJ/mol)', val: dH, color: dH < 0 ? '#22C55E' : '#EF4444' },
          { label: 'TΔS (kJ/mol)', val: (temp * dS / 1000).toFixed(1), color: '#3B82F6' },
          { label: 'ΔG = ΔH−TΔS', val: dG.toFixed(1), color: spontaneous ? '#22C55E' : '#EF4444' },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: '#F8FAFC', border: '1px solid #E7E5E0' }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{label}</p>
            <p className="font-sora font-bold text-lg" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-3 text-center" style={{ background: spontaneous ? '#F0FDF4' : '#FEF2F2', border: `2px solid ${spontaneous ? '#22C55E' : '#EF4444'}` }}>
        <p className="font-sora font-bold text-sm" style={{ color: spontaneous ? '#1B4332' : '#DC2626' }}>
          {spontaneous ? '✅ Spontaneous (ΔG < 0)' : '❌ Non-spontaneous (ΔG > 0)'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>ΔH: {dH} kJ/mol</label>
          <input type="range" min={-150} max={150} value={dH} onChange={e => { setDH(+e.target.value); onEvent(`ΔH changed to ${+e.target.value} kJ/mol`); }} style={{ accentColor: '#22C55E' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>T: {temp}K</label>
          <input type="range" min={100} max={1000} value={temp} onChange={e => { setTemp(+e.target.value); onEvent(`Temperature: ${+e.target.value}K`); }} style={{ accentColor: '#3B82F6' }} className="w-full" />
        </div>
      </div>

      <button onClick={toggle} className="py-3 rounded-xl text-sm font-sora font-bold"
        style={{ background: open ? '#EF4444' : '#22C55E', color: '#FFF' }}>
        {open ? '🔒 Replace Partition' : '🌀 Remove Partition (mix gases)'}
      </button>
    </div>
  );
}
