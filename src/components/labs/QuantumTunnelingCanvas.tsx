import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function QuantumTunnelingCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [energy, setEnergy] = useState(60);
  const [barrierH, setBarrierH] = useState(100);
  const [barrierW, setBarrierW] = useState(40);
  const stateRef = useRef({ energy: 60, barrierH: 100, barrierW: 40, t: 0, launched: false });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 0, W, H);

      const barrierX = W / 2 - s.barrierW / 2;
      const barrierTop = H - s.barrierH * 1.5;

      // Barrier
      const barGrd = ctx.createLinearGradient(barrierX, 0, barrierX + s.barrierW, 0);
      barGrd.addColorStop(0, 'rgba(239,68,68,0.8)');
      barGrd.addColorStop(1, 'rgba(239,68,68,0.4)');
      ctx.fillStyle = barGrd;
      ctx.fillRect(barrierX, barrierTop, s.barrierW, H - barrierTop);

      // Barrier label
      ctx.fillStyle = '#FCA5A5'; ctx.font = '600 11px Inter,sans-serif';
      ctx.fillText(`Barrier V₀=${s.barrierH}`, barrierX + s.barrierW / 2 - 30, barrierTop - 8);

      // Transmission coefficient (WKB approx simplified)
      const kappa = Math.sqrt(Math.max(0, s.barrierH - s.energy)) * 0.05;
      const T = Math.exp(-2 * kappa * s.barrierW * 0.1);
      const TPercent = Math.min(100, T * 100);

      // Wave function before barrier
      const k = Math.sqrt(s.energy) * 0.1;
      const waveH = Math.min(70, s.energy * 0.5);

      // Incident region
      ctx.strokeStyle = '#60A5FA'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 20; x < barrierX; x += 2) {
        const phase = k * x - s.t * 3;
        const amp = waveH * (0.6 + 0.4 * Math.sin(s.t * 2 - x * 0.02));
        const y = H / 2 - amp * Math.sin(phase);
        x === 20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Inside barrier — evanescent / tunneling wave (exponentially decaying)
      if (s.energy < s.barrierH) {
        ctx.strokeStyle = `rgba(248,113,113,0.7)`; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = barrierX; x < barrierX + s.barrierW; x += 2) {
          const decay = Math.exp(-kappa * (x - barrierX) * 0.2);
          const y = H / 2 - waveH * decay * Math.sin(s.t * 3 - x * 0.05);
          x === barrierX ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Transmitted region
      ctx.strokeStyle = '#34D399'; ctx.lineWidth = 2.5; ctx.globalAlpha = Math.max(0.05, T);
      ctx.beginPath();
      for (let x = barrierX + s.barrierW; x < W - 20; x += 2) {
        const phase = k * x - s.t * 3;
        const y = H / 2 - waveH * T * Math.sin(phase);
        x === barrierX + s.barrierW ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.globalAlpha = 1;

      // Energy line
      const energyY = H - s.energy * 1.5;
      ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 1.5; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(20, energyY); ctx.lineTo(W - 20, energyY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#FBBF24'; ctx.font = '600 11px Inter,sans-serif';
      ctx.fillText(`E = ${s.energy}`, W - 60, energyY - 5);

      // Stats
      ctx.fillStyle = '#F1F5F9'; ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(`Particle Energy: ${s.energy}`, 14, 24);
      ctx.fillText(`Barrier Height: ${s.barrierH}`, 14, 44);
      ctx.fillText(`Barrier Width: ${s.barrierW}`, 14, 64);
      ctx.fillStyle = s.energy >= s.barrierH ? '#34D399' : '#60A5FA';
      ctx.fillText(s.energy >= s.barrierH ? `Classical pass-through` : `Tunneling T ≈ ${TPercent.toFixed(1)}%`, 14, 86);

      s.t += 0.06;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={320} className="w-full rounded-xl" style={{ maxHeight: 260 }} />
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `Particle Energy: ${energy}`, val: energy, set: setEnergy, key: 'energy' as const, min: 10, max: 150, color: '#FBBF24' },
          { label: `Barrier Height: ${barrierH}`, val: barrierH, set: setBarrierH, key: 'barrierH' as const, min: 30, max: 180, color: '#EF4444' },
          { label: `Barrier Width: ${barrierW}`, val: barrierW, set: setBarrierW, key: 'barrierW' as const, min: 10, max: 120, color: '#F97316' },
        ].map(({ label, val, set, key, min, max, color }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val}
              onChange={e => { stateRef.current[key] = +e.target.value; set(+e.target.value); onEvent(`Changed ${key} to ${e.target.value}`); }}
              style={{ accentColor: color }} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
