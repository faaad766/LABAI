import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function MagneticForceCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(5);
  const [fieldB, setFieldB] = useState(3);
  const [length, setLength] = useState(1);
  const [currentDir, setCurrentDir] = useState<'right' | 'left'>('right');
  const [fieldDir, setFieldDir] = useState<'out' | 'in'>('out');
  const stateRef = useRef({ current: 5, fieldB: 3, length: 1, currentDir: 'right' as 'right'|'left', fieldDir: 'out' as 'out'|'in', t: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const s = stateRef.current;

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);

      // Background B-field symbols
      const spacing = 50;
      ctx.fillStyle = 'rgba(30,58,95,0.1)'; ctx.font = '16px serif';
      for (let x = spacing; x < W; x += spacing) {
        for (let y = spacing; y < H; y += spacing) {
          ctx.fillText(s.fieldDir === 'out' ? '•' : '×', x - 5, y + 5);
        }
      }

      // Wire
      const wireY = H / 2, wireX1 = 80, wireX2 = W - 80;
      ctx.strokeStyle = '#B45309'; ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(wireX1, wireY); ctx.lineTo(wireX2, wireY); ctx.stroke();

      // Current arrow
      const midX = W / 2;
      const arrowLen = 60, arrowDir = s.currentDir === 'right' ? 1 : -1;
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(midX - arrowDir * arrowLen / 2, wireY);
      ctx.lineTo(midX + arrowDir * arrowLen / 2, wireY);
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(midX + arrowDir * arrowLen / 2, wireY);
      ctx.lineTo(midX + arrowDir * (arrowLen / 2 - 12), wireY - 8);
      ctx.lineTo(midX + arrowDir * (arrowLen / 2 - 12), wireY + 8);
      ctx.closePath(); ctx.fill();

      // Force
      const F = s.fieldB * s.current * s.length;
      // Fleming's left-hand rule: F = IL × B
      let forceDir = 0; // 0 = up, 1 = down
      if (s.currentDir === 'right' && s.fieldDir === 'out') forceDir = -1; // up
      else if (s.currentDir === 'right' && s.fieldDir === 'in') forceDir = 1; // down
      else if (s.currentDir === 'left' && s.fieldDir === 'out') forceDir = 1;
      else forceDir = -1;

      const forceScale = Math.min(F * 6, 90);
      s.t += 0.05;
      const pulse = 1 + 0.05 * Math.sin(s.t * 4);

      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(midX, wireY);
      ctx.lineTo(midX, wireY + forceDir * forceScale * pulse);
      ctx.stroke();

      // Arrowhead for force
      const fy = wireY + forceDir * forceScale * pulse;
      ctx.fillStyle = '#1B4332';
      ctx.beginPath();
      ctx.moveTo(midX, fy);
      ctx.lineTo(midX - 9, fy - forceDir * 14);
      ctx.lineTo(midX + 9, fy - forceDir * 14);
      ctx.closePath(); ctx.fill();

      // Labels
      ctx.fillStyle = '#1C1917'; ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(`F = BIL = ${s.fieldB} × ${s.current} × ${s.length} = ${F.toFixed(1)} N`, 14, 26);
      ctx.fillText(`Current direction: ${s.currentDir}`, 14, 48);
      ctx.fillText(`B-field: ${s.fieldDir === 'out' ? 'out of page (•)' : 'into page (×)'}`, 14, 68);
      ctx.fillStyle = '#1B4332'; ctx.font = '700 13px Inter,sans-serif';
      ctx.fillText(`Force: ${forceDir < 0 ? '↑ UPWARD' : '↓ DOWNWARD'}`, 14, 90);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
      <canvas ref={canvasRef} width={560} height={340} className="w-full rounded-xl" style={{ border: '1px solid #E7E5E0', maxHeight: 280 }} />
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `Current I: ${current} A`, val: current, set: setCurrent, key: 'current' as const, min: 1, max: 15 },
          { label: `B-field: ${fieldB} T`, val: fieldB, set: setFieldB, key: 'fieldB' as const, min: 1, max: 10 },
          { label: `Length L: ${length} m`, val: length, set: setLength, key: 'length' as const, min: 1, max: 5 },
        ].map(({ label, val, set, key, min, max }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{label}</label>
            <input type="range" min={min} max={max} value={val}
              onChange={e => { stateRef.current[key] = +e.target.value; set(+e.target.value); onEvent(`Changed ${key} to ${e.target.value}`); }}
              style={{ accentColor: '#1B4332' }} className="w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {(['right', 'left'] as const).map(d => (
          <button key={d} onClick={() => { stateRef.current.currentDir = d; setCurrentDir(d); onEvent(`Set current direction to ${d}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: currentDir === d ? '#1B4332' : '#F0F7F3', color: currentDir === d ? '#FFF' : '#1B4332', border: '1px solid #BBF7D0' }}>
            Current {d === 'right' ? '→' : '←'}
          </button>
        ))}
        {(['out', 'in'] as const).map(d => (
          <button key={d} onClick={() => { stateRef.current.fieldDir = d; setFieldDir(d); onEvent(`Set B-field direction to ${d} of page`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: fieldDir === d ? '#1E3A5F' : '#EFF6FF', color: fieldDir === d ? '#FFF' : '#1E3A5F', border: '1px solid #BFDBFE' }}>
            B {d === 'out' ? '• Out' : '× In'}
          </button>
        ))}
      </div>
    </div>
  );
}
