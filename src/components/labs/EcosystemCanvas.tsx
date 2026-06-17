import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

export default function EcosystemCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [grass, setGrass] = useState(80);
  const [rabbits, setRabbits] = useState(40);
  const [foxes, setFoxes] = useState(10);
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [history, setHistory] = useState([{ t: 0, g: 80, r: 40, f: 10 }]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = useCallback(() => {
    setGrass(g => {
      setRabbits(r => {
        setFoxes(f => {
          const ng = Math.max(0, Math.min(100, g + 8 - r * 0.15));
          const nr = Math.max(0, Math.min(120, r + r * 0.05 * (g / 50) - f * 0.4));
          const nf = Math.max(0, Math.min(60, f + f * 0.03 * (r / 20) - f * 0.05));
          setTime(t => {
            setHistory(h => [...h.slice(-40), { t: t + 1, g: ng, r: Math.round(nr), f: Math.round(nf) }]);
            return t + 1;
          });
          return Math.round(nf);
        });
        return Math.round(rabbits);
      });
      return Math.round(grass);
    });
  }, [grass, rabbits, foxes]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setGrass(g => {
          setRabbits(r => {
            setFoxes(f => {
              const ng = Math.max(0, Math.min(100, g + 8 - r * 0.15));
              const nr = Math.max(0, Math.min(120, r + r * 0.05 * (g / 50) - f * 0.4));
              const nf = Math.max(0, Math.min(60, f + f * 0.03 * (r / 20) - f * 0.05));
              setTime(t => {
                setHistory(h => [...h.slice(-40), { t: t + 1, g: ng, r: Math.round(nr), f: Math.round(nf) }]);
                return t + 1;
              });
              return Math.round(nf);
            });
            return 0; // placeholder
          });
          return 0; // placeholder
        });
      }, 600);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  // Simpler manual simulation
  const tickRef = useRef({ grass: 80, rabbits: 40, foxes: 10, time: 0 });
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const s = tickRef.current;
      const ng = Math.max(2, Math.min(100, s.grass + 10 - s.rabbits * 0.18));
      const nr = Math.max(1, Math.min(150, s.rabbits + Math.round(s.rabbits * 0.06 * (s.grass / 60)) - s.foxes * 0.5));
      const nf = Math.max(0, Math.min(80, s.foxes + Math.round(s.foxes * 0.04 * (s.rabbits / 25)) - s.foxes * 0.06));
      tickRef.current = { grass: Math.round(ng), rabbits: Math.round(nr), foxes: Math.round(nf), time: s.time + 1 };
      setGrass(Math.round(ng)); setRabbits(Math.round(nr)); setFoxes(Math.round(nf)); setTime(s.time + 1);
      setHistory(h => [...h.slice(-50), { t: s.time + 1, g: Math.round(ng), r: Math.round(nr), f: Math.round(nf) }]);
    }, 700);
    return () => clearInterval(iv);
  }, [running]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    if (history.length < 2) return;
    const maxVal = 150;
    const colors = { g: '#22C55E', r: '#94A3B8', f: '#EF4444' };
    const keys: Array<keyof typeof colors> = ['g', 'r', 'f'];
    keys.forEach(key => {
      ctx.beginPath();
      ctx.strokeStyle = colors[key]; ctx.lineWidth = 2;
      history.forEach((pt, i) => {
        const x = (i / (history.length - 1)) * W;
        const y = H - (pt[key as 'g'|'r'|'f'] / maxVal) * (H - 10) - 5;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [history]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '🌿 Grass', val: grass, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
          { label: '🐰 Rabbits', val: rabbits, color: '#475569', bg: '#F8FAFC', border: '#CBD5E1' },
          { label: '🦊 Foxes', val: foxes, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
        ].map(({ label, val, color, bg, border }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{label}</p>
            <p className="font-sora font-bold text-2xl" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} width={520} height={160} className="w-full rounded-xl"
        style={{ border: '1px solid #E7E5E0', background: '#FAFAF9' }} />
      <div className="flex gap-2 text-xs font-inter">
        {[{ c: '#22C55E', l: 'Grass' }, { c: '#94A3B8', l: 'Rabbits' }, { c: '#EF4444', l: 'Foxes' }].map(({ c, l }) => (
          <span key={l} className="flex items-center gap-1"><span className="w-3 h-1 rounded-full inline-block" style={{ background: c }} />{l}</span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Grass (%)', val: grass, min: 0, max: 100, set: (v: number) => { setGrass(v); tickRef.current.grass = v; onEvent(`Adjusted grass coverage to ${v}%`); } },
          { label: 'Rabbits', val: rabbits, min: 0, max: 100, set: (v: number) => { setRabbits(v); tickRef.current.rabbits = v; onEvent(`Set rabbit population to ${v}`); } },
          { label: 'Foxes', val: foxes, min: 0, max: 40, set: (v: number) => { setFoxes(v); tickRef.current.foxes = v; onEvent(`Set fox population to ${v}`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}: {val}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setRunning(r => !r); onEvent(running ? 'Paused ecosystem simulation' : 'Started ecosystem simulation running'); }}
          className="flex-1 py-2.5 rounded-xl text-sm font-sora font-bold transition-all"
          style={{ background: running ? '#EF4444' : '#1B4332', color: '#FFF' }}>
          {running ? '⏸ Pause' : '▶ Run Simulation'}
        </button>
        <button onClick={() => { setGrass(80); setRabbits(40); setFoxes(10); setTime(0); setHistory([{ t: 0, g: 80, r: 40, f: 10 }]); tickRef.current = { grass: 80, rabbits: 40, foxes: 10, time: 0 }; onEvent('Reset ecosystem to initial conditions'); }}
          className="px-4 py-2.5 rounded-xl text-sm font-inter font-semibold"
          style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
      <p className="font-inter text-xs text-center" style={{ color: '#A8A29E' }}>Time: {time} | Watch Lotka-Volterra predator-prey cycles!</p>
    </div>
  );
}
