import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type Direction = 'forward' | 'reverse' | 'none';

export default function LeChatelierCanvas({ onEvent }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [conc, setConc]   = useState(50);
  const [temp, setTemp]   = useState(400);
  const [pres, setPres]   = useState(1.0);
  const [Q, setQ]         = useState(50);
  const [shift, setShift] = useState<Direction>('none');
  const concRef = useRef(50);
  const tempRef = useRef(400);
  const presRef = useRef(1.0);
  const QRef    = useRef(50);
  const shiftRef = useRef<Direction>('none');
  const rafRef  = useRef(0);
  const tickRef = useRef(0);

  concRef.current = conc; tempRef.current = temp;
  presRef.current = pres; QRef.current = Q;
  shiftRef.current = shift;

  // K for Haber: changes with temperature
  const K = Math.max(5, 200 - (temp - 400) * 0.4);
  const KRef = useRef(K);
  KRef.current = K;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;

    function drawEquation() {
      ctx.font = 'bold 14px Sora,sans-serif'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'center';
      ctx.fillText('N₂ + 3H₂  ⇌  2NH₃', W / 2, H * 0.12);
      ctx.font = '10px Inter'; ctx.fillStyle = '#52796F';
      ctx.fillText('(Haber Process — exothermic forward reaction)', W / 2, H * 0.12 + 18);
      ctx.textAlign = 'left';
    }

    function drawMolecules(t: number, q: number, k: number) {
      const reactantCount = Math.floor((1 - q / 100) * 12) + 1;
      const productCount  = Math.floor((q / 100) * 12) + 1;
      // Reactant side (left)
      for (let i = 0; i < reactantCount; i++) {
        const x = 40 + (i % 4) * 36 + 4 * Math.sin(t * 0.04 + i);
        const y = H * 0.45 + Math.floor(i / 4) * 30 + 4 * Math.cos(t * 0.03 + i * 1.3);
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#FEF3C7'; ctx.fill(); ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '8px Inter'; ctx.fillStyle = '#92400E'; ctx.textAlign = 'center'; ctx.fillText('N₂', x, y + 3);
      }
      // Product side (right)
      for (let i = 0; i < productCount; i++) {
        const x = W - 120 + (i % 4) * 28 + 3 * Math.sin(t * 0.05 + i);
        const y = H * 0.45 + Math.floor(i / 4) * 30 + 3 * Math.cos(t * 0.04 + i * 1.1);
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#F0F7F3'; ctx.fill(); ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = '8px Inter'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'center'; ctx.fillText('NH₃', x, y + 3);
      }
      ctx.textAlign = 'left';
      ctx.font = '11px Inter'; ctx.fillStyle = '#78716C';
      ctx.fillText('Reactants (N₂, H₂)', 20, H * 0.38);
      ctx.fillText('Products (NH₃)', W - 130, H * 0.38);
    }

    function drawArrows(sh: Direction) {
      const cy = H * 0.62, mx = W / 2;
      const fwd = sh === 'forward' ? '#1B4332' : '#D4CFC8';
      const rev = sh === 'reverse' ? '#9F1239' : '#D4CFC8';
      // Forward arrow
      ctx.beginPath(); ctx.moveTo(mx - 60, cy - 8); ctx.lineTo(mx + 60, cy - 8);
      ctx.strokeStyle = fwd; ctx.lineWidth = sh === 'forward' ? 3 : 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx + 50, cy - 14); ctx.lineTo(mx + 60, cy - 8); ctx.lineTo(mx + 50, cy - 2);
      ctx.strokeStyle = fwd; ctx.stroke();
      // Reverse arrow
      ctx.beginPath(); ctx.moveTo(mx + 60, cy + 8); ctx.lineTo(mx - 60, cy + 8);
      ctx.strokeStyle = rev; ctx.lineWidth = sh === 'reverse' ? 3 : 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx - 50, cy + 2); ctx.lineTo(mx - 60, cy + 8); ctx.lineTo(mx - 50, cy + 14);
      ctx.strokeStyle = rev; ctx.stroke();
      ctx.font = '10px Inter'; ctx.fillStyle = '#52796F'; ctx.textAlign = 'center';
      ctx.fillText(sh === 'forward' ? '→ Equilibrium shifts FORWARD' : sh === 'reverse' ? '← Equilibrium shifts REVERSE' : '⇌ At equilibrium', mx, cy + 30);
      ctx.textAlign = 'left';
    }

    function drawQvsK(q: number, k: number) {
      const bx = W / 2 - 80, by = H * 0.76, bw = 160, bh = 18;
      ctx.fillStyle = '#F9F9F7'; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
      const qFrac = Math.min(q / 100, 1);
      const kFrac = Math.min(k / 200, 1);
      // Q bar
      ctx.fillStyle = '#BBF7D0'; ctx.fillRect(bx, by, bw * qFrac, bh / 2);
      ctx.fillStyle = '#FEF3C7'; ctx.fillRect(bx, by + bh / 2, bw * kFrac, bh / 2);
      ctx.font = '9px Inter'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'left';
      ctx.fillText(`Q = ${q.toFixed(0)}`, bx + 3, by + 10);
      ctx.fillStyle = '#92400E'; ctx.fillText(`K = ${k.toFixed(0)}`, bx + 3, by + bh - 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#52796F'; ctx.font = '10px Sora';
      const cmp = Math.abs(q - k) < 5 ? 'Q ≈ K (equilibrium)' : q < k ? 'Q < K → shift →' : 'Q > K → shift ←';
      ctx.fillText(cmp, bx + bw - 3, by + bh / 2 + 4);
      ctx.textAlign = 'left';
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      tickRef.current++;
      drawEquation();
      drawMolecules(tickRef.current, QRef.current, KRef.current);
      drawArrows(shiftRef.current);
      drawQvsK(QRef.current, KRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const applyChange = (newQ: number, dir: Direction, msg: string) => {
    setQ(newQ); setShift(dir);
    onEvent(msg);
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      <div className="flex flex-wrap gap-4 p-3 shrink-0 items-center" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        <label className="flex flex-col gap-1 font-inter text-xs" style={{ color: '#52796F' }}>
          <span>Concentration (N₂ added): {conc}%</span>
          <input type="range" min="10" max="90" value={conc} onChange={e => {
            const v = +e.target.value; setConc(v);
            const newQ = Math.max(5, Q - (v - concRef.current) * 0.4);
            applyChange(newQ, 'forward', `More N₂ reactant added — Q drops below K, equilibrium shifts forward (right) to consume excess reactant and produce more NH₃`);
          }} className="w-28 accent-forest" />
        </label>
        <label className="flex flex-col gap-1 font-inter text-xs" style={{ color: '#52796F' }}>
          <span>Temperature: {temp}K</span>
          <input type="range" min="300" max="800" step="50" value={temp} onChange={e => {
            const v = +e.target.value; setTemp(v);
            const dir: Direction = v > 400 ? 'reverse' : 'forward';
            applyChange(v > 400 ? Math.min(90, Q + 10) : Math.max(10, Q - 10), dir,
              v > 400
                ? `Temperature increased — Haber process is exothermic, so higher temp favours reverse reaction, reducing NH₃ yield (Q > K)`
                : `Temperature decreased — equilibrium shifts forward to release heat, increasing NH₃ yield`
            );
          }} className="w-28" />
        </label>
        <label className="flex flex-col gap-1 font-inter text-xs" style={{ color: '#52796F' }}>
          <span>Pressure: {pres.toFixed(1)} atm</span>
          <input type="range" min="0.5" max="3.0" step="0.1" value={pres} onChange={e => {
            const v = +e.target.value; setPres(v);
            const dir: Direction = v > 1 ? 'forward' : 'reverse';
            applyChange(v > 1 ? Math.min(85, Q + 8) : Math.max(15, Q - 8), dir,
              v > 1
                ? `Pressure increased — system shifts toward fewer moles of gas (products side: 2NH₃ vs 4 reactant moles), increasing yield`
                : `Pressure decreased — equilibrium shifts toward more gas moles (reactants), reducing NH₃ yield`
            );
          }} className="w-28" />
        </label>
        <button onClick={() => { setConc(50); setTemp(400); setPres(1.0); setQ(50); setShift('none'); }}
          className="px-3 py-1.5 rounded-lg text-xs font-sora font-semibold ml-auto"
          style={{ border: '1px solid #E7E5E0', color: '#1B4332', background: '#fff' }}>
          Reset
        </button>
      </div>
      <canvas ref={canvasRef} width={700} height={310} className="w-full flex-1" />
    </div>
  );
}
