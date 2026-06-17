import { useState, useEffect, useRef } from 'react';

interface Crystal { x: number; y: number; size: number; angle: number }

export default function CrystalGrowingCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [type, setType] = useState<'cubic'|'hexagonal'|'tetragonal'>('cubic');
  const [supersat, setSupersat] = useState(60);
  const [coolingRate, setCoolingRate] = useState(5);
  const [seed, setSeed] = useState(false);
  const [growing, setGrowing] = useState(false);
  const [crystals, setCrystals] = useState<Crystal[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (growing) {
      timerRef.current = setInterval(() => {
        const chance = (supersat / 100) * (coolingRate / 10) * (seed ? 2 : 1);
        if (Math.random() < chance * 0.25) {
          const newC: Crystal = { x: Math.random() * 80 + 10, y: Math.random() * 70 + 15, size: seed ? 8 : 3, angle: Math.random() * 60 };
          setCrystals(prev => {
            const next = prev.length < 40 ? [...prev, newC] : prev;
            if (next.length % 5 === 0) onEvent(`${next.length} ${type} crystals nucleated — supersaturation ${supersat}%, cooling rate ${coolingRate}°C/min`);
            return next.map(c => ({ ...c, size: Math.min(c.size + 0.5 * (supersat / 100), 25) }));
          });
        }
      }, 400);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [growing, supersat, coolingRate, seed, type, onEvent]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // Solution background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#EFF6FF'); grad.addColorStop(1, '#DBEAFE');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    // Draw crystals
    crystals.forEach(cr => {
      const px = (cr.x / 100) * W, py = (cr.y / 100) * H, s = cr.size;
      ctx.save(); ctx.translate(px, py); ctx.rotate((cr.angle * Math.PI) / 180);
      ctx.fillStyle = type === 'cubic' ? '#A78BFA' : type === 'hexagonal' ? '#22C55E' : '#3B82F6';
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
      if (type === 'cubic') {
        ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeRect(-s / 2, -s / 2, s, s);
      } else if (type === 'hexagonal') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          i === 0 ? ctx.moveTo(s * Math.cos(a), s * Math.sin(a)) : ctx.lineTo(s * Math.cos(a), s * Math.sin(a));
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillRect(-s / 3, -s / 2, s * 2 / 3, s); ctx.strokeRect(-s / 3, -s / 2, s * 2 / 3, s);
      }
      ctx.restore();
    });
    ctx.fillStyle = '#1E3A5F'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText(`${crystals.length} crystals | ${type}`, 10, H - 10);
  }, [crystals, type]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['cubic','hexagonal','tetragonal'] as const).map(t => (
          <button key={t} onClick={() => { setType(t); setCrystals([]); setGrowing(false); onEvent(`Crystal type: ${t}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: type === t ? '#3B82F6' : '#EFF6FF', color: type === t ? '#FFF' : '#1E3A5F', border: '1px solid #BFDBFE' }}>
            {t}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={220} className="w-full rounded-xl" style={{ border: '1px solid #BFDBFE' }} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: `Supersaturation: ${supersat}%`, val: supersat, min: 10, max: 100, set: (v: number) => { setSupersat(v); onEvent(`Supersaturation set to ${v}%`); } },
          { label: `Cooling rate: ${coolingRate}°C/min`, val: coolingRate, min: 1, max: 20, set: (v: number) => { setCoolingRate(v); onEvent(`Cooling rate: ${v}°C/min`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#3B82F6' }} className="w-full" />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={seed} onChange={e => { setSeed(e.target.checked); onEvent(e.target.checked ? 'Added seed crystal — nucleation site created' : 'Removed seed crystal'); }} />
        <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Add Seed Crystal</span>
      </label>
      <div className="flex gap-2">
        <button onClick={() => { setGrowing(g => !g); onEvent(growing ? 'Paused crystallization' : 'Started crystal growth'); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: growing ? '#EF4444' : '#3B82F6', color: '#FFF' }}>
          {growing ? '⏸ Pause' : '💎 Grow Crystals'}
        </button>
        <button onClick={() => { setCrystals([]); setGrowing(false); onEvent('Reset crystal growth'); }}
          className="px-4 py-3 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
