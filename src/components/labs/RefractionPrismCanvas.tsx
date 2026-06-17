import { useState, useEffect, useRef } from 'react';

export default function RefractionPrismCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [n, setN] = useState(1.5); // refractive index
  const [angle, setAngle] = useState(45); // incident angle degrees
  const [prismAngle, setPrismAngle] = useState(60);
  const [showDispersion, setShowDispersion] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, prismH = 200, prismW = prismH * Math.tan((prismAngle / 2) * Math.PI / 180) * 2;
    const tipX = cx, tipY = 60, baseY = tipY + prismH;
    const baseLeft = tipX - prismW / 2, baseRight = tipX + prismW / 2;

    // Prism
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(baseLeft, baseY); ctx.lineTo(baseRight, baseY); ctx.closePath();
    ctx.fillStyle = 'rgba(147,197,253,0.25)'; ctx.fill();
    ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#3B82F6'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`n=${n}`, cx, baseY - 10); ctx.fillText(`α=${prismAngle}°`, cx, baseY - 25); ctx.textAlign = 'left';

    // Incident ray
    const incidentRad = angle * Math.PI / 180;
    const entryX = baseLeft + prismW * 0.3, entryY = tipY + prismH * 0.6;
    const incRayLen = 120;
    const incStartX = entryX - incRayLen * Math.sin(incidentRad);
    const incStartY = entryY - incRayLen * Math.cos(incidentRad);
    ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(incStartX, incStartY); ctx.lineTo(entryX, entryY); ctx.stroke();
    ctx.fillStyle = '#FFF'; ctx.font = '10px Inter,sans-serif';
    ctx.fillText(`θ₁=${angle}°`, incStartX + 5, incStartY + 15);

    // Snell's law: n₁ sin(θ₁) = n₂ sin(θ₂)
    const sinT2 = Math.sin(incidentRad) / n;
    const critAngle = Math.asin(1 / n);
    const isTIR = sinT2 >= 1;

    if (isTIR) {
      ctx.fillStyle = '#EF4444'; ctx.font = 'bold 12px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Total Internal Reflection', cx, H - 20); ctx.textAlign = 'left';
    } else {
      const refractedAngle = Math.asin(sinT2);
      // Inside prism - assume hitting exit face
      const exitX = entryX + 80, exitY = baseY - 20;
      ctx.strokeStyle = 'rgba(147,197,253,0.8)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(entryX, entryY); ctx.lineTo(exitX, exitY); ctx.stroke();

      if (showDispersion) {
        const colors = [
          { n2: n + 0.03, col: '#EF4444', lbl: 'Red' },
          { n2: n + 0.02, col: '#F97316', lbl: 'Orange' },
          { n2: n + 0.01, col: '#EAB308', lbl: 'Yellow' },
          { n2: n, col: '#22C55E', lbl: 'Green' },
          { n2: n - 0.01, col: '#3B82F6', lbl: 'Blue' },
          { n2: n - 0.02, col: '#6366F1', lbl: 'Violet' },
        ];
        colors.forEach(({ n2, col, lbl }) => {
          const sinExit = n2 * Math.sin(refractedAngle);
          if (Math.abs(sinExit) >= 1) return;
          const exitAngle = Math.asin(sinExit);
          const len = 120;
          const ex = exitX + len * Math.sin(exitAngle);
          const ey = exitY + len * Math.cos(exitAngle);
          ctx.strokeStyle = col; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(exitX, exitY); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.fillStyle = col; ctx.font = '9px Inter,sans-serif';
          ctx.fillText(lbl, ex + 3, ey);
        });
      } else {
        const sinExit = n * Math.sin(refractedAngle);
        if (Math.abs(sinExit) < 1) {
          const exitAngle = Math.asin(sinExit);
          const len = 120;
          ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(exitX, exitY);
          ctx.lineTo(exitX + len * Math.sin(exitAngle), exitY + len * Math.cos(exitAngle)); ctx.stroke();
        }
      }
      // Normal lines
      ctx.strokeStyle = '#A8A29E'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(entryX, entryY - 40); ctx.lineTo(entryX, entryY + 40); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#1C1917'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`θ₂=${(refractedAngle * 180 / Math.PI).toFixed(1)}°`, entryX + 5, entryY + 25);
      ctx.fillStyle = '#52796F'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`Critical angle: ${(critAngle * 180 / Math.PI).toFixed(1)}°`, 10, H - 8);
    }
    // Snell label
    ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText(`Snell's Law: n₁ sin(θ₁) = n₂ sin(θ₂)`, 10, 22);
  }, [n, angle, prismAngle, showDispersion]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={300} className="w-full rounded-xl" style={{ border: '1px solid #BFDBFE', background: '#1C1917' }} />
      <div className="grid grid-cols-2 gap-3">
        {[{ l: `Refractive index n: ${n}`, v: n * 10, s: (v:number)=>{ setN(v/10); onEvent(`n=${v/10} — critical angle=${(Math.asin(10/v)*180/Math.PI).toFixed(1)}°`); }, min: 10, max: 25 },
          { l: `Incident angle: ${angle}°`, v: angle, s: (v:number)=>{setAngle(v); onEvent(`θ₁=${v}° — refracted = ${(Math.asin(Math.sin(v*Math.PI/180)/n)*180/Math.PI).toFixed(1)}°`);}, min: 5, max: 85 },
          { l: `Prism angle α: ${prismAngle}°`, v: prismAngle, s: setPrismAngle, min: 20, max: 80 }].map(({ l, v, s, min, max }) => (
          <div key={l} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{l}</label>
            <input type="range" min={min} max={max} value={v} onChange={e => s(+e.target.value)} style={{ accentColor: '#3B82F6' }} className="w-full" />
          </div>
        ))}
        <label className="flex items-center gap-2 cursor-pointer col-span-2">
          <input type="checkbox" checked={showDispersion} onChange={e => { setShowDispersion(e.target.checked); onEvent(e.target.checked ? 'Dispersion on — white light splits into spectrum' : 'Dispersion off — single wavelength'); }} />
          <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Show chromatic dispersion (white light → spectrum)</span>
        </label>
      </div>
    </div>
  );
}
