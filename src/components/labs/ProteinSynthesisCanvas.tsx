import { useEffect, useRef, useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type Phase = 'idle' | 'transcription' | 'translation' | 'done';

const CODONS = ['AUG','UUU','GCU','CAA','UCG','GAA','AUA','UAA'];
const AA_NAMES = ['Met','Phe','Ala','Gln','Ser','Glu','Ile','STOP'];
const AA_COLORS = ['#1B4332','#2D6A4F','#52796F','#84A98C','#F59E0B','#D97706','#92400E','#9F1239'];

export default function ProteinSynthesisCanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [step, setStep] = useState(0);
  const [chain, setChain] = useState<string[]>([]);
  const phaseRef = useRef<Phase>('idle');
  const stepRef  = useRef(0);
  const chainRef = useRef<string[]>([]);
  const rafRef   = useRef<number>(0);
  const tickRef  = useRef(0);

  phaseRef.current = phase;
  stepRef.current  = step;
  chainRef.current = chain;

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;

    function drawDNA(t: number) {
      // Double helix
      for (let x = 20; x < W - 20; x += 3) {
        const y1 = H * 0.22 + 18 * Math.sin((x / W) * Math.PI * 4 + t * 0.02);
        const y2 = H * 0.22 + 18 * Math.sin((x / W) * Math.PI * 4 + t * 0.02 + Math.PI);
        ctx.beginPath(); ctx.arc(x, y1, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#1B4332'; ctx.globalAlpha = 0.7; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#2D6A4F'; ctx.globalAlpha = 0.7; ctx.fill();
        ctx.globalAlpha = 1;
        if (x % 24 === 0) {
          ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2);
          ctx.strokeStyle = 'rgba(27,67,50,0.25)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }
      ctx.font = '11px Sora,sans-serif'; ctx.fillStyle = '#1B4332'; ctx.globalAlpha = 0.6;
      ctx.fillText('DNA Template', 22, H * 0.22 - 26); ctx.globalAlpha = 1;
    }

    function drawMRNA(progress: number) {
      const len = Math.floor(progress * (W - 60));
      ctx.beginPath(); ctx.moveTo(30, H * 0.48);
      ctx.lineTo(30 + len, H * 0.48);
      ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 3; ctx.stroke();
      // Codons
      const shown = Math.floor(progress * CODONS.length);
      for (let i = 0; i < shown; i++) {
        ctx.font = '10px Inter,sans-serif'; ctx.fillStyle = '#92400E';
        ctx.fillText(CODONS[i], 30 + i * (W - 60) / CODONS.length, H * 0.44);
      }
      ctx.font = '11px Sora,sans-serif'; ctx.fillStyle = '#D97706'; ctx.globalAlpha = 0.7;
      ctx.fillText('mRNA', 22, H * 0.61); ctx.globalAlpha = 1;
    }

    function drawRibosome(pos: number, curStep: number) {
      const rx = 30 + pos * (W - 100);
      // Ribosome body
      ctx.beginPath(); ctx.ellipse(rx, H * 0.48, 32, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(27,67,50,0.15)'; ctx.fill();
      ctx.strokeStyle = '#1B4332'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = '10px Sora,sans-serif'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'center';
      ctx.fillText('Ribosome', rx, H * 0.48 + 4); ctx.textAlign = 'left';

      // tRNA carrying amino acid
      if (curStep > 0 && curStep < CODONS.length) {
        ctx.beginPath(); ctx.moveTo(rx, H * 0.48 - 14);
        ctx.lineTo(rx, H * 0.35);
        ctx.strokeStyle = '#84A98C'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(rx, H * 0.31, 12, 0, Math.PI * 2);
        ctx.fillStyle = AA_COLORS[curStep % AA_COLORS.length]; ctx.fill();
        ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(CODONS[curStep] ?? '', rx, H * 0.31 + 4); ctx.textAlign = 'left';
      }
    }

    function drawChain(c: string[]) {
      ctx.font = '11px Sora,sans-serif'; ctx.fillStyle = '#78716C';
      ctx.fillText('Polypeptide:', 22, H * 0.8);
      c.forEach((aa, i) => {
        const x = 110 + i * 44, y = H * 0.8;
        if (i > 0) {
          ctx.beginPath(); ctx.moveTo(x - 26, y - 2); ctx.lineTo(x - 14, y - 2);
          ctx.strokeStyle = '#E7E5E0'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(x, y - 2, 16, 0, Math.PI * 2);
        ctx.fillStyle = AA_COLORS[i % AA_COLORS.length]; ctx.fill();
        ctx.font = '9px Inter,sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(aa, x, y + 2); ctx.textAlign = 'left';
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FDFCF9'; ctx.fillRect(0, 0, W, H);
      const ph = phaseRef.current; const st = stepRef.current;
      tickRef.current++;

      drawDNA(tickRef.current);

      if (ph === 'transcription' || ph === 'translation' || ph === 'done') {
        const prog = ph === 'transcription'
          ? Math.min(tickRef.current / 120, 1)
          : 1;
        drawMRNA(prog);
      }

      if (ph === 'translation' || ph === 'done') {
        const tPos = Math.min((tickRef.current % 300) / 300, 1);
        drawRibosome(tPos, st);
      }

      drawChain(chainRef.current);

      if (ph === 'done') {
        ctx.font = '14px Sora,sans-serif'; ctx.fillStyle = '#1B4332'; ctx.textAlign = 'center';
        ctx.fillText('✓ Protein synthesised!', W / 2, H - 16); ctx.textAlign = 'left';
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const startTranscription = () => {
    if (phase !== 'idle') return;
    setPhase('transcription');
    onEvent('DNA unwound — RNA polymerase begins transcribing mRNA from the template strand');
    setTimeout(() => {
      setPhase('translation');
      onEvent('mRNA exits nucleus and attaches to ribosome — translation begins');
    }, 3000);
  };

  const addAminoAcid = () => {
    if (phase !== 'translation') return;
    const idx = stepRef.current;
    if (idx >= CODONS.length - 1) {
      setChain(prev => [...prev]);
      setPhase('done');
      onEvent('Stop codon (UAA) reached — ribosome releases complete polypeptide chain');
      return;
    }
    const newAA = AA_NAMES[idx];
    setChain(prev => [...prev, newAA]);
    setStep(prev => prev + 1);
    onEvent(`tRNA brings ${newAA} (codon ${CODONS[idx]}) — peptide bond forms, chain grows to ${idx + 1} amino acids`);
  };

  const reset = () => {
    setPhase('idle'); setStep(0); setChain([]);
    tickRef.current = 0;
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ border: '1px solid #E7E5E0' }}>
      {/* Controls */}
      <div className="flex flex-wrap gap-2 p-3 shrink-0" style={{ background: '#F0F7F3', borderBottom: '1px solid #E7E5E0' }}>
        <button onClick={startTranscription} disabled={phase !== 'idle'}
          className="btn-primary text-xs disabled:opacity-40">
          ▶ Start Transcription
        </button>
        <button onClick={addAminoAcid} disabled={phase !== 'translation'}
          className="btn-primary text-xs disabled:opacity-40">
          + Add Amino Acid
        </button>
        <button onClick={reset}
          className="px-3 py-1.5 rounded-lg text-xs font-sora font-semibold transition-all"
          style={{ border: '1px solid #E7E5E0', color: '#1B4332', background: '#fff' }}>
          Reset
        </button>
        <div className="ml-auto font-inter text-xs self-center" style={{ color: '#52796F' }}>
          Phase: <strong>{phase}</strong> · Chain: {chain.length} aa
        </div>
      </div>
      {/* Step labels */}
      <div className="flex justify-around px-4 pt-2 shrink-0">
        {['1. DNA Template','2. mRNA Transcription','3. Ribosome Translation','4. Polypeptide'].map((s, i) => (
          <div key={s} className="text-center">
            <span className="font-inter text-xs font-medium" style={{ color: i <= ['idle','transcription','translation','done'].indexOf(phase) ? '#1B4332' : '#D4CFC8' }}>
              {s}
            </span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} width={700} height={280} className="w-full flex-1" style={{ background: '#FDFCF9' }} />
    </div>
  );
}
