import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function PendulumCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [length, setLength] = useState(200);
  const [angle, setAngle] = useState(30);
  const [running, setRunning] = useState(false);

  const stateRef = useRef({ theta: (angle * Math.PI) / 180, omega: 0, running: false, length, angle });
  stateRef.current.length = length;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const g = 9.8;
    const dt = 0.016;
    const s = stateRef.current;
    let frame = 0;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      const px = W / 2, py = 60;
      const L = s.length * (Math.min(W, H) / 480);
      const bx = px + L * Math.sin(s.theta);
      const by = py + L * Math.cos(s.theta);

      // Pivot
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#1B4332'; ctx.fill();

      // Rod
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by);
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5; ctx.stroke();

      // Bob
      const bobR = 16;
      const grd = ctx.createRadialGradient(bx - 4, by - 4, 2, bx, by, bobR);
      grd.addColorStop(0, '#F59E0B'); grd.addColorStop(1, '#D97706');
      ctx.beginPath(); ctx.arc(bx, by, bobR, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.strokeStyle = '#B45309'; ctx.lineWidth = 1.5; ctx.stroke();

      // Energy bars
      const maxKE = 0.5 * 1 * (g / (s.length / 100)) * Math.pow(s.theta, 2) * Math.pow(s.length / 100, 2);
      const KE = 0.5 * 1 * Math.pow(s.omega * (s.length / 100), 2);
      const PE = maxKE > 0 ? (maxKE - KE) : 0;
      const barW = 80, barH = 10, bx0 = W - 110, by0 = 20;

      ctx.fillStyle = '#1C1917'; ctx.font = '600 11px Inter,sans-serif';
      ctx.fillText('Energy', bx0, by0 - 6);

      ctx.fillStyle = '#E7E5E0'; ctx.fillRect(bx0, by0, barW, barH);
      ctx.fillStyle = '#F59E0B'; ctx.fillRect(bx0, by0, barW * Math.min(KE / Math.max(maxKE, 0.001), 1), barH);
      ctx.fillStyle = '#1C1917'; ctx.font = '500 10px Inter,sans-serif';
      ctx.fillText('KE', bx0 - 22, by0 + 8);

      ctx.fillStyle = '#E7E5E0'; ctx.fillRect(bx0, by0 + 14, barW, barH);
      ctx.fillStyle = '#1B4332'; ctx.fillRect(bx0, by0 + 14, barW * Math.min(PE / Math.max(maxKE, 0.001), 1), barH);
      ctx.fillText('PE', bx0 - 22, by0 + 22);

      // Labels
      const T = 2 * Math.PI * Math.sqrt((s.length / 100) / g);
      const freq = 1 / T;
      ctx.fillStyle = '#1C1917'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText(`Length: ${s.length} cm`, 14, 24);
      ctx.fillText(`Period: ${T.toFixed(2)} s`, 14, 42);
      ctx.fillText(`Freq: ${freq.toFixed(2)} Hz`, 14, 60);
      ctx.fillText(`Angle: ${((s.theta * 180) / Math.PI).toFixed(1)}°`, 14, 78);

      // Trajectory ghost arc
      ctx.beginPath();
      const arcStart = -Math.abs(stateRef.current.angle) * Math.PI / 180;
      const arcEnd = Math.abs(stateRef.current.angle) * Math.PI / 180;
      ctx.arc(px, py, L, Math.PI / 2 + arcStart, Math.PI / 2 + arcEnd);
      ctx.strokeStyle = 'rgba(245,158,11,0.15)'; ctx.lineWidth = 3; ctx.setLineDash([4, 4]);
      ctx.stroke(); ctx.setLineDash([]);

      if (s.running) {
        s.omega += (-g / (s.length / 100)) * Math.sin(s.theta) * dt;
        s.theta += s.omega * dt;
        frame++;
      }
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleStart = () => {
    const s = stateRef.current;
    if (!s.running) {
      s.theta = (stateRef.current.angle * Math.PI) / 180;
      s.omega = 0;
    }
    s.running = !s.running;
    setRunning(s.running);
    onEvent(s.running
      ? `Started pendulum oscillation: length=${length}cm, angle=${angle}°`
      : 'Paused pendulum');
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={380} className="w-full rounded-xl border" style={{ border: '1px solid #E7E5E0', background: '#FDFCF9', maxHeight: 340 }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Length: {length} cm</label>
          <input type="range" min={60} max={360} value={length}
            onChange={e => { stateRef.current.length = +e.target.value; setLength(+e.target.value); onEvent(`Changed pendulum length to ${e.target.value}cm`); }}
            className="w-full accent-forest" style={{ accentColor: '#1B4332' }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Start Angle: {angle}°</label>
          <input type="range" min={5} max={75} value={angle}
            onChange={e => { stateRef.current.angle = +e.target.value; stateRef.current.theta = (+e.target.value * Math.PI) / 180; setAngle(+e.target.value); onEvent(`Set initial angle to ${e.target.value}°`); }}
            className="w-full" style={{ accentColor: '#1B4332' }} />
        </div>
      </div>
      <button onClick={handleStart}
        className="px-5 py-2.5 rounded-lg font-sora font-bold text-sm text-white transition-all"
        style={{ background: running ? '#92400E' : '#1B4332', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        {running ? '⏸ Pause' : '▶ Start Oscillation'}
      </button>
    </div>
  );
}
