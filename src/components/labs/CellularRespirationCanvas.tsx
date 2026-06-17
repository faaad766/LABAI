import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }
type Stage = 'idle' | 'glycolysis' | 'krebs' | 'etc' | 'done';

export default function CellularRespirationCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [atp, setAtp] = useState(0);
  const [nadh, setNadh] = useState(0);
  const stageRef = useRef<Stage>('idle');
  const atpRef   = useRef(0);
  const rafRef   = useRef(0);
  const tickRef  = useRef(0);

  stageRef.current = stage;
  atpRef.current   = atp;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;

    const STAGE_X = [W * 0.12, W * 0.38, W * 0.65, W * 0.88];
    const STAGE_LABELS = ['Glycolysis', 'Pyruvate\nOxidation', 'Krebs\nCycle', 'ETC'];
    const STAGE_ATPS   = [0, 2, 2, 34];
    const STAGE_COLORS = ['#1B4332','#2D6A4F','#52796F','#F59E0B'];
    const STAGE_IDX: Record<Stage, number> = { idle: -1, glycolysis: 0, krebs: 2, etc: 3, done: 4 };

    function drawPipeline(t: number) {
      // Connecting arrow
      ctx.beginPath();
      ctx.moveTo(STAGE_X[0], H * 0.42);
      for (let i = 1; i < STAGE_X.length; i++) ctx.lineTo(STAGE_X[i], H * 0.42);
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 2; ctx.stroke();

      const active = STAGE_IDX[stageRef.current];
      STAGE_LABELS.forEach((lbl, i) => {
        const isActive = i <= active;
        const pulse = isActive ? 1 + 0.06 * Math.sin(t * 0.06 + i) : 1;
        // Node circle
        ctx.beginPath();
        ctx.arc(STAGE_X[i], H * 0.42, 28 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? STAGE_COLORS[i] : '#F0EDE6';
        ctx.fill();
        ctx.strokeStyle = isActive ? STAGE_COLORS[i] : '#E7E5E0';
        ctx.lineWidth = 2; ctx.stroke();
        // Label
        ctx.font = '11px Sora,sans-serif'; ctx.fillStyle = isActive ? '#fff' : '#A8A29E';
        ctx.textAlign = 'center';
        const lines = lbl.split('\n');
        lines.forEach((line, li) => ctx.fillText(line, STAGE_X[i], H * 0.42 + (li - (lines.length - 1) / 2) * 13));
        // ATP yield badge
        if (isActive && STAGE_ATPS[i] > 0) {
          ctx.font = 'bold 10px Inter,sans-serif'; ctx.fillStyle = '#F59E0B';
          ctx.fillText(`+${STAGE_ATPS[i]} ATP`, STAGE_X[i], H * 0.42 + 38);
        }
        ctx.textAlign = 'left';
      });
    }

    function drawATPCounter(t: number) {
      const a = atpRef.current;
      ctx.font = 'bold 42px Sora,sans-serif'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'center';
      ctx.fillText(String(a), W / 2, H * 0.78);
      ctx.font = '13px Inter,sans-serif'; ctx.fillStyle = '#52796F';
      ctx.fillText('ATP molecules produced', W / 2, H * 0.78 + 22);
      ctx.textAlign = 'left';
      // Sparkle on ATP gain
      if (a > 0 && a < 38) {
        const spark = 0.5 + 0.5 * Math.sin(t * 0.15);
        ctx.font = `${14 + spark * 4}px Inter`; ctx.textAlign = 'center'; ctx.fillStyle = '#F59E0B';
        ctx.fillText('⚡', W / 2 + 38, H * 0.78 - 4); ctx.textAlign = 'left';
      }
    }

    function drawGlucose() {
      ctx.beginPath(); ctx.arc(W * 0.12, H * 0.2, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#FEF3C7'; ctx.fill();
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#92400E'; ctx.textAlign = 'center';
      ctx.fillText('C₆H₁₂O₆', W * 0.12, H * 0.2 + 4); ctx.textAlign = 'left';
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      tickRef.current++;
      drawGlucose();
      drawPipeline(tickRef.current);
      drawATPCounter(tickRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const advance = () => {
    const transitions: Partial<Record<Stage, { next: Stage; atp: number; nadh: number; msg: string }>> = {
      idle:       { next: 'glycolysis', atp: 2,  nadh: 2,  msg: 'Glycolysis splits glucose into 2 pyruvate molecules in the cytoplasm — net 2 ATP and 2 NADH produced' },
      glycolysis: { next: 'krebs',      atp: 4,  nadh: 8,  msg: 'Pyruvate enters the mitochondria — Krebs cycle releases CO₂ and produces 2 more ATP plus NADH and FADH₂' },
      krebs:      { next: 'etc',        atp: 38, nadh: 10, msg: 'Electron Transport Chain — NADH donates electrons, O₂ is final acceptor, 34 ATP produced via chemiosmosis' },
      etc:        { next: 'done',       atp: 38, nadh: 10, msg: 'Cellular respiration complete — 38 ATP total from 1 glucose molecule (C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP)' },
    };
    const t = transitions[stage];
    if (!t) return;
    setStage(t.next);
    setAtp(t.atp);
    setNadh(t.nadh);
    onEvent(t.msg);
  };

  const LABELS: Record<Stage, string> = {
    idle: 'Start Glycolysis',
    glycolysis: 'Enter Krebs Cycle',
    krebs: 'Start ETC',
    etc: 'Complete Respiration',
    done: 'Complete ✓',
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      <div className="flex flex-wrap gap-2 p-3 shrink-0 items-center" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        <button onClick={advance} disabled={stage === 'done'}
          className="btn-primary text-xs disabled:opacity-40">
          {LABELS[stage]}
        </button>
        <button onClick={() => { setStage('idle'); setAtp(0); setNadh(0); }}
          className="px-3 py-1.5 rounded-lg text-xs font-sora font-semibold"
          style={{ border: '1px solid #E7E5E0', color: '#1B4332', background: '#fff' }}>
          Reset
        </button>
        <div className="ml-auto flex gap-4 font-inter text-xs" style={{ color: '#52796F' }}>
          <span>Stage: <strong>{stage}</strong></span>
          <span>NADH: <strong>{nadh}</strong></span>
        </div>
      </div>
      <canvas ref={canvasRef} width={700} height={300} className="w-full flex-1" style={{ background: '#FDFCF9' }} />
    </div>
  );
}
