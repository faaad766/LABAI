import { useState, useEffect, useRef } from 'react';

export default function LinearProgrammingCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [c1, setC1] = useState(3); // objective coefficients
  const [c2, setC2] = useState(5);
  const [a11, setA11] = useState(1); const [a12, setA12] = useState(2); const [b1, setB1] = useState(8);
  const [a21, setA21] = useState(3); const [a22, setA22] = useState(2); const [b2, setB2] = useState(12);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const scale = 30, ox = 40, oy = H - 40;
    // Axes
    ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 10, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, 10); ctx.stroke();
    for (let i = 0; i <= 10; i++) {
      ctx.fillStyle = '#A8A29E'; ctx.font = '9px Inter,sans-serif';
      ctx.fillText(String(i), ox + i * scale - 4, oy + 12);
      ctx.fillText(String(i), ox - 14, oy - i * scale + 4);
    }
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillText('x₁', W - 16, oy - 4); ctx.fillText('x₂', ox + 4, 14);
    // Feasible region
    const verts: [number, number][] = [[0, 0]];
    if (b1 / a12 >= 0) verts.push([0, b1 / a12]);
    if (b2 / a22 >= 0) verts.push([0, b2 / a22]);
    if (b1 / a11 >= 0) verts.push([b1 / a11, 0]);
    if (b2 / a21 >= 0) verts.push([b2 / a21, 0]);
    // Intersection of two constraints
    const det = a11 * a22 - a12 * a21;
    if (Math.abs(det) > 1e-9) {
      const ix = (b1 * a22 - b2 * a12) / det;
      const iy = (a11 * b2 - a21 * b1) / det;
      if (ix >= 0 && iy >= 0) verts.push([ix, iy]);
    }
    // Filter feasible
    const feasible = verts.filter(([x, y]) => x >= 0 && y >= 0 && a11 * x + a12 * y <= b1 + 1e-9 && a21 * x + a22 * y <= b2 + 1e-9);
    // Sort by angle
    const cx2 = feasible.reduce((s, v) => s + v[0], 0) / feasible.length;
    const cy2 = feasible.reduce((s, v) => s + v[1], 0) / feasible.length;
    feasible.sort((a, b) => Math.atan2(a[1] - cy2, a[0] - cx2) - Math.atan2(b[1] - cy2, b[0] - cx2));
    if (feasible.length > 2) {
      ctx.fillStyle = 'rgba(139,92,246,0.15)';
      ctx.beginPath();
      feasible.forEach(([x, y], i) => { const px = ox + x * scale, py = oy - y * scale; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2; ctx.stroke();
    }
    // Constraints
    [[a11, a12, b1, '#3B82F6', `${a11}x₁+${a12}x₂≤${b1}`], [a21, a22, b2, '#EF4444', `${a21}x₁+${a22}x₂≤${b2}`]].forEach(([a, b, bval, col, lbl], i) => {
      const x1_ = 0, y1_ = (bval as number) / (b as number);
      const x2_ = (bval as number) / (a as number), y2_ = 0;
      ctx.strokeStyle = col as string; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(ox + x1_ * scale, oy - y1_ * scale); ctx.lineTo(ox + x2_ * scale, oy - y2_ * scale); ctx.stroke();
      ctx.fillStyle = col as string; ctx.font = '10px Inter,sans-serif'; ctx.fillText(lbl as string, 50 + i * 130, 30);
    });
    // Optimal point
    let bestZ = -Infinity, bestPt: [number, number] = [0, 0];
    feasible.forEach(([x, y]) => { const z = c1 * x + c2 * y; if (z > bestZ) { bestZ = z; bestPt = [x, y]; } });
    const bpx = ox + bestPt[0] * scale, bpy = oy - bestPt[1] * scale;
    ctx.beginPath(); ctx.arc(bpx, bpy, 8, 0, Math.PI * 2); ctx.fillStyle = '#F59E0B'; ctx.fill();
    ctx.strokeStyle = '#D97706'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#D97706'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText(`Opt: (${bestPt[0].toFixed(1)}, ${bestPt[1].toFixed(1)})  Z=${bestZ.toFixed(1)}`, bpx + 10, bpy - 8);
    onEvent(`Optimal: x₁=${bestPt[0].toFixed(2)}, x₂=${bestPt[1].toFixed(2)}, Z=${bestZ.toFixed(2)}. Objective: ${c1}x₁+${c2}x₂`);
  }, [c1, c2, a11, a12, b1, a21, a22, b2]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={260} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <p className="font-inter font-semibold mb-1" style={{ color: '#4C1D95' }}>Maximize Z = c₁x₁ + c₂x₂</p>
          <div className="flex gap-2">
            {[{ l: 'c₁', v: c1, s: setC1 }, { l: 'c₂', v: c2, s: setC2 }].map(({ l, v, s }) => (
              <label key={l} className="flex items-center gap-1">{l}:
                <input type="number" value={v} min={0} max={10} onChange={e => s(+e.target.value)} className="w-12 rounded px-1 py-0.5" style={{ border: '1px solid #DDD6FE' }} />
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <p className="font-inter font-semibold mb-1" style={{ color: '#1E3A5F' }}>Subject to:</p>
          <p style={{ fontFamily: 'monospace', color: '#1C1917' }}>{a11}x₁+{a12}x₂ ≤ {b1}</p>
          <p style={{ fontFamily: 'monospace', color: '#1C1917' }}>{a21}x₁+{a22}x₂ ≤ {b2}</p>
        </div>
      </div>
    </div>
  );
}
