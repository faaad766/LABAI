import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type ReactionType = 'exothermic' | 'endothermic';
interface DataPoint { t: number; temp: number; }

export default function CalorimetryCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [reactionType, setReactionType] = useState<ReactionType>('exothermic');
  const [reacting, setReacting] = useState(false);
  const [currentTemp, setCurrentTemp] = useState(22);
  const reactingRef = useRef(false);
  const reactionTypeRef = useRef<ReactionType>('exothermic');
  const tempRef = useRef(22);
  const startTempRef = useRef(22);
  const timeRef = useRef(0);
  const dataRef = useRef<DataPoint[]>([{ t: 0, temp: 22 }]);
  const reactionTimeRef = useRef(0);

  const startReaction = () => {
    if (reactingRef.current) return;
    reactingRef.current = true;
    setReacting(true);
    startTempRef.current = tempRef.current;
    reactionTimeRef.current = 0;
    const type = reactionTypeRef.current;
    onEvent(`${type === 'exothermic' ? 'Exothermic (hand warmer)' : 'Endothermic (ice pack)'} reaction started! Temperature is ${type === 'exothermic' ? 'rising' : 'dropping'}. Why does this happen at the molecular level?`);
  };

  const selectType = (t: ReactionType) => {
    if (reactingRef.current) return;
    reactionTypeRef.current = t;
    setReactionType(t);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Update temperature
      if (reactingRef.current) {
        reactionTimeRef.current += 0.016;
        const rt = reactionTimeRef.current;
        const isExo = reactionTypeRef.current === 'exothermic';
        const deltaT = isExo ? 18 : -12;
        const target = startTempRef.current + deltaT;
        const curve = rt < 5 ? Math.sin((rt / 5) * Math.PI / 2) : Math.cos(((rt - 5) / 15) * Math.PI / 2);
        tempRef.current = startTempRef.current + deltaT * Math.max(0, Math.min(1, rt < 5 ? curve : curve));
        if (rt > 20) { reactingRef.current = false; setReacting(false); onEvent(`Reaction complete! ΔT = ${(tempRef.current - startTempRef.current).toFixed(1)}°C. Is this reaction releasing or absorbing energy from surroundings?`); }
        void target;
      }
      setCurrentTemp(Math.round(tempRef.current * 10) / 10);

      // Track data
      if (dataRef.current.length === 0 || t - dataRef.current[dataRef.current.length-1].t > 0.25) {
        dataRef.current.push({ t, temp: tempRef.current });
        if (dataRef.current.length > 120) dataRef.current.shift();
      }

      // Calorimeter cup
      const cx = W * 0.3, cy = H * 0.52;
      const cupW = W * 0.3, cupH = H * 0.48;
      // Outer cup
      const cupGrad = ctx.createLinearGradient(cx - cupW/2, 0, cx + cupW/2, 0);
      cupGrad.addColorStop(0, 'rgba(180,200,255,0.1)');
      cupGrad.addColorStop(0.5, 'rgba(180,200,255,0.2)');
      cupGrad.addColorStop(1, 'rgba(180,200,255,0.1)');
      ctx.fillStyle = cupGrad;
      ctx.strokeStyle = 'rgba(180,200,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(cx - cupW/2, cy - cupH/2, cupW, cupH, 8); ctx.fill(); ctx.stroke();
      // Insulation
      ctx.strokeStyle = 'rgba(255,200,100,0.2)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(cx - cupW/2 + 3, cy - cupH/2 + 3, cupW - 6, cupH - 6, 6); ctx.stroke();

      // Solution fill
      const tempColor = tempRef.current > 35 ? '#FF4444' : tempRef.current < 15 ? '#4488FF' : '#44AAFF';
      const solGrad = ctx.createRadialGradient(cx, cy + 10, 0, cx, cy, cupW*0.4);
      solGrad.addColorStop(0, tempColor + '40');
      solGrad.addColorStop(1, tempColor + '18');
      ctx.fillStyle = solGrad;
      ctx.beginPath(); ctx.roundRect(cx - cupW/2 + 5, cy - cupH/2 + 5, cupW - 10, cupH - 10, 5); ctx.fill();

      // Stirrer rod
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - cupH/2 - 15); ctx.lineTo(cx, cy + cupH/2 - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 12, cy + cupH/4); ctx.lineTo(cx + 12, cy + cupH/4); ctx.stroke();

      // Thermometer
      const thx = cx + cupW * 0.25;
      ctx.fillStyle = 'rgba(180,200,255,0.25)';
      ctx.beginPath(); ctx.roundRect(thx - 3, cy - cupH/2 - 10, 6, cupH * 0.8, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(180,200,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();
      const mercuryH = (cupH * 0.7) * ((tempRef.current - 5) / 55);
      ctx.fillStyle = tempColor;
      ctx.beginPath(); ctx.roundRect(thx - 2, cy + cupH/2 - 30 - mercuryH, 4, mercuryH, 2); ctx.fill();
      ctx.beginPath(); ctx.arc(thx, cy + cupH/2 - 26, 6, 0, Math.PI*2);
      ctx.fillStyle = tempColor; ctx.fill();

      // Heat particles (exothermic) or cold particles (endothermic)
      if (reactingRef.current) {
        const isExo = reactionTypeRef.current === 'exothermic';
        for (let i = 0; i < 5; i++) {
          const angle = (i/5) * Math.PI * 2 + t * (isExo ? 2 : -1);
          const r = 15 + Math.random() * 20;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r * 0.5;
          ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = isExo ? 'rgba(255,100,50,0.6)' : 'rgba(100,150,255,0.6)';
          ctx.fill();
        }
      }

      // Temperature label on cup
      ctx.fillStyle = tempColor; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${tempRef.current.toFixed(1)}°C`, cx, cy + cupH/2 + 20);

      // Live graph (right side)
      const gx = W * 0.62, gy = H * 0.08, gw = W * 0.33, gh = H * 0.58;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, 6); ctx.fill(); ctx.stroke();

      // Y axis
      const tempMin = 0, tempMax = 55;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx+24, gy+8); ctx.lineTo(gx+24, gy+gh-20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx+24, gy+gh-20); ctx.lineTo(gx+gw-8, gy+gh-20); ctx.stroke();

      // Y labels
      ctx.fillStyle = 'rgba(226,232,240,0.4)'; ctx.font = '8px Inter';
      [0,20,40,55].forEach(tv => {
        const ty2 = gy+gh-20 - ((tv-tempMin)/(tempMax-tempMin))*(gh-28);
        ctx.textAlign = 'right'; ctx.fillText(`${tv}°`, gx+22, ty2+3);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(gx+24, ty2); ctx.lineTo(gx+gw-8, ty2); ctx.stroke();
      });

      // Axis labels
      ctx.fillStyle = 'rgba(226,232,240,0.4)'; ctx.font = '8px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Time (s)', gx+gw/2+8, gy+gh-6);
      ctx.save(); ctx.translate(gx+8, gy+gh/2); ctx.rotate(-Math.PI/2);
      ctx.fillText('Temp (°C)', 0, 0); ctx.restore();

      // Data line
      const data = dataRef.current;
      if (data.length > 2) {
        const tMin = data[0].t, tMax = Math.max(data[data.length-1].t, tMin + 10);
        ctx.beginPath();
        data.forEach((d, i) => {
          const dx = gx + 24 + ((d.t - tMin) / (tMax - tMin)) * (gw - 32);
          const dy = gy + gh - 20 - ((d.temp - tempMin) / (tempMax - tempMin)) * (gh - 28);
          i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy);
        });
        ctx.strokeStyle = tempRef.current > 22 ? '#EF4444' : '#3B82F6';
        ctx.lineWidth = 2; ctx.stroke();
        // Current point glow
        const ld = data[data.length-1];
        const ldx = gx + 24 + ((ld.t - tMin) / (tMax - tMin)) * (gw - 32);
        const ldy = gy + gh - 20 - ((ld.temp - tempMin) / (tempMax - tempMin)) * (gh - 28);
        ctx.beginPath(); ctx.arc(ldx, ldy, 4, 0, Math.PI*2);
        ctx.fillStyle = tempRef.current > 22 ? '#EF4444' : '#3B82F6'; ctx.fill();
      }

      // Energy diagram overlay
      const edx = gx + gw * 0.6, edy = gy + 12, edw = gw * 0.38, edh = gh * 0.38;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.roundRect(edx, edy, edw, edh, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.8; ctx.stroke();
      const isExo = reactionTypeRef.current === 'exothermic';
      // Energy curve
      ctx.strokeStyle = isExo ? '#EF4444' : '#3B82F6'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const px2 = edx + (i/40)*edw;
        const gaussH = edh * 0.5 * Math.exp(-0.5*Math.pow((i-20)/8,2));
        const endH = isExo ? edh * 0.6 : edh * 0.2;
        const startH = isExo ? edh * 0.2 : edh * 0.6;
        const py2 = edy + edh - 8 - (startH + ((endH-startH)*(i/40)) + gaussH);
        i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(226,232,240,0.5)'; ctx.font = '7px Inter'; ctx.textAlign = 'center';
      ctx.fillText(isExo ? 'Exothermic' : 'Endothermic', edx + edw/2, edy + edh - 2);
      ctx.fillText('Reaction coordinate →', edx + edw/2, edy + edh + 6);

      ctx.fillStyle = 'rgba(226,232,240,0.7)'; ctx.font = '600 10px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Temperature vs Time', gx+gw/2+8, gy + 14);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 280 }} />
      <div className="mt-3 px-2 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['exothermic','endothermic'] as ReactionType[]).map(t => (
            <button
              key={t}
              onClick={() => selectType(t)}
              disabled={reacting}
              className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium transition-all disabled:opacity-40"
              style={{
                background: reactionType === t ? (t === 'exothermic' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)') : 'rgba(255,255,255,0.05)',
                border: `1px solid ${reactionType === t ? (t === 'exothermic' ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.5)') : 'rgba(255,255,255,0.08)'}`,
                color: reactionType === t ? (t === 'exothermic' ? '#EF4444' : '#3B82F6') : 'rgba(226,232,240,0.5)',
              }}
            >
              {t === 'exothermic' ? '🔥 Hand Warmer' : '❄️ Ice Pack'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-inter text-slate/50">{currentTemp.toFixed(1)}°C</span>
          <button onClick={startReaction} disabled={reacting} className="btn-indigo disabled:opacity-50">
            {reacting ? 'Reacting…' : 'Mix Reactants'}
          </button>
        </div>
      </div>
    </div>
  );
}
