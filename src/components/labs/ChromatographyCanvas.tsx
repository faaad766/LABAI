import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

interface Band { name: string; color: string; rf: number; width: number; }

const BANDS: Band[] = [
  { name: 'Carotene',      color: '#F97316', rf: 0.92, width: 12 },
  { name: 'Xanthophyll',   color: '#EAB308', rf: 0.72, width: 14 },
  { name: 'Chlorophyll a', color: '#16A34A', rf: 0.44, width: 18 },
  { name: 'Chlorophyll b', color: '#65A30D', rf: 0.28, width: 14 },
];

export default function ChromatographyCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const runningRef = useRef(false);
  const progressRef = useRef(0);
  const timeRef = useRef(0);
  const reportedRef = useRef<Set<string>>(new Set());

  const start = () => {
    if (progressRef.current >= 1) { progressRef.current = 0; setProgress(0); reportedRef.current.clear(); }
    runningRef.current = true; setRunning(true);
    onEvent('Solvent front moving up the paper strip — different pigments travel at different rates based on polarity. Watch the Rf values form!');
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

      if (runningRef.current && progressRef.current < 1) {
        progressRef.current = Math.min(1, progressRef.current + 0.0025);
        setProgress(progressRef.current);
        if (progressRef.current >= 1) { runningRef.current = false; setRunning(false); onEvent('Chromatography complete! Four distinct pigment bands visible. Can you calculate the Rf value for each?'); }
      }

      const prog = progressRef.current;

      // Paper strip
      const px = W * 0.35, pTop = H * 0.06, pBot = H * 0.88;
      const paperH = pBot - pTop, paperW = W * 0.24;
      // Paper texture gradient
      const paperGrad = ctx.createLinearGradient(px - paperW/2, 0, px + paperW/2, 0);
      paperGrad.addColorStop(0, 'rgba(245,240,220,0.85)');
      paperGrad.addColorStop(0.5, 'rgba(255,252,235,0.95)');
      paperGrad.addColorStop(1, 'rgba(245,240,220,0.85)');
      ctx.fillStyle = paperGrad;
      ctx.fillRect(px - paperW/2, pTop, paperW, paperH);
      ctx.strokeStyle = 'rgba(200,190,150,0.5)'; ctx.lineWidth = 1;
      ctx.strokeRect(px - paperW/2, pTop, paperW, paperH);

      // Paper lines (texture)
      ctx.strokeStyle = 'rgba(180,170,130,0.15)'; ctx.lineWidth = 0.5;
      for (let ly = pTop + 8; ly < pBot; ly += 8) {
        ctx.beginPath(); ctx.moveTo(px - paperW/2, ly); ctx.lineTo(px + paperW/2, ly); ctx.stroke();
      }

      // Solvent front
      const solventY = pBot - prog * paperH * 0.9;
      if (prog > 0.02) {
        // Wet portion
        ctx.fillStyle = 'rgba(180,220,255,0.15)';
        ctx.fillRect(px - paperW/2 + 1, solventY, paperW - 2, pBot - solventY);
        // Solvent front line
        const shimmer = Math.sin(t * 5) * 1;
        ctx.strokeStyle = 'rgba(100,160,255,0.6)'; ctx.lineWidth = 1.5; ctx.setLineDash([3,2]);
        ctx.beginPath(); ctx.moveTo(px - paperW/2, solventY + shimmer); ctx.lineTo(px + paperW/2, solventY + shimmer); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(100,160,255,0.7)'; ctx.font = '9px Inter'; ctx.textAlign = 'left';
        ctx.fillText('solvent front', px + paperW/2 + 4, solventY + 4);
      }

      // Origin line
      const originY = pBot - 14;
      ctx.strokeStyle = 'rgba(100,100,100,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.moveTo(px - paperW/2, originY); ctx.lineTo(px + paperW/2, originY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(100,100,100,0.7)'; ctx.font = '8px Inter'; ctx.textAlign = 'left';
      ctx.fillText('origin', px + paperW/2 + 4, originY + 3);

      // Pigment dot at origin
      ctx.beginPath(); ctx.arc(px, originY, 5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(80,40,20,0.8)'; ctx.fill();

      // Pigment bands
      BANDS.forEach((band) => {
        const bandProgress = Math.min(prog / 0.85, 1);
        const bandY = originY - bandProgress * band.rf * paperH * 0.85;

        if (bandY < originY && bandProgress > band.rf * 0.1) {
          const bandH = 10 + band.width * 0.4;
          ctx.fillStyle = band.color + 'CC';
          ctx.fillRect(px - paperW/2 + 3, bandY - bandH/2, paperW - 6, bandH);

          // Report band appearance
          const visible = bandProgress > band.rf * 0.15;
          if (visible && !reportedRef.current.has(band.name)) {
            reportedRef.current.add(band.name);
            onEvent(`${band.name} band appearing at Rf ≈ ${band.rf} — why does it travel ${band.rf > 0.5 ? 'higher' : 'lower'} than other pigments?`);
          }

          // Label
          ctx.fillStyle = band.color; ctx.font = '500 9px Inter'; ctx.textAlign = 'left';
          ctx.fillText(`${band.name}`, px + paperW/2 + 4, bandY + 3);
          ctx.fillStyle = 'rgba(226,232,240,0.5)'; ctx.font = '9px Inter';
          ctx.fillText(`Rf = ${band.rf.toFixed(2)}`, px + paperW/2 + 4, bandY + 13);
        }
      });

      // Rf ruler on right side of paper
      ctx.strokeStyle = 'rgba(226,232,240,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - paperW/2 - 10, pTop + 10); ctx.lineTo(px - paperW/2 - 10, originY); ctx.stroke();
      for (let rf = 0; rf <= 1; rf += 0.2) {
        const ry = originY - rf * (originY - pTop - 10);
        ctx.beginPath(); ctx.moveTo(px - paperW/2 - 14, ry); ctx.lineTo(px - paperW/2 - 6, ry); ctx.stroke();
        ctx.fillStyle = 'rgba(226,232,240,0.4)'; ctx.font = '7px Inter'; ctx.textAlign = 'right';
        ctx.fillText(rf.toFixed(1), px - paperW/2 - 16, ry + 3);
      }
      ctx.fillStyle = 'rgba(226,232,240,0.4)'; ctx.font = '8px Inter'; ctx.textAlign = 'center';
      ctx.save(); ctx.translate(px - paperW/2 - 26, (pTop + originY)/2); ctx.rotate(-Math.PI/2);
      ctx.fillText('Rf', 0, 0); ctx.restore();

      // Title
      ctx.fillStyle = 'rgba(226,232,240,0.85)'; ctx.font = '600 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Paper Chromatography — Plant Pigments', px, pTop - 6);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 280 }} />
      <div className="mt-3 px-2 flex items-center justify-between gap-3">
        <div className="flex gap-3 flex-wrap">
          {BANDS.map(b => (
            <div key={b.name} className="flex items-center gap-1.5 text-xs font-inter text-slate/60">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
              {b.name}
            </div>
          ))}
        </div>
        <button
          onClick={start}
          disabled={running}
          className="btn-indigo shrink-0 disabled:opacity-50"
        >
          {running ? 'Running…' : progress >= 1 ? 'Restart' : 'Start'}
        </button>
      </div>
    </div>
  );
}
