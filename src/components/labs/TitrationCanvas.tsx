import { useEffect, useRef, useState, useCallback } from 'react';
import MoleculeViewer from '@/components/labs/MoleculeViewer';

interface Props { onEvent: (e: string) => void; }

interface Drop { x: number; y: number; vy: number; }

const PH_COLORS = [
  '#FF0000','#FF2200','#FF4400','#FF6600','#FF8800',
  '#FFAA00','#FFCC00','#FFEE00','#CCFF00','#88FF44',
  '#44FF88','#00FFCC','#00EEFF',
];

function phToColor(pH: number): string {
  const idx = Math.min(12, Math.max(0, Math.round((pH / 14) * 12)));
  const c = PH_COLORS[12 - idx];
  return c;
}
function phToRgba(pH: number, alpha = 0.5): string {
  const hex = phToColor(pH);
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function SevenSegDigit({ digit, color }: { digit: string; color: string }) {
  const d: Record<string, number[]> = {
    '0':[1,1,1,1,1,1,0],'1':[0,1,1,0,0,0,0],'2':[1,1,0,1,1,0,1],
    '3':[1,1,1,1,0,0,1],'4':[0,1,1,0,0,1,1],'5':[1,0,1,1,0,1,1],
    '6':[1,0,1,1,1,1,1],'7':[1,1,1,0,0,0,0],'8':[1,1,1,1,1,1,1],
    '9':[1,1,1,1,0,1,1],'.': [0,0,0,0,0,0,0],
  };
  const segs = d[digit] ?? [0,0,0,0,0,0,0];
  const on = color; const off = 'rgba(255,255,255,0.06)';
  return (
    <svg width="20" height="32" viewBox="0 0 20 32">
      {/* Top */}   <rect x="3" y="1"  width="14" height="3" rx="1.5" fill={segs[0]?on:off}/>
      {/* TR */}    <rect x="16" y="3" width="3"  height="11" rx="1.5" fill={segs[1]?on:off}/>
      {/* BR */}    <rect x="16" y="17" width="3" height="11" rx="1.5" fill={segs[2]?on:off}/>
      {/* Bot */}   <rect x="3" y="28" width="14" height="3" rx="1.5" fill={segs[3]?on:off}/>
      {/* BL */}    <rect x="1" y="17" width="3" height="11" rx="1.5" fill={segs[4]?on:off}/>
      {/* TL */}    <rect x="1" y="3"  width="3" height="11" rx="1.5" fill={segs[5]?on:off}/>
      {/* Mid */}   <rect x="3" y="14" width="14" height="3" rx="1.5" fill={segs[6]?on:off}/>
    </svg>
  );
}

export default function TitrationCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ pH: 13.5, acidAdded: 0, drops: [] as Drop[], indicator: false, time: 0 });
  const isHoldingRef = useRef(false);
  const lastMilestoneRef = useRef<number>(13);

  const [pH, setPH] = useState(13.5);
  const [indicator, setIndicator] = useState(false);

  const reportMilestone = useCallback((newPH: number) => {
    const mile = Math.round(newPH);
    if (mile !== lastMilestoneRef.current) {
      lastMilestoneRef.current = mile;
      const msgs: Record<number, string> = {
        10: 'pH dropped to 10 — still basic. What do you think will happen as we add more acid?',
        7: 'pH reached 7 — the equivalence point! Neutral solution achieved.',
        4: 'pH dropped to 4 — now acidic. The NaOH has been completely neutralized.',
      };
      if (msgs[mile]) onEvent(msgs[mile]);
    }
  }, [onEvent]);

  const handleMouseDown = () => { isHoldingRef.current = true; onEvent('Valve opened — HCl acid is dripping into the NaOH solution'); };
  const handleMouseUp = () => { isHoldingRef.current = false; };

  useEffect(() => {
    stateRef.current.indicator = indicator;
  }, [indicator]);

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
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      // Add acid
      if (isHoldingRef.current && s.pH > 0.5) {
        s.pH = Math.max(0, s.pH - 0.015);
        s.acidAdded += 0.15;
        setPH(s.pH);
        reportMilestone(s.pH);
        if (Math.random() < 0.3) s.drops.push({ x: W * 0.5, y: H * 0.12, vy: 1.5 });
      }

      // Burette
      const bx = W * 0.5, bty = H * 0.04, bth = H * 0.28, btw = 16;
      const shimmer = Math.sin(s.time * 3) * 1;
      // Tube glass
      const burGrad = ctx.createLinearGradient(bx - btw/2, 0, bx + btw/2, 0);
      burGrad.addColorStop(0, 'rgba(180,200,255,0.12)');
      burGrad.addColorStop(0.5, 'rgba(180,200,255,0.3)');
      burGrad.addColorStop(1, 'rgba(180,200,255,0.12)');
      ctx.fillStyle = burGrad;
      ctx.strokeStyle = 'rgba(180,200,255,0.45)'; ctx.lineWidth = 1.2;
      ctx.strokeRect(bx - btw/2, bty, btw, bth);
      // HCl fill
      const fillH = bth * (s.pH / 14);
      ctx.fillStyle = 'rgba(220,100,100,0.45)';
      ctx.fillRect(bx - btw/2 + 1, bty + bth - fillH + shimmer, btw - 2, fillH - shimmer);
      // Graduation marks
      for (let g = 1; g <= 5; g++) {
        const gy = bty + bth / 6 * g;
        ctx.beginPath(); ctx.moveTo(bx - btw/2, gy); ctx.lineTo(bx - btw/2 + 6, gy);
        ctx.strokeStyle = 'rgba(180,200,255,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillStyle = 'rgba(180,200,255,0.5)'; ctx.font = '8px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`${g*5}mL`, bx + btw/2 + 3, gy + 3);
      }
      // Stopcock
      ctx.fillStyle = isHoldingRef.current ? '#10B981' : '#6366F1';
      ctx.fillRect(bx - 6, bty + bth - 2, 12, 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8; ctx.strokeRect(bx - 6, bty + bth - 2, 12, 6);
      // Tip
      ctx.strokeStyle = 'rgba(180,200,255,0.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(bx, bty + bth + 4); ctx.lineTo(bx, bty + bth + 14); ctx.stroke();

      // Update drops
      s.drops = s.drops.filter(d => d.y < H * 0.82).map(d => {
        d.y += d.vy; d.vy += 0.15;
        ctx.beginPath(); ctx.ellipse(d.x, d.y, 3, 4, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(220,80,80,0.8)'; ctx.fill();
        return d;
      });

      // Beaker
      const bkx = W * 0.5, bky = H * 0.82, bkw = W * 0.46, bkh = H * 0.3;
      const beakerGrad = ctx.createLinearGradient(bkx - bkw/2, 0, bkx + bkw/2, 0);
      beakerGrad.addColorStop(0, 'rgba(180,200,255,0.1)');
      beakerGrad.addColorStop(0.5, 'rgba(180,200,255,0.22)');
      beakerGrad.addColorStop(1, 'rgba(180,200,255,0.1)');
      ctx.fillStyle = beakerGrad;
      ctx.strokeStyle = 'rgba(180,200,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(bkx - bkw/2, bky - bkh, bkw, bkh);
      // Graduation marks on beaker
      for (let g = 1; g <= 4; g++) {
        const gy = bky - bkh + (bkh / 5) * g;
        ctx.beginPath(); ctx.moveTo(bkx - bkw/2, gy); ctx.lineTo(bkx - bkw/2 + 10, gy);
        ctx.strokeStyle = 'rgba(180,200,255,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillStyle = 'rgba(180,200,255,0.45)'; ctx.font = '8px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`${(g*0.25).toFixed(2)}M`, bkx - bkw/2 + 12, gy + 3);
      }

      // Liquid
      const liqColor = s.indicator ?
        (s.pH > 8.2 ? 'rgba(220,0,180,0.55)' : s.pH < 8.2 ? 'rgba(240,240,255,0.4)' : 'rgba(255,255,255,0.3)') :
        phToRgba(s.pH, 0.55);
      const liqShimmer = Math.sin(s.time * 2.5) * 1.5;
      ctx.fillStyle = liqColor;
      ctx.fillRect(bkx - bkw/2 + 2, bky - bkh * 0.7 + liqShimmer, bkw - 4, bkh * 0.7);

      // pH meter display - 7-segment
      const phStr = s.pH.toFixed(1);
      const digits = phStr.split('');
      const displayX = W * 0.06;
      const displayY = H * 0.62;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.roundRect(displayX, displayY, 90, 52, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(0,255,0,0.15)';
      ctx.fillRect(displayX + 2, displayY + 2, 86, 48);
      const segColor = s.pH < 6 ? '#FF4444' : s.pH > 8 ? '#4488FF' : '#44FF88';
      ctx.fillStyle = 'rgba(226,232,240,0.6)'; ctx.font = '8px Inter'; ctx.textAlign = 'left';
      ctx.fillText('pH', displayX + 4, displayY + 12);
      digits.forEach((d, i) => {
        const el = document.getElementById(`seg-${i}`);
        void el;
      });
      // Draw 7-seg inline
      let ox = displayX + 26;
      digits.forEach((d) => {
        const segs7: Record<string,number[]> = {
          '0':[1,1,1,1,1,1,0],'1':[0,1,1,0,0,0,0],'2':[1,1,0,1,1,0,1],
          '3':[1,1,1,1,0,0,1],'4':[0,1,1,0,0,1,1],'5':[1,0,1,1,0,1,1],
          '6':[1,0,1,1,1,1,1],'7':[1,1,1,0,0,0,0],'8':[1,1,1,1,1,1,1],
          '9':[1,1,1,1,0,1,1],'.': [0,0,0,0,0,0,0],
        };
        if (d === '.') { ctx.beginPath(); ctx.arc(ox + 2, displayY + 44, 3, 0, Math.PI*2); ctx.fillStyle = segColor; ctx.fill(); ox += 8; return; }
        const sg = segs7[d] ?? [0,0,0,0,0,0,0];
        const sc = segColor, oc = 'rgba(255,255,255,0.06)';
        const sw = 14, sh = 22;
        const sy = displayY + 18;
        // top
        ctx.fillStyle = sg[0]?sc:oc; ctx.beginPath(); ctx.roundRect(ox+2, sy-sh/2-1, sw-4, 2, 1); ctx.fill();
        // tr
        ctx.fillStyle = sg[1]?sc:oc; ctx.beginPath(); ctx.roundRect(ox+sw-2, sy-sh/2, 2, sh/2-1, 1); ctx.fill();
        // br
        ctx.fillStyle = sg[2]?sc:oc; ctx.beginPath(); ctx.roundRect(ox+sw-2, sy, 2, sh/2-1, 1); ctx.fill();
        // bot
        ctx.fillStyle = sg[3]?sc:oc; ctx.beginPath(); ctx.roundRect(ox+2, sy+sh/2-1, sw-4, 2, 1); ctx.fill();
        // bl
        ctx.fillStyle = sg[4]?sc:oc; ctx.beginPath(); ctx.roundRect(ox, sy, 2, sh/2-1, 1); ctx.fill();
        // tl
        ctx.fillStyle = sg[5]?sc:oc; ctx.beginPath(); ctx.roundRect(ox, sy-sh/2, 2, sh/2-1, 1); ctx.fill();
        // mid
        ctx.fillStyle = sg[6]?sc:oc; ctx.beginPath(); ctx.roundRect(ox+2, sy-1, sw-4, 2, 1); ctx.fill();
        ox += sw + 2;
      });

      // Labels
      ctx.fillStyle = 'rgba(226,232,240,0.7)'; ctx.font = '600 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`Acid added: ${s.acidAdded.toFixed(1)} mL`, W * 0.5, H * 0.97);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [reportMilestone]);

  const phStr = pH.toFixed(1);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative w-full flex-1" style={{ minHeight: 280 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg sim-canvas-container cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        />
      </div>
      <div className="mt-2 px-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg border border-glass flex items-center justify-center text-xs font-bold font-mono"
            style={{ background: phToRgba(pH, 0.3), color: phToColor(pH), borderColor: phToRgba(pH, 0.5) }}
          >
            {phStr}
          </div>
          <div>
            <div className="text-xs font-inter text-slate/60">pH reading</div>
            <div className="text-xs font-inter" style={{ color: pH > 7 ? '#4488FF' : pH < 7 ? '#FF4444' : '#44FF88' }}>
              {pH > 7.2 ? 'Basic' : pH < 6.8 ? 'Acidic' : 'Neutral'}
            </div>
          </div>
        </div>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-inter font-medium transition-all"
          style={{
            background: indicator ? 'rgba(220,0,180,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${indicator ? 'rgba(220,0,180,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: indicator ? '#f472b6' : 'rgba(226,232,240,0.6)',
          }}
          onClick={() => { setIndicator(!indicator); if (!indicator) onEvent('Phenolphthalein indicator added — solution will turn pink above pH 8.2'); }}
        >
          {indicator ? '✓ Indicator added' : 'Add Indicator'}
        </button>
        <div className="text-xs font-inter text-slate/50 text-right">
          Hold canvas<br/>to drip HCl
        </div>
      </div>
      {/* 3D Molecule Viewer row */}
      <div className="flex gap-4 flex-wrap justify-center pt-1">
        <MoleculeViewer molecule="hcl"   size={110} showLabel />
        <MoleculeViewer molecule="naoh"  size={110} showLabel />
        <MoleculeViewer molecule="nacl"  size={110} showLabel />
      </div>
    </div>
  );
}
