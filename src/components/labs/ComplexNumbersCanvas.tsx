import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function ComplexNumbersCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a1, setA1] = useState(2); const [b1, setB1] = useState(1);
  const [a2, setA2] = useState(1); const [b2, setB2] = useState(2);
  const [op, setOp] = useState<'add' | 'mul'>('add');
  const stateRef = useRef({ a1: 2, b1: 1, a2: 1, b2: 2, op: 'add' as 'add' | 'mul' });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2, scale = 50;
      const tx = (re: number) => cx + re * scale;
      const ty = (im: number) => cy - im * scale;

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath(); ctx.moveTo(tx(i), 0); ctx.lineTo(tx(i), H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, ty(i)); ctx.lineTo(W, ty(i)); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
      ctx.fillStyle = '#78716C'; ctx.font = '11px Inter,sans-serif';
      ctx.fillText('Re', W - 24, cy - 6); ctx.fillText('Im', cx + 6, 16);

      // Tick labels
      ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      for (let i = -4; i <= 4; i++) {
        if (i !== 0) {
          ctx.fillText(String(i), tx(i), cy + 14);
          ctx.fillText(String(i) + 'i', cx - 14, ty(i) + 4);
        }
      }
      ctx.textAlign = 'left';

      const drawVec = (re: number, im: number, color: string, label: string) => {
        const x1 = cx, y1 = cy, x2 = tx(re), y2 = ty(im);
        ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        // Arrowhead
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 10 * Math.cos(ang - 0.4), y2 - 10 * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - 10 * Math.cos(ang + 0.4), y2 - 10 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
        // Dot + label
        ctx.beginPath(); ctx.arc(x2, y2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1C1917'; ctx.font = '700 11px Inter,sans-serif';
        ctx.fillText(label, x2 + 8, y2 - 8);
        // Arc for argument
        const mod = Math.sqrt(re * re + im * im);
        if (mod > 0.5) {
          ctx.strokeStyle = color + '55'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(cx, cy, 20, 0, -Math.atan2(im, re), im < 0); ctx.stroke();
        }
      };

      // z1
      drawVec(s.a1, s.b1, '#1B4332', `z₁=${s.a1}+${s.b1}i`);
      drawVec(s.a2, s.b2, '#2563EB', `z₂=${s.a2}+${s.b2}i`);

      // Result
      let ra = 0, rb = 0, opLabel = '';
      if (s.op === 'add') {
        ra = s.a1 + s.a2; rb = s.b1 + s.b2;
        opLabel = `z₁+z₂ = ${ra}+${rb}i`;
      } else {
        ra = s.a1 * s.a2 - s.b1 * s.b2;
        rb = s.a1 * s.b2 + s.b1 * s.a2;
        opLabel = `z₁×z₂ = ${ra}+${rb}i`;
      }
      drawVec(ra, rb, '#F59E0B', opLabel);

      // Stats
      const mod1 = Math.sqrt(s.a1 ** 2 + s.b1 ** 2);
      const mod2 = Math.sqrt(s.a2 ** 2 + s.b2 ** 2);
      const arg1 = (Math.atan2(s.b1, s.a1) * 180 / Math.PI).toFixed(1);
      const arg2 = (Math.atan2(s.b2, s.a2) * 180 / Math.PI).toFixed(1);
      ctx.fillStyle = '#1C1917'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText(`|z₁| = ${mod1.toFixed(2)}, ∠ = ${arg1}°`, 10, 20);
      ctx.fillText(`|z₂| = ${mod2.toFixed(2)}, ∠ = ${arg2}°`, 10, 38);
      ctx.fillStyle = '#D97706';
      ctx.fillText(opLabel, 10, H - 12);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={340} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 290 }} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: `z₁ real: ${a1}`, val: a1, set: setA1, key: 'a1' as const },
          { label: `z₁ imag: ${b1}i`, val: b1, set: setB1, key: 'b1' as const },
          { label: `z₂ real: ${a2}`, val: a2, set: setA2, key: 'a2' as const },
          { label: `z₂ imag: ${b2}i`, val: b2, set: setB2, key: 'b2' as const },
        ].map(({ label, val, set, key }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={-4} max={4} step={0.5} value={val}
              onChange={e => { set(+e.target.value); stateRef.current[key] = +e.target.value; onEvent(`Changed ${key} to ${e.target.value}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {(['add', 'mul'] as const).map(o => (
          <button key={o} onClick={() => { setOp(o); stateRef.current.op = o; onEvent(`Selected ${o === 'add' ? 'addition' : 'multiplication'} of complex numbers`); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: op === o ? '#1B4332' : '#F0F7F3', color: op === o ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {o === 'add' ? 'z₁ + z₂ (Add)' : 'z₁ × z₂ (Multiply)'}
          </button>
        ))}
      </div>
    </div>
  );
}
