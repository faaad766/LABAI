import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }
type ImmuneStage = 'idle' | 'antigen' | 'recognition' | 'bcell' | 'antibody' | 'neutralised';

export default function ImmuneResponseCanvas({ onEvent }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stageRef   = useRef<ImmuneStage>('idle');
  const rafRef     = useRef(0);
  const tickRef    = useRef(0);
  const [stage, setStage] = useState<ImmuneStage>('idle');
  const [abCount, setAbCount] = useState(0);

  stageRef.current = stage;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;

    function drawPathogen(t: number, count: number, neutralised: boolean) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const rx = W * 0.25 + 60 * Math.cos(angle + t * 0.01);
        const ry = H * 0.4  + 40 * Math.sin(angle + t * 0.01);
        if (neutralised && i < abCount * 2) continue;
        // Pathogen body
        ctx.beginPath(); ctx.arc(rx, ry, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE4E6'; ctx.fill();
        ctx.strokeStyle = '#9F1239'; ctx.lineWidth = 1.5; ctx.stroke();
        // Spike proteins
        for (let s = 0; s < 6; s++) {
          const sa = (s / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(rx + 14 * Math.cos(sa), ry + 14 * Math.sin(sa));
          ctx.lineTo(rx + 20 * Math.cos(sa), ry + 20 * Math.sin(sa));
          ctx.strokeStyle = '#9F1239'; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.font = '9px Inter'; ctx.fillStyle = '#9F1239'; ctx.textAlign = 'center';
        ctx.fillText('ANTIGEN', rx, ry + 4); ctx.textAlign = 'left';
      }
    }

    function drawBCell(t: number, active: boolean) {
      const bx = W * 0.55, by = H * 0.4;
      // B-cell glow
      if (active) {
        ctx.beginPath(); ctx.arc(bx, by, 32 + 4 * Math.sin(t * 0.08), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(27,67,50,0.1)'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(bx, by, 22, 0, Math.PI * 2);
      ctx.fillStyle = active ? '#F0F7F3' : '#F9FAFB';
      ctx.fill(); ctx.strokeStyle = active ? '#1B4332' : '#D1D5DB'; ctx.lineWidth = 2; ctx.stroke();
      // Nucleus
      ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fillStyle = active ? '#1B4332' : '#9CA3AF'; ctx.fill();
      ctx.font = '9px Sora'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('B', bx, by + 4);
      ctx.textAlign = 'left';
      ctx.font = '11px Sora'; ctx.fillStyle = active ? '#1B4332' : '#9CA3AF'; ctx.textAlign = 'center';
      ctx.fillText('B-Cell', bx, by + 38); ctx.textAlign = 'left';
    }

    function drawAntibody(ax: number, ay: number) {
      // Y-shape antibody
      const armL = 12;
      ctx.beginPath();
      ctx.moveTo(ax, ay + armL * 1.5);
      ctx.lineTo(ax, ay);
      ctx.lineTo(ax - armL, ay - armL);
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + armL, ay - armL);
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2; ctx.stroke();
      // Tips
      [ax - armL, ax + armL].forEach(tx => {
        ctx.beginPath(); ctx.arc(tx, ay - armL, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#BBF7D0'; ctx.fill(); ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 1; ctx.stroke();
      });
    }

    function drawAntibodies(count: number, t: number) {
      for (let i = 0; i < count; i++) {
        const angle = (i / Math.max(count, 1)) * Math.PI * 2 + t * 0.02;
        const r = 40 + i * 8;
        const ax = W * 0.55 + r * Math.cos(angle);
        const ay = H * 0.4  + r * Math.sin(angle);
        drawAntibody(ax, ay);
      }
    }

    function drawLegend() {
      const items = [
        { color: '#FFE4E6', border: '#9F1239', label: 'Pathogen/Antigen' },
        { color: '#F0F7F3', border: '#1B4332', label: 'B-Cell' },
        { color: '#BBF7D0', border: '#1B4332', label: 'Antibody (Y)' },
      ];
      items.forEach((item, i) => {
        ctx.beginPath(); ctx.arc(W - 130, H * 0.15 + i * 22, 7, 0, Math.PI * 2);
        ctx.fillStyle = item.color; ctx.fill(); ctx.strokeStyle = item.border; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '10px Inter'; ctx.fillStyle = '#57534E';
        ctx.fillText(item.label, W - 118, H * 0.15 + i * 22 + 4);
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      tickRef.current++;
      const st = stageRef.current;
      const count = st === 'idle' ? 0 : st === 'antigen' ? 5 : st === 'recognition' ? 5 : 3;
      const neutralised = st === 'neutralised';
      const abShow = st === 'antibody' || st === 'neutralised' ? abCount : 0;

      drawPathogen(tickRef.current, count, neutralised);
      drawBCell(tickRef.current, st === 'bcell' || st === 'antibody' || st === 'neutralised');
      drawAntibodies(abShow, tickRef.current);

      // Stage caption
      const captions: Partial<Record<ImmuneStage, string>> = {
        idle: 'System at rest — no pathogens detected',
        antigen: 'Pathogens entering — spike proteins (antigens) detected',
        recognition: 'B-cell binds matching antigen — clonal selection begins',
        bcell: 'B-cell activated — differentiating into antibody-producing plasma cells',
        antibody: 'Plasma cells producing Y-shaped antibodies — binding antigens',
        neutralised: 'Pathogens neutralised — antibodies have blocked all spike proteins!',
      };
      ctx.font = '12px Inter,sans-serif'; ctx.fillStyle = '#52796F'; ctx.textAlign = 'center';
      ctx.fillText(captions[st] ?? '', W / 2, H - 16); ctx.textAlign = 'left';

      drawLegend();
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [abCount]);

  const STEPS: Array<{ label: string; next: ImmuneStage; msg: string; ab?: number }> = [
    { label: '🦠 Introduce Pathogen', next: 'antigen',     msg: 'Pathogens enter the bloodstream — their surface proteins (antigens) are unique molecular fingerprints that the immune system must recognise', ab: 0 },
    { label: '🔍 B-Cell Recognition', next: 'recognition', msg: 'A B-cell with matching surface receptors binds the antigen — this triggers clonal selection, activating this specific B-cell clone', ab: 0 },
    { label: '⚡ Activate B-Cell',    next: 'bcell',        msg: 'Activated B-cell proliferates into plasma cells — each plasma cell can produce up to 2,000 antibodies per second within days', ab: 0 },
    { label: '🛡️ Produce Antibodies', next: 'antibody',    msg: 'Y-shaped antibodies released — their two variable regions (Fab) bind antigens precisely, like a lock and key, neutralising the threat', ab: 8 },
    { label: '✅ Neutralise Threat',  next: 'neutralised',  msg: 'All pathogens neutralised — memory B-cells retained for lifetime immunity; next infection triggers rapid secondary response', ab: 12 },
  ];

  const currentIdx = ['idle','antigen','recognition','bcell','antibody','neutralised'].indexOf(stage);
  const nextStep = STEPS[Math.max(0, currentIdx)];

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      <div className="flex flex-wrap gap-2 p-3 shrink-0 items-center" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        {nextStep && stage !== 'neutralised' && (
          <button
            onClick={() => {
              setStage(nextStep.next);
              if (nextStep.ab !== undefined) setAbCount(nextStep.ab);
              onEvent(nextStep.msg);
            }}
            className="btn-primary text-xs">
            {nextStep.label}
          </button>
        )}
        <button onClick={() => { setStage('idle'); setAbCount(0); }}
          className="px-3 py-1.5 rounded-lg text-xs font-sora font-semibold"
          style={{ border: '1px solid #E7E5E0', color: '#1B4332', background: '#fff' }}>
          Reset
        </button>
        <div className="ml-auto font-inter text-xs" style={{ color: '#52796F' }}>
          Antibodies: <strong>{abCount}</strong> · Stage: <strong>{stage}</strong>
        </div>
      </div>
      <canvas ref={canvasRef} width={700} height={300} className="w-full flex-1" style={{ background: '#FDFCF9' }} />
    </div>
  );
}
