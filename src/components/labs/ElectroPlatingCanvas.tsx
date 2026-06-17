import { useState, useEffect, useRef } from 'react';

export default function ElectroPlatingCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [current, setCurrent] = useState(2);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [deposited, setDeposited] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const MW_Cu = 63.5, F = 96485, n = 2;

  // Faraday: m = (M * I * t) / (n * F)
  const calcMass = (i: number, t: number) => (MW_Cu * i * t) / (n * F) * 1000; // mg

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTime(t => {
          const newT = t + 1;
          const m = calcMass(current, newT);
          setDeposited(+m.toFixed(3));
          if (newT % 10 === 0) onEvent(`${newT}s elapsed: ${m.toFixed(3)}mg Cu deposited. Q = ${(current * newT).toFixed(0)}C (Faraday's law: m = MIt/nF)`);
          return newT;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, current, onEvent]);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // Beaker
    ctx.fillStyle = '#DBEAFE'; ctx.beginPath(); ctx.roundRect(60, 40, W - 120, H - 80, [0, 0, 16, 16]); ctx.fill();
    ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(60, 40, W - 120, H - 80, [0, 0, 16, 16]); ctx.stroke();
    ctx.fillStyle = '#BFDBFE'; ctx.font = '11px Inter,sans-serif'; ctx.fillText('CuSO₄ (aq)', W / 2 - 30, H / 2 + 10);
    // Cathode (iron) — left
    const cathodeH = 80; const depth = Math.min(cathodeH, deposited * 5);
    ctx.fillStyle = '#64748B'; ctx.fillRect(100, 60, 30, cathodeH); // iron
    ctx.fillStyle = '#B45309'; ctx.fillRect(100, 60 + cathodeH - depth, 30, depth); // copper layer
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText('Fe (−)', 100, 55);
    // Anode (copper) — right
    const anodeX = W - 130;
    ctx.fillStyle = '#B45309'; ctx.fillRect(anodeX, 60, 30, cathodeH);
    ctx.fillStyle = '#1C1917'; ctx.fillText('Cu (+)', anodeX, 55);
    // Bubbles at cathode
    if (running) {
      [108, 115, 122].forEach(bx => {
        ctx.beginPath(); ctx.arc(bx, 60 + cathodeH - depth - 10 - (Date.now() % 1000) / 100, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(219,234,254,0.7)'; ctx.fill();
      });
    }
    // Wire
    ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(115, 60); ctx.lineTo(115, 20); ctx.lineTo(anodeX + 15, 20); ctx.lineTo(anodeX + 15, 60); ctx.stroke();
    // Battery
    ctx.fillStyle = '#FEF3C7'; ctx.fillRect(W / 2 - 20, 8, 40, 20); ctx.strokeStyle = '#D97706'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 20, 8, 40, 20);
    ctx.fillStyle = '#92400E'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillText(`${current}A`, W / 2 - 8, 22);
    // Deposited mass
    ctx.fillStyle = '#B45309'; ctx.font = 'bold 12px Inter,sans-serif';
    ctx.fillText(`Cu deposited: ${deposited} mg`, 70, H - 12);
  }, [deposited, current, running]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={220} className="w-full rounded-xl" style={{ border: '1px solid #BFDBFE' }} />
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Current (A)', val: current.toFixed(1), color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
          { label: 'Time (s)', val: time, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
          { label: 'Mass (mg)', val: deposited, color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
        ].map(({ label, val, color, bg, border }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="font-inter text-xs mb-1" style={{ color: '#52796F' }}>{label}</p>
            <p className="font-sora font-bold text-xl" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>
      <div>
        <label className="font-inter text-xs font-semibold block mb-1" style={{ color: '#1C1917' }}>Current: {current}A</label>
        <input type="range" min={0.5} max={10} step={0.5} value={current} onChange={e => { setCurrent(+e.target.value); onEvent(`Current changed to ${+e.target.value}A`); }} style={{ accentColor: '#F59E0B' }} className="w-full" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setRunning(r => !r); onEvent(running ? 'Paused electroplating' : 'Started electroplating — Cu²⁺ ions migrating to cathode'); }}
          className="flex-1 py-3 rounded-xl text-sm font-sora font-bold" style={{ background: running ? '#EF4444' : '#F59E0B', color: '#FFF' }}>
          {running ? '⏸ Pause' : '⚡ Start Plating'}
        </button>
        <button onClick={() => { setRunning(false); setTime(0); setDeposited(0); onEvent('Reset electroplating'); }}
          className="px-4 py-3 rounded-xl text-sm font-inter" style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
      <p className="font-inter text-xs text-center" style={{ color: '#A8A29E' }}>Faraday's law: m = MIt/nF = {calcMass(current, 60).toFixed(2)}mg per minute</p>
    </div>
  );
}
