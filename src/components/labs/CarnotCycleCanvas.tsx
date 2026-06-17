import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

const STAGES = ['1→2: Isothermal Expansion', '2→3: Adiabatic Expansion', '3→4: Isothermal Compression', '4→1: Adiabatic Compression'];
const STAGE_COLORS = ['#1B4332', '#2D6A4F', '#F59E0B', '#D97706'];

export default function CarnotCycleCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [Th, setTh] = useState(600);
  const [Tc, setTc] = useState(300);
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ Th: 600, Tc: 300, progress: 0, running: false, stage: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function pvCurve(V: number, C: number, gamma = 1.4) { return C / Math.pow(V, gamma); }

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      const padL = 70, padB = 50, padR = 30, padT = 30;
      const chartW = W - padL - padR, chartH = H - padB - padT;

      // Axes
      ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + chartH);
      ctx.lineTo(padL + chartW, padT + chartH); ctx.stroke();
      ctx.fillStyle = '#1C1917'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText('Pressure (P)', padL - 5, padT - 10);
      ctx.fillText('Volume (V) →', padL + chartW - 60, padT + chartH + 20);

      // Map PV to canvas
      const Vmin = 1, Vmax = 4, Pmin = 0.5, Pmax = 8;
      const tx = (v: number) => padL + ((v - Vmin) / (Vmax - Vmin)) * chartW;
      const ty = (p: number) => padT + chartH - ((p - Pmin) / (Pmax - Pmin)) * chartH;

      // Carnot cycle points
      const V1 = 1.2, V2 = 2.2, V3 = 3.2, V4 = 1.8;
      const P1 = 6.5, P2 = P1 * V1 / V2;
      const P3 = P2 * Math.pow(V2 / V3, 1.4);
      const P4 = P1 * Math.pow(V1 / V4, 1.4);

      const pts = [{ V: V1, P: P1 }, { V: V2, P: P2 }, { V: V3, P: P3 }, { V: V4, P: P4 }];

      // Draw all 4 segments
      const SEGS: Array<[{ V: number; P: number }, { V: number; P: number }, string, boolean]> = [
        [pts[0], pts[1], STAGE_COLORS[0], false],
        [pts[1], pts[2], STAGE_COLORS[1], true],
        [pts[2], pts[3], STAGE_COLORS[2], false],
        [pts[3], pts[0], STAGE_COLORS[3], true],
      ];
      SEGS.forEach(([a, b, col, adiab]) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (!adiab) {
          // Isothermal: PV = const
          const C = a.P * a.V;
          for (let v = Math.min(a.V, b.V); v <= Math.max(a.V, b.V); v += 0.05) {
            const p = C / v;
            v === Math.min(a.V, b.V) ? ctx.moveTo(tx(v), ty(p)) : ctx.lineTo(tx(v), ty(p));
          }
        } else {
          // Adiabatic: PV^gamma = const
          const C = a.P * Math.pow(a.V, 1.4);
          for (let v = Math.min(a.V, b.V); v <= Math.max(a.V, b.V); v += 0.05) {
            const p = pvCurve(v, C);
            v === Math.min(a.V, b.V) ? ctx.moveTo(tx(v), ty(p)) : ctx.lineTo(tx(v), ty(p));
          }
        }
        ctx.stroke();
      });

      // Points
      pts.forEach((p, i) => {
        ctx.beginPath(); ctx.arc(tx(p.V), ty(p.P), 6, 0, Math.PI * 2);
        ctx.fillStyle = STAGE_COLORS[i % 4]; ctx.fill();
        ctx.fillStyle = '#1C1917'; ctx.font = '700 11px Inter,sans-serif';
        ctx.fillText(`${i + 1}`, tx(p.V) + 8, ty(p.P) - 6);
      });

      // Efficiency
      const eta = (1 - s.Tc / s.Th) * 100;
      ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(`Th = ${s.Th} K`, W - 120, padT + 20);
      ctx.fillText(`Tc = ${s.Tc} K`, W - 120, padT + 40);
      ctx.fillStyle = '#1B4332'; ctx.font = '700 14px Inter,sans-serif';
      ctx.fillText(`η = 1 - Tc/Th = ${eta.toFixed(1)}%`, padL, padT - 10);

      // Stage labels
      ctx.font = '600 11px Inter,sans-serif';
      STAGES.forEach((st, i) => {
        ctx.fillStyle = STAGE_COLORS[i];
        ctx.fillText(`${i + 1}. ${st.split(':')[1]}`, padL, padT + chartH + 38 + (i < 2 ? 0 : 16));
        if (i === 1) { ctx.fillText('', 0, 0); }
      });

      // Running animation dot
      if (s.running) {
        s.progress = (s.progress + 0.5) % 100;
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={360} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 300 }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Hot Reservoir Th: {Th} K</label>
          <input type="range" min={400} max={900} value={Th}
            onChange={e => { stateRef.current.Th = +e.target.value; setTh(+e.target.value); onEvent(`Set hot reservoir temperature to ${e.target.value} K`); }}
            style={{ accentColor: '#DC2626' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Cold Reservoir Tc: {Tc} K</label>
          <input type="range" min={100} max={400} value={Tc}
            onChange={e => { stateRef.current.Tc = +e.target.value; setTc(+e.target.value); onEvent(`Set cold reservoir temperature to ${e.target.value} K`); }}
            style={{ accentColor: '#2563EB' }} className="w-full" />
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#F0F7F3', border: '1px solid #BBF7D0' }}>
        <span className="font-inter text-sm font-semibold" style={{ color: '#1B4332' }}>
          Carnot Efficiency: {((1 - Tc / Th) * 100).toFixed(1)}% — No real engine can exceed this
        </span>
      </div>
    </div>
  );
}
