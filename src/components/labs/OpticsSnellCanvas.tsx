import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

const MEDIA = [
  { label: 'Air', n: 1.0 }, { label: 'Water', n: 1.33 },
  { label: 'Glass', n: 1.5 }, { label: 'Diamond', n: 2.42 },
];

export default function OpticsSnellCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [incidence, setIncidence] = useState(40);
  const [n2idx, setN2idx] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Top medium (air)
      ctx.fillStyle = '#EFF6FF'; ctx.fillRect(0, 0, W, H / 2);
      // Bottom medium
      ctx.fillStyle = MEDIA[n2idx].n > 1.4 ? '#D1FAE5' : '#DBEAFE';
      ctx.fillRect(0, H / 2, W, H / 2);

      // Interface
      ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      ctx.setLineDash([]);

      // Normal line
      ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(W / 2, 20); ctx.lineTo(W / 2, H - 20); ctx.stroke();
      ctx.setLineDash([]);

      const cx = W / 2, cy = H / 2;
      const n1 = 1.0, n2 = MEDIA[n2idx].n;
      const thetaI = (incidence * Math.PI) / 180;
      const sinTR = (n1 / n2) * Math.sin(thetaI);
      const totalInternalReflection = sinTR > 1;

      // Incident ray
      const len = 160;
      const ix = cx - len * Math.sin(thetaI);
      const iy = cy - len * Math.cos(thetaI);
      ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(cx, cy); ctx.stroke();
      // Arrow
      ctx.fillStyle = '#FBBF24';
      const ix2 = cx - 30 * Math.sin(thetaI), iy2 = cy - 30 * Math.cos(thetaI);
      ctx.beginPath(); ctx.arc(ix2, iy2, 4, 0, Math.PI * 2); ctx.fill();

      if (!totalInternalReflection) {
        const thetaR = Math.asin(sinTR);
        const rx = cx + len * Math.sin(thetaR);
        const ry = cy + len * Math.cos(thetaR);
        ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(rx, ry); ctx.stroke();
        ctx.fillStyle = '#1B4332';
        const rx2 = cx + 50 * Math.sin(thetaR), ry2 = cy + 50 * Math.cos(thetaR);
        ctx.beginPath(); ctx.arc(rx2, ry2, 4, 0, Math.PI * 2); ctx.fill();

        // Angle arcs
        ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, 40, -Math.PI / 2 - thetaI, -Math.PI / 2); ctx.stroke();
        ctx.strokeStyle = '#1B4332';
        ctx.beginPath(); ctx.arc(cx, cy, 40, Math.PI / 2, Math.PI / 2 + thetaR); ctx.stroke();

        ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText(`θ₁ = ${incidence}°`, cx - 90, cy - 50);
        ctx.fillText(`θ₂ = ${(thetaR * 180 / Math.PI).toFixed(1)}°`, cx + 48, cy + 55);
      } else {
        // Reflected ray
        const rx = cx + len * Math.sin(thetaI), ry = cy - len * Math.cos(thetaI);
        ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 3;
        ctx.setLineDash([8, 5]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(rx, ry); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#DC2626'; ctx.font = '700 13px Inter,sans-serif';
        ctx.fillText('Total Internal Reflection', cx - 100, cy + 30);
      }

      // Labels
      ctx.fillStyle = '#1E3A5F'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText(`n₁ = ${n1} (Air)`, 14, 24);
      ctx.fillText(`n₂ = ${n2} (${MEDIA[n2idx].label})`, 14, H / 2 + 22);
      ctx.fillStyle = '#1C1917'; ctx.font = '600 11px Inter,sans-serif';
      const lhs = (n1 * Math.sin(thetaI)).toFixed(3);
      const rhs = totalInternalReflection ? 'TIR' : (n2 * Math.asin(sinTR)).toFixed(3);
      ctx.fillText(`n₁·sin(θ₁) = ${lhs}`, W - 180, 24);
      ctx.fillText(`n₂·sin(θ₂) = ${totalInternalReflection ? 'N/A' : rhs}`, W - 180, 42);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [incidence, n2idx]);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={380} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 340 }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Angle of Incidence: {incidence}°</label>
          <input type="range" min={1} max={89} value={incidence}
            onChange={e => { setIncidence(+e.target.value); onEvent(`Changed angle of incidence to ${e.target.value}°`); }}
            style={{ accentColor: '#1B4332' }} className="w-full" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Medium 2</label>
          <div className="flex gap-2 flex-wrap">
            {MEDIA.slice(1).map((m, i) => (
              <button key={m.label} onClick={() => { setN2idx(i + 1); onEvent(`Changed medium 2 to ${m.label} (n=${m.n})`); }}
                className="px-3 py-1.5 rounded-lg text-xs font-inter font-semibold transition-all"
                style={{ background: n2idx === i + 1 ? '#1B4332' : '#F0F7F3', color: n2idx === i + 1 ? '#FFFFFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
