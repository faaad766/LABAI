import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }
type Law = 'boyle' | 'charles' | 'gay-lussac';

export default function GasLawsCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [law, setLaw]   = useState<Law>('boyle');
  const [P, setP]       = useState(1.0);
  const [V, setV]       = useState(10.0);
  const [T, setT]       = useState(300);
  const lawRef = useRef<Law>('boyle');
  const PRef   = useRef(1.0);
  const VRef   = useRef(10.0);
  const TRef   = useRef(300);
  const rafRef = useRef(0);
  const tickRef = useRef(0);
  lawRef.current = law; PRef.current = P; VRef.current = V; TRef.current = T;

  type Particle = { x: number; y: number; vx: number; vy: number };
  const particles = useRef<Particle[]>([]);
  const NPART = 24;

  useEffect(() => {
    particles.current = Array.from({ length: NPART }, () => ({
      x: 200 + Math.random() * 120, y: 120 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const SYR_CX = W * 0.32;

    function getSyringeHeight(): number {
      return 60 + (VRef.current / 20) * 80;
    }

    function drawSyringe() {
      const sh = getSyringeHeight();
      const sy = H * 0.5 - sh / 2;
      const sw = 100;
      const sx = SYR_CX - sw / 2;
      // Barrel
      ctx.fillStyle = 'rgba(219,234,254,0.35)'; ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, sw, sh);
      // Piston
      ctx.fillStyle = '#1B4332'; ctx.fillRect(sx - 8, sy - 6, sw + 16, 12);
      ctx.font = '9px Inter'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'center';
      ctx.fillText('PISTON', SYR_CX, sy - 14);
      ctx.font = '10px Sora'; ctx.fillStyle = '#1E40AF';
      ctx.fillText(`V = ${VRef.current.toFixed(1)} L`, SYR_CX, sy + sh + 20);
      ctx.textAlign = 'left';
    }

    function updateParticles() {
      const sh = getSyringeHeight();
      const sy = H * 0.5 - sh / 2;
      const sx = SYR_CX - 50; const ex = SYR_CX + 50;
      const speed = 0.8 + TRef.current * 0.004;
      particles.current.forEach(p => {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x < sx + 4 || p.x > ex - 4) p.vx *= -1;
        if (p.y < sy + 4 || p.y > sy + sh - 4) p.vy *= -1;
        p.x = Math.max(sx + 4, Math.min(ex - 4, p.x));
        p.y = Math.max(sy + 4, Math.min(sy + sh - 4, p.y));
      });
    }

    function drawParticles() {
      particles.current.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#1B4332'; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
      });
    }

    function drawGraph() {
      const gx = W * 0.56, gy = H * 0.18, gw = W * 0.36, gh = H * 0.55;
      ctx.fillStyle = '#FAF8F3'; ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
      ctx.setLineDash([3, 3]);
      // Grid
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(gx + gw * i / 4, gy); ctx.lineTo(gx + gw * i / 4, gy + gh);
        ctx.strokeStyle = '#F0EDE6'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx, gy + gh * i / 4); ctx.lineTo(gx + gw, gy + gh * i / 4); ctx.stroke();
      }
      ctx.setLineDash([]);
      // Plot curve
      const l = lawRef.current;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const frac = i / 100;
        let px2: number, py2: number;
        if (l === 'boyle') {
          // P vs V hyperbola — PV = const
          const xV = 1 + frac * 19;
          const yP = (PRef.current * VRef.current) / xV;
          px2 = gx + (frac) * gw;
          py2 = gy + gh - Math.min((yP / 10) * gh, gh);
        } else if (l === 'charles') {
          // V vs T linear
          const xT = 200 + frac * 400;
          const yV = (VRef.current / TRef.current) * xT;
          px2 = gx + (frac) * gw;
          py2 = gy + gh - Math.min((yV / 20) * gh, gh);
        } else {
          // P vs T linear
          const xT = 200 + frac * 400;
          const yP = (PRef.current / TRef.current) * xT;
          px2 = gx + (frac) * gw;
          py2 = gy + gh - Math.min((yP / 5) * gh, gh);
        }
        i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
      }
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2.5; ctx.stroke();

      // Axis labels
      ctx.font = '10px Inter'; ctx.fillStyle = '#78716C'; ctx.textAlign = 'center';
      const xLbl = l === 'boyle' ? 'Volume (L)' : 'Temperature (K)';
      const yLbl = l === 'charles' ? 'Volume (L)' : 'Pressure (atm)';
      ctx.fillText(xLbl, gx + gw / 2, gy + gh + 16);
      ctx.save(); ctx.translate(gx - 14, gy + gh / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLbl, 0, 0); ctx.restore();

      // Title
      const titles: Record<Law, string> = {
        boyle: "Boyle's Law: P×V = const (T fixed)",
        charles: "Charles's Law: V/T = const (P fixed)",
        'gay-lussac': "Gay-Lussac's: P/T = const (V fixed)",
      };
      ctx.font = '10px Sora'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'left';
      ctx.fillText(titles[l], gx, gy - 6);
    }

    function drawReadout() {
      ctx.font = 'bold 11px Inter'; ctx.fillStyle = '#52796F'; ctx.textAlign = 'left';
      ctx.fillText(`P = ${PRef.current.toFixed(2)} atm`, W * 0.56, H * 0.82);
      ctx.fillText(`V = ${VRef.current.toFixed(1)} L`,   W * 0.56, H * 0.82 + 16);
      ctx.fillText(`T = ${TRef.current} K`,              W * 0.56, H * 0.82 + 32);
      ctx.fillText(`n = 1 mol`,                          W * 0.56, H * 0.82 + 48);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      tickRef.current++;
      updateParticles();
      drawSyringe();
      drawParticles();
      drawGraph();
      drawReadout();
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleP = (v: number) => {
    setP(v);
    if (law === 'boyle') { const newV = +(1.0 * 10 / v).toFixed(1); setV(Math.max(1, Math.min(20, newV))); }
    onEvent(`Pressure changed to ${v.toFixed(2)} atm — ${law === 'boyle' ? `at constant T, PV = constant: volume adjusts to ${(10 / v).toFixed(1)} L (Boyle's Law)` : `at constant V, pressure and temperature are directly proportional (Gay-Lussac's)`}`);
  };
  const handleV = (v: number) => {
    setV(v);
    if (law === 'boyle') { const newP = +(1.0 * 10 / v).toFixed(2); setP(Math.max(0.1, Math.min(5, newP))); }
    onEvent(`Volume changed to ${v.toFixed(1)} L — ${law === 'boyle' ? `pressure adjusts to ${(10 / v).toFixed(2)} atm to maintain PV = constant` : `at constant P, volume is proportional to temperature (Charles's Law): V/T = constant`}`);
  };
  const handleT = (v: number) => {
    setT(v);
    if (law === 'charles') { const newV = +(10 * v / 300).toFixed(1); setV(Math.max(1, Math.min(20, newV))); }
    onEvent(`Temperature changed to ${v}K — ${law === 'charles' ? `volume adjusts to ${(10 * v / 300).toFixed(1)} L; warmer gas molecules move faster and push the piston out` : `pressure increases: faster molecules hit walls more forcefully`}`);
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      <div className="flex flex-wrap gap-3 p-3 shrink-0 items-start" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        {/* Law selector */}
        <div className="flex gap-1.5 flex-wrap">
          {([['boyle',"Boyle's"],['charles',"Charles'"],['gay-lussac',"Gay-Lussac's"]] as [Law,string][]).map(([id, lbl]) => (
            <button key={id} onClick={() => setLaw(id)}
              className="px-3 py-1.5 rounded-lg font-inter text-xs font-medium transition-all"
              style={{ background: law === id ? '#1B4332' : '#fff', color: law === id ? '#fff' : '#52796F', border: '1px solid #E7E5E0' }}>
              {lbl}
            </button>
          ))}
        </div>
        {/* Sliders */}
        <div className="flex gap-4 flex-wrap">
          {(law === 'boyle' || law === 'gay-lussac') && (
            <label className="font-inter text-xs flex flex-col gap-0.5" style={{ color: '#52796F' }}>
              P: {P.toFixed(2)} atm
              <input type="range" min="0.2" max="5" step="0.1" value={P} onChange={e => handleP(+e.target.value)} className="w-28" />
            </label>
          )}
          {(law === 'boyle' || law === 'charles') && (
            <label className="font-inter text-xs flex flex-col gap-0.5" style={{ color: '#52796F' }}>
              V: {V.toFixed(1)} L
              <input type="range" min="1" max="20" step="0.5" value={V} onChange={e => handleV(+e.target.value)} className="w-28" />
            </label>
          )}
          {(law === 'charles' || law === 'gay-lussac') && (
            <label className="font-inter text-xs flex flex-col gap-0.5" style={{ color: '#52796F' }}>
              T: {T} K
              <input type="range" min="200" max="600" step="10" value={T} onChange={e => handleT(+e.target.value)} className="w-28" />
            </label>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} width={700} height={300} className="w-full flex-1" />
    </div>
  );
}
