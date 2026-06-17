import { useEffect, useRef, useCallback } from 'react';

interface Props { onEvent: (e: string) => void; }

type SolutionType = 'hypotonic' | 'isotonic' | 'hypertonic';

interface State {
  selected: SolutionType;
  sliceSize: Record<SolutionType, number>;
  time: number;
  particles: Array<{ x: number; y: number; vx: number; vy: number; side: 'in' | 'out'; sol: SolutionType }>;
}

const SOLUTIONS: { id: SolutionType; label: string; saltPct: string; target: number; color: string }[] = [
  { id: 'hypotonic',  label: 'Hypotonic (0.2%)',  saltPct: '0.2%',  target: 1.3, color: 'rgba(99,180,255,0.35)' },
  { id: 'isotonic',   label: 'Isotonic (0.9%)',   saltPct: '0.9%',  target: 1.0, color: 'rgba(99,255,180,0.25)' },
  { id: 'hypertonic', label: 'Hypertonic (5%)',   saltPct: '5%',    target: 0.7, color: 'rgba(255,180,99,0.35)' },
];

export default function OsmosisCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({
    selected: 'isotonic',
    sliceSize: { hypotonic: 1, isotonic: 1, hypertonic: 1 },
    time: 0,
    particles: [],
  });
  const animRef = useRef<number>(0);
  const reportedRef = useRef<Set<string>>(new Set());

  const initParticles = useCallback((sol: SolutionType, cx: number, cy: number) => {
    const count = 20;
    const arr = [];
    for (let i = 0; i < count; i++) {
      const inside = Math.random() < 0.5;
      const angle = Math.random() * Math.PI * 2;
      const r = inside ? Math.random() * 20 : 20 + Math.random() * 30;
      arr.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        side: inside ? 'in' as const : 'out' as const,
        sol,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const W = () => canvas.width;
    const H = () => canvas.height;
    const positions = [0.2, 0.5, 0.8];

    // init particles
    stateRef.current.particles = SOLUTIONS.flatMap((s, i) =>
      initParticles(s.id, W() * positions[i], H() * 0.55)
    );

    const draw = () => {
      const s = stateRef.current;
      s.time += 0.016;

      ctx.clearRect(0, 0, W(), H());

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W(); x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke(); }
      for (let y = 0; y < H(); y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W(), y); ctx.stroke(); }

      SOLUTIONS.forEach((sol, i) => {
        const cx = W() * positions[i];
        const by = H() * 0.75;
        const bw = W() * 0.18;
        const bh = H() * 0.35;
        const target = sol.target;
        const current = s.sliceSize[sol.id];
        const speed = sol.id === 'isotonic' ? 0 : sol.id === 'hypotonic' ? 0.003 : -0.002;
        s.sliceSize[sol.id] = Math.max(0.5, Math.min(1.5, current + speed));

        // Beaker glass
        ctx.strokeStyle = 'rgba(180,200,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - bw / 2, by - bh, bw, bh);

        // Graduation marks
        for (let g = 1; g <= 4; g++) {
          const gy = by - bh + (bh / 5) * g;
          ctx.beginPath();
          ctx.moveTo(cx - bw / 2, gy);
          ctx.lineTo(cx - bw / 2 + 8, gy);
          ctx.strokeStyle = 'rgba(180,200,255,0.3)';
          ctx.stroke();
        }

        // Solution fill with shimmer
        const shimmer = Math.sin(s.time * 3 + i) * 2;
        ctx.fillStyle = sol.color;
        ctx.fillRect(cx - bw / 2 + 1, by - bh * 0.8 + shimmer, bw - 2, bh * 0.8);

        // Potato slice
        const sz = s.sliceSize[sol.id];
        const sw = 18 * sz, sh = 8 * sz;
        const sliceY = by - bh * 0.4;

        // Report size changes
        const key = `${sol.id}_${sz > 1.15 ? 'swollen' : sz < 0.85 ? 'shrunken' : 'normal'}`;
        if (!reportedRef.current.has(key)) {
          reportedRef.current.add(key);
          onEvent(`In ${sol.label}: potato slice is ${sz > 1.15 ? 'swelling (water flowing in)' : sz < 0.85 ? 'shrinking (water flowing out)' : 'staying the same (isotonic)'}`);
        }

        // Slice gradient
        const grad = ctx.createLinearGradient(cx - sw, sliceY - sh, cx + sw, sliceY + sh);
        grad.addColorStop(0, '#d4a84b');
        grad.addColorStop(1, '#b8892e');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, sliceY, sw, sh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,100,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(226,232,240,0.8)';
        ctx.font = '600 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(sol.label, cx, by + 16);

        // Size indicator
        const sizeLabel = sz > 1.1 ? '▲ Swelling' : sz < 0.9 ? '▼ Shrinking' : '= Stable';
        const sizeColor = sz > 1.1 ? '#10B981' : sz < 0.9 ? '#F59E0B' : '#6366F1';
        ctx.fillStyle = sizeColor;
        ctx.font = '500 10px Inter';
        ctx.fillText(sizeLabel, cx, by + 28);

        // Particle flow direction arrows
        const flowDir = sol.id === 'hypotonic' ? 1 : sol.id === 'hypertonic' ? -1 : 0;
        if (flowDir !== 0) {
          const arrowX = cx + (flowDir > 0 ? -bw * 0.1 : bw * 0.1);
          ctx.fillStyle = flowDir > 0 ? 'rgba(99,180,255,0.7)' : 'rgba(255,140,60,0.7)';
          ctx.font = '14px serif';
          ctx.fillText(flowDir > 0 ? '→' : '←', arrowX, sliceY);
        }

        void target;
      });

      // Update & draw water molecules
      s.particles = s.particles.map((p) => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;
        if (nx < 5 || nx > W() - 5) p.vx *= -1;
        if (ny < 5 || ny > H() - 5) p.vy *= -1;
        nx = Math.max(5, Math.min(W() - 5, nx));
        ny = Math.max(5, Math.min(H() - 5, ny));
        return { ...p, x: nx, y: ny };
      });

      s.particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.side === 'in' ? 'rgba(99,180,255,0.7)' : 'rgba(200,220,255,0.4)';
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [initParticles, onEvent]);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 300 }} />
      <div className="mt-3 px-1 flex gap-4 flex-wrap justify-center">
        {SOLUTIONS.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-xs font-inter text-slate/60">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color.replace('0.35', '1').replace('0.25','1') }} />
            {s.id.charAt(0).toUpperCase() + s.id.slice(1)}: {s.saltPct} NaCl
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs font-inter text-slate/60">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Water molecules
        </div>
      </div>
    </div>
  );
}
