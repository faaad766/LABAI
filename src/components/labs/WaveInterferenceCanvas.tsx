import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function WaveInterferenceCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [freq1, setFreq1] = useState(2);
  const [freq2, setFreq2] = useState(2);
  const [amp1, setAmp1] = useState(40);
  const [amp2, setAmp2] = useState(40);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ freq1: 2, freq2: 2, amp1: 40, amp2: 40, running: false, t: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.05)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Center line
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

      // Wave 1
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 - s.amp1 * Math.sin(2 * Math.PI * s.freq1 * x / W + s.t);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(27,67,50,0.5)'; ctx.lineWidth = 2; ctx.stroke();

      // Wave 2
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 - s.amp2 * Math.sin(2 * Math.PI * s.freq2 * x / W + s.t * 1.2);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(245,158,11,0.5)'; ctx.lineWidth = 2; ctx.stroke();

      // Resultant wave
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y1 = s.amp1 * Math.sin(2 * Math.PI * s.freq1 * x / W + s.t);
        const y2 = s.amp2 * Math.sin(2 * Math.PI * s.freq2 * x / W + s.t * 1.2);
        const yr = H / 2 - (y1 + y2);
        x === 0 ? ctx.moveTo(x, yr) : ctx.lineTo(x, yr);
      }
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5; ctx.stroke();

      // Labels
      ctx.fillStyle = '#1C1917'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText('Wave 1 (green)', 14, 20);
      ctx.fillText('Wave 2 (amber)', 14, 38);
      ctx.fillText('Resultant (dark)', 14, 56);

      // Interference type
      const phaseDiff = Math.abs(s.freq1 - s.freq2);
      const type = phaseDiff < 0.5 ? 'Constructive ✓' : 'Mixed Interference';
      ctx.fillStyle = phaseDiff < 0.5 ? '#1B4332' : '#92400E';
      ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(type, W - 180, 24);

      if (s.running) s.t += 0.04;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={280} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', background: '#FDFCF9', maxHeight: 280 }} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Freq 1', val: freq1, set: setFreq1, key: 'freq1' as const, color: 'green' },
          { label: 'Freq 2', val: freq2, set: setFreq2, key: 'freq2' as const, color: 'amber' },
          { label: 'Amp 1', val: amp1, set: setAmp1, key: 'amp1' as const, min: 10, max: 70, color: 'green' },
          { label: 'Amp 2', val: amp2, set: setAmp2, key: 'amp2' as const, min: 10, max: 70, color: 'amber' },
        ].map(({ label, val, set, key, min = 1, max = 6, color }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}: {val}</label>
            <input type="range" min={min} max={max} value={val}
              style={{ accentColor: color === 'green' ? '#1B4332' : '#F59E0B' }}
              onChange={e => {
                stateRef.current[key] = +e.target.value;
                set(+e.target.value);
                onEvent(`Changed ${label} to ${e.target.value}`);
              }} className="w-full" />
          </div>
        ))}
      </div>
      <button onClick={() => { stateRef.current.running = !stateRef.current.running; setRunning(r => !r); onEvent(stateRef.current.running ? 'Started wave animation' : 'Paused waves'); }}
        className="px-5 py-2.5 rounded-lg font-sora font-bold text-sm text-white"
        style={{ background: running ? '#92400E' : '#1B4332' }}>
        {running ? '⏸ Pause' : '▶ Animate Waves'}
      </button>
    </div>
  );
}
