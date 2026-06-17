import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

function evalF(expr: string, x: number, y: number): number {
  try {
    const safe = expr.replace(/\^/g, '**').replace(/sin/g, 'Math.sin').replace(/cos/g, 'Math.cos');
    // eslint-disable-next-line no-new-func
    return new Function('x', 'y', `return ${safe}`)(x, y) as number;
  } catch { return NaN; }
}

const PRESETS = [
  { label: 'x²+y²', expr: 'x*x + y*y' },
  { label: 'sin(x)+y', expr: 'Math.sin(x) + y' },
  { label: 'x²-y²', expr: 'x*x - y*y' },
];

export default function VectorFieldsCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expr, setExpr] = useState('x*x + y*y');
  const stateRef = useRef({ expr: 'x*x + y*y', mouseX: 0, mouseY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0F172A'; ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2, scale = 50;
      const range = 4;
      const step = 0.8;

      // Contour fill (scalar field heatmap)
      for (let px = 0; px < W; px += 4) {
        for (let py = 0; py < H; py += 4) {
          const fx = (px - cx) / scale;
          const fy = -(py - cy) / scale;
          const val = evalF(s.expr, fx, fy);
          if (!isFinite(val)) continue;
          const norm = Math.tanh(val / 10);
          const r = norm > 0 ? Math.floor(norm * 80) : 0;
          const b = norm < 0 ? Math.floor(-norm * 80) : 0;
          ctx.fillStyle = `rgba(${r},40,${b},0.5)`;
          ctx.fillRect(px, py, 4, 4);
        }
      }

      // Gradient arrows
      const h = 0.001;
      for (let gx = -range; gx <= range; gx += step) {
        for (let gy = -range; gy <= range; gy += step) {
          const dfdx = (evalF(s.expr, gx + h, gy) - evalF(s.expr, gx - h, gy)) / (2 * h);
          const dfdy = (evalF(s.expr, gx, gy + h) - evalF(s.expr, gx, gy - h)) / (2 * h);
          const mag = Math.sqrt(dfdx * dfdx + dfdy * dfdy);
          if (!isFinite(mag) || mag < 0.001) continue;
          const len = Math.min(18, 8 / Math.sqrt(mag));
          const nx = dfdx / mag, ny = -dfdy / mag;
          const px = cx + gx * scale, py = cy - gy * scale;
          const ax = nx * len, ay = ny * len;
          const alpha = Math.min(0.9, mag * 0.15 + 0.3);
          ctx.strokeStyle = `rgba(251,191,36,${alpha})`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + ax, py + ay); ctx.stroke();
          const ang = Math.atan2(ay, ax);
          ctx.fillStyle = `rgba(251,191,36,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(px + ax, py + ay);
          ctx.lineTo(px + ax - 5 * Math.cos(ang - 0.5), py + ay - 5 * Math.sin(ang - 0.5));
          ctx.lineTo(px + ax - 5 * Math.cos(ang + 0.5), py + ay - 5 * Math.sin(ang + 0.5));
          ctx.closePath(); ctx.fill();
        }
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

      // Labels
      ctx.fillStyle = '#F1F5F9'; ctx.font = '700 12px Inter,sans-serif';
      ctx.fillText(`∇f(x,y) for f = ${s.expr}`, 14, 22);
      ctx.fillStyle = '#94A3B8'; ctx.font = '600 11px Inter,sans-serif';
      ctx.fillText('Arrows = gradient direction', 14, 40);
      ctx.fillText('Color = scalar field value (red=+, blue=-)', 14, 56);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={320} className="w-full rounded-xl" style={{ maxHeight: 270 }} />
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(pr => (
          <button key={pr.label} onClick={() => { setExpr(pr.expr); stateRef.current.expr = pr.expr; onEvent(`Changed scalar field to f(x,y) = ${pr.expr}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: expr === pr.expr ? '#1B4332' : '#F0F7F3', color: expr === pr.expr ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {pr.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Custom f(x,y)</label>
        <input value={expr} onChange={e => { setExpr(e.target.value); stateRef.current.expr = e.target.value; onEvent(`Set scalar field to f = ${e.target.value}`); }}
          className="px-2 py-1.5 rounded-lg text-sm font-inter outline-none"
          style={{ border: '1.5px solid #E7E5E0', background: '#FAF8F3', color: '#1C1917' }} />
      </div>
    </div>
  );
}
