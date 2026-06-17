import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }
interface Bubble { x: number; y: number; r: number; vy: number; opacity: number; }
interface DataPoint { t: number; rate: number; }

export default function PhotosynthesisCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ light: 60, co2: 50, temp: 25, bubbles: [] as Bubble[], data: [] as DataPoint[], time: 0 });
  const [light, setLight] = useState(60);
  const [co2, setCo2] = useState(50);
  const [temperature, setTemperature] = useState(25);
  const prevRef = useRef({ light: 60, co2: 50, temp: 25 });

  const calcRate = (l: number, c: number, t: number) => {
    const lf = l / 100;
    const cf = c / 100;
    const tf = t >= 15 && t <= 35 ? 1 - Math.abs(t - 25) / 20 : 0.1;
    return Math.min(1, lf * 0.5 + cf * 0.3 + tf * 0.2);
  };

  useEffect(() => {
    stateRef.current.light = light;
    stateRef.current.co2 = co2;
    stateRef.current.temp = temperature;
    const p = prevRef.current;
    if (Math.abs(light - p.light) > 10) { onEvent(`Light intensity changed to ${light}% — photosynthesis rate is ${calcRate(light,co2,temperature) > 0.5 ? 'increasing' : 'decreasing'}`); p.light = light; }
    if (Math.abs(co2 - p.co2) > 10) { onEvent(`CO₂ concentration changed to ${co2}% — O₂ bubble production is ${co2 > 50 ? 'high' : 'low'}`); p.co2 = co2; }
    if (Math.abs(temperature - p.temp) > 5) { onEvent(`Temperature changed to ${temperature}°C — enzyme activity is ${temperature > 35 ? 'decreasing (too hot)' : temperature < 15 ? 'low (too cold)' : 'optimal'}`); p.temp = temperature; }
  }, [light, co2, temperature, onEvent]);

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
      const rate = calcRate(s.light, s.co2, s.temp);
      ctx.clearRect(0, 0, W, H);

      // Track data
      if (s.data.length === 0 || s.time - s.data[s.data.length-1].t > 0.5) {
        s.data.push({ t: s.time, rate });
        if (s.data.length > 80) s.data.shift();
      }

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Plant illustration area
      const px = W * 0.35, py = H * 0.25;
      const sunIntensity = s.light / 100;

      // Sun rays
      if (sunIntensity > 0.1) {
        ctx.save();
        ctx.translate(W * 0.1, H * 0.12);
        for (let r = 0; r < 8; r++) {
          const angle = (r / 8) * Math.PI * 2 + s.time * 0.5;
          const rayLen = 20 + sunIntensity * 15;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle)*12, Math.sin(angle)*12);
          ctx.lineTo(Math.cos(angle)*rayLen, Math.sin(angle)*rayLen);
          ctx.strokeStyle = `rgba(255,220,80,${sunIntensity * 0.6})`;
          ctx.lineWidth = 1.5; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,220,80,${sunIntensity * 0.9})`; ctx.fill();
        ctx.restore();
      }

      // Stem
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(px, H * 0.8); ctx.lineTo(px, py + 40); ctx.stroke();

      // Leaves
      const leafColor = `rgba(${Math.round(34+rate*100)},${Math.round(180+rate*50)},${Math.round(60+rate*20)},0.9)`;
      for (let l = 0; l < 3; l++) {
        const ly = py + 40 + l * 30;
        const dir = l % 2 === 0 ? 1 : -1;
        ctx.fillStyle = leafColor;
        ctx.beginPath();
        ctx.ellipse(px + dir * 28, ly, 28, 12, dir * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main leaf (top)
      ctx.fillStyle = leafColor;
      ctx.beginPath();
      ctx.ellipse(px, py + 20, 35, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();

      // O2 bubbles
      if (Math.random() < rate * 0.25) {
        s.bubbles.push({ x: px + (Math.random()-0.5)*50, y: py + 10, r: 3+Math.random()*4, vy: -(0.4+rate*1.2), opacity: 0.85 });
      }
      s.bubbles = s.bubbles.filter(b => b.opacity > 0.05).map(b => {
        b.y += b.vy; b.x += Math.sin(b.y*0.05)*0.5; b.opacity -= 0.006;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(160,240,255,${b.opacity})`; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = `rgba(200,250,255,${b.opacity*0.3})`; ctx.fill();
        ctx.fillStyle = `rgba(200,250,255,${b.opacity*0.8})`;
        ctx.font = `${Math.round(b.r*1.8)}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText('O₂', b.x, b.y + b.r*0.4);
        return b;
      });

      // Live graph (right side)
      const gx = W * 0.62, gy = H * 0.15, gw = W * 0.32, gh = H * 0.45;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx+10, gy); ctx.lineTo(gx+10, gy+gh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, gy+gh-10); ctx.lineTo(gx+gw, gy+gh-10); ctx.stroke();

      // Labels
      ctx.fillStyle = 'rgba(226,232,240,0.7)'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Time', gx + gw/2, gy + gh + 12);
      ctx.save(); ctx.translate(gx - 10, gy + gh/2); ctx.rotate(-Math.PI/2);
      ctx.fillText('Rate', 0, 0); ctx.restore();

      // Data line
      if (s.data.length > 2) {
        ctx.beginPath();
        s.data.forEach((d, i) => {
          const dx = gx + 10 + ((i / (s.data.length-1)) * (gw - 10));
          const dy = gy + gh - 10 - d.rate * (gh - 20);
          i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy);
        });
        ctx.strokeStyle = '#10B981'; ctx.lineWidth = 2; ctx.stroke();
      }

      // Current rate label
      ctx.fillStyle = '#10B981'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`Rate: ${(rate*100).toFixed(0)}%`, gx + gw/2, gy - 5);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 260 }} />
      <div className="mt-3 px-2 space-y-2.5">
        {[
          { label: 'Light Intensity', val: light, set: setLight, unit: '%', min: 0, max: 100 },
          { label: 'CO₂ Concentration', val: co2, set: setCo2, unit: '%', min: 0, max: 100 },
          { label: 'Temperature', val: temperature, set: setTemperature, unit: '°C', min: 5, max: 45 },
        ].map(({ label, val, set, unit, min, max }) => (
          <div key={label}>
            <div className="flex justify-between text-xs font-inter text-slate/60 mb-1">
              <span>{label}</span><span>{val}{unit}</span>
            </div>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)}
              className="w-full h-1.5 rounded-full cursor-pointer accent-indigo-lab" />
          </div>
        ))}
      </div>
    </div>
  );
}
