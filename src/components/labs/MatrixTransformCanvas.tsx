import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function MatrixTransformCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(1); const [b, setB] = useState(0);
  const [c, setC] = useState(0); const [d, setD] = useState(1);
  const stateRef = useRef({ a: 1, b: 0, c: 0, d: 1, progress: 0, animating: false });

  const PRESETS = [
    { label: 'Identity', a: 1, b: 0, c: 0, d: 1 },
    { label: 'Rotate 90°', a: 0, b: -1, c: 1, d: 0 },
    { label: 'Scale 2×', a: 2, b: 0, c: 0, d: 2 },
    { label: 'Shear →', a: 1, b: 1, c: 0, d: 1 },
    { label: 'Reflect X', a: 1, b: 0, c: 0, d: -1 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2, scale = 80;
      const tx = (x: number, y: number): [number, number] => [cx + x * scale, cy - y * scale];

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy + i * scale); ctx.lineTo(W, cy + i * scale); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

      const t = Math.min(s.progress, 1);
      const ia = 1 + (s.a - 1) * t, ib = 0 + (s.b - 0) * t;
      const ic = 0 + (s.c - 0) * t, id = 1 + (s.d - 1) * t;

      const applyM = (x: number, y: number): [number, number] => [ia * x + ib * y, ic * x + id * y];

      // Unit square
      const squarePts: Array<[number, number]> = [[0, 0], [1, 0], [1, 1], [0, 1]];
      const transformed = squarePts.map(([x, y]) => applyM(x, y));

      // Original (ghost)
      ctx.strokeStyle = 'rgba(27,67,50,0.2)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      squarePts.forEach(([x, y], i) => {
        const [cx2, cy2] = tx(x, y);
        i === 0 ? ctx.moveTo(cx2, cy2) : ctx.lineTo(cx2, cy2);
      });
      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);

      // Transformed
      const fillGrd = ctx.createLinearGradient(...tx(0, 0), ...tx(s.a, s.c));
      fillGrd.addColorStop(0, 'rgba(245,158,11,0.2)'); fillGrd.addColorStop(1, 'rgba(27,67,50,0.2)');
      ctx.beginPath();
      transformed.forEach(([x, y], i) => {
        const [cx2, cy2] = tx(x, y);
        i === 0 ? ctx.moveTo(cx2, cy2) : ctx.lineTo(cx2, cy2);
      });
      ctx.closePath(); ctx.fillStyle = fillGrd; ctx.fill();
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2.5; ctx.stroke();

      // Basis vectors
      const [e1x, e1y] = applyM(1, 0);
      const [e2x, e2y] = applyM(0, 1);
      [[e1x, e1y, '#1B4332'], [e2x, e2y, '#F59E0B']].forEach(([ex, ey, col]) => {
        const [x0, y0] = tx(0, 0); const [x1, y1] = tx(ex as number, ey as number);
        ctx.strokeStyle = col as string; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const ang = Math.atan2(-(ey as number), ex as number);
        ctx.fillStyle = col as string;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 10 * Math.cos(ang - 0.4), y1 - 10 * Math.sin(ang - 0.4));
        ctx.lineTo(x1 - 10 * Math.cos(ang + 0.4), y1 - 10 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      });

      // Stats
      const det = s.a * s.d - s.b * s.c;
      ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(`[${s.a}  ${s.b}]`, 14, 30);
      ctx.fillText(`[${s.c}  ${s.d}]`, 14, 50);
      ctx.fillText(`det = ${det.toFixed(2)}`, 14, 72);
      const tr = s.a + s.d;
      ctx.fillText(`trace = ${tr.toFixed(2)}`, 14, 92);

      if (s.animating && s.progress < 1) s.progress += 0.025;

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const apply = () => { stateRef.current.progress = 0; stateRef.current.animating = true; onEvent(`Applied matrix [[${a},${b}],[${c},${d}]] — det=${(a * d - b * c).toFixed(2)}`); };

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={340} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 290 }} />
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => {
            setA(p.a); setB(p.b); setC(p.c); setD(p.d);
            stateRef.current.a = p.a; stateRef.current.b = p.b;
            stateRef.current.c = p.c; stateRef.current.d = p.d;
            stateRef.current.progress = 0; stateRef.current.animating = true;
            onEvent(`Applied ${p.label} matrix`);
          }}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: '#F0F7F3', color: '#1B4332', border: '1px solid #BBF7D0' }}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[{ label: 'a', val: a, set: setA, key: 'a' as const }, { label: 'b', val: b, set: setB, key: 'b' as const },
          { label: 'c', val: c, set: setC, key: 'c' as const }, { label: 'd', val: d, set: setD, key: 'd' as const }].map(({ label, val, set, key }) => (
          <div key={key} className="flex flex-col gap-1 items-center">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label} = {val}</label>
            <input type="range" min={-3} max={3} step={0.5} value={val}
              onChange={e => { set(+e.target.value); stateRef.current[key] = +e.target.value; }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        ))}
      </div>
      <button onClick={apply} className="py-2.5 rounded-lg font-sora font-bold text-sm text-white"
        style={{ background: '#1B4332' }}>
        ▶ Apply Transformation
      </button>
    </div>
  );
}
