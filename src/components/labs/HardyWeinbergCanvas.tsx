import { useState, useEffect, useRef } from 'react';

export default function HardyWeinbergCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [p, setP] = useState(0.6);
  const [selection, setSelection] = useState(0);
  const [drift, setDrift] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [history, setHistory] = useState([{ gen: 0, p: 0.6 }]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const q = 1 - p;

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // Grid
    ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(y => {
      ctx.beginPath(); ctx.moveTo(40, H - y * (H - 30) - 15); ctx.lineTo(W - 10, H - y * (H - 30) - 15); ctx.stroke();
      ctx.fillStyle = '#A8A29E'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(y.toFixed(2), 4, H - y * (H - 30) - 12);
    });
    if (history.length < 2) return;
    // p line
    ctx.beginPath(); ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2.5;
    history.forEach((pt, i) => {
      const x = 40 + (i / Math.max(1, history.length - 1)) * (W - 55);
      const y = H - pt.p * (H - 30) - 15;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // q line
    ctx.beginPath(); ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2.5;
    history.forEach((pt, i) => {
      const x = 40 + (i / Math.max(1, history.length - 1)) * (W - 55);
      const y = H - (1 - pt.p) * (H - 30) - 15;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Labels
    ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillStyle = '#8B5CF6'; ctx.fillText('p (dom)', W - 64, 20);
    ctx.fillStyle = '#EF4444'; ctx.fillText('q (rec)', W - 60, 35);
  }, [history]);

  const runGeneration = () => {
    setP(prev => {
      let newP = prev;
      if (selection !== 0) newP = Math.max(0.01, Math.min(0.99, prev + selection * 0.03));
      if (drift) newP = Math.max(0.01, Math.min(0.99, newP + (Math.random() - 0.5) * 0.08));
      setGeneration(g => g + 1);
      setHistory(h => [...h.slice(-50), { gen: generation + 1, p: +newP.toFixed(3) }]);
      onEvent(`Generation ${generation + 1}: p=${newP.toFixed(3)}, q=${(1 - newP).toFixed(3)} — ${selection > 0 ? 'selection favoring dominant' : selection < 0 ? 'selection against dominant' : 'neutral'}${drift ? ' + genetic drift' : ''}`);
      return +newP.toFixed(3);
    });
  };

  const freqs = { AA: (p * p).toFixed(3), Aa: (2 * p * q).toFixed(3), aa: (q * q).toFixed(3) };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="grid grid-cols-3 gap-2">
        {[{ g: 'AA', f: freqs.AA, c: '#8B5CF6' }, { g: 'Aa', f: freqs.Aa, c: '#A78BFA' }, { g: 'aa', f: freqs.aa, c: '#EF4444' }].map(({ g, f, c }) => (
          <div key={g} className="rounded-xl p-3 text-center" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{g}</p>
            <p className="font-sora font-bold text-xl" style={{ color: c }}>{f}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <div className="flex-1 text-center rounded-xl p-3" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <span className="font-inter text-xs" style={{ color: '#52796F' }}>p (dominant)</span>
          <p className="font-sora font-bold text-2xl" style={{ color: '#8B5CF6' }}>{p.toFixed(3)}</p>
        </div>
        <div className="flex-1 text-center rounded-xl p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <span className="font-inter text-xs" style={{ color: '#52796F' }}>q (recessive)</span>
          <p className="font-sora font-bold text-2xl" style={{ color: '#EF4444' }}>{q.toFixed(3)}</p>
        </div>
      </div>
      <canvas ref={canvasRef} width={520} height={180} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', background: '#FAFAF9' }} />
      <div className="flex flex-col gap-3">
        <div>
          <label className="font-inter text-xs font-semibold block mb-1" style={{ color: '#1C1917' }}>Starting p: {p.toFixed(2)}</label>
          <input type="range" min={0.05} max={0.95} step={0.01} value={p}
            onChange={e => { setP(+e.target.value); setGeneration(0); setHistory([{ gen: 0, p: +e.target.value }]); onEvent(`Set starting allele frequency p=${(+e.target.value).toFixed(2)}`); }}
            style={{ accentColor: '#8B5CF6' }} className="w-full" />
        </div>
        <div>
          <label className="font-inter text-xs font-semibold block mb-1" style={{ color: '#1C1917' }}>
            Selection pressure: {selection > 0 ? `+${selection}` : selection} (negative = against dominant)
          </label>
          <input type="range" min={-3} max={3} step={1} value={selection}
            onChange={e => { setSelection(+e.target.value); onEvent(`Set selection pressure to ${+e.target.value}`); }}
            style={{ accentColor: '#8B5CF6' }} className="w-full" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={drift} onChange={e => { setDrift(e.target.checked); onEvent(e.target.checked ? 'Enabled genetic drift' : 'Disabled genetic drift'); }} />
          <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Enable Genetic Drift</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={runGeneration} className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#8B5CF6', color: '#FFF' }}>
          Run Generation {generation + 1} →
        </button>
        <button onClick={() => { setGeneration(0); setHistory([{ gen: 0, p }]); onEvent('Reset Hardy-Weinberg simulation'); }}
          className="px-4 py-3 rounded-xl text-sm font-inter font-semibold" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
      <p className="font-inter text-xs text-center" style={{ color: '#A8A29E' }}>Generation {generation} | p + q = {(p + q).toFixed(3)}</p>
    </div>
  );
}
