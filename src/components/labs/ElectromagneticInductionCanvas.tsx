import { useState, useRef, useEffect } from 'react';

export default function ElectromagneticInductionCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [speed, setSpeed] = useState(2);
  const [N, setN] = useState(100);
  const [B, setB] = useState(0.5);
  const [area, setArea] = useState(0.01);
  const [running, setRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  const maxEMF = N * B * area * speed; // Faraday's law: ε = -NBAω·sin(ωt), peak = NBAω

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    const coilH = 130, coilW = 120, coilX = W / 2 - coilW / 2, coilY = 30;
    const trailEMF: number[] = [];

    const draw = () => {
      tRef.current += 0.016 * speed;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Background field region
      const fieldCols = 8, fieldRows = 5;
      ctx.fillStyle = '#EFF6FF'; ctx.fillRect(coilX - 30, coilY - 10, coilW + 60, coilH + 20);
      for (let i = 0; i < fieldCols; i++) {
        for (let j = 0; j < fieldRows; j++) {
          const bx = coilX - 20 + i * (coilW + 40) / fieldCols;
          const by = coilY + j * coilH / fieldRows + 10;
          ctx.fillStyle = '#93C5FD'; ctx.font = 'bold 12px Inter,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('×', bx, by);
        }
      }
      ctx.textAlign = 'left';
      ctx.strokeStyle = '#BFDBFE'; ctx.lineWidth = 1.5;
      ctx.strokeRect(coilX - 30, coilY - 10, coilW + 60, coilH + 20);
      ctx.fillStyle = '#93C5FD'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(`B=${B}T (into page)`, coilX + coilW + 25, coilY - 2);
      ctx.textAlign = 'left';

      // Rotating coil (projected as ellipse)
      const angle = t % (Math.PI * 2);
      const yscale = Math.abs(Math.cos(angle)); // projection
      const coilColor = '#F59E0B';
      ctx.strokeStyle = coilColor; ctx.lineWidth = 3;
      ctx.strokeRect(coilX, coilY + coilH / 2 * (1 - yscale), coilW, coilH * yscale);
      // N label
      ctx.fillStyle = coilColor; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`N=${N}`, coilX + coilW / 2 - 15, coilY + coilH / 2 + 6);

      // Current direction indicator
      const emf = N * B * area * speed * Math.sin(angle);
      ctx.fillStyle = emf > 0 ? '#22C55E' : '#EF4444';
      ctx.font = 'bold 14px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(emf > 0.1 ? '↷' : emf < -0.1 ? '↶' : '—', coilX + coilW / 2, coilY + 20);
      ctx.textAlign = 'left';

      // EMF trail graph
      trailEMF.push(emf);
      if (trailEMF.length > W - 280) trailEMF.shift();
      const graphX = W - 200, graphY = 20, graphW = 180, graphH = coilH + 20;
      ctx.fillStyle = '#F5F3FF'; ctx.fillRect(graphX, graphY, graphW, graphH);
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1; ctx.strokeRect(graphX, graphY, graphW, graphH);
      ctx.strokeStyle = '#DDD6FE'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(graphX, graphY + graphH / 2); ctx.lineTo(graphX + graphW, graphY + graphH / 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#8B5CF6'; ctx.lineWidth = 2;
      ctx.beginPath();
      trailEMF.forEach((e, i) => {
        const x = graphX + i, y = graphY + graphH / 2 - (e / maxEMF) * (graphH / 2 - 10);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = '#8B5CF6'; ctx.font = '9px Inter,sans-serif';
      ctx.fillText('EMF(t)', graphX + 4, graphY + 12);
      ctx.fillStyle = '#EF4444'; ctx.font = 'bold 10px Inter,sans-serif';
      ctx.fillText(`ε=${emf.toFixed(3)}V`, graphX + 4, graphY + graphH - 4);

      // Labels
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`ε_max = NBAω = ${maxEMF.toFixed(3)} V`, 12, H - 36);
      ctx.fillStyle = '#8B5CF6'; ctx.font = '10px Inter,sans-serif';
      ctx.fillText(`ε(t) = NBAω·sin(ωt) = ${emf.toFixed(4)} V`, 12, H - 18);

      if (running) rafRef.current = requestAnimationFrame(draw);
    };
    if (running) rafRef.current = requestAnimationFrame(draw);
    else {
      // Static diagram
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#EFF6FF'; ctx.fillRect(coilX - 30, coilY - 10, coilW + 60, coilH + 20);
      ctx.strokeStyle = '#BFDBFE'; ctx.lineWidth = 1.5; ctx.strokeRect(coilX - 30, coilY - 10, coilW + 60, coilH + 20);
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 3; ctx.strokeRect(coilX, coilY + 10, coilW, coilH - 20);
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`ε_max = NBAω = ${maxEMF.toFixed(3)} V`, 12, H - 20);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed, N, B, area, maxEMF]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={220} className="w-full rounded-xl" style={{ border: '1px solid #FDE68A', background: '#FFFBEB' }} />
      <div className="grid grid-cols-2 gap-3">
        {[{ l: `Angular speed ω: ${speed} rad/s`, v: speed, s: setSpeed, min: 0.5, max: 10, step: 0.5 },
          { l: `Turns N: ${N}`, v: N, s: setN, min: 10, max: 500, step: 10 },
          { l: `B field: ${B} T`, v: B, s: setB, min: 0.1, max: 2, step: 0.1 },
          { l: `Area A: ${area.toFixed(3)} m²`, v: area * 1000, s: (v:number)=>setArea(v/1000), min: 1, max: 50 }].map(({ l, v, s, min, max, step }) => (
          <div key={l} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{l}</label>
            <input type="range" min={min} max={max} step={step ?? 1} value={v} onChange={e => { s(+e.target.value); onEvent(`ε_max = ${maxEMF.toFixed(3)} V`); }} style={{ accentColor: '#F59E0B' }} className="w-full" />
          </div>
        ))}
      </div>
      <button onClick={() => setRunning(r => !r)} className="py-3 rounded-xl text-sm font-sora font-bold"
        style={{ background: running ? '#EF4444' : '#F59E0B', color: '#FFF' }}>
        {running ? '⏹ Stop' : '▶ Start Rotation'}
      </button>
    </div>
  );
}
