import { useState, useEffect, useRef } from 'react';

export default function RcCircuitCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [freq, setFreq] = useState(100);
  const [R, setR] = useState(1000);
  const [C, setC] = useState(10);
  const [mode, setMode] = useState<'RC'|'RL'>('RC');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const rafRef = useRef<number>(0);
  const L = 0.1; // 0.1 H

  const omega = 2 * Math.PI * freq;
  const XC = mode === 'RC' ? 1 / (omega * C * 1e-6) : omega * L;
  const Z = Math.sqrt(R * R + XC * XC);
  const phase = Math.atan(XC / R);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    let prev = performance.now();
    const draw = (now: number) => {
      tRef.current += (now - prev) / 1000; prev = now;
      ctx.clearRect(0, 0, W, H);
      const t = tRef.current;
      // Draw V and I waveforms
      const midV = 60, midI = 150, amp = 40;
      // Voltage
      ctx.beginPath(); ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2.5;
      for (let x = 0; x < W; x++) {
        const angle = omega * (t + (x / W) * 0.02);
        const y = midV - amp * Math.sin(angle);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Current (phase shifted)
      ctx.beginPath(); ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2.5;
      for (let x = 0; x < W; x++) {
        const angle = omega * (t + (x / W) * 0.02) - phase;
        const y = midI - amp * Math.sin(angle);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Labels
      ctx.fillStyle = '#3B82F6'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.fillText('V(t)', 5, midV - 44);
      ctx.fillStyle = '#EF4444'; ctx.fillText('I(t)', 5, midI - 44);
      // Phase info
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 12px Inter,sans-serif';
      ctx.fillText(`φ = ${(phase * 180 / Math.PI).toFixed(1)}°`, W / 2 - 30, H - 8);
      // Phasor diagram
      const px = W - 80, py = 100, scale = 35;
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - 45, py); ctx.lineTo(px + 45, py); ctx.moveTo(px, py - 45); ctx.lineTo(px, py + 45); ctx.stroke();
      ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + scale, py); ctx.stroke(); // R
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px + scale, py); ctx.lineTo(px + scale, py - (mode === 'RC' ? 1 : -1) * XC / Z * scale); ctx.stroke(); // XC
      ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + R / Z * scale, py - (mode === 'RC' ? 1 : -1) * XC / Z * scale); ctx.stroke(); // Z
      ctx.fillStyle = '#52796F'; ctx.font = '9px Inter,sans-serif';
      ctx.fillText('R', px + scale / 2, py - 4);
      ctx.fillText(mode === 'RC' ? 'Xc' : 'XL', px + scale + 3, py - 10);
      ctx.fillText('Z', px + R / Z * scale / 2 - 10, py - (mode === 'RC' ? 1 : -1) * XC / Z * scale / 2);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [freq, R, C, mode, omega, XC, Z, phase]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['RC','RL'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); onEvent(`Switched to ${m} circuit analysis`); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: mode === m ? '#8B5CF6' : '#F5F3FF', color: mode === m ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {m} Circuit
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={200} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#1C1917' }} />
      <div className="grid grid-cols-3 gap-2">
        {[{ l: 'Impedance Z', v: `${Z.toFixed(0)}Ω`, c: '#8B5CF6' }, { l: mode === 'RC' ? 'Xc' : 'XL', v: `${XC.toFixed(0)}Ω`, c: '#F59E0B' }, { l: 'Phase φ', v: `${(phase * 180 / Math.PI).toFixed(1)}°`, c: '#EF4444' }].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl p-3 text-center" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{l}</p>
            <p className="font-sora font-bold text-lg" style={{ color: c }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `f: ${freq}Hz`, val: freq, min: 10, max: 1000, set: (v: number) => { setFreq(v); onEvent(`Frequency: ${v}Hz — Xc=${(1/(2*Math.PI*v*C*1e-6)).toFixed(0)}Ω`); } },
          { label: `R: ${R}Ω`, val: R, min: 100, max: 5000, set: (v: number) => { setR(v); onEvent(`Resistance: ${v}Ω`); } },
          { label: `C: ${C}μF`, val: C, min: 1, max: 100, set: (v: number) => { setC(v); onEvent(`Capacitance: ${v}μF`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
