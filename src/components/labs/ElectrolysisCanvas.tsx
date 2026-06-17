import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

export default function ElectrolysisCanvas({ onEvent }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const voltRef    = useRef(0);
  const runRef     = useRef(false);
  const tickRef    = useRef(0);
  const rafRef     = useRef(0);
  const [voltage, setVoltage] = useState(0);
  const [running, setRunning] = useState(false);
  const [h2Vol, setH2Vol]     = useState(0);
  const [o2Vol, setO2Vol]     = useState(0);
  const [current, setCurrent] = useState(0);

  voltRef.current = voltage;
  runRef.current  = running;

  type Bubble = { x: number; y: number; r: number; side: 'H' | 'O'; vy: number };
  const bubbles = useRef<Bubble[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const CX = W / 2, WATER_TOP = H * 0.22, WATER_BOT = H * 0.72;
    const CATH_X = CX - 80, ANOD_X = CX + 80;
    const ELEC_TOP = WATER_TOP + 10, ELEC_BOT = WATER_BOT - 10;

    function drawContainer() {
      // Water body
      ctx.fillStyle = 'rgba(219,234,254,0.4)';
      ctx.fillRect(CX - 140, WATER_TOP, 280, WATER_BOT - WATER_TOP);
      ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 2;
      ctx.strokeRect(CX - 140, WATER_TOP, 280, WATER_BOT - WATER_TOP);
      // Water label
      ctx.font = '11px Inter'; ctx.fillStyle = '#1E40AF'; ctx.textAlign = 'center';
      ctx.fillText('H₂O (+ electrolyte)', CX, WATER_TOP - 8); ctx.textAlign = 'left';
    }

    function drawElectrodes() {
      // Cathode (−)
      ctx.fillStyle = '#1B4332';
      ctx.fillRect(CATH_X - 6, ELEC_TOP, 12, ELEC_BOT - ELEC_TOP);
      ctx.font = 'bold 12px Sora'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'center';
      ctx.fillText('CATHODE (−)', CATH_X, ELEC_TOP - 12);
      ctx.fillText('H₂ produced', CATH_X, ELEC_BOT + 22);
      // Anode (+)
      ctx.fillStyle = '#9F1239';
      ctx.fillRect(ANOD_X - 6, ELEC_TOP, 12, ELEC_BOT - ELEC_TOP);
      ctx.fillStyle = '#9F1239';
      ctx.fillText('ANODE (+)', ANOD_X, ELEC_TOP - 12);
      ctx.fillText('O₂ produced', ANOD_X, ELEC_BOT + 22);
      ctx.textAlign = 'left';
    }

    function drawCollectionTubes(h2: number, o2: number) {
      const maxH = 60;
      // H2 tube (cathode)
      ctx.fillStyle = 'rgba(219,234,254,0.3)';
      ctx.fillRect(CATH_X - 20, WATER_TOP - maxH - 10, 40, maxH);
      ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 1; ctx.strokeRect(CATH_X - 20, WATER_TOP - maxH - 10, 40, maxH);
      const h2H = Math.min((h2 / 100) * maxH, maxH);
      ctx.fillStyle = 'rgba(134,239,172,0.5)';
      ctx.fillRect(CATH_X - 20, WATER_TOP - 10 - h2H, 40, h2H);
      ctx.font = '9px Inter'; ctx.fillStyle = '#166534'; ctx.textAlign = 'center';
      ctx.fillText(`H₂: ${h2.toFixed(0)}%`, CATH_X, WATER_TOP - maxH - 16);
      // O2 tube (anode)
      ctx.fillStyle = 'rgba(219,234,254,0.3)';
      ctx.fillRect(ANOD_X - 20, WATER_TOP - maxH - 10, 40, maxH);
      ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 1; ctx.strokeRect(ANOD_X - 20, WATER_TOP - maxH - 10, 40, maxH);
      const o2H = Math.min((o2 / 100) * maxH, maxH);
      ctx.fillStyle = 'rgba(254,202,202,0.5)';
      ctx.fillRect(ANOD_X - 20, WATER_TOP - 10 - o2H, 40, o2H);
      ctx.font = '9px Inter'; ctx.fillStyle = '#9F1239'; ctx.textAlign = 'center';
      ctx.fillText(`O₂: ${o2.toFixed(0)}%`, ANOD_X, WATER_TOP - maxH - 16);
      ctx.textAlign = 'left';
    }

    function spawnBubble(side: 'H' | 'O') {
      const x = side === 'H' ? CATH_X + (Math.random() - 0.5) * 8 : ANOD_X + (Math.random() - 0.5) * 8;
      bubbles.current.push({ x, y: ELEC_BOT - 5, r: 3 + Math.random() * 4, side, vy: -(0.6 + Math.random() * 0.8) });
    }

    function drawBubbles() {
      bubbles.current.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.side === 'H' ? 'rgba(134,239,172,0.6)' : 'rgba(252,165,165,0.6)';
        ctx.fill(); ctx.strokeStyle = b.side === 'H' ? '#86EFAC' : '#FCA5A5'; ctx.lineWidth = 0.5; ctx.stroke();
        b.y += b.vy;
        b.x += 0.3 * Math.sin(tickRef.current * 0.1 + b.r);
      });
      bubbles.current = bubbles.current.filter(b => b.y > WATER_TOP);
    }

    function drawCircuit(v: number) {
      ctx.font = '10px Inter'; ctx.fillStyle = '#78716C'; ctx.textAlign = 'center';
      ctx.fillText(`${v.toFixed(1)}V · ${(v * 0.08).toFixed(2)}A`, CX, WATER_BOT + 45);
      ctx.textAlign = 'left';
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      tickRef.current++;
      const v = voltRef.current;

      if (runRef.current && v >= 1.5) {
        // Spawn bubbles proportional to voltage
        if (tickRef.current % Math.max(2, Math.floor(8 - v)) === 0) {
          spawnBubble('H'); spawnBubble('H');
          spawnBubble('O');
        }
        setH2Vol(h => Math.min(100, h + v * 0.012));
        setO2Vol(o => Math.min(50,  o + v * 0.006));
        setCurrent(+(v * 0.08).toFixed(2));
      }

      drawContainer();
      drawElectrodes();
      drawBubbles();
      drawCollectionTubes(h2Vol, o2Vol);
      drawCircuit(v);

      if (v < 1.5 && runRef.current) {
        ctx.font = '12px Sora'; ctx.fillStyle = '#9F1239'; ctx.textAlign = 'center';
        ctx.fillText('Voltage too low — needs ≥ 1.5V to split water', CX, WATER_BOT + 62);
        ctx.textAlign = 'left';
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [h2Vol, o2Vol]);

  const handleVoltage = (v: number) => {
    const prev = voltRef.current;
    setVoltage(v);
    if (v >= 1.5 && prev < 1.5) {
      onEvent(`Voltage reached ${v.toFixed(1)}V — above the 1.5V decomposition potential of water. Electrolysis begins: 2H₂O → 2H₂ + O₂. H₂ forms at cathode (reduction), O₂ at anode (oxidation).`);
    } else if (v > prev && v >= 1.5) {
      onEvent(`Voltage increased to ${v.toFixed(1)}V — higher current means faster electron flow, producing H₂ and O₂ bubbles more rapidly at both electrodes`);
    }
  };

  const toggleRun = () => {
    const next = !running; setRunning(next);
    if (next && voltage >= 1.5) onEvent(`Electrolysis started at ${voltage.toFixed(1)}V — water molecules split at both electrodes simultaneously; H₂:O₂ volume ratio is always 2:1 as per 2H₂O → 2H₂ + O₂`);
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      <div className="flex flex-wrap gap-3 p-3 shrink-0 items-center" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        <button onClick={toggleRun}
          className="btn-primary text-xs"
          style={{ background: running ? '#9F1239' : '#1B4332' }}>
          {running ? '⏹ Stop' : '▶ Start Electrolysis'}
        </button>
        <label className="flex items-center gap-2 font-inter text-xs" style={{ color: '#52796F' }}>
          Voltage: <strong>{voltage.toFixed(1)}V</strong>
          <input type="range" min="0" max="12" step="0.1" value={voltage} onChange={e => handleVoltage(+e.target.value)} className="w-32" />
        </label>
        <button onClick={() => { setVoltage(0); setRunning(false); setH2Vol(0); setO2Vol(0); setCurrent(0); bubbles.current = []; }}
          className="px-3 py-1.5 rounded-lg text-xs font-sora font-semibold ml-auto"
          style={{ border: '1px solid #E7E5E0', color: '#1B4332', background: '#fff' }}>
          Reset
        </button>
        <div className="font-inter text-xs w-full flex gap-4" style={{ color: '#52796F' }}>
          <span>H₂ (cathode): <strong>{h2Vol.toFixed(1)}%</strong></span>
          <span>O₂ (anode): <strong>{o2Vol.toFixed(1)}%</strong></span>
          <span>Current: <strong>{current}A</strong></span>
          <span style={{ color: '#D97706' }}>Ratio H₂:O₂ ≈ 2:1</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={700} height={310} className="w-full flex-1" />
    </div>
  );
}
