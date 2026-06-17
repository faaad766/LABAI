import { useEffect, useRef, useState } from 'react';
import MoleculeViewer from '@/components/labs/MoleculeViewer';

interface Props { onEvent: (e: string) => void; }

type Step = 'start' | 'mash' | 'detergent' | 'salt' | 'alcohol' | 'dna';

const STEPS: { id: Step; label: string; desc: string }[] = [
  { id: 'start',     label: '1. Strawberry',  desc: 'Intact cell' },
  { id: 'mash',      label: '2. Mash',         desc: 'Break cells' },
  { id: 'detergent', label: '3. Detergent',    desc: 'Lyse membranes' },
  { id: 'salt',      label: '4. Salt',         desc: 'Precipitate proteins' },
  { id: 'alcohol',   label: '5. Cold Alcohol', desc: 'Precipitate DNA' },
  { id: 'dna',       label: '6. DNA Visible!', desc: 'White strands' },
];

interface Strand { x: number; y: number; vx: number; vy: number; len: number; angle: number; }

export default function DNACanvas({ onEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [step, setStep] = useState<Step>('start');
  const stepRef = useRef<Step>('start');
  const stateRef = useRef({ time: 0, strands: [] as Strand[], particles: [] as { x:number;y:number;vx:number;vy:number;color:string }[] });

  const advanceStep = () => {
    const order: Step[] = ['start','mash','detergent','salt','alcohol','dna'];
    const idx = order.indexOf(stepRef.current);
    if (idx < order.length - 1) {
      const next = order[idx + 1];
      stepRef.current = next;
      setStep(next);
      const msgs: Partial<Record<Step,string>> = {
        mash: 'Mashing the strawberry breaks open the cells, releasing their contents including DNA',
        detergent: 'Detergent dissolves the lipid membranes surrounding the cell and nucleus',
        salt: 'Salt causes proteins to clump and precipitate out of solution',
        alcohol: 'Cold alcohol creates a layer — DNA is insoluble in alcohol and precipitates',
        dna: 'White stringy DNA strands have precipitated at the alcohol-water interface!',
      };
      if (msgs[next]) onEvent(msgs[next]!);
    }
  };

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

      const currentStep = stepRef.current;
      const tx = W * 0.45, ty = H * 0.12, tw = W * 0.26, th = H * 0.72;

      // Tube glass
      const tubeGrad = ctx.createLinearGradient(tx - tw/2, 0, tx + tw/2, 0);
      tubeGrad.addColorStop(0, 'rgba(180,200,255,0.12)');
      tubeGrad.addColorStop(0.4, 'rgba(180,200,255,0.28)');
      tubeGrad.addColorStop(1, 'rgba(180,200,255,0.12)');
      ctx.fillStyle = tubeGrad;
      ctx.beginPath();
      ctx.roundRect(tx - tw/2, ty, tw, th, [8, 8, tw/2, tw/2]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,200,255,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

      // Three layers
      const lyH = th * 0.33;
      // Bottom layer — red strawberry juice / lysate
      const bottomColor = currentStep === 'start' ? 'rgba(200,60,60,0.5)' :
        currentStep === 'mash' ? 'rgba(220,80,80,0.6)' :
        currentStep === 'detergent' ? 'rgba(220,100,120,0.55)' : 'rgba(180,60,80,0.45)';
      ctx.fillStyle = bottomColor;
      ctx.fillRect(tx - tw/2 + 2, ty + th - lyH, tw - 4, lyH - 10);

      // Middle layer — salty lysate
      if (['salt','alcohol','dna'].includes(currentStep)) {
        ctx.fillStyle = 'rgba(200,180,140,0.3)';
        ctx.fillRect(tx - tw/2 + 2, ty + th - lyH*2, tw - 4, lyH);
      }

      // Top layer — alcohol
      if (['alcohol','dna'].includes(currentStep)) {
        ctx.fillStyle = 'rgba(220,240,255,0.18)';
        ctx.fillRect(tx - tw/2 + 2, ty + 4, tw - 4, lyH * 0.8);
        // Interface shimmer
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(tx - tw/2 + 2, ty + lyH * 0.8, tw - 4, 3);
      }

      // DNA strands at interface
      if (currentStep === 'dna') {
        if (Math.random() < 0.05) {
          s.strands.push({ x: tx + (Math.random()-0.5)*tw*0.5, y: ty + lyH * 0.8, vx: (Math.random()-0.5)*0.3, vy: -0.15, len: 15+Math.random()*25, angle: Math.random()*Math.PI });
        }
        s.strands = s.strands.slice(-40).map(str => {
          str.y += str.vy; str.x += str.vx; str.angle += 0.01;
          if (str.y < ty + 10 || str.y > ty + lyH) str.vy *= -0.5;
          ctx.beginPath();
          const x1 = str.x + Math.cos(str.angle) * str.len;
          const y1 = str.y + Math.sin(str.angle) * str.len * 0.3;
          ctx.moveTo(str.x, str.y);
          ctx.quadraticCurveTo(str.x + str.len*0.4, str.y - 8, x1, y1);
          ctx.strokeStyle = 'rgba(255,255,255,0.75)';
          ctx.lineWidth = 1.5; ctx.stroke();
          return str;
        });
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('↑ DNA Strands', tx, ty + lyH * 0.75 - 8);
      }

      // Strawberry (start)
      if (currentStep === 'start') {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath(); ctx.arc(tx, ty + th * 0.55, 22, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2ecc71'; ctx.font = '20px serif'; ctx.textAlign = 'center';
        ctx.fillText('🍓', tx, ty + th * 0.55 + 8);
      }

      // Mash particles
      if (currentStep === 'mash') {
        for (let i = 0; i < 12; i++) {
          const angle = (i/12)*Math.PI*2 + s.time;
          const r = 20 + Math.sin(s.time*3+i)*5;
          ctx.beginPath(); ctx.arc(tx + Math.cos(angle)*r, ty + th*0.4 + Math.sin(angle)*r*0.5, 3, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(220,80,80,0.8)'; ctx.fill();
        }
      }

      // Detergent bubbles
      if (currentStep === 'detergent') {
        for (let i = 0; i < 8; i++) {
          const bx = tx + (Math.sin(s.time*2+i*0.8))*tw*0.3;
          const by = ty + th*0.6 + Math.cos(s.time+i)*20;
          ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(180,220,255,0.6)'; ctx.lineWidth = 1; ctx.stroke();
        }
      }

      // Layer labels
      if (['salt','alcohol','dna'].includes(currentStep)) {
        ctx.fillStyle = 'rgba(226,232,240,0.5)'; ctx.font = '10px Inter'; ctx.textAlign = 'left';
        ctx.fillText('Salt buffer', tx + tw/2 + 6, ty + th - lyH*1.5 + 8);
        ctx.fillText('Cell lysate', tx + tw/2 + 6, ty + th - lyH*0.5);
      }
      if (['alcohol','dna'].includes(currentStep)) {
        ctx.fillStyle = 'rgba(200,230,255,0.6)';
        ctx.fillText('Cold alcohol', tx + tw/2 + 6, ty + lyH * 0.4);
      }

      // Step label
      const cur = STEPS.find(st => st.id === currentStep);
      ctx.fillStyle = 'rgba(226,232,240,0.9)'; ctx.font = '600 12px Inter'; ctx.textAlign = 'center';
      ctx.fillText(cur?.label ?? '', tx, ty - 8);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1 rounded-lg sim-canvas-container" style={{ minHeight: 280 }} />
      <div className="mt-3 px-2">
        <div className="flex gap-1 flex-wrap justify-center mb-2">
          {STEPS.map((st, i) => {
            const order: Step[] = ['start','mash','detergent','salt','alcohol','dna'];
            const currentIdx = order.indexOf(step);
            const stIdx = order.indexOf(st.id);
            const done = stIdx <= currentIdx;
            return (
              <div key={st.id} className="flex items-center gap-1 text-xs font-inter" style={{ color: done ? '#10B981' : 'rgba(226,232,240,0.35)' }}>
                {i > 0 && <span className="opacity-30">→</span>}
                <span>{st.label}</span>
              </div>
            );
          })}
        </div>
        {step !== 'dna' && (
          <button onClick={advanceStep} className="btn-indigo w-full text-sm">
            {STEPS.find(s => s.id === step)?.desc ?? 'Next Step'} →
          </button>
        )}
        {step === 'dna' && (
          <div className="text-center text-emerald-lab font-inter text-sm font-semibold py-2">
            ✓ DNA extraction complete!
          </div>
        )}
      </div>
      {/* 3D Molecule Viewer */}
      <div className="flex gap-4 flex-wrap justify-center pt-2">
        <MoleculeViewer molecule="dna_base" size={130} showLabel />
        <MoleculeViewer molecule="water"    size={110} showLabel />
      </div>
    </div>
  );
}
