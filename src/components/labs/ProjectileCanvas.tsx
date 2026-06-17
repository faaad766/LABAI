import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function ProjectileCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(60);
  const stateRef = useRef({ angle: 45, speed: 60, x: 0, y: 0, vx: 0, vy: 0, launched: false, trail: [] as {x:number;y:number}[], done: false });

  const launch = () => {
    const s = stateRef.current;
    const rad = s.angle * Math.PI / 180;
    s.vx = s.speed * Math.cos(rad);
    s.vy = -s.speed * Math.sin(rad);
    s.x = 40; s.y = 0;
    s.trail = [];
    s.launched = true; s.done = false;
    onEvent(`Launched projectile at angle=${s.angle}°, speed=${s.speed} m/s`);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;
    const g = 9.8, dt = 0.06;
    const scaleX = 5, scaleY = 4;

    function draw() {
      const W = canvas.width, H = canvas.height;
      const groundY = H - 40;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, '#EFF6FF'); sky.addColorStop(1, '#FDFCF9');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, groundY);

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY); ctx.stroke(); }
      for (let y = 0; y < groundY; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Ground
      ctx.fillStyle = '#52796F'; ctx.fillRect(0, groundY, W, H - groundY);
      ctx.fillStyle = '#2D6A4F'; ctx.fillRect(0, groundY, W, 4);

      // Cannon
      ctx.save();
      ctx.translate(40, groundY);
      ctx.rotate(-(s.angle * Math.PI / 180));
      ctx.fillStyle = '#1B4332'; ctx.fillRect(0, -5, 36, 10); ctx.restore();

      const toCanvasX = (wx: number) => 40 + wx * scaleX;
      const toCanvasY = (wy: number) => groundY - wy * scaleY;

      // Trail
      if (s.trail.length > 1) {
        ctx.beginPath();
        s.trail.forEach((p, i) => {
          const cx = toCanvasX(p.x), cy = toCanvasY(p.y);
          i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
        });
        ctx.strokeStyle = 'rgba(245,158,11,0.5)'; ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      }

      if (s.launched && !s.done) {
        const cx = toCanvasX(s.x), cy = toCanvasY(s.y);
        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B'; ctx.fill();
        ctx.strokeStyle = '#D97706'; ctx.lineWidth = 2; ctx.stroke();

        // Velocity vectors
        const vscale = 1.2;
        ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s.vx * vscale, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + s.vy * vscale); ctx.stroke();

        s.trail.push({ x: s.x, y: s.y });
        s.vy += g * dt; s.x += s.vx * dt; s.y -= s.vy * dt;
        if (s.y <= 0 && s.vy > 0) { s.y = 0; s.done = true; }
      }

      // Stats
      const rad = s.angle * Math.PI / 180;
      const v0 = s.speed;
      const totalT = (2 * v0 * Math.sin(rad)) / g;
      const maxH = (v0 * Math.sin(rad)) ** 2 / (2 * g);
      const range = v0 ** 2 * Math.sin(2 * rad) / g;

      ctx.fillStyle = '#1C1917'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText(`Angle: ${s.angle}°`, 14, 20);
      ctx.fillText(`Speed: ${s.speed} m/s`, 14, 38);
      ctx.fillText(`Range: ${range.toFixed(1)} m`, 14, 56);
      ctx.fillText(`Max Height: ${maxH.toFixed(1)} m`, 14, 74);
      ctx.fillText(`Flight Time: ${totalT.toFixed(2)} s`, 14, 92);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={360} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 300 }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Launch Angle: {angle}°</label>
          <input type="range" min={5} max={85} value={angle}
            onChange={e => { setAngle(+e.target.value); stateRef.current.angle = +e.target.value; onEvent(`Set launch angle to ${e.target.value}°`); }}
            style={{ accentColor: '#1B4332' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Initial Speed: {speed} m/s</label>
          <input type="range" min={20} max={100} value={speed}
            onChange={e => { setSpeed(+e.target.value); stateRef.current.speed = +e.target.value; onEvent(`Set initial speed to ${e.target.value} m/s`); }}
            style={{ accentColor: '#1B4332' }} className="w-full" />
        </div>
      </div>
      <button onClick={launch} className="px-5 py-2.5 rounded-lg font-sora font-bold text-sm text-white"
        style={{ background: '#1B4332', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        🚀 Launch Projectile
      </button>
    </div>
  );
}
