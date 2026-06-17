import { useState, useEffect, useRef } from 'react';

export default function TranspirationCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [light, setLight] = useState(50);
  const [humidity, setHumidity] = useState(50);
  const [temp, setTemp] = useState(25);
  const [wind, setWind] = useState(0);
  const [open, setOpen] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);

  const rate = Math.max(0, (light / 100) * (1 - humidity / 100) * (temp / 40) * (1 + wind / 30) * (open ? 1 : 0.05) * 80);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    let raf: number;
    const drops: { x: number; y: number; r: number; speed: number }[] = [];
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
      sky.addColorStop(0, `hsl(${200 - light}, 60%, ${60 + light / 5}%)`);
      sky.addColorStop(1, '#F0F7F3');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // Sun
      ctx.beginPath(); ctx.arc(W - 50, 40, 22, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251,191,36,${light / 100})`; ctx.fill();
      // Stem
      ctx.strokeStyle = '#4D7C0F'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(W / 2, H / 2); ctx.stroke();
      // Leaf
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, 90, 50, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${120 - temp * 0.5}, ${60 + light * 0.3}%, 35%)`; ctx.fill();
      ctx.strokeStyle = '#15803D'; ctx.lineWidth = 2; ctx.stroke();
      // Stomata
      const stomataDelta = open ? 5 : 1;
      [W / 2 - 30, W / 2, W / 2 + 30].forEach(sx => {
        [H / 2 - 10, H / 2 + 10].forEach(sy => {
          ctx.beginPath(); ctx.ellipse(sx, sy, stomataDelta, 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = open ? '#92400E' : '#1C1917'; ctx.fill();
        });
      });
      // Water drops
      if (rate > 5 && tRef.current % Math.max(1, Math.floor(20 / (rate / 20))) === 0) {
        drops.push({ x: W / 2 + (Math.random() - 0.5) * 80, y: H / 2 - 20, r: 3 + Math.random() * 3, speed: 1 + Math.random() });
      }
      drops.forEach((d, i) => {
        d.y -= d.speed; d.x += wind * 0.1;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.6)'; ctx.fill();
        if (d.y < 0) drops.splice(i, 1);
      });
      // Root water
      ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(W / 2, H); ctx.lineTo(W / 2, H + 10); ctx.stroke();
      ctx.setLineDash([]);
      // Rate bar
      ctx.fillStyle = '#F0FDF4'; ctx.fillRect(10, 10, 130, 28); ctx.strokeStyle = '#BBF7D0'; ctx.lineWidth = 1; ctx.strokeRect(10, 10, 130, 28);
      ctx.fillStyle = '#1B4332'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`Rate: ${rate.toFixed(1)} μmol/m²/s`, 16, 28);
      tRef.current++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [light, humidity, temp, wind, open, rate]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <canvas ref={canvasRef} width={520} height={280} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0' }} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: `☀️ Light: ${light}%`, val: light, min: 0, max: 100, set: (v: number) => { setLight(v); onEvent(`Light intensity: ${v}%`); } },
          { label: `💧 Humidity: ${humidity}%`, val: humidity, min: 0, max: 100, set: (v: number) => { setHumidity(v); onEvent(`Humidity: ${v}%`); } },
          { label: `🌡️ Temp: ${temp}°C`, val: temp, min: 5, max: 45, set: (v: number) => { setTemp(v); onEvent(`Temperature: ${v}°C`); } },
          { label: `💨 Wind: ${wind} km/h`, val: wind, min: 0, max: 50, set: (v: number) => { setWind(v); onEvent(`Wind speed: ${v} km/h`); } },
        ].map(({ label, val, min, max, set }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={open} onChange={e => { setOpen(e.target.checked); onEvent(e.target.checked ? 'Stomata opened — water loss increases' : 'Stomata closed — water loss almost zero'); }} />
        <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Stomata Open</span>
      </label>
      <div className="rounded-xl p-3 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <span className="font-inter text-xs" style={{ color: '#52796F' }}>Transpiration Rate: </span>
        <span className="font-sora font-bold text-lg" style={{ color: '#1B4332' }}>{rate.toFixed(1)} μmol/m²/s</span>
      </div>
    </div>
  );
}
