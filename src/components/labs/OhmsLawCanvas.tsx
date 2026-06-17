import { useState, useEffect, useRef } from 'react';

interface Component { id: string; type: 'battery'|'resistor'|'wire'; x: number; y: number; value?: number }

export default function OhmsLawCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [voltage, setVoltage] = useState(9);
  const [r1, setR1] = useState(100);
  const [r2, setR2] = useState(220);
  const [mode, setMode] = useState<'series'|'parallel'>('series');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const Rtotal = mode === 'series' ? r1 + r2 : (r1 * r2) / (r1 + r2);
  const I = voltage / Rtotal;
  const P = voltage * I;

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 3;

    if (mode === 'series') {
      // Simple series circuit rectangle
      ctx.beginPath();
      ctx.moveTo(60, 60); ctx.lineTo(460, 60);
      ctx.lineTo(460, 180); ctx.lineTo(60, 180); ctx.lineTo(60, 60);
      ctx.stroke();
      // Battery left side
      ctx.fillStyle = '#FEF3C7'; ctx.fillRect(44, 90, 32, 60); ctx.strokeStyle = '#D97706'; ctx.lineWidth = 2; ctx.strokeRect(44, 90, 32, 60);
      ctx.fillStyle = '#92400E'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(`${voltage}V`, 48, 124);
      // R1 top
      ctx.fillStyle = '#F0F9FF'; ctx.fillRect(170, 44, 80, 32); ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 2; ctx.strokeRect(170, 44, 80, 32);
      ctx.fillStyle = '#1E3A5F'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(`R1=${r1}Ω`, 178, 64);
      // R2 top
      ctx.fillStyle = '#F0F9FF'; ctx.fillRect(300, 44, 80, 32); ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 2; ctx.strokeRect(300, 44, 80, 32);
      ctx.fillText(`R2=${r2}Ω`, 308, 64);
      // Current flow arrow
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(80, 60); ctx.lineTo(160, 60); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#EF4444'; ctx.font = '10px Inter,sans-serif'; ctx.fillText(`I = ${I.toFixed(3)}A`, 200, 180 + 20);
    } else {
      // Parallel circuit
      ctx.beginPath(); ctx.moveTo(60, 40); ctx.lineTo(460, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 200); ctx.lineTo(460, 200); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 40); ctx.lineTo(60, 200); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(460, 40); ctx.lineTo(460, 200); ctx.stroke();
      // Battery
      ctx.fillStyle = '#FEF3C7'; ctx.fillRect(44, 90, 32, 60); ctx.strokeStyle = '#D97706'; ctx.lineWidth = 2; ctx.strokeRect(44, 90, 32, 60);
      ctx.fillStyle = '#92400E'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(`${voltage}V`, 48, 124);
      // Junction lines
      ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(200, 40); ctx.lineTo(200, 200); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(360, 40); ctx.lineTo(360, 200); ctx.stroke();
      // Resistors
      ctx.fillStyle = '#F0F9FF'; ctx.fillRect(215, 95, 70, 30); ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 2; ctx.strokeRect(215, 95, 70, 30);
      ctx.fillStyle = '#1E3A5F'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(`R1=${r1}Ω`, 220, 114);
      ctx.fillStyle = '#F0F9FF'; ctx.fillRect(215, 140, 70, 30); ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 2; ctx.strokeRect(215, 140, 70, 30);
      ctx.fillText(`R2=${r2}Ω`, 220, 159);
      ctx.fillStyle = '#EF4444'; ctx.font = '10px Inter,sans-serif'; ctx.fillText(`I = ${I.toFixed(3)}A`, 200, 220);
    }
    // Values box
    ctx.fillStyle = '#F0FDF4'; ctx.fillRect(W - 170, 10, 160, 70); ctx.strokeStyle = '#BBF7D0'; ctx.lineWidth = 1.5; ctx.strokeRect(W - 170, 10, 160, 70);
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText(`V = ${voltage}V`, W - 160, 30);
    ctx.fillText(`R = ${Rtotal.toFixed(1)}Ω`, W - 160, 48);
    ctx.fillText(`I = ${I.toFixed(3)}A  P = ${P.toFixed(2)}W`, W - 160, 66);
  }, [voltage, r1, r2, mode, Rtotal, I, P]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['series','parallel'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); onEvent(`Switched to ${m} circuit`); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize"
            style={{ background: mode === m ? '#3B82F6' : '#EFF6FF', color: mode === m ? '#FFF' : '#1E3A5F', border: '1px solid #BFDBFE' }}>
            {m}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={240} className="w-full rounded-xl" style={{ border: '1px solid #BFDBFE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `V: ${voltage}V`, val: voltage, min: 1, max: 24, set: (v: number) => { setVoltage(v); onEvent(`Voltage set to ${v}V — I = ${(v / Rtotal).toFixed(3)}A`); } },
          { label: `R1: ${r1}Ω`, val: r1, min: 10, max: 1000, set: (v: number) => { setR1(v); onEvent(`R1 changed to ${v}Ω`); } },
          { label: `R2: ${r2}Ω`, val: r2, min: 10, max: 1000, set: (v: number) => { setR2(v); onEvent(`R2 changed to ${v}Ω`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#3B82F6' }} className="w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[{ l: 'Total R', v: `${Rtotal.toFixed(1)}Ω`, c: '#3B82F6' }, { l: 'Current', v: `${I.toFixed(3)}A`, c: '#EF4444' }, { l: 'Power', v: `${P.toFixed(2)}W`, c: '#F59E0B' }].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl p-3 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{l}</p>
            <p className="font-sora font-bold text-lg" style={{ color: c }}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
