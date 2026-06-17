import { useState, useEffect, useRef } from 'react';

export default function NumberTheoryCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [n, setN] = useState(60);
  const [mode, setMode] = useState<'sieve'|'gcd'|'goldbach'>('sieve');
  const [n2, setN2] = useState(48);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sieve = (limit: number) => {
    const isPrime = new Array(limit + 1).fill(true);
    isPrime[0] = isPrime[1] = false;
    for (let i = 2; i * i <= limit; i++) { if (isPrime[i]) { for (let j = i * i; j <= limit; j += i) isPrime[j] = false; } }
    return isPrime;
  };

  const gcdSteps = (a: number, b: number): { a: number; b: number; r: number }[] => {
    const steps = [];
    while (b > 0) { steps.push({ a, b, r: a % b }); [a, b] = [b, a % b]; }
    return steps;
  };

  const goldbachPairs = (num: number): [number, number][] => {
    if (num % 2 !== 0 || num < 4) return [];
    const isPrime = sieve(num);
    const pairs: [number, number][] = [];
    for (let i = 2; i <= num / 2; i++) { if (isPrime[i] && isPrime[num - i]) pairs.push([i, num - i]); }
    return pairs;
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    if (mode === 'sieve') {
      const isPrime = sieve(n);
      const cols = Math.ceil(Math.sqrt(n));
      const cellW = Math.min((W - 20) / cols, 36), cellH = Math.min((H - 20) / Math.ceil(n / cols), 36);
      for (let i = 2; i <= n; i++) {
        const row = Math.floor((i - 2) / cols), col = (i - 2) % cols;
        const x = 10 + col * cellW, y = 10 + row * cellH;
        ctx.fillStyle = isPrime[i] ? '#8B5CF6' : '#E7E5E0';
        ctx.fillRect(x, y, cellW - 2, cellH - 2);
        ctx.fillStyle = isPrime[i] ? '#FFF' : '#78716C';
        ctx.font = `bold ${Math.max(8, cellW / 3)}px Inter,sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(String(i), x + cellW / 2, y + cellH / 2 + 4);
      }
      ctx.textAlign = 'left';
      const primes = Array.from({ length: n - 1 }, (_, i) => i + 2).filter(i => isPrime[i]);
      onEvent(`Sieve of Eratosthenes up to ${n}: ${primes.length} primes found: ${primes.slice(0, 10).join(', ')}...`);
    } else if (mode === 'gcd') {
      const steps = gcdSteps(n, n2);
      const g = steps[steps.length - 1]?.b ?? (n2 === 0 ? n : n2);
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 13px Inter,sans-serif';
      ctx.fillText(`GCD(${n}, ${n2}) = ${n > 0 && n2 > 0 ? (steps.length > 0 ? steps[steps.length-1].b || steps[steps.length-2]?.b : Math.min(n,n2)) : 0}`, 10, 24);
      steps.forEach((s, i) => {
        const y = 50 + i * 30;
        ctx.fillStyle = i === steps.length - 1 ? '#8B5CF6' : '#1C1917';
        ctx.font = `${i === steps.length - 1 ? 'bold' : 'normal'} 12px monospace`;
        ctx.fillText(`${s.a} = ${Math.floor(s.a / s.b)} × ${s.b} + ${s.r}`, 20, y);
        if (s.r === 0) {
          ctx.fillStyle = '#22C55E'; ctx.font = 'bold 12px Inter,sans-serif';
          ctx.fillText(`  ✓ GCD = ${s.b}`, 20, y + 20);
        }
      });
    } else {
      const pairs = goldbachPairs(n % 2 === 0 ? n : n + 1);
      const even = n % 2 === 0 ? n : n + 1;
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 13px Inter,sans-serif';
      ctx.fillText(`${even} = prime + prime (${pairs.length} ways)`, 10, 22);
      pairs.forEach(([p, q], i) => {
        const row = Math.floor(i / 3), col = i % 3;
        const x = 10 + col * 170, y = 40 + row * 30;
        ctx.fillStyle = '#F5F3FF'; ctx.fillRect(x, y, 160, 24); ctx.strokeStyle = '#DDD6FE'; ctx.lineWidth = 1; ctx.strokeRect(x, y, 160, 24);
        ctx.fillStyle = '#4C1D95'; ctx.font = '11px Inter,sans-serif';
        ctx.fillText(`${even} = ${p} + ${q}`, x + 8, y + 16);
      });
    }
  }, [n, n2, mode]);

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['sieve','gcd','goldbach'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); onEvent(`Mode: ${m}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: mode === m ? '#8B5CF6' : '#F5F3FF', color: mode === m ? '#FFF' : '#4C1D95', border: '1px solid #DDD6FE' }}>
            {m === 'sieve' ? 'Sieve' : m === 'gcd' ? 'Euclidean GCD' : 'Goldbach'}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={260} className="w-full rounded-xl" style={{ border: '1px solid #DDD6FE', background: '#FAFAF9' }} />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>{mode === 'sieve' ? `Limit: ${n}` : mode === 'goldbach' ? `Even n: ${n % 2 === 0 ? n : n + 1}` : `a: ${n}`}</label>
          <input type="range" min={mode === 'sieve' ? 10 : 4} max={mode === 'sieve' ? 120 : 200} value={n} onChange={e => { setN(+e.target.value); onEvent(`n=${+e.target.value}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
        </div>
        {mode === 'gcd' && (
          <div className="flex flex-col gap-1">
            <label className="font-inter text-xs font-semibold" style={{ color: '#1C1917' }}>b: {n2}</label>
            <input type="range" min={1} max={200} value={n2} onChange={e => { setN2(+e.target.value); onEvent(`b=${+e.target.value}`); }} style={{ accentColor: '#8B5CF6' }} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
