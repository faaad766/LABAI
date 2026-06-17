import { useState, useRef, useEffect } from 'react';

export default function MomentumCollisionCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [m1, setM1] = useState(2); const [m2, setM2] = useState(1);
  const [v1, setV1] = useState(5); const [v2, setV2] = useState(-1);
  const [type, setType] = useState<'elastic'|'perfectly_inelastic'>('elastic');
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({ x1: 60, x2: 380, v1f: 0, v2f: 0, phase: 'before' as 'before'|'after', frame: 0 });

  // Calculate final velocities
  const calcVelocities = () => {
    if (type === 'elastic') {
      const v1f = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
      const v2f = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
      return { v1f, v2f };
    } else {
      const vf = (m1 * v1 + m2 * v2) / (m1 + m2);
      return { v1f: vf, v2f: vf };
    }
  };
  const { v1f, v2f } = calcVelocities();
  const p_before = m1 * v1 + m2 * v2, p_after = m1 * v1f + m2 * v2f;
  const ke_before = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const ke_after = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f;

  const run = () => {
    stateRef.current = { x1: 80, x2: 380, v1f, v2f, phase: 'before', frame: 0 };
    setAnimating(true);
    const W = canvasRef.current!.width;
    const r1 = Math.max(18, Math.sqrt(m1) * 12), r2 = Math.max(14, Math.sqrt(m2) * 10);
    const step = () => {
      const s = stateRef.current; s.frame++;
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, W, c.height);
      const H = c.height;
      // Ground
      ctx.fillStyle = '#E7E5E0'; ctx.fillRect(20, H - 30, W - 40, 4);
      if (s.phase === 'before') {
        s.x1 += v1 * 1.5; s.x2 += v2 * 1.5;
        const colliding = Math.abs(s.x1 - s.x2) < r1 + r2;
        if (colliding) {
          s.phase = 'after';
          onEvent(`Collision! p=${p_before.toFixed(2)} kg·m/s conserved. KE: ${ke_before.toFixed(2)}→${ke_after.toFixed(2)} J (${((ke_after/ke_before)*100).toFixed(1)}% retained)`);
        }
      } else {
        s.x1 += s.v1f * 1.5; s.x2 += s.v2f * 1.5;
      }
      // Draw balls
      [{ x: s.x1, r: r1, m: m1, col: '#3B82F6', label: `m=${m1}` }, { x: s.x2, r: r2, m: m2, col: '#EF4444', label: `m=${m2}` }].forEach(({ x, r, col, label }) => {
        ctx.beginPath(); ctx.arc(x, H - 30 - r, r, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, x, H - 30 - r + 4);
      });
      ctx.textAlign = 'left';
      const vLabel = (vv: number, x: number) => `v=${vv > 0 ? '+' : ''}${vv.toFixed(1)}`;
      ctx.fillStyle = '#1C1917'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(s.phase === 'before' ? vLabel(v1, s.x1) : vLabel(s.v1f, s.x1), s.x1 - 14, H - 30 - r1 - 14);
      ctx.fillText(s.phase === 'before' ? vLabel(v2, s.x2) : vLabel(s.v2f, s.x2), s.x2 - 14, H - 30 - r2 - 14);
      // Phase label
      ctx.fillStyle = '#8B5CF6'; ctx.font = 'bold 12px Inter,sans-serif';
      ctx.fillText(s.phase === 'before' ? 'Before collision' : 'After collision', W / 2 - 50, 20);
      if (s.x1 < -100 || s.x2 > W + 100 || s.frame > 300) { setAnimating(false); return; }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Static preview
  useEffect(() => {
    if (animating) return;
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#E7E5E0'; ctx.fillRect(20, H - 30, W - 40, 4);
    const r1 = Math.max(18, Math.sqrt(m1) * 12), r2 = Math.max(14, Math.sqrt(m2) * 10);
    [{ x: 110, r: r1, col: '#3B82F6', lbl: `m₁=${m1} v=${v1}` }, { x: 380, r: r2, col: '#EF4444', lbl: `m₂=${m2} v=${v2}` }].forEach(({ x, r, col, lbl }) => {
      ctx.beginPath(); ctx.arc(x, H - 30 - r, r, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = '#1C1917'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x, H - 30 - r - 10); ctx.textAlign = 'left';
    });
    // Arrows
    const drawArrow = (x: number, y: number, v: number, col: string) => {
      const len = v * 15; if (Math.abs(len) < 2) return;
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x + len, y); ctx.lineTo(x + len - Math.sign(len) * 10, y - 5); ctx.lineTo(x + len - Math.sign(len) * 10, y + 5); ctx.fill();
    };
    drawArrow(110, H - 30 - r1 * 2 - 10, v1, '#3B82F6');
    drawArrow(380, H - 30 - r2 * 2 - 10, v2, '#EF4444');
  }, [m1, m2, v1, v2, animating]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['elastic','perfectly_inelastic'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); onEvent(`Collision type: ${t === 'elastic' ? 'elastic (KE conserved)' : 'perfectly inelastic (objects stick)'}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: type === t ? '#8B5CF6' : '#F5F3FF', color: type === t ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {t === 'elastic' ? 'Elastic' : 'Perfectly Inelastic'}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={200} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl p-3" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <p className="font-inter text-xs font-semibold" style={{ color: '#1E3A5F' }}>After collision:</p>
          <p style={{ color: '#3B82F6' }}>v₁' = {v1f.toFixed(3)} m/s</p>
          <p style={{ color: '#EF4444' }}>v₂' = {v2f.toFixed(3)} m/s</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <p className="font-inter text-xs font-semibold" style={{ color: '#4C1D95' }}>Conservation:</p>
          <p style={{ color: '#22C55E' }}>p: {p_before.toFixed(2)} → {p_after.toFixed(2)}</p>
          <p style={{ color: type === 'elastic' ? '#22C55E' : '#F97316' }}>KE: {ke_before.toFixed(2)} → {ke_after.toFixed(2)} J</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ l: `m₁: ${m1}kg`, v: m1, s: setM1, min: 0.5, max: 5 }, { l: `m₂: ${m2}kg`, v: m2, s: setM2, min: 0.5, max: 5 },
          { l: `v₁: ${v1} m/s`, v: v1, s: setV1, min: -10, max: 10 }, { l: `v₂: ${v2} m/s`, v: v2, s: setV2, min: -10, max: 10 }].map(({ l, v, s, min, max }) => (
          <div key={l} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{l}</label>
            <input type="range" min={min} max={max} step={0.5} value={v} onChange={e => s(+e.target.value)} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={animating} className="py-3 rounded-xl text-sm font-sora font-bold"
        style={{ background: animating ? '#DDD6FE' : '#8B5CF6', color: '#FFF' }}>
        ▶ Run Collision
      </button>
    </div>
  );
}
