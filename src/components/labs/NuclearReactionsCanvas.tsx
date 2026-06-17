import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }
type Mode = 'decay' | 'fission' | 'fusion';
type DecayType = 'alpha' | 'beta' | 'gamma';

const ISOTOPES: Record<string, { Z: number; N: number; halfLife: string; product: string }> = {
  'U-238':  { Z: 92, N: 146, halfLife: '4.5 billion years', product: 'Th-234 + α' },
  'C-14':   { Z: 6,  N: 8,   halfLife: '5,730 years',       product: 'N-14 + β⁻' },
  'Co-60':  { Z: 27, N: 33,  halfLife: '5.3 years',         product: 'Ni-60 + β⁻ + γ' },
  'Rn-222': { Z: 86, N: 136, halfLife: '3.8 days',          product: 'Po-218 + α' },
};

export default function NuclearReactionsCanvas({ onEvent }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [mode, setMode]         = useState<Mode>('decay');
  const [decayType, setDecayType] = useState<DecayType>('alpha');
  const [isotope, setIsotope]   = useState('U-238');
  const [elapsed, setElapsed]   = useState(0);
  const [atoms, setAtoms]       = useState(100);
  const [running, setRunning]   = useState(false);
  const modeRef    = useRef<Mode>('decay');
  const runRef     = useRef(false);
  const atomsRef   = useRef(100);
  const elapsedRef = useRef(0);
  const rafRef     = useRef(0);
  const tickRef    = useRef(0);
  modeRef.current    = mode;
  runRef.current     = running;
  atomsRef.current   = atoms;
  elapsedRef.current = elapsed;

  type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
  const particles = useRef<Particle[]>([]);
  const HALF_LIVES: Record<string, number> = { 'U-238': 300, 'C-14': 200, 'Co-60': 150, 'Rn-222': 100 };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const CX = W / 2, CY = H * 0.38;

    function drawNucleus(n: number) {
      const scale = 0.4 + (n / 100) * 0.6;
      const r = 32 * scale;
      // Glow
      const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, r * 2);
      grad.addColorStop(0, 'rgba(27,67,50,0.25)'); grad.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(CX, CY, r * 2, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
      // Nucleus
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1B4332'; ctx.fill();
      // Proton/neutron pattern
      const iso = ISOTOPES[isotope];
      const pn = Math.floor((iso.Z / (iso.Z + iso.N)) * n);
      for (let i = 0; i < Math.min(n, 20); i++) {
        const angle = (i / 20) * Math.PI * 2;
        const nr = (r - 8) * Math.sqrt(Math.random());
        const nx2 = CX + nr * Math.cos(angle + tickRef.current * 0.003);
        const ny2 = CY + nr * Math.sin(angle + tickRef.current * 0.003);
        ctx.beginPath(); ctx.arc(nx2, ny2, 3, 0, Math.PI * 2);
        ctx.fillStyle = i < pn ? '#F59E0B' : '#84A98C'; ctx.fill();
      }
      ctx.font = `bold ${Math.max(10, 14 * scale)}px Sora`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(isotope, CX, CY + 5); ctx.textAlign = 'left';
    }

    function drawDecayParticles() {
      particles.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 80; ctx.fill(); ctx.globalAlpha = 1;
        if (p.color === '#FFD700') {
          ctx.beginPath(); ctx.moveTo(p.x - 10, p.y); ctx.lineTo(p.x + 10, p.y);
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1; ctx.globalAlpha = p.life / 80; ctx.stroke(); ctx.globalAlpha = 1;
        }
      });
      particles.current = particles.current.filter(p => p.life > 0);
    }

    function spawnDecay() {
      const angle = Math.random() * Math.PI * 2;
      const col = decayType === 'alpha' ? '#F59E0B' : decayType === 'beta' ? '#1B4332' : '#FFD700';
      const speed = decayType === 'gamma' ? 5 : 3;
      particles.current.push({ x: CX, y: CY, vx: speed * Math.cos(angle), vy: speed * Math.sin(angle), life: 80, color: col, size: decayType === 'alpha' ? 7 : decayType === 'beta' ? 3 : 1 });
    }

    function drawDecayCurve(a: number) {
      const gx = 20, gy = H * 0.72, gw = W - 40, gh = H * 0.2;
      ctx.fillStyle = '#FAF8F3'; ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
      const HL = HALF_LIVES[isotope] ?? 200;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const aFrac = Math.pow(0.5, (t * 3 * HL) / HL);
        const x = gx + t * gw;
        const y = gy + gh - aFrac * gh;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2; ctx.stroke();
      // Current dot
      const tFrac = Math.min(elapsedRef.current / (3 * HL), 1);
      const aFrac = a / 100;
      ctx.beginPath(); ctx.arc(gx + tFrac * gw, gy + gh - aFrac * gh, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B'; ctx.fill();
      ctx.font = '9px Inter'; ctx.fillStyle = '#78716C'; ctx.textAlign = 'center';
      ctx.fillText('Time →', gx + gw / 2, gy + gh + 14);
      ctx.fillText(`${a.toFixed(0)} atoms remaining`, gx + gw - 40, gy - 6);
      ctx.textAlign = 'left';
    }

    function drawFission() {
      const t = tickRef.current;
      // Draw U-235 → Ba-141 + Kr-92 + 3n
      ctx.font = 'bold 13px Sora'; ctx.fillStyle = '#1C1917'; ctx.textAlign = 'center';
      ctx.fillText('U-235 + n → Ba-141 + Kr-92 + 3n + energy', CX, H * 0.18);
      // Animate chain reaction
      const cycle = t % 120;
      if (cycle < 30) {
        ctx.beginPath(); ctx.arc(CX, CY, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#1B4332'; ctx.fill();
        ctx.font = '11px Sora'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('U-235', CX, CY + 4);
      } else if (cycle < 60) {
        // Fission fragments
        ctx.beginPath(); ctx.arc(CX - 50, CY, 18, 0, Math.PI * 2); ctx.fillStyle = '#F59E0B'; ctx.fill();
        ctx.beginPath(); ctx.arc(CX + 50, CY, 18, 0, Math.PI * 2); ctx.fillStyle = '#52796F'; ctx.fill();
        ctx.font = '9px Sora'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText('Ba', CX - 50, CY + 4); ctx.fillText('Kr', CX + 50, CY + 4);
        // Neutrons
        [-40,0,40].forEach((dx, i) => {
          const ny2 = CY - 30 - (cycle - 30) * 1.5;
          ctx.beginPath(); ctx.arc(CX + dx, ny2, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#1B4332'; ctx.fill();
          ctx.font = '8px Inter'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('n', CX + dx, ny2 + 3);
        });
      } else {
        // Flash
        ctx.globalAlpha = 0.3 * Math.sin((cycle - 60) / 60 * Math.PI);
        ctx.beginPath(); ctx.arc(CX, CY, 60, 0, Math.PI * 2);
        ctx.fillStyle = '#FEF3C7'; ctx.fill(); ctx.globalAlpha = 1;
        ctx.font = '12px Sora'; ctx.fillStyle = '#D97706'; ctx.textAlign = 'center'; ctx.fillText('ENERGY RELEASED', CX, CY + 4);
      }
      ctx.textAlign = 'left';
    }

    function drawFusion() {
      const t = tickRef.current;
      ctx.font = 'bold 13px Sora'; ctx.fillStyle = '#1C1917'; ctx.textAlign = 'center';
      ctx.fillText('²H + ³H → ⁴He + n + 17.6 MeV', CX, H * 0.18);
      const cycle = t % 100;
      const approach = cycle / 100;
      const d1x = CX - 80 + approach * 60;
      const d2x = CX + 80 - approach * 60;
      if (approach < 0.85) {
        ctx.beginPath(); ctx.arc(d1x, CY, 16, 0, Math.PI * 2); ctx.fillStyle = '#1B4332'; ctx.fill();
        ctx.beginPath(); ctx.arc(d2x, CY, 20, 0, Math.PI * 2); ctx.fillStyle = '#2D6A4F'; ctx.fill();
        ctx.font = '10px Sora'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText('²H', d1x, CY + 4); ctx.fillText('³H', d2x, CY + 4);
      } else {
        // Fusion flash
        ctx.beginPath(); ctx.arc(CX, CY, 28, 0, Math.PI * 2); ctx.fillStyle = '#F59E0B'; ctx.fill();
        ctx.font = '10px Sora'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('⁴He', CX, CY + 4);
        // Neutron
        ctx.beginPath(); ctx.arc(CX + 60, CY, 6, 0, Math.PI * 2); ctx.fillStyle = '#92400E'; ctx.fill();
        ctx.font = '8px Inter'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('n', CX + 60, CY + 3);
      }
      ctx.textAlign = 'left';
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      tickRef.current++;
      const m = modeRef.current;
      if (m === 'decay') {
        if (runRef.current) {
          const HL = HALF_LIVES[isotope] ?? 200;
          if (tickRef.current % 4 === 0) {
            const decayChance = 1 - Math.pow(0.5, 4 / (HL * 60 / 2));
            if (Math.random() < decayChance && atomsRef.current > 1) {
              atomsRef.current = Math.max(1, atomsRef.current - 1);
              setAtoms(atomsRef.current);
              spawnDecay();
            }
            elapsedRef.current += 4;
            setElapsed(elapsedRef.current);
          }
        }
        drawNucleus(atomsRef.current);
        drawDecayParticles();
        drawDecayCurve(atomsRef.current);
        // Legend
        ctx.font = '9px Inter'; ctx.fillStyle = '#F59E0B'; ctx.fillText('■ α particle', W * 0.7, H * 0.55);
        ctx.fillStyle = '#1B4332'; ctx.fillText('■ β particle', W * 0.7, H * 0.55 + 14);
        ctx.fillStyle = '#D4AF37'; ctx.fillText('— γ ray',      W * 0.7, H * 0.55 + 28);
      } else if (m === 'fission') {
        drawFission();
      } else {
        drawFusion();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isotope, decayType]);

  const startDecay = () => {
    if (running) { setRunning(false); return; }
    setRunning(true);
    onEvent(`Nuclear decay started for ${isotope} (half-life: ${ISOTOPES[isotope]?.halfLife}) — each atom independently has a 50% chance of decaying every half-life. The decay curve follows N = N₀ × (½)^(t/t½)`);
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      <div className="flex flex-wrap gap-3 p-3 shrink-0 items-center" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        {/* Mode */}
        <div className="flex gap-1.5">
          {(['decay','fission','fusion'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setRunning(false); setAtoms(100); setElapsed(0); onEvent(`Mode switched to ${m} — ${m === 'fission' ? 'heavy nucleus splits into smaller nuclei + neutrons + energy' : m === 'fusion' ? 'light nuclei combine at extreme temperatures releasing even more energy than fission' : 'unstable nucleus emits particles to reach stability'}`); }}
              className="px-3 py-1.5 rounded-lg font-inter text-xs font-medium capitalize transition-all"
              style={{ background: mode === m ? '#1B4332' : '#fff', color: mode === m ? '#fff' : '#52796F', border: '1px solid #E7E5E0' }}>
              {m}
            </button>
          ))}
        </div>
        {mode === 'decay' && (
          <>
            <select value={isotope} onChange={e => { setIsotope(e.target.value); setAtoms(100); setElapsed(0); }}
              className="rounded-lg px-2 py-1.5 font-inter text-xs outline-none"
              style={{ border: '1px solid #E7E5E0', background: '#FAF8F3', color: '#1C1917' }}>
              {Object.keys(ISOTOPES).map(k => <option key={k}>{k}</option>)}
            </select>
            <div className="flex gap-1.5">
              {(['alpha','beta','gamma'] as DecayType[]).map(d => (
                <button key={d} onClick={() => { setDecayType(d); onEvent(`Decay type set to ${d}: ${d === 'alpha' ? 'emits ⁴He nucleus (2p+2n), range: cm in air, stopped by paper' : d === 'beta' ? 'emits electron, neutron → proton inside nucleus, stopped by aluminium' : 'emits high-energy photon (electromagnetic wave), stopped by thick lead/concrete'}`); }}
                  className="px-2 py-1 rounded font-inter text-xs transition-all"
                  style={{ background: decayType === d ? '#F59E0B' : '#fff', color: decayType === d ? '#92400E' : '#78716C', border: '1px solid #E7E5E0' }}>
                  {d === 'alpha' ? 'α' : d === 'beta' ? 'β' : 'γ'}
                </button>
              ))}
            </div>
            <button onClick={startDecay}
              className="btn-primary text-xs"
              style={{ background: running ? '#9F1239' : '#1B4332' }}>
              {running ? '⏹ Pause' : '▶ Start Decay'}
            </button>
            <div className="ml-auto font-inter text-xs flex gap-3" style={{ color: '#52796F' }}>
              <span>Atoms: <strong>{atoms}</strong></span>
              <span>t½: {ISOTOPES[isotope]?.halfLife}</span>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} width={700} height={320} className="w-full flex-1" />
    </div>
  );
}
