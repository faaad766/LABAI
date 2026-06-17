import { useEffect, useRef, useState, useCallback } from 'react';

interface Props { onEvent: (e: string) => void; }

interface Bubble { x: number; y: number; r: number; vy: number; opacity: number; }

export default function EnzymeCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ temp: 37, pH: 7, foam: 0, bubbles: [] as Bubble[], time: 0 });
  const [temp, setTemp] = useState(37);
  const [pH, setPH] = useState(7);
  const prevTempRef = useRef(37);
  const prevPHRef = useRef(7);

  const getRateMultiplier = useCallback((t: number, p: number) => {
    const tempEffect = t >= 25 && t <= 45 ? 1 - Math.abs(t - 37) / 20 : 0.1;
    const phEffect = p >= 5 && p <= 9 ? 1 - Math.abs(p - 7) / 4 : 0.05;
    return Math.max(0.01, tempEffect * phEffect);
  }, []);

  useEffect(() => {
    stateRef.current.temp = temp;
    stateRef.current.pH = pH;
    const tDiff = Math.abs(temp - prevTempRef.current);
    const pDiff = Math.abs(pH - prevPHRef.current);
    if (tDiff > 5) { onEvent(`Temperature changed to ${temp}°C — enzyme activity is ${getRateMultiplier(temp, pH) > 0.5 ? 'increasing' : 'decreasing'}`); prevTempRef.current = temp; }
    if (pDiff > 1) { onEvent(`pH changed to ${pH} — enzyme ${pH < 5 || pH > 9 ? 'is denatured' : 'is active'}`); prevPHRef.current = pH; }
  }, [temp, pH, onEvent, getRateMultiplier]);

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
      const s = stateRef.current;
      s.time += 0.016;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      const rate = getRateMultiplier(s.temp, s.pH);
      s.foam = Math.min(1, s.foam + rate * 0.008);
      if (rate < 0.2) s.foam = Math.max(0, s.foam - 0.005);

      // Test tube
      const tx = W * 0.5, ty = H * 0.15, tw = W * 0.22, th = H * 0.7;
      const tubeGrad = ctx.createLinearGradient(tx - tw/2, 0, tx + tw/2, 0);
      tubeGrad.addColorStop(0, 'rgba(180,200,255,0.15)');
      tubeGrad.addColorStop(0.5, 'rgba(180,200,255,0.35)');
      tubeGrad.addColorStop(1, 'rgba(180,200,255,0.15)');
      ctx.fillStyle = tubeGrad;
      ctx.beginPath();
      ctx.roundRect(tx - tw/2, ty, tw, th, [0,0,tw/2,tw/2]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,200,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.stroke();

      // Liquid (H2O2)
      const liqH = th * 0.55;
      const liqY = ty + th - liqH;
      const shimmer = Math.sin(s.time * 4) * 1.5;
      ctx.fillStyle = 'rgba(200,230,255,0.3)';
      ctx.fillRect(tx - tw/2 + 2, liqY + shimmer, tw - 4, liqH - shimmer);

      // Foam layer
      const foamH = s.foam * th * 0.35;
      const foamY = liqY - foamH;
      if (foamH > 0) {
        const foamGrad = ctx.createLinearGradient(0, foamY, 0, liqY);
        foamGrad.addColorStop(0, 'rgba(255,255,255,0)');
        foamGrad.addColorStop(1, 'rgba(255,255,255,0.5)');
        ctx.fillStyle = foamGrad;
        ctx.fillRect(tx - tw/2 + 2, foamY, tw - 4, foamH);
        // Foam top bubbles
        for (let fx = tx - tw/2 + 6; fx < tx + tw/2 - 6; fx += 8) {
          ctx.beginPath();
          ctx.arc(fx + Math.sin(s.time*2+fx)*2, foamY + 4, 3+Math.random()*2, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();
        }
      }

      // Spawn bubbles
      if (Math.random() < rate * 0.4) {
        s.bubbles.push({ x: tx + (Math.random()-0.5)*tw*0.6, y: ty+th-10, r: 2+Math.random()*4, vy: -(0.5+Math.random()*1.5), opacity: 0.8 });
      }
      s.bubbles = s.bubbles.filter(b => b.opacity > 0).map(b => {
        b.y += b.vy; b.opacity -= 0.01; b.x += Math.sin(b.y * 0.1) * 0.3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(180,220,255,${b.opacity})`;
        ctx.lineWidth = 0.8; ctx.stroke();
        return b;
      });

      // Liver piece
      ctx.fillStyle = '#8B1A1A';
      const lx = tx - 10, ly = liqY + liqH * 0.3;
      ctx.beginPath();
      ctx.roundRect(lx, ly, 20, 12, 4);
      ctx.fill();
      ctx.fillStyle = '#A52A2A';
      ctx.fillText('liver', lx, ly - 4);

      // Labels
      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.font = '600 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('H₂O₂ + Catalase', tx, ty - 10);

      // Rate indicator
      const rateColor = rate > 0.6 ? '#10B981' : rate > 0.3 ? '#6366F1' : '#F59E0B';
      ctx.fillStyle = rateColor;
      ctx.font = '500 11px Inter';
      ctx.fillText(`Reaction Rate: ${(rate*100).toFixed(0)}%`, tx, ty + th + 20);

      // Foam height label
      ctx.fillStyle = 'rgba(226,232,240,0.6)';
      ctx.font = '10px Inter';
      ctx.fillText(`Foam: ${(s.foam*100).toFixed(0)}%`, tx, ty + th + 34);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [getRateMultiplier]);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 260 }} />
      <div className="mt-3 px-2 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-inter text-slate/60 mb-1">
            <span>Temperature: {temp}°C</span>
            <span className="text-emerald-lab">{temp >= 30 && temp <= 42 ? 'Optimal range' : 'Sub-optimal'}</span>
          </div>
          <input type="range" min={10} max={80} value={temp} onChange={e => setTemp(+e.target.value)}
            className="w-full h-1.5 rounded-full cursor-pointer accent-indigo-lab" />
        </div>
        <div>
          <div className="flex justify-between text-xs font-inter text-slate/60 mb-1">
            <span>pH: {pH}</span>
            <span className="text-emerald-lab">{pH >= 6 && pH <= 8 ? 'Near neutral' : pH < 4 || pH > 10 ? 'Enzyme denatured' : 'Reduced activity'}</span>
          </div>
          <input type="range" min={1} max={14} step={0.5} value={pH} onChange={e => setPH(+e.target.value)}
            className="w-full h-1.5 rounded-full cursor-pointer accent-indigo-lab" />
        </div>
      </div>
    </div>
  );
}
