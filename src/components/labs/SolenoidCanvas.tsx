import { useState, useEffect, useRef } from 'react';

export default function SolenoidCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [current, setCurrent] = useState(2);
  const [turns, setTurns] = useState(200);
  const [length, setLength] = useState(0.15);
  const [core, setCore] = useState<'air'|'iron'|'ferrite'>('air');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const MU0 = 4 * Math.PI * 1e-7;
  const permeability: Record<string, number> = { air: 1, iron: 1000, ferrite: 3000 };
  const mu_r = permeability[core];
  const B = MU0 * mu_r * (turns / length) * current;

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, sy = 60, sh = H - 100, coilColor = '#F59E0B';
    const solenoidW = 340, coilSpacing = solenoidW / Math.min(turns, 30);
    const sx = cx - solenoidW / 2;

    // Core
    const coreColors: Record<string, string> = { air: '#F8FAFC', iron: '#CBD5E1', ferrite: '#A8A29E' };
    ctx.fillStyle = coreColors[core]; ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1.5;
    ctx.fillRect(sx + 10, sy + 15, solenoidW - 20, sh - 30);
    ctx.strokeRect(sx + 10, sy + 15, solenoidW - 20, sh - 30);

    // Draw coil turns
    const nVisible = Math.min(turns, 30);
    for (let i = 0; i < nVisible; i++) {
      const x = sx + 10 + i * ((solenoidW - 20) / nVisible);
      ctx.strokeStyle = coilColor; ctx.lineWidth = 3;
      // Front half ellipse
      ctx.beginPath(); ctx.ellipse(x, sy + sh / 2, 8, sh / 2 - 15, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      // Back half (dashed)
      ctx.strokeStyle = 'rgba(245,158,11,0.3)'; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.ellipse(x, sy + sh / 2, 8, sh / 2 - 15, 0, Math.PI / 2, 3 * Math.PI / 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    // End caps (circles for 3D effect)
    [sx, sx + solenoidW - 10].forEach(ex => {
      ctx.strokeStyle = coilColor; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(ex, sy + sh / 2, 8, sh / 2 - 15, 0, 0, Math.PI * 2); ctx.stroke();
    });

    // Magnetic field lines (inside)
    const fieldIntensity = Math.min(1, B / 0.03);
    ctx.strokeStyle = `rgba(59,130,246,${0.3 + fieldIntensity * 0.6})`;
    ctx.lineWidth = 1.5 + fieldIntensity * 1.5;
    for (let row = 0; row < 5; row++) {
      const fy = sy + 20 + row * (sh - 20) / 4;
      ctx.beginPath();
      ctx.moveTo(sx + 15, fy);
      ctx.lineTo(sx + solenoidW - 15, fy);
      ctx.stroke();
      // Arrow
      const ax = cx;
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath(); ctx.moveTo(ax + 10, fy); ctx.lineTo(ax, fy - 5); ctx.lineTo(ax, fy + 5); ctx.fill();
    }
    // External field loops (left/right)
    ctx.strokeStyle = 'rgba(59,130,246,0.2)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.ellipse(sx - 40, H / 2, 40, 80, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(sx + solenoidW + 40, H / 2, 40, 80, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#3B82F6'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('S', sx - 40, H / 2 + 4); ctx.fillText('N', sx + solenoidW + 40, H / 2 + 4);

    // B field display
    const bStr = B < 0.001 ? `${(B * 1e6).toFixed(2)} μT` : B < 1 ? `${(B * 1e3).toFixed(2)} mT` : `${B.toFixed(4)} T`;
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 12px Inter,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`B = μ₀μᵣnI = ${bStr}`, 15, H - 38);
    ctx.fillText(`n=${turns} turns, L=${length.toFixed(2)}m, I=${current}A, μᵣ=${mu_r}`, 15, H - 20);
  }, [current, turns, length, core, B, mu_r]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['air','iron','ferrite'] as const).map(c => (
          <button key={c} onClick={() => { setCore(c); onEvent(`Core: ${c} (μᵣ=${permeability[c]}) — B=${core === c ? B.toFixed(4) : 'updating'} T`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: core === c ? '#F59E0B' : '#FFFBEB', color: core === c ? '#FFF' : '#92400E', border: '1px solid #FDE68A' }}>
            {c} core
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={240} className="w-full rounded-xl" style={{ border: '1px solid #FDE68A', background: '#FFFBEB' }} />
      <div className="grid grid-cols-3 gap-3">
        {[{ l: `Current I: ${current}A`, v: current, s: setCurrent, min: 0, max: 10 },
          { l: `Turns N: ${turns}`, v: turns, s: setTurns, min: 10, max: 1000, step: 10 },
          { l: `Length L: ${length.toFixed(2)}m`, v: length * 100, s: (v: number) => { setLength(v/100); onEvent(`L=${v/100}m`); }, min: 2, max: 50 }].map(({ l, v, s, min, max, step }) => (
          <div key={l} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{l}</label>
            <input type="range" min={min} max={max} step={step ?? 1} value={v} onChange={e => { s(+e.target.value); onEvent(`${l.split(':')[0]}: ${+e.target.value}`); }} style={{ accentColor: '#F59E0B' }} className="w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-xl p-3 text-center" style={{ background: '#FFFBEB', border: '2px solid #F59E0B' }}>
        <p className="font-inter text-xs font-semibold" style={{ color: '#92400E' }}>B = μ₀μᵣ(N/L)I</p>
        <p className="font-sora font-bold text-2xl" style={{ color: '#D97706' }}>{B < 0.001 ? `${(B*1e6).toFixed(1)} μT` : B < 1 ? `${(B*1000).toFixed(2)} mT` : `${B.toFixed(3)} T`}</p>
      </div>
    </div>
  );
}
