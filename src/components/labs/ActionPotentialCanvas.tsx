import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }
type APState = 'resting' | 'firing' | 'repolarising' | 'refractory';

export default function ActionPotentialCanvas({ onEvent }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef<APState>('resting');
  const waveRef    = useRef(0);
  const voltRef    = useRef(-70);
  const voltHistory = useRef<number[]>(Array(200).fill(-70));
  const rafRef     = useRef(0);
  const tickRef    = useRef(0);
  const [apState, setApState]   = useState<APState>('resting');
  const [mV, setMV]             = useState(-70);
  const [stimCount, setStimCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const AXON_Y = H * 0.42;

    function drawAxon() {
      // Axon body
      ctx.beginPath();
      ctx.moveTo(40, AXON_Y - 18); ctx.lineTo(W - 40, AXON_Y - 18);
      ctx.lineTo(W - 40, AXON_Y + 18); ctx.lineTo(40, AXON_Y + 18); ctx.closePath();
      ctx.fillStyle = '#F0F7F3'; ctx.fill();
      ctx.strokeStyle = '#BBF7D0'; ctx.lineWidth = 1.5; ctx.stroke();
      // Myelin sheath segments
      for (let x = 60; x < W - 50; x += 80) {
        ctx.beginPath();
        ctx.roundRect(x, AXON_Y - 24, 44, 48, 4);
        ctx.fillStyle = 'rgba(245,158,11,0.08)'; ctx.fill();
        ctx.strokeStyle = '#FDE68A'; ctx.lineWidth = 1; ctx.stroke();
      }
      // Node of Ranvier labels
      ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#52796F'; ctx.textAlign = 'center';
      for (let x = 60; x < W - 50; x += 80) ctx.fillText('Node', x + 22, AXON_Y + 32);
      ctx.textAlign = 'left';
    }

    function drawWave(wave: number, state: APState) {
      if (state === 'resting') return;
      const wx = wave;
      // Depolarisation flash
      const alpha = state === 'firing' ? 0.7 : state === 'repolarising' ? 0.4 : 0.2;
      const col = state === 'firing' ? '#1B4332' : state === 'repolarising' ? '#52796F' : '#D1D5DB';
      ctx.beginPath();
      ctx.arc(wx, AXON_Y, 20, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.globalAlpha = alpha; ctx.fill();
      ctx.globalAlpha = 1;
    }

    function drawIons(t: number, state: APState, wave: number) {
      if (state === 'resting') {
        // Na+ outside
        for (let i = 0; i < 5; i++) {
          const ix = 60 + i * 120; const iy = AXON_Y - 30 + 4 * Math.sin(t * 0.04 + i);
          ctx.font = '10px Inter'; ctx.fillStyle = '#1B4332'; ctx.fillText('Na⁺', ix, iy);
        }
        return;
      }
      const showNa = state === 'firing';
      const showK  = state === 'repolarising';
      for (let i = 0; i < 4; i++) {
        const ix = wave - 30 + i * 16;
        if (ix < 40 || ix > W - 40) continue;
        ctx.font = '10px Inter';
        if (showNa) { ctx.fillStyle = '#1B4332'; ctx.fillText('Na⁺', ix, AXON_Y - 32); }
        if (showK)  { ctx.fillStyle = '#F59E0B'; ctx.fillText('K⁺',  ix, AXON_Y + 32); }
      }
    }

    function drawVoltageGraph(history: number[]) {
      const gx = 30, gy = H * 0.7, gw = W - 60, gh = 60;
      // Background
      ctx.fillStyle = '#FAF8F3'; ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
      // Axis labels
      ctx.font = '9px Inter'; ctx.fillStyle = '#78716C'; ctx.textAlign = 'right';
      ctx.fillText('+40mV', gx - 2, gy + 10);
      ctx.fillText('−70mV', gx - 2, gy + gh - 2);
      ctx.textAlign = 'left';
      // Baseline
      const baseY = gy + gh * 0.88;
      ctx.beginPath(); ctx.moveTo(gx, baseY); ctx.lineTo(gx + gw, baseY);
      ctx.strokeStyle = '#D4CFC8'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      // Voltage line
      if (history.length < 2) return;
      ctx.beginPath();
      history.forEach((v, i) => {
        const x = gx + (i / history.length) * gw;
        const y = gy + gh - ((v + 70) / 110) * gh;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 2; ctx.stroke();
    }

    function updateVoltage(state: APState): number {
      if (state === 'resting')      return -70;
      if (state === 'firing')       return Math.min(voltRef.current + 8, 40);
      if (state === 'repolarising') return Math.max(voltRef.current - 6, -80);
      if (state === 'refractory')   return Math.min(voltRef.current + 2, -70);
      return -70;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      tickRef.current++;
      const st = stateRef.current;

      // Auto-advance wave
      if (st !== 'resting') {
        waveRef.current = Math.min(waveRef.current + 3, W - 40);
        voltRef.current = updateVoltage(st);
        voltHistory.current.push(voltRef.current);
        if (voltHistory.current.length > 200) voltHistory.current.shift();
        setMV(Math.round(voltRef.current));
      }

      // State transitions
      if (st === 'firing' && voltRef.current >= 40) {
        stateRef.current = 'repolarising';
        setApState('repolarising');
        onEvent('Voltage-gated K⁺ channels open — potassium rushes OUT, repolarising the membrane back toward −70mV');
      }
      if (st === 'repolarising' && voltRef.current <= -80) {
        stateRef.current = 'refractory';
        setApState('refractory');
        onEvent('Refractory period — Na⁺/K⁺ pump restores resting potential; no new action potential can fire yet');
      }
      if (st === 'refractory' && voltRef.current >= -70) {
        stateRef.current = 'resting';
        setApState('resting');
        waveRef.current = 0;
      }

      drawAxon();
      drawWave(waveRef.current, st);
      drawIons(tickRef.current, st, waveRef.current);
      drawVoltageGraph(voltHistory.current);

      // mV label
      ctx.font = 'bold 14px Sora,sans-serif'; ctx.fillStyle = st === 'firing' ? '#1B4332' : '#52796F';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(voltRef.current)} mV`, W - 12, H * 0.65);
      ctx.textAlign = 'left';

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [onEvent]);

  const stimulate = () => {
    if (apState !== 'resting') return;
    stateRef.current = 'firing';
    setApState('firing');
    voltRef.current = -55;
    waveRef.current = 40;
    setStimCount(c => c + 1);
    onEvent('Stimulus applied — threshold (−55mV) reached! Voltage-gated Na⁺ channels open, sodium rushes IN, membrane depolarises to +40mV');
  };

  const reset = () => {
    stateRef.current = 'resting'; setApState('resting');
    voltRef.current = -70; setMV(-70);
    waveRef.current = 0;
    voltHistory.current = Array(200).fill(-70);
    setStimCount(0);
  };

  const STATE_COLOR: Record<APState, string> = {
    resting: '#1B4332', firing: '#D97706', repolarising: '#52796F', refractory: '#9CA3AF',
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      <div className="flex flex-wrap gap-2 p-3 shrink-0 items-center" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        <button onClick={stimulate} disabled={apState !== 'resting'}
          className="btn-primary text-xs disabled:opacity-40">
          ⚡ Stimulate Neuron
        </button>
        <button onClick={reset}
          className="px-3 py-1.5 rounded-lg text-xs font-sora font-semibold"
          style={{ border: '1px solid #E7E5E0', color: '#1B4332', background: '#fff' }}>
          Reset
        </button>
        <div className="ml-auto flex gap-4 font-inter text-xs items-center">
          <span style={{ color: STATE_COLOR[apState] }}>
            State: <strong>{apState}</strong>
          </span>
          <span style={{ color: '#52796F' }}>
            Voltage: <strong>{mV} mV</strong>
          </span>
          <span style={{ color: '#78716C' }}>
            Stimulations: {stimCount}
          </span>
        </div>
      </div>
      <canvas ref={canvasRef} width={700} height={310} className="w-full flex-1" style={{ background: '#FDFCF9' }} />
    </div>
  );
}
