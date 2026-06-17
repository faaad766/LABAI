import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type Phase = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase';

const PHASES: { id: Phase; label: string; color: string; desc: string }[] = [
  { id: 'interphase', label: 'Interphase',  color: '#6366F1', desc: 'DNA replication — cell prepares for division' },
  { id: 'prophase',   label: 'Prophase',    color: '#8B5CF6', desc: 'Chromosomes condense, spindle forms' },
  { id: 'metaphase',  label: 'Metaphase',   color: '#F59E0B', desc: 'Chromosomes align at cell equator' },
  { id: 'anaphase',   label: 'Anaphase',    color: '#EF4444', desc: 'Chromatids pulled to opposite poles' },
  { id: 'telophase',  label: 'Telophase',   color: '#10B981', desc: 'Two new nuclei form, cell divides' },
];

export default function MitosisCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [phase, setPhase] = useState<Phase>('interphase');
  const phaseRef = useRef<Phase>('interphase');
  const timeRef = useRef(0);

  const setPhaseWithEvent = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
    onEvent(`Phase changed to ${p} — ${PHASES.find(ph => ph.id === p)?.desc}`);
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
      const cx = W / 2, cy = H * 0.45;
      const p = phaseRef.current;
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      const phaseData = PHASES.find(ph => ph.id === p)!;
      const cellR = Math.min(W, H) * 0.28;

      // Cell membrane
      const squeeze = p === 'telophase' ? Math.sin(t * 2) * 0.1 : 0;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cellR * (1 - squeeze), cellR * (1 + squeeze * 0.3), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${phaseData.color}88`; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(30,40,60,0.4)'; ctx.fill(); ctx.stroke();

      // Nucleus (interphase & prophase)
      if (p === 'interphase' || p === 'prophase') {
        const pulse = p === 'prophase' ? Math.sin(t * 3) * 3 : 0;
        ctx.beginPath();
        ctx.arc(cx, cy, cellR * 0.38 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(150,180,255,0.5)'; ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(80,100,180,0.25)'; ctx.fill(); ctx.stroke();
      }

      // Chromosomes
      const chrCount = 4;
      if (p === 'prophase' || p === 'metaphase') {
        for (let i = 0; i < chrCount; i++) {
          const angle = (i / chrCount) * Math.PI * 2 + (p === 'metaphase' ? 0 : t * 0.5);
          const r = p === 'metaphase' ? 0 : cellR * 0.25;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r * (p === 'metaphase' ? 1 : 0.6);
          const chrLen = p === 'metaphase' ? 18 : 12;
          ctx.strokeStyle = phaseData.color; ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y - chrLen/2);
          ctx.lineTo(x, y + chrLen/2);
          ctx.stroke();
          // Sister chromatid
          ctx.beginPath();
          ctx.moveTo(x + 5, y - chrLen/2 + 3);
          ctx.lineTo(x + 5, y + chrLen/2 - 3);
          ctx.stroke();
          // Centromere
          ctx.beginPath(); ctx.arc(x + 2.5, y, 3, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
        }
      }

      // Spindle fibers
      if (p === 'metaphase' || p === 'anaphase' || p === 'prophase') {
        const poles = [{ x: cx, y: cy - cellR * 0.85 }, { x: cx, y: cy + cellR * 0.85 }];
        const attachY = p === 'metaphase' ? cy : (p === 'anaphase' ? undefined : cy);
        for (let i = 0; i < chrCount; i++) {
          const chrX = cx + ((i - chrCount/2 + 0.5) * cellR * 0.3);
          poles.forEach(pole => {
            ctx.beginPath();
            ctx.moveTo(pole.x, pole.y);
            ctx.lineTo(chrX, attachY ?? cy);
            ctx.strokeStyle = 'rgba(200,160,255,0.3)'; ctx.lineWidth = 1; ctx.stroke();
          });
        }
      }

      // Anaphase — chromatids separating
      if (p === 'anaphase') {
        const separation = Math.min(1, t % 10 / 5);
        for (let i = 0; i < chrCount; i++) {
          const xOff = (i - chrCount/2 + 0.5) * cellR * 0.3;
          [-1, 1].forEach(dir => {
            const chrY = cy + dir * cellR * 0.4 * separation;
            ctx.strokeStyle = phaseData.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(cx + xOff, chrY - 8); ctx.lineTo(cx + xOff, chrY + 8); ctx.stroke();
            // Spindle fiber
            ctx.beginPath(); ctx.moveTo(cx, cy + dir * cellR * 0.82);
            ctx.lineTo(cx + xOff, chrY);
            ctx.strokeStyle = 'rgba(200,160,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
          });
        }
      }

      // Telophase — cell plate
      if (p === 'telophase') {
        const progress = Math.min(1, (t % 8) / 4);
        // Two nuclei
        [-1, 1].forEach(dir => {
          ctx.beginPath(); ctx.arc(cx, cy + dir * cellR * 0.4, cellR * 0.2, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(150,180,255,0.5)'; ctx.lineWidth = 1.2;
          ctx.fillStyle = 'rgba(80,100,180,0.25)'; ctx.fill(); ctx.stroke();
        });
        // Cell plate forming
        const plateW = cellR * 2 * progress;
        ctx.strokeStyle = '#10B981'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(cx - plateW/2, cy); ctx.lineTo(cx + plateW/2, cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#10B98188';
        ctx.fillText('Cell plate', cx + plateW/2 + 6, cy + 4);
      }

      // Phase label
      ctx.fillStyle = 'rgba(226,232,240,0.95)'; ctx.font = 'bold 13px Sora'; ctx.textAlign = 'center';
      ctx.fillText(phaseData.label, cx, H * 0.85);
      ctx.fillStyle = 'rgba(226,232,240,0.55)'; ctx.font = '10px Inter';
      ctx.fillText(phaseData.desc, cx, H * 0.85 + 16);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 280 }} />
      <div className="mt-3 px-2">
        <div className="flex gap-1.5 flex-wrap justify-center">
          {PHASES.map((ph) => (
            <button
              key={ph.id}
              onClick={() => setPhaseWithEvent(ph.id)}
              className="px-3 py-1.5 rounded-full text-xs font-inter font-medium transition-all"
              style={{
                background: phase === ph.id ? ph.color + '33' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${phase === ph.id ? ph.color + '80' : 'rgba(255,255,255,0.08)'}`,
                color: phase === ph.id ? ph.color : 'rgba(226,232,240,0.5)',
              }}
            >
              {ph.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
