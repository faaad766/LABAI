import { useState, useEffect, useRef } from 'react';

export default function CapacitorCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [R, setR] = useState(10000);
  const [C, setC] = useState(100);
  const [V0, setV0] = useState(9);
  const [charging, setCharging] = useState<boolean|null>(null);
  const [t, setT] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<{ t: number; v: number }[]>([{ t: 0, v: 0 }]);
  const tauMs = (R * C * 1e-6 * 1000);
  const tau = R * C * 1e-6;
  const currentV = charging === true ? V0 * (1 - Math.exp(-t / tau)) : charging === false ? V0 * Math.exp(-t / tau) : 0;

  useEffect(() => {
    if (charging !== null) {
      timerRef.current = setInterval(() => {
        setT(prev => {
          const next = prev + tau / 10;
          const v = charging ? V0 * (1 - Math.exp(-next / tau)) : V0 * Math.exp(-next / tau);
          histRef.current = [...histRef.current.slice(-80), { t: next, v }];
          if (Math.round(next / tau * 10) % 10 === 0) {
            onEvent(`t=${next.toFixed(2)}s: V=${v.toFixed(2)}V (τ=${tau.toFixed(2)}s). ${charging ? 'Charging' : 'Discharging'} through R=${(R/1000).toFixed(0)}kΩ, C=${C}μF`);
          }
          return next;
        });
      }, 200);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [charging, tau, V0, R, C, onEvent]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // Axes
    ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      const y = H - frac * (H - 20) - 10;
      ctx.beginPath(); ctx.moveTo(35, y); ctx.lineTo(W - 10, y); ctx.stroke();
      ctx.fillStyle = '#A8A29E'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`${(frac * V0).toFixed(1)}V`, 2, y + 4);
    });
    // τ line
    const tauX = 35 + Math.min((tau / (tau * 5)) * (W - 45), W - 45);
    ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(tauX, 10); ctx.lineTo(tauX, H - 10); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#D97706'; ctx.font = '10px Inter,sans-serif';
    ctx.fillText('τ', tauX + 2, 22);
    // Curve
    if (histRef.current.length > 1) {
      ctx.beginPath(); ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2.5;
      const maxT = tau * 5;
      histRef.current.forEach((pt, i) => {
        const x = 35 + (pt.t / maxT) * (W - 45);
        const y = H - (pt.v / V0) * (H - 20) - 10;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    // Current voltage indicator
    const vX = 35 + Math.min((t / (tau * 5)) * (W - 45), W - 45);
    const vY = H - (currentV / V0) * (H - 20) - 10;
    ctx.beginPath(); ctx.arc(vX, vY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444'; ctx.fill();
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText(`V=${currentV.toFixed(2)}V`, W - 90, 20);
  }, [t, currentV, tau, V0]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={200} className="w-full rounded-xl" style={{ border: '1px solid #BFDBFE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <p className="font-inter text-xs" style={{ color: '#52796F' }}>Capacitor Voltage</p>
          <p className="font-sora font-bold text-2xl" style={{ color: '#3B82F6' }}>{currentV.toFixed(2)}V</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <p className="font-inter text-xs" style={{ color: '#52796F' }}>Time Constant τ = RC</p>
          <p className="font-sora font-bold text-2xl" style={{ color: '#D97706' }}>{tauMs.toFixed(0)}ms</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `V₀: ${V0}V`, val: V0, min: 1, max: 24, set: (v: number) => { setV0(v); setT(0); histRef.current = [{ t: 0, v: 0 }]; onEvent(`Supply voltage: ${v}V`); } },
          { label: `R: ${(R/1000).toFixed(0)}kΩ`, val: R, min: 1000, max: 100000, set: (v: number) => { setR(v); setT(0); histRef.current = [{ t: 0, v: 0 }]; onEvent(`Resistance: ${(v/1000).toFixed(0)}kΩ — τ=${(v * C * 1e-6 * 1000).toFixed(0)}ms`); } },
          { label: `C: ${C}μF`, val: C, min: 1, max: 1000, set: (v: number) => { setC(v); setT(0); histRef.current = [{ t: 0, v: 0 }]; onEvent(`Capacitance: ${v}μF`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#3B82F6' }} className="w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setCharging(true); setT(0); histRef.current = [{ t: 0, v: 0 }]; onEvent(`Charging capacitor: V rises as V₀(1−e^{−t/τ}), τ=${tauMs.toFixed(0)}ms`); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#3B82F6', color: '#FFF' }}>
          ⚡ Charge
        </button>
        <button onClick={() => { setCharging(false); setT(0); histRef.current = [{ t: 0, v: V0 }]; onEvent(`Discharging capacitor: V drops as V₀·e^{−t/τ}`); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: '#EF4444', color: '#FFF' }}>
          ↓ Discharge
        </button>
        <button onClick={() => { setCharging(null); setT(0); histRef.current = [{ t: 0, v: 0 }]; onEvent('Reset capacitor'); }}
          className="px-4 py-3 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
