import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function GravitationalOrbitsCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speed, setSpeed] = useState(5);
  const [mass, setMass] = useState(5);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ speed: 5, mass: 5, px: 0, py: 0, vx: 0, vy: 0, running: false, trail: [] as {x:number;y:number}[] });

  const resetOrbit = () => {
    const s = stateRef.current;
    s.px = 0; s.py = -150;
    s.vx = s.speed * 0.8; s.vy = 0;
    s.trail = [];
    onEvent(`Starting orbit: speed=${s.speed}, star mass=${s.mass}`);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;
    resetOrbit();

    function draw() {
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 0, W, H);

      // Stars background
      if (!('starsDrawn' in draw)) {
        // Draw once logic not needed, just redraw lightly
      }
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137 + 7) % W), sy = ((i * 251 + 11) % H);
        ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 5) * 0.06})`;
        ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
      }

      // Star (central body)
      const grd = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, s.mass * 3 + 10);
      grd.addColorStop(0, '#FEF08A'); grd.addColorStop(0.5, '#F59E0B'); grd.addColorStop(1, 'rgba(217,119,6,0)');
      ctx.beginPath(); ctx.arc(cx, cy, s.mass * 3 + 10, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.fillStyle = '#FDE68A'; ctx.font = '700 11px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ Star', cx, cy + s.mass * 3 + 22);
      ctx.textAlign = 'left';

      // Trail
      if (s.trail.length > 1) {
        ctx.beginPath();
        s.trail.forEach((p, i) => {
          const px = cx + p.x, py = cy + p.y;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.strokeStyle = 'rgba(96,165,250,0.3)'; ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      }

      // Planet
      const px = cx + s.px, py = cy + s.py;
      const pgrd = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, 9);
      pgrd.addColorStop(0, '#93C5FD'); pgrd.addColorStop(1, '#2563EB');
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = pgrd; ctx.fill();

      // Physics
      if (s.running) {
        const G = 500, M = s.mass * 8;
        const dx = -s.px, dy = -s.py;
        const r = Math.sqrt(dx * dx + dy * dy);
        const force = G * M / (r * r);
        s.vx += force * dx / r * 0.016;
        s.vy += force * dy / r * 0.016;
        s.px += s.vx * 0.016 * 30;
        s.py += s.vy * 0.016 * 30;
        s.trail.push({ x: s.px, y: s.py });
        if (s.trail.length > 300) s.trail.shift();
      }

      // Period (Kepler's 3rd)
      const r0 = 150;
      const T = 2 * Math.PI * Math.sqrt(r0 ** 3 / (500 * s.mass * 8));
      ctx.fillStyle = '#F1F5F9'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText(`Orbital period ≈ ${T.toFixed(1)} s`, 14, 24);
      ctx.fillText(`Orbit speed: ${s.speed}`, 14, 44);
      ctx.fillText(`Star mass: ${s.mass}`, 14, 64);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={340} className="w-full rounded-xl" style={{ maxHeight: 280 }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Orbital Speed: {speed}</label>
          <input type="range" min={2} max={10} value={speed}
            onChange={e => { stateRef.current.speed = +e.target.value; setSpeed(+e.target.value); resetOrbit(); onEvent(`Changed orbital speed to ${e.target.value}`); }}
            style={{ accentColor: '#2563EB' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Star Mass: {mass}</label>
          <input type="range" min={1} max={12} value={mass}
            onChange={e => { stateRef.current.mass = +e.target.value; setMass(+e.target.value); resetOrbit(); onEvent(`Changed star mass to ${e.target.value}`); }}
            style={{ accentColor: '#F59E0B' }} className="w-full" />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => { stateRef.current.running = !stateRef.current.running; setRunning(r => !r); if (!stateRef.current.running) {} else { resetOrbit(); } onEvent(stateRef.current.running ? 'Started orbit simulation' : 'Paused orbit'); }}
          className="flex-1 py-2.5 rounded-lg font-sora font-bold text-sm text-white"
          style={{ background: running ? '#92400E' : '#1B4332' }}>
          {running ? '⏸ Pause' : '▶ Start Orbit'}
        </button>
        <button onClick={() => { resetOrbit(); }}
          className="px-4 py-2.5 rounded-lg font-sora font-bold text-sm"
          style={{ background: '#EFF6FF', color: '#1E3A5F', border: '1px solid #BFDBFE' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
