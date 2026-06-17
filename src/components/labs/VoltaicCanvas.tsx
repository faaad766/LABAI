import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function VoltaicCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const timeRef = useRef(0);
  const [voltage, setVoltage] = useState(0);
  const voltageRef = useRef(0);

  const connect = () => {
    connectedRef.current = true;
    setConnected(true);
    voltageRef.current = 1.1;
    setVoltage(1.1);
    onEvent('Circuit completed! Electron flow observed from zinc anode to copper cathode. Voltage reading: 1.10V. Which electrode is being oxidized?');
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

    const electrons: { x: number; y: number; progress: number; speed: number }[] = [];
    const ions: { x: number; y: number; vx: number; vy: number; charge: number }[] = [];

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const conn = connectedRef.current;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Beakers
      const bh = H * 0.45, bw = W * 0.28;
      const zx = W * 0.22, cx2 = W * 0.78, by = H * 0.68;

      // Zinc beaker
      const zg = ctx.createLinearGradient(zx - bw/2, 0, zx + bw/2, 0);
      zg.addColorStop(0, 'rgba(180,200,255,0.1)');
      zg.addColorStop(0.5, 'rgba(180,200,255,0.22)');
      zg.addColorStop(1, 'rgba(180,200,255,0.1)');
      ctx.fillStyle = zg;
      ctx.strokeStyle = 'rgba(180,200,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(zx - bw/2, by - bh, bw, bh);
      // ZnSO4 solution (blue)
      ctx.fillStyle = 'rgba(100,150,255,0.2)';
      ctx.fillRect(zx - bw/2 + 2, by - bh + 10, bw - 4, bh - 12);
      ctx.fillStyle = 'rgba(226,232,240,0.6)'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
      ctx.fillText('ZnSO₄', zx, by + 16); ctx.fillText('(aq)', zx, by + 28);

      // Copper beaker
      const cg = ctx.createLinearGradient(cx2 - bw/2, 0, cx2 + bw/2, 0);
      cg.addColorStop(0, 'rgba(180,200,255,0.1)');
      cg.addColorStop(0.5, 'rgba(180,200,255,0.22)');
      cg.addColorStop(1, 'rgba(180,200,255,0.1)');
      ctx.fillStyle = cg;
      ctx.strokeStyle = 'rgba(180,200,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx2 - bw/2, by - bh, bw, bh);
      // CuSO4 solution (cyan)
      ctx.fillStyle = 'rgba(0,180,220,0.2)';
      ctx.fillRect(cx2 - bw/2 + 2, by - bh + 10, bw - 4, bh - 12);
      ctx.fillStyle = 'rgba(226,232,240,0.6)'; ctx.textAlign = 'center';
      ctx.fillText('CuSO₄', cx2, by + 16); ctx.fillText('(aq)', cx2, by + 28);

      // Electrodes
      // Zinc rod
      const zRodGrad = ctx.createLinearGradient(zx - 8, 0, zx + 8, 0);
      zRodGrad.addColorStop(0, '#8ea3b0'); zRodGrad.addColorStop(0.5, '#c0d0dc'); zRodGrad.addColorStop(1, '#8ea3b0');
      ctx.fillStyle = zRodGrad;
      ctx.fillRect(zx - 8, by - bh * 0.85, 16, bh * 0.7);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(zx - 8, by - bh * 0.85, 16, bh * 0.7);
      ctx.fillStyle = 'rgba(226,232,240,0.9)'; ctx.font = 'bold 13px Sora'; ctx.textAlign = 'center';
      ctx.fillText('Zn', zx, by - bh * 0.9);
      ctx.fillStyle = '#F59E0B'; ctx.font = '9px Inter';
      ctx.fillText('ANODE (−)', zx, by - bh * 0.95);

      // Copper rod
      const cRodGrad = ctx.createLinearGradient(cx2 - 8, 0, cx2 + 8, 0);
      cRodGrad.addColorStop(0, '#b87333'); cRodGrad.addColorStop(0.5, '#d4904f'); cRodGrad.addColorStop(1, '#b87333');
      ctx.fillStyle = cRodGrad;
      ctx.fillRect(cx2 - 8, by - bh * 0.85, 16, bh * 0.7);
      ctx.strokeStyle = 'rgba(255,200,100,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(cx2 - 8, by - bh * 0.85, 16, bh * 0.7);
      ctx.fillStyle = 'rgba(226,232,240,0.9)'; ctx.font = 'bold 13px Sora'; ctx.textAlign = 'center';
      ctx.fillText('Cu', cx2, by - bh * 0.9);
      ctx.fillStyle = '#10B981'; ctx.font = '9px Inter';
      ctx.fillText('CATHODE (+)', cx2, by - bh * 0.95);

      // Salt bridge
      const sbY = by - bh - 20, sbMid = W * 0.5;
      ctx.strokeStyle = 'rgba(180,200,255,0.4)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(zx, sbY); ctx.lineTo(zx, sbY - 20);
      ctx.bezierCurveTo(zx, sbY - 60, cx2, sbY - 60, cx2, sbY - 20);
      ctx.lineTo(cx2, sbY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(226,232,240,0.5)'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Salt Bridge (KNO₃)', sbMid, sbY - 55);

      // Wire
      const wireY = by - bh - 50;
      if (conn) {
        ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(zx, by - bh * 0.9 - 10); ctx.lineTo(zx, wireY);
        ctx.lineTo(cx2, wireY); ctx.lineTo(cx2, by - bh * 0.9 - 10); ctx.stroke();
        ctx.fillStyle = 'rgba(226,232,240,0.6)'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
        ctx.fillText('electron flow →', sbMid, wireY - 6);
      } else {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(100,100,160,0.4)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(zx, by - bh * 0.9 - 10); ctx.lineTo(zx, wireY);
        ctx.lineTo(cx2, wireY); ctx.lineTo(cx2, by - bh * 0.9 - 10); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Electrons flowing
      if (conn) {
        if (Math.random() < 0.15) electrons.push({ x: zx, y: wireY, progress: 0, speed: 0.008 + Math.random() * 0.006 });
        electrons.forEach((e, i) => {
          e.progress = Math.min(1, e.progress + e.speed);
          const totalLen = (cx2 - zx) + 2 * 30;
          const dist = e.progress * totalLen;
          let ex = zx, ey = wireY;
          if (dist < 30) { ex = zx; ey = wireY - dist; }
          else if (dist < 30 + cx2 - zx) { ex = zx + (dist - 30); ey = wireY; }
          else { ex = cx2; ey = wireY + (dist - 30 - (cx2 - zx)); }
          ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI*2);
          ctx.fillStyle = '#818CF8'; ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 7px Inter'; ctx.textAlign = 'center';
          ctx.fillText('e⁻', ex, ey + 2.5);
          if (e.progress >= 1) electrons.splice(i, 1);
        });

        // Ion movement in solutions
        if (Math.random() < 0.1) {
          ions.push({ x: sbMid + (Math.random() - 0.5) * 30, y: sbY - 30, vx: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.5), vy: (Math.random() - 0.5) * 0.5, charge: Math.random() < 0.5 ? 1 : -1 });
        }
        ions.forEach((ion, i) => {
          ion.x += ion.vx; ion.y += ion.vy;
          ctx.beginPath(); ctx.arc(ion.x, ion.y, 4, 0, Math.PI*2);
          ctx.fillStyle = ion.charge > 0 ? 'rgba(255,120,60,0.7)' : 'rgba(60,120,255,0.7)'; ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 6px Inter'; ctx.textAlign = 'center';
          ctx.fillText(ion.charge > 0 ? '+' : '−', ion.x, ion.y + 2);
          if (Math.abs(ion.x - sbMid) > 80 || ion.y < sbY - 55) ions.splice(i, 1);
        });
      }

      // Voltmeter
      const vmx = sbMid, vmy = H * 0.12;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(vmx - 36, vmy, 72, 44, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(226,232,240,0.5)'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
      ctx.fillText('VOLTMETER', vmx, vmy + 12);
      const vDispColor = conn ? '#10B981' : '#334155';
      const vText = conn ? `${voltageRef.current.toFixed(2)} V` : '--- V';
      ctx.fillStyle = vDispColor; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
      ctx.fillText(vText, vmx, vmy + 36);
      // Subtle flicker when connected
      if (conn) {
        const flicker = Math.sin(t * 20) * 0.03;
        ctx.fillStyle = '#10B981'; ctx.font = 'bold 16px monospace';
        ctx.fillText(`${(voltageRef.current + flicker).toFixed(2)} V`, vmx, vmy + 36);
      }

      void sbMid;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 280 }} />
      <div className="mt-3 px-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs font-inter text-slate/60">
            <span className="text-amber-lab font-semibold">Zn</span> → Zn²⁺ + 2e⁻ (oxidation)
          </div>
          <div className="text-xs font-inter text-slate/60">
            Cu²⁺ + 2e⁻ → <span className="text-emerald-lab font-semibold">Cu</span> (reduction)
          </div>
        </div>
        {!connected ? (
          <button onClick={connect} className="btn-indigo shrink-0">Connect Circuit</button>
        ) : (
          <div className="text-emerald-lab text-xs font-inter font-semibold shrink-0">✓ {voltage.toFixed(2)}V — Circuit active</div>
        )}
      </div>
    </div>
  );
}
