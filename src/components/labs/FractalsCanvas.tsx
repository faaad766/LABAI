import { useState, useEffect, useRef } from 'react';

type FractalType = 'mandelbrot' | 'julia' | 'sierpinski';
export default function FractalsCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [type, setType] = useState<FractalType>('mandelbrot');
  const [maxIter, setMaxIter] = useState(64);
  const [cReal, setCReal] = useState(-0.7);
  const [cImag, setCImag] = useState(0.27);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;

    if (type === 'sierpinski') {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#F5F3FF'; ctx.fillRect(0, 0, W, H);
      const drawTri = (x: number, y: number, size: number, depth: number) => {
        if (depth === 0) {
          ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x - size * 0.866, y + size * 0.5);
          ctx.lineTo(x + size * 0.866, y + size * 0.5); ctx.closePath();
          ctx.fillStyle = '#8B5CF6'; ctx.fill();
          return;
        }
        drawTri(x, y - size / 2, size / 2, depth - 1);
        drawTri(x - size * 0.433, y + size * 0.25, size / 2, depth - 1);
        drawTri(x + size * 0.433, y + size * 0.25, size / 2, depth - 1);
      };
      drawTri(W / 2, 30, Math.min(W, H) * 0.45, Math.min(7, Math.floor(maxIter / 10)));
      onEvent(`Sierpinski triangle depth ${Math.floor(maxIter / 10)} — self-similar fractal with dimension log(3)/log(2) ≈ 1.585`);
      return;
    }

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const x0 = (px / W - 0.5) * 3.5 / zoom - 0.5;
        const y0 = (py / H - 0.5) * 2.5 / zoom;
        let x = type === 'julia' ? x0 : 0;
        let y = type === 'julia' ? y0 : 0;
        const cx = type === 'julia' ? cReal : x0;
        const cy = type === 'julia' ? cImag : y0;
        let iter = 0;
        while (x * x + y * y <= 4 && iter < maxIter) {
          const xNew = x * x - y * y + cx;
          y = 2 * x * y + cy;
          x = xNew;
          iter++;
        }
        const idx = (py * W + px) * 4;
        if (iter === maxIter) { data[idx] = data[idx+1] = data[idx+2] = 0; }
        else {
          const t = iter / maxIter;
          data[idx] = Math.floor(9 * (1-t) * t * t * t * 255);
          data[idx+1] = Math.floor(15 * (1-t) * (1-t) * t * t * 255);
          data[idx+2] = Math.floor(8.5 * (1-t) * (1-t) * (1-t) * t * 255);
        }
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [type, maxIter, cReal, cImag, zoom]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['mandelbrot','julia','sierpinski'] as FractalType[]).map(t => (
          <button key={t} onClick={() => { setType(t); onEvent(`Fractal type: ${t} — infinite self-similar complexity`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: type === t ? '#8B5CF6' : '#F5F3FF', color: type === t ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {t}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={260} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE' }} />
      {type !== 'sierpinski' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Max iterations: {maxIter}</label>
            <input type="range" min={16} max={256} step={16} value={maxIter} onChange={e => { setMaxIter(+e.target.value); onEvent(`Iterations: ${+e.target.value} — more = finer boundary detail`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Zoom: {zoom}x</label>
            <input type="range" min={1} max={8} step={0.5} value={zoom} onChange={e => { setZoom(+e.target.value); onEvent(`Zoom: ${+e.target.value}x — fractal detail at every scale`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
          {type === 'julia' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>c real: {cReal}</label>
                <input type="range" min={-2} max={2} step={0.05} value={cReal} onChange={e => { setCReal(+e.target.value); onEvent(`c = ${+e.target.value}+${cImag}i — changes Julia set shape`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>c imag: {cImag}</label>
                <input type="range" min={-2} max={2} step={0.05} value={cImag} onChange={e => { setCImag(+e.target.value); onEvent(`c = ${cReal}+${+e.target.value}i`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
              </div>
            </>
          )}
        </div>
      )}
      {type === 'sierpinski' && (
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>Recursion depth: {Math.floor(maxIter/10)}</label>
          <input type="range" min={10} max={70} step={10} value={maxIter} onChange={e => { setMaxIter(+e.target.value); onEvent(`Sierpinski depth: ${Math.floor(+e.target.value/10)}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
        </div>
      )}
    </div>
  );
}
