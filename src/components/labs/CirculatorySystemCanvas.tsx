import { useState, useEffect, useRef } from 'react';

export default function CirculatorySystemCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [beating, setBeating] = useState(false);
  const [hr, setHr] = useState(72);
  const [phase, setPhase] = useState(0); // 0=diastole, 1=systole
  const [beat, setBeat] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const iv = beating ? setInterval(() => {
      setPhase(p => { const n = (p + 1) % 4; if (n === 1) { setBeat(b => b + 1); onEvent(`Heartbeat #${beat + 1}: ventricular systole — blood ejected to lungs and body at ${hr} BPM`); } return n; });
    }, 60000 / hr / 4) : null;
    return () => { if (iv) clearInterval(iv); };
  }, [beating, hr, beat, onEvent]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      tRef.current += 0.05;
      const t = tRef.current;
      const expand = beating ? Math.sin(t * (hr / 20)) * 8 : 0;
      // Heart shape
      const cx = W / 2, cy = H / 2 - 20;
      ctx.save(); ctx.translate(cx, cy);
      ctx.scale(1 + expand * 0.01, 1 + expand * 0.01);
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.01) {
        const x = 16 * Math.pow(Math.sin(a), 3);
        const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        a === 0 ? ctx.moveTo(x * 5, y * 5) : ctx.lineTo(x * 5, y * 5);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
      grad.addColorStop(0, '#EF4444'); grad.addColorStop(1, '#991B1B');
      ctx.fillStyle = grad; ctx.fill();
      // Chambers
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-55, -10, 48, 50); // right
      ctx.fillRect(7, -10, 48, 50); // left
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 9px Inter,sans-serif';
      ctx.fillText('RV', -38, 20); ctx.fillText('LV', 24, 20);
      ctx.fillText('RA', -38, -20); ctx.fillText('LA', 24, -20);
      ctx.restore();
      // Aorta
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(cx + 7, cy - 65); ctx.bezierCurveTo(cx + 50, cy - 100, cx + 80, cy - 60, cx + 80, cy - 20); ctx.stroke();
      // Pulmonary
      ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx - 7, cy - 65); ctx.bezierCurveTo(cx - 50, cy - 100, cx - 80, cy - 60, cx - 80, cy - 20); ctx.stroke();
      // Oxygenated blood color
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx + 80, cy - 20); ctx.lineTo(cx + 80, cy + 80); ctx.stroke();
      ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - 80, cy - 20); ctx.lineTo(cx - 80, cy + 80); ctx.stroke();
      // Labels
      ctx.fillStyle = '#EF4444'; ctx.font = '10px Inter,sans-serif'; ctx.fillText('Oxygenated', cx + 55, cy + 95);
      ctx.fillStyle = '#3B82F6'; ctx.fillText('Deoxygenated', cx - 100, cy + 95);
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 12px Inter,sans-serif';
      ctx.fillText(`${hr} BPM | Beat: ${beat}`, cx - 40, H - 10);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [beating, hr, beat]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={300} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', background: '#FFF5F5' }} />
      <div>
        <label className="font-inter text-xs font-semibold block mb-1" style={{ color: '#1C1917' }}>Heart Rate: {hr} BPM</label>
        <input type="range" min={40} max={180} value={hr} onChange={e => { setHr(+e.target.value); onEvent(`Heart rate changed to ${+e.target.value} BPM`); }} style={{ accentColor: '#EF4444' }} className="w-full" />
        <div className="flex justify-between text-xs font-inter mt-0.5" style={{ color: '#A8A29E' }}>
          <span>Bradycardia (40)</span><span>Normal (72)</span><span>Tachycardia (180)</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setBeating(b => !b); onEvent(beating ? 'Heart stopped' : 'Heart started beating'); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: beating ? '#EF4444' : '#DC2626', color: '#FFF' }}>
          {beating ? '⏸ Stop Heart' : '❤️ Start Heart'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-inter">
        <div className="rounded-lg p-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <span className="font-semibold" style={{ color: '#DC2626' }}>Right side:</span>
          <p style={{ color: '#78716C' }}>Receives deoxygenated blood → pumps to lungs</p>
        </div>
        <div className="rounded-lg p-2" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <span className="font-semibold" style={{ color: '#1E3A5F' }}>Left side:</span>
          <p style={{ color: '#78716C' }}>Receives oxygenated blood → pumps to body</p>
        </div>
      </div>
    </div>
  );
}
