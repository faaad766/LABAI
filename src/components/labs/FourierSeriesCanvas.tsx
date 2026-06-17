import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type WaveType = 'square' | 'sawtooth' | 'triangle';

function targetWave(type: WaveType, x: number): number {
  const t = ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (type === 'square') return t < Math.PI ? 1 : -1;
  if (type === 'sawtooth') return (t / Math.PI) - 1;
  return t < Math.PI ? (2 * t / Math.PI - 1) : (3 - 2 * t / Math.PI);
}

function fourierApprox(type: WaveType, x: number, terms: number): number {
  let sum = 0;
  for (let n = 1; n <= terms; n++) {
    if (type === 'square') {
      if (n % 2 !== 0) sum += (4 / (Math.PI * n)) * Math.sin(n * x);
    } else if (type === 'sawtooth') {
      sum += (2 / (Math.PI * n)) * (n % 2 === 0 ? -1 : 1) * Math.sin(n * x);
    } else {
      if (n % 2 !== 0) sum += (8 / (Math.PI * Math.PI * n * n)) * (n % 4 === 1 ? 1 : -1) * Math.sin(n * x);
    }
  }
  return sum;
}

export default function FourierSeriesCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveType, setWaveType] = useState<WaveType>('square');
  const [terms, setTerms] = useState(3);
  const stateRef = useRef({ waveType: 'square' as WaveType, terms: 3, t: 0, running: true });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      const padL = 30, padR = 20, padT = 40, padB = 40;
      const cW = W - padL - padR, cH = H - padT - padB;
      const xRange = 2 * Math.PI;
      const tx = (x: number) => padL + (x / xRange) * cW;
      const ty = (y: number) => padT + cH / 2 - (y / 1.5) * (cH / 2);

      // Grid
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, padT + cH / 2); ctx.lineTo(padL + cW, padT + cH / 2); ctx.stroke();

      // Target wave
      ctx.strokeStyle = 'rgba(27,67,50,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const x = (i / 400) * xRange;
        const y = targetWave(s.waveType, x);
        i === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
      }
      ctx.stroke(); ctx.setLineDash([]);

      // Fourier approximation
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const x = (i / 400) * xRange + s.t * 0.02;
        const y = fourierApprox(s.waveType, x, s.terms);
        i === 0 ? ctx.moveTo(tx((i / 400) * xRange), ty(y)) : ctx.lineTo(tx((i / 400) * xRange), ty(y));
      }
      ctx.stroke();

      // Individual harmonics (faint)
      for (let n = 1; n <= Math.min(s.terms, 5); n++) {
        ctx.strokeStyle = `rgba(27,67,50,${0.1 + n * 0.04})`; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = (i / 200) * xRange;
          let y = 0;
          if (s.waveType === 'square' && n % 2 !== 0) y = (4 / (Math.PI * n)) * Math.sin(n * x);
          else if (s.waveType === 'sawtooth') y = (2 / (Math.PI * n)) * (n % 2 === 0 ? -1 : 1) * Math.sin(n * x);
          else if (s.waveType === 'triangle' && n % 2 !== 0) y = (8 / (Math.PI * Math.PI * n * n)) * (n % 4 === 1 ? 1 : -1) * Math.sin(n * x);
          i === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        }
        ctx.stroke();
      }

      // X-axis ticks
      ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('0', padL, padT + cH / 2 + 16);
      ctx.fillText('π', tx(Math.PI), padT + cH / 2 + 16);
      ctx.fillText('2π', tx(2 * Math.PI), padT + cH / 2 + 16);
      ctx.textAlign = 'left';

      // Labels
      ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
      const waveNames: Record<WaveType, string> = { square: 'Square Wave', sawtooth: 'Sawtooth Wave', triangle: 'Triangle Wave' };
      ctx.fillText(`${waveNames[s.waveType]} — ${s.terms} harmonic${s.terms !== 1 ? 's' : ''}`, padL, padT - 10);
      ctx.fillStyle = '#78716C'; ctx.font = '600 11px Inter,sans-serif';
      ctx.fillText('— Target  — Fourier Approx', padL, padT + 6);

      if (s.running) s.t += 1;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={300} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 260 }} />
      <div className="flex gap-2 flex-wrap">
        {(['square', 'sawtooth', 'triangle'] as WaveType[]).map(w => (
          <button key={w} onClick={() => { setWaveType(w); stateRef.current.waveType = w; onEvent(`Selected ${w} wave target`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: waveType === w ? '#1B4332' : '#F0F7F3', color: waveType === w ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {w}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Number of harmonics: {terms}</label>
        <input type="range" min={1} max={20} value={terms}
          onChange={e => { setTerms(+e.target.value); stateRef.current.terms = +e.target.value; onEvent(`Added ${e.target.value} harmonics to Fourier series`); }}
          style={{ accentColor: '#F59E0B' }} className="w-full" />
      </div>
    </div>
  );
}
