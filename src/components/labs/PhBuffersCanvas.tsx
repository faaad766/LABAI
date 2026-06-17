import { useState, useRef, useEffect } from 'react';

export default function PhBuffersCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [bufferType, setBufferType] = useState<'acetate'|'phosphate'|'none'>('acetate');
  const [pH, setPH] = useState(4.7);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const PKA: Record<string, number> = { acetate: 4.76, phosphate: 7.2, none: 7.0 };
  const pka = PKA[bufferType];

  const addAcid = () => {
    const delta = bufferType === 'none' ? -1.5 : -0.15;
    const newPH = Math.max(0, Math.round((pH + delta) * 10) / 10);
    setPH(newPH);
    onEvent(`Added strong acid: pH changed from ${pH} to ${newPH} — ${bufferType === 'none' ? 'LARGE drop (no buffer)' : 'SMALL change (buffer resists!)'}`);
  };
  const addBase = () => {
    const delta = bufferType === 'none' ? 1.5 : 0.15;
    const newPH = Math.min(14, Math.round((pH + delta) * 10) / 10);
    setPH(newPH);
    onEvent(`Added strong base: pH changed from ${pH} to ${newPH} — ${bufferType === 'none' ? 'LARGE rise (no buffer)' : 'SMALL change (buffer resists!)'}`);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // pH scale bar
    const bar = ctx.createLinearGradient(20, 0, W - 20, 0);
    ['#DC2626','#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#14B8A6','#06B6D4','#3B82F6','#6366F1','#8B5CF6','#7C3AED','#6D28D9'].forEach((c2, i) => bar.addColorStop(i / 13, c2));
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(20, 30, W - 40, 36, 8); ctx.fill();
    // pH marker
    const x = 20 + ((pH / 14) * (W - 40));
    ctx.fillStyle = '#1C1917'; ctx.beginPath(); ctx.moveTo(x, 26); ctx.lineTo(x - 7, 16); ctx.lineTo(x + 7, 16); ctx.closePath(); ctx.fill();
    ctx.fillText(`pH ${pH.toFixed(1)}`, x - 16, 12);
    ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#1C1917';
    // pKa marker
    if (bufferType !== 'none') {
      const pkax = 20 + ((pka / 14) * (W - 40));
      ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(pkax, 28); ctx.lineTo(pkax, 80); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#1C1917'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`pKₐ ${pka}`, pkax + 3, 90);
    }
    // Labels
    ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#52796F';
    ['0','2','4','6','8','10','12','14'].forEach((l, i) => ctx.fillText(l, 20 + (i * 2 / 14) * (W - 40) - 4, 80));
    ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillStyle = '#DC2626';
    ctx.fillText('Acid', 22, 100); ctx.fillStyle = '#3B82F6'; ctx.fillText('Base', W - 44, 100);
    // Buffer zone highlight
    if (bufferType !== 'none') {
      const lo = 20 + ((pka - 1) / 14) * (W - 40), hi = 20 + ((pka + 1) / 14) * (W - 40);
      ctx.fillStyle = 'rgba(34,197,94,0.18)'; ctx.beginPath(); ctx.roundRect(lo, 22, hi - lo, 44, 4); ctx.fill();
      ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.strokeRect(lo, 22, hi - lo, 44); ctx.setLineDash([]);
      ctx.fillStyle = '#16A34A'; ctx.font = 'bold 10px Inter,sans-serif';
      ctx.fillText('Buffer zone', lo + 4, 105);
    }
  }, [pH, bufferType, pka]);

  const pHColor = pH < 3 ? '#DC2626' : pH < 6 ? '#F97316' : pH < 8 ? '#22C55E' : pH < 11 ? '#3B82F6' : '#7C3AED';

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['acetate', 'phosphate', 'none'] as const).map(b => (
          <button key={b} onClick={() => { setBufferType(b); setPH(b === 'acetate' ? 4.7 : b === 'phosphate' ? 7.2 : 7.0); onEvent(`Switched to ${b} ${b === 'none' ? '(no buffer — pure water)' : 'buffer'}`); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
            style={{ background: bufferType === b ? '#22C55E' : '#F0FDF4', color: bufferType === b ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            {b === 'none' ? 'Pure Water' : `${b} buffer`}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} width={520} height={115} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', background: '#FAFAF9' }} />

      <div className="text-center rounded-xl p-4" style={{ background: `${pHColor}11`, border: `2px solid ${pHColor}` }}>
        <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>Current pH</p>
        <p className="font-sora font-bold text-4xl" style={{ color: pHColor }}>{pH.toFixed(1)}</p>
        <p className="font-inter text-xs mt-1" style={{ color: '#78716C' }}>
          {pH < 3 ? 'Strongly acidic' : pH < 6 ? 'Acidic' : pH < 8 ? 'Neutral zone' : pH < 11 ? 'Basic' : 'Strongly basic'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={addAcid} className="py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#DC2626', color: '#FFF' }}>
          + Add Strong Acid (HCl)
        </button>
        <button onClick={addBase} className="py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#3B82F6', color: '#FFF' }}>
          + Add Strong Base (NaOH)
        </button>
      </div>

      <div className="rounded-lg p-3 text-xs font-inter" style={{ background: '#FAFAF9', border: '1px solid #E7E5E0', color: '#52796F' }}>
        💡 Henderson-Hasselbalch: <strong>pH = pKa + log([A⁻]/[HA])</strong>. Buffer works best within ±1 unit of pKa.
      </div>
    </div>
  );
}
