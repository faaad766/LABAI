import { useState, useRef, useEffect } from 'react';

export default function SpringOscillatorCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [k, setK] = useState(5); const [mass, setMass] = useState(1); const [damping, setDamping] = useState(0.1);
  const [running, setRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({ x: 1.5, v: 0, t: 0 });

  const omega = Math.sqrt(k / mass);
  const gammaRatio = damping / (2 * mass);
  const regime = gammaRatio < omega ? 'underdamped' : gammaRatio === omega ? 'critically damped' : 'overdamped';

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    const trailX: number[] = [];
    let lastEvent = '';

    const animate = () => {
      stateRef.current.t += 0.016;
      const dt = 0.016;
      const s = stateRef.current;
      const acc = (-k * s.x - damping * s.v) / mass;
      s.v += acc * dt; s.x += s.v * dt;

      // Emit events at turning points
      const evt = s.v > 0 ? `→` : `←`;
      if (evt !== lastEvent && Math.abs(s.x) > 0.1) {
        const amp = Math.abs(s.x);
        onEvent(`Spring oscillator: amplitude=${amp.toFixed(3)}m, freq=${omega.toFixed(2)}rad/s, regime: ${regime}`);
        lastEvent = evt;
      }

      ctx.clearRect(0, 0, W, H);
      const equilibX = 260, wallX = 20, massR = 22;
      const displayX = equilibX + s.x * 60;

      // Trail graph (right panel)
      trailX.push(s.x);
      if (trailX.length > 200) trailX.shift();
      ctx.fillStyle = '#F5F3FF'; ctx.fillRect(W - 210, 10, 200, H - 20);
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1; ctx.strokeRect(W - 210, 10, 200, H - 20);
      ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2;
      ctx.beginPath();
      trailX.forEach((x, i) => {
        const px = W - 210 + i, py = H / 2 - x * 25;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.strokeStyle = '#DDD6FE'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(W - 210, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#A8A29E'; ctx.font = '9px Inter,sans-serif';
      ctx.fillText('x(t)', W - 208, 24);

      // Wall
      ctx.fillStyle = '#78716C'; ctx.fillRect(wallX, 40, 8, H - 80);
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(wallX, 50 + i * 30); ctx.lineTo(wallX - 8, 60 + i * 30); ctx.stroke(); }

      // Spring (zigzag)
      const springLen = displayX - wallX - 8;
      const coils = 12;
      ctx.strokeStyle = '#F97316'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(wallX + 8, H / 2);
      for (let i = 0; i <= coils * 2; i++) {
        const sx = wallX + 8 + (springLen / (coils * 2)) * i;
        const sy = H / 2 + (i % 2 === 0 ? 0 : (i % 4 === 1 ? -12 : 12));
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Ground
      ctx.fillStyle = '#E7E5E0'; ctx.fillRect(wallX, H - 40, equilibX + 100, 4);

      // Mass block
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(displayX - massR, H / 2 - massR, massR * 2, massR * 2);
      ctx.strokeStyle = '#1E3A5F'; ctx.lineWidth = 2; ctx.strokeRect(displayX - massR, H / 2 - massR, massR * 2, massR * 2);
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${mass}kg`, displayX, H / 2 + 5); ctx.textAlign = 'left';

      // Equilibrium
      ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(equilibX, 40); ctx.lineTo(equilibX, H - 50); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#22C55E'; ctx.font = '9px Inter,sans-serif'; ctx.fillText('x=0', equilibX + 2, 52);

      // Labels
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`k=${k} N/m  m=${mass}kg  γ=${damping} Ns/m`, 30, 22);
      ctx.fillStyle = '#8B5CF6'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`ω₀=${omega.toFixed(2)} rad/s  x=${s.x.toFixed(3)}m  ${regime}`, 30, 38);

      if (running) rafRef.current = requestAnimationFrame(animate);
    };
    if (running) { rafRef.current = requestAnimationFrame(animate); }
    else {
      // Draw static initial state
      ctx.clearRect(0, 0, W, H);
      const equilibX = 260, wallX = 20, massR = 22;
      ctx.fillStyle = '#E7E5E0'; ctx.fillRect(wallX, H - 40, equilibX + 100, 4);
      ctx.fillStyle = '#78716C'; ctx.fillRect(wallX, 40, 8, H - 80);
      ctx.fillStyle = '#3B82F6'; ctx.fillRect(equilibX + 90 - massR, H / 2 - massR, massR * 2, massR * 2);
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${mass}kg`, equilibX + 90, H / 2 + 5); ctx.textAlign = 'left';
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`ω₀ = √(k/m) = ${omega.toFixed(3)} rad/s`, 30, 22);
      ctx.fillText(`Period T = ${(2 * Math.PI / omega).toFixed(3)} s  |  Regime: ${regime}`, 30, 38);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, k, mass, damping, omega, regime]);

  const toggle = () => {
    if (!running) { stateRef.current = { x: 1.5, v: 0, t: 0 }; }
    setRunning(r => !r);
    onEvent(running ? 'Stopped' : `Started: ω=${omega.toFixed(2)}, ${regime}`);
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={200} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-3 gap-3">
        {[{ l: `Spring k: ${k}`, v: k, s: setK, min: 1, max: 20 }, { l: `Mass: ${mass}kg`, v: mass, s: setMass, min: 0.5, max: 5 }, { l: `Damping γ: ${damping}`, v: damping, s: setDamping, min: 0, max: 5, step: 0.1 }].map(({ l, v, s, min, max, step }) => (
          <div key={l} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{l}</label>
            <input type="range" min={min} max={max} step={step ?? 0.5} value={v} onChange={e => { s(+e.target.value); onEvent(`${l.split(':')[0]}: ${+e.target.value}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
        ))}
      </div>
      <button onClick={toggle} className="py-3 rounded-xl text-sm font-sora font-bold"
        style={{ background: running ? '#EF4444' : '#8B5CF6', color: '#FFF' }}>
        {running ? '⏹ Stop' : '▶ Start Oscillation'}
      </button>
    </div>
  );
}
