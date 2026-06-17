import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function DopplerEffectCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceSpeed, setSourceSpeed] = useState(100);
  const [sourceFreq, setSourceFreq] = useState(440);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ sourceSpeed: 100, sourceFreq: 440, running: false, sourceX: 80, waves: [] as {x:number;r:number;alpha:number}[], t: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;
    const soundSpeed = 340;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      // Road
      ctx.fillStyle = '#4B5563'; ctx.fillRect(0, H / 2 - 14, W, 28);
      ctx.strokeStyle = '#FEF9C3'; ctx.lineWidth = 2; ctx.setLineDash([20, 20]);
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.setLineDash([]);

      // Observer (stationary)
      const obsX = W - 80, obsY = H / 2 - 30;
      ctx.fillStyle = '#1B4332';
      ctx.beginPath(); ctx.arc(obsX, obsY, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1C1917'; ctx.font = '600 11px Inter,sans-serif';
      ctx.fillText('Observer', obsX - 25, obsY - 16);

      // Wavefronts
      s.waves.forEach(w => {
        ctx.strokeStyle = `rgba(37,99,235,${w.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(w.x, H / 2, w.r, 0, Math.PI * 2); ctx.stroke();
        w.r += 3; w.alpha -= 0.006;
      });
      s.waves = s.waves.filter(w => w.alpha > 0);

      // Source (moving car)
      const carW = 40, carH = 18;
      const carX = s.sourceX, carY = H / 2 - carH / 2;
      ctx.fillStyle = '#F59E0B'; ctx.fillRect(carX - carW / 2, carY, carW, carH);
      ctx.fillStyle = '#92400E'; ctx.fillRect(carX - carW / 2 + 5, carY - 8, carW - 10, 10);

      // Doppler calculations
      const vs = s.sourceSpeed;
      const v = soundSpeed;
      const f0 = s.sourceFreq;
      const fObsApproach = f0 * v / (v - vs);
      const fObsRecede = f0 * v / (v + vs);
      const dx = obsX - s.sourceX;
      const approaching = dx > 0;
      const fObs = approaching ? fObsApproach : fObsRecede;

      ctx.fillStyle = '#1C1917'; ctx.font = '700 12px Inter,sans-serif';
      ctx.fillText(`Source freq: ${s.sourceFreq} Hz`, 14, 24);
      ctx.fillText(`Source speed: ${s.sourceSpeed} m/s`, 14, 44);
      ctx.fillStyle = approaching ? '#1B4332' : '#92400E';
      ctx.fillText(`Observed: ${fObs.toFixed(0)} Hz (${approaching ? '↑ higher — approaching' : '↓ lower — receding'})`, 14, 64);
      ctx.fillStyle = '#1C1917';
      ctx.fillText(`Sound speed: 340 m/s`, 14, 84);

      if (s.running) {
        s.sourceX += s.sourceSpeed * 0.03;
        s.t += 1;
        if (s.t % 8 === 0) s.waves.push({ x: s.sourceX, r: 0, alpha: 0.8 });
        if (s.sourceX > W + 60) s.sourceX = -60;
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={320} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 260 }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Source Speed: {sourceSpeed} m/s</label>
          <input type="range" min={10} max={300} value={sourceSpeed}
            onChange={e => { stateRef.current.sourceSpeed = +e.target.value; setSourceSpeed(+e.target.value); onEvent(`Changed source speed to ${e.target.value} m/s`); }}
            style={{ accentColor: '#F59E0B' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Source Frequency: {sourceFreq} Hz</label>
          <input type="range" min={200} max={800} value={sourceFreq}
            onChange={e => { stateRef.current.sourceFreq = +e.target.value; setSourceFreq(+e.target.value); onEvent(`Changed source frequency to ${e.target.value} Hz`); }}
            style={{ accentColor: '#2563EB' }} className="w-full" />
        </div>
      </div>
      <button onClick={() => { stateRef.current.running = !stateRef.current.running; setRunning(r => !r); onEvent(stateRef.current.running ? 'Started Doppler animation' : 'Paused'); }}
        className="px-5 py-2.5 rounded-lg font-sora font-bold text-sm text-white"
        style={{ background: running ? '#92400E' : '#1B4332' }}>
        {running ? '⏸ Pause' : '▶ Start Motion'}
      </button>
    </div>
  );
}
