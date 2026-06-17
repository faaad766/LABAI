import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

interface Metal {
  id: string; name: string; symbol: string;
  flameColor: string; glowColor: string;
  wavelengths: number[];
}

const METALS: Metal[] = [
  { id: 'sodium',    name: 'Sodium',    symbol: 'Na', flameColor: '#FF8C00', glowColor: '#FFA500', wavelengths: [589] },
  { id: 'copper',    name: 'Copper',    symbol: 'Cu', flameColor: '#00CC44', glowColor: '#00FF66', wavelengths: [510, 578] },
  { id: 'lithium',   name: 'Lithium',   symbol: 'Li', flameColor: '#CC1133', glowColor: '#FF2244', wavelengths: [670, 610] },
  { id: 'potassium', name: 'Potassium', symbol: 'K',  flameColor: '#8822CC', glowColor: '#AA44FF', wavelengths: [404, 766] },
  { id: 'none',      name: 'No salt',   symbol: '—',  flameColor: '#2255AA', glowColor: '#3366CC', wavelengths: [] },
];

const SPECTRUM_COLORS = [
  '#6600FF','#4400FF','#0000FF','#0055FF','#0099FF',
  '#00BBFF','#00DDFF','#00FFDD','#00FF88','#00FF44',
  '#44FF00','#88FF00','#CCFF00','#FFFF00','#FFCC00',
  '#FF8800','#FF4400','#FF0000',
];

