import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type ConicType = 'circle' | 'ellipse' | 'parabola' | 'hyperbola';

export default function ConicSectionsCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [conicType, setConicType] = useState<ConicType>('ellipse');
  const [a, setA] = useState(3); const [b, setB] = useState(2); const [c, setC] = useState(2);
  const stateRef = useRef({ conicType: 'ellipse' as ConicType, a: 3, b: 2, c: 2 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2, scale = 40;
      const tx = (x: number) => cx + x * scale;
      const ty = (y: number) => cy - y * scale;

      // Grid
      ctx.strokeStyle = 'rgba(27,67,50,0.06)'; ctx.lineWidth = 1;
      for (let i = -7; i <= 7; i++) {
        ctx.beginPath(); ctx.moveTo(tx(i), 0); ctx.lineTo(tx(i), H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, ty(i)); ctx.lineTo(W, ty(i)); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#D6D3D1'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
      ctx.fillStyle = '#A8A29E'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText('x', W - 14, cy - 6); ctx.fillText('y', cx + 6, 14);

      // Tick labels
      ctx.fillStyle = '#78716C'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      for (let i = -6; i <= 6; i++) { if (i !== 0) { ctx.fillText(String(i), tx(i), cy + 14); } }
      ctx.textAlign = 'left';

      const aa = s.a, bb = s.b, cc = s.c;

      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5;

      if (s.conicType === 'circle') {
        ctx.beginPath(); ctx.arc(cx, cy, aa * scale, 0, Math.PI * 2); ctx.stroke();
        // Focus = center
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = '#F59E0B'; ctx.fill();
        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(`x² + y² = ${aa}²   (r=${aa})`, 14, 26);

      } else if (s.conicType === 'ellipse') {
        ctx.beginPath();
        for (let t = 0; t <= Math.PI * 2; t += 0.02) {
          const x = aa * Math.cos(t), y = bb * Math.sin(t);
          t === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        }
        ctx.closePath(); ctx.stroke();
        // Foci
        const f = Math.sqrt(Math.max(0, aa * aa - bb * bb));
        [[-f, 0], [f, 0]].forEach(([fx, fy]) => {
          ctx.beginPath(); ctx.arc(tx(fx), ty(fy), 5, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B'; ctx.fill();
          ctx.fillStyle = '#D97706'; ctx.font = '600 10px Inter,sans-serif';
          ctx.fillText('F', tx(fx) + 6, ty(fy) - 6);
        });
        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(`x²/${aa}² + y²/${bb}² = 1  (e=${(f / aa).toFixed(2)})`, 14, 26);

      } else if (s.conicType === 'parabola') {
        ctx.beginPath();
        for (let t = -5; t <= 5; t += 0.05) {
          const x = t, y = (1 / (4 * cc)) * x * x;
          if (Math.abs(y) > 5) continue;
          t === -5 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        }
        ctx.stroke();
        // Focus + directrix
        ctx.beginPath(); ctx.arc(tx(0), ty(cc), 5, 0, Math.PI * 2); ctx.fillStyle = '#F59E0B'; ctx.fill();
        ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(0, ty(-cc)); ctx.lineTo(W, ty(-cc)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(`y = x²/(4·${cc})   focus(0,${cc})   directrix y=-${cc}`, 14, 26);

      } else { // hyperbola
        ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5;
        // Right branch
        ctx.beginPath();
        for (let t = -Math.PI / 2.2; t <= Math.PI / 2.2; t += 0.02) {
          const x = aa / Math.cos(t), y = bb * Math.tan(t);
          if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 7) continue;
          t === -Math.PI / 2.2 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        }
        ctx.stroke();
        // Left branch
        ctx.beginPath();
        for (let t = -Math.PI / 2.2; t <= Math.PI / 2.2; t += 0.02) {
          const x = -aa / Math.cos(t), y = bb * Math.tan(t);
          if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 7) continue;
          t === -Math.PI / 2.2 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y));
        }
        ctx.stroke();
        // Asymptotes
        ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
        [1, -1].forEach(sign => {
          const slope = sign * (bb / aa);
          ctx.beginPath(); ctx.moveTo(0, ty(-slope * (cx / scale)));
          ctx.lineTo(W, ty(slope * (cx / scale))); ctx.stroke();
        });
        ctx.setLineDash([]);
        const f2 = Math.sqrt(aa * aa + bb * bb);
        [[-f2, 0], [f2, 0]].forEach(([fx, fy]) => {
          ctx.beginPath(); ctx.arc(tx(fx), ty(fy), 5, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B'; ctx.fill();
        });
        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(`x²/${aa}² - y²/${bb}² = 1  (e=${(f2 / aa).toFixed(2)})`, 14, 26);
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={320} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 280 }} />
      <div className="flex gap-2 flex-wrap">
        {(['circle', 'ellipse', 'parabola', 'hyperbola'] as ConicType[]).map(ct => (
          <button key={ct} onClick={() => { setConicType(ct); stateRef.current.conicType = ct; onEvent(`Selected conic section: ${ct}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: conicType === ct ? '#1B4332' : '#F0F7F3', color: conicType === ct ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {ct}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: conicType === 'parabola' ? 'Focus param p' : 'a', val: a, set: setA, key: 'a' as const },
          { label: 'b', val: b, set: setB, key: 'b' as const },
          { label: 'c / p', val: c, set: setC, key: 'c' as const },
        ].map(({ label, val, set, key }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label} = {val}</label>
            <input type="range" min={1} max={5} step={0.5} value={val}
              onChange={e => { set(+e.target.value); stateRef.current[key] = +e.target.value; onEvent(`Changed parameter ${label} to ${e.target.value} on ${conicType}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
