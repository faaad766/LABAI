import { useEffect, useRef, useState, useCallback } from 'react';

interface Props { onEvent: (e: string) => void; }
interface Charge { x: number; y: number; q: number; id: number; }

export default function ElectricFieldsCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [charges, setCharges] = useState<Charge[]>([
    { x: 180, y: 190, q: 1, id: 1 },
    { x: 380, y: 190, q: -1, id: 2 },
  ]);
  const [polarity, setPolarity] = useState<1 | -1>(1);
  const chargesRef = useRef(charges);
  chargesRef.current = charges;

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const newCharge: Charge = { x, y, q: polarity, id: Date.now() };
    setCharges(prev => [...prev, newCharge]);
    onEvent(`Placed ${polarity > 0 ? 'positive' : 'negative'} charge at (${Math.round(x)}, ${Math.round(y)})`);
  }, [polarity, onEvent]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    function getField(cx: number, cy: number) {
      let ex = 0, ey = 0;
      for (const ch of chargesRef.current) {
        const dx = cx - ch.x, dy = cy - ch.y;
        const r2 = dx * dx + dy * dy;
        if (r2 < 100) continue;
        const r = Math.sqrt(r2);
        const mag = ch.q / r2;
        ex += mag * dx / r; ey += mag * dy / r;
      }
      return { ex, ey };
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#F8FAFF'; ctx.fillRect(0, 0, W, H);

      // Field vectors
      const step = 40;
      for (let gx = step / 2; gx < W; gx += step) {
        for (let gy = step / 2; gy < H; gy += step) {
          const { ex, ey } = getField(gx, gy);
          const mag = Math.sqrt(ex * ex + ey * ey);
          if (mag < 0.0001) continue;
          const scale = Math.min(16, 6 / mag);
          const ax = ex / mag * scale, ay = ey / mag * scale;
          const alpha = Math.min(1, mag * 2);
          ctx.strokeStyle = `rgba(30,58,95,${alpha * 0.5})`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + ax, gy + ay); ctx.stroke();
          // Arrowhead
          const ang = Math.atan2(ay, ax);
          ctx.fillStyle = `rgba(30,58,95,${alpha * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(gx + ax, gy + ay);
          ctx.lineTo(gx + ax - 5 * Math.cos(ang - 0.4), gy + ay - 5 * Math.sin(ang - 0.4));
          ctx.lineTo(gx + ax - 5 * Math.cos(ang + 0.4), gy + ay - 5 * Math.sin(ang + 0.4));
          ctx.closePath(); ctx.fill();
        }
      }

      // Charges
      for (const ch of chargesRef.current) {
        const grd = ctx.createRadialGradient(ch.x - 4, ch.y - 4, 2, ch.x, ch.y, 18);
        if (ch.q > 0) {
          grd.addColorStop(0, '#FCA5A5'); grd.addColorStop(1, '#DC2626');
        } else {
          grd.addColorStop(0, '#93C5FD'); grd.addColorStop(1, '#2563EB');
        }
        ctx.beginPath(); ctx.arc(ch.x, ch.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ch.q > 0 ? '+' : '−', ch.x, ch.y);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }

      ctx.fillStyle = '#1C1917'; ctx.font = '600 12px Inter,sans-serif';
      ctx.fillText('Click canvas to place charge', 14, canvas.height - 12);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={340} onClick={handleCanvasClick}
        className="w-full rounded-xl cursor-crosshair" style={{ border: '1px solid #E7E5E0', maxHeight: 300 }} />
      <div className="flex gap-3 flex-wrap items-center">
        <span className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Place:</span>
        <button onClick={() => { setPolarity(1); onEvent('Selected positive charge'); }}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: polarity > 0 ? '#DC2626' : '#FEE2E2', color: polarity > 0 ? '#FFF' : '#DC2626', border: '1.5px solid #FECACA' }}>
          + Positive
        </button>
        <button onClick={() => { setPolarity(-1); onEvent('Selected negative charge'); }}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: polarity < 0 ? '#2563EB' : '#EFF6FF', color: polarity < 0 ? '#FFF' : '#2563EB', border: '1.5px solid #BFDBFE' }}>
          − Negative
        </button>
        <button onClick={() => { setCharges([{ x: 180, y: 190, q: 1, id: 1 }, { x: 380, y: 190, q: -1, id: 2 }]); onEvent('Reset charges'); }}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: '#F0F7F3', color: '#1B4332', border: '1px solid #BBF7D0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