export default function FlameTestCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [selected, setSelected] = useState<Metal>(METALS[4]);
  const selectedRef = useRef<Metal>(METALS[4]);
  const timeRef = useRef(0);

  const selectMetal = (m: Metal) => {
    selectedRef.current = m;
    setSelected(m);
    if (m.id !== 'none') onEvent(`${m.name} (${m.symbol}) salt added to wire — flame turned ${m.flameColor === '#FF8C00' ? 'orange' : m.flameColor === '#00CC44' ? 'green' : m.flameColor === '#CC1133' ? 'crimson' : 'violet'}. What does this tell us about electron energy levels?`);
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
      const metal = selectedRef.current;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Bunsen burner (center-left)
      const bx = W * 0.35, by = H * 0.78;
      const bw = 24, bh = 40;

      // Burner body
      const burnerGrad = ctx.createLinearGradient(bx - bw/2, 0, bx + bw/2, 0);
      burnerGrad.addColorStop(0, '#334155');
      burnerGrad.addColorStop(0.5, '#475569');
      burnerGrad.addColorStop(1, '#334155');
      ctx.fillStyle = burnerGrad;
      ctx.beginPath(); ctx.roundRect(bx - bw/2, by, bw, bh, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(180,200,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();

      // Base
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.roundRect(bx - bw, by + bh - 6, bw*2, 12, 3); ctx.fill();

      // Flame (noise-based flicker)
      const flicker1 = Math.sin(t * 13.7) * 4;
      const flicker2 = Math.cos(t * 9.3) * 3;
      const flicker3 = Math.sin(t * 17.1 + 0.8) * 2;
      const flameH = 50 + Math.abs(flicker1) * 1.5;
      const flameW = 18 + Math.abs(flicker2) * 0.5;

      // Outer colored flame
      const outerGrad = ctx.createRadialGradient(bx + flicker3, by - flameH * 0.6, 2, bx, by, flameH);
      outerGrad.addColorStop(0, metal.glowColor + 'EE');
      outerGrad.addColorStop(0.4, metal.flameColor + 'CC');
      outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(bx - flameW, by);
      ctx.quadraticCurveTo(bx - flameW * 0.8 + flicker2, by - flameH * 0.5, bx + flicker3 * 0.5, by - flameH);
      ctx.quadraticCurveTo(bx + flameW * 0.8 + flicker1, by - flameH * 0.5, bx + flameW, by);
      ctx.closePath();
      ctx.fill();

      // Inner blue cone
      const innerGrad = ctx.createRadialGradient(bx, by - 12, 2, bx, by - 8, 18);
      innerGrad.addColorStop(0, 'rgba(180,220,255,0.9)');
      innerGrad.addColorStop(0.5, 'rgba(100,150,255,0.6)');
      innerGrad.addColorStop(1, 'rgba(50,80,200,0)');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.moveTo(bx - 8, by);
      ctx.quadraticCurveTo(bx - 6, by - 14, bx + flicker2 * 0.3, by - 24);
      ctx.quadraticCurveTo(bx + 6, by - 14, bx + 8, by);
      ctx.closePath(); ctx.fill();

      // Glow bloom on canvas
      if (metal.id !== 'none') {
        const bloom = ctx.createRadialGradient(bx, by - flameH * 0.5, 0, bx, by - flameH * 0.5, flameH * 1.2);
        bloom.addColorStop(0, metal.glowColor + '30');
        bloom.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bloom;
        ctx.beginPath(); ctx.arc(bx, by - flameH * 0.5, flameH * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wire loop
      const wx = bx, wy = by - flameH * 0.6;
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.65, H * 0.25);
      ctx.lineTo(wx + 2, wy + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx + 2, wy, 7, 0, Math.PI * 2);
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5; ctx.stroke();
      if (metal.id !== 'none') {
        ctx.fillStyle = metal.flameColor + '88';
        ctx.beginPath(); ctx.arc(wx + 2, wy, 5, 0, Math.PI*2); ctx.fill();
      }

      // Spectrometer (right side)
      const sx = W * 0.58, sy = H * 0.12, sw = W * 0.36, sh = H * 0.3;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();

      // Spectrum gradient bar
      const specH = 14, specY = sy + sh * 0.18;
      for (let i = 0; i < SPECTRUM_COLORS.length; i++) {
        ctx.fillStyle = SPECTRUM_COLORS[i];
        ctx.fillRect(sx + 8 + (i / SPECTRUM_COLORS.length) * (sw - 16), specY, (sw - 16) / SPECTRUM_COLORS.length + 0.5, specH);
      }

      // Emission lines
      metal.wavelengths.forEach((wl) => {
        const normalized = (wl - 380) / (780 - 380);
        const lx = sx + 8 + normalized * (sw - 16);
        const pulse = 0.7 + Math.sin(t * 4) * 0.3;
        ctx.strokeStyle = metal.glowColor;
        ctx.lineWidth = 3; ctx.globalAlpha = pulse;
        ctx.beginPath(); ctx.moveTo(lx, specY - 4); ctx.lineTo(lx, specY + specH + 4); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
        ctx.fillText(`${wl}nm`, lx, specY + specH + 14);
      });

      // Wavelength axis labels
      ctx.fillStyle = 'rgba(226,232,240,0.4)'; ctx.font = '8px Inter'; ctx.textAlign = 'center';
      [400, 500, 600, 700].forEach(wl => {
        const lx = sx + 8 + ((wl - 380) / 400) * (sw - 16);
        ctx.fillText(`${wl}`, lx, specY + specH + 24);
      });

      ctx.fillStyle = 'rgba(226,232,240,0.7)'; ctx.font = '600 10px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Virtual Emission Spectrometer', sx + sw/2, sy + 12);

      // Metal label
      if (metal.id !== 'none') {
        ctx.fillStyle = metal.glowColor; ctx.font = 'bold 13px Sora'; ctx.textAlign = 'center';
        ctx.fillText(`${metal.name} — ${metal.symbol}`, W * 0.35, H * 0.95);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 260 }} />
      <div className="mt-3 px-2 flex flex-wrap gap-2 justify-center">
        {METALS.map((m) => (
          <button
            key={m.id}
            onClick={() => selectMetal(m)}
            className="px-3 py-1.5 rounded-full text-xs font-inter font-medium transition-all"
            style={{
              background: selected.id === m.id ? m.flameColor + '25' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${selected.id === m.id ? m.flameColor + '70' : 'rgba(255,255,255,0.08)'}`,
              color: selected.id === m.id ? m.flameColor : 'rgba(226,232,240,0.5)',
            }}
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}
