import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useApp } from '@/contexts/AppContext';
import {
  FlaskConical, Microscope, Brain, Star, ArrowRight,
  Dna, Calculator, Beaker, Zap, Code,
} from 'lucide-react';

// ── Animated hero canvas: orbiting molecules ──────────────────────────
function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width  = 320;
    const H = canvas.height = 320;
    type Node = { x: number; y: number; r: number; vx: number; vy: number; color: string };
    const PALETTE = ['#1B4332','#2D6A4F','#52796F','#F59E0B','#84A98C','#D97706'];
    const nodes: Node[] = [
      { x:160,y:160,r:20,vx: 0.22,vy: 0.15,color:'#1B4332' },
      { x: 90,y:105,r:13,vx:-0.16,vy: 0.26,color:'#2D6A4F' },
      { x:240,y: 95,r:11,vx: 0.26,vy:-0.19,color:'#F59E0B' },
      { x:250,y:220,r:14,vx:-0.21,vy:-0.21,color:'#52796F' },
      { x: 78,y:220,r:10,vx: 0.19,vy:-0.26,color:'#84A98C' },
      { x:160,y: 58,r: 9,vx:-0.23,vy: 0.21,color:'#2D6A4F' },
      { x:285,y:160,r: 9,vx:-0.19,vy: 0.23,color:'#1B4332' },
      { x: 38,y:160,r: 9,vx: 0.23,vy:-0.16,color:'#F59E0B' },
      { x:160,y:262,r: 9,vx: 0.16,vy: 0.21,color:'#52796F' },
    ];
    const bonds = [{a:0,b:1},{a:0,b:2},{a:0,b:3},{a:0,b:4},{a:1,b:5},{a:2,b:6},{a:3,b:7},{a:4,b:8},{a:5,b:6},{a:6,b:3},{a:1,b:4}];
    let frame = 0, raf: number;
    function draw() {
      ctx.clearRect(0,0,W,H);
      // Glow bg
      const grad = ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,130);
      grad.addColorStop(0,'rgba(27,67,50,0.07)'); grad.addColorStop(1,'transparent');
      ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
      // Bonds
      bonds.forEach(b => {
        const na=nodes[b.a],nb=nodes[b.b];
        ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y);
        ctx.strokeStyle='rgba(27,67,50,0.14)'; ctx.lineWidth=2.5; ctx.stroke();
      });
      // Nodes
      nodes.forEach((n,i) => {
        const pulse = 1 + 0.07*Math.sin(frame*0.033+i);
        // Outer glow
        const g = ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r*pulse*1.6);
        g.addColorStop(0, n.color+'44'); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r*pulse*1.6,0,Math.PI*2);
        ctx.fillStyle=g; ctx.fill();
        // Core
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r*pulse,0,Math.PI*2);
        ctx.fillStyle=n.color; ctx.globalAlpha=0.9; ctx.fill();
        ctx.globalAlpha=1;
        // Highlight
        ctx.beginPath(); ctx.arc(n.x-n.r*0.3,n.y-n.r*0.3,n.r*0.3,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fill();
        // Drift
        n.x += n.vx*Math.sin(frame*0.009+i); n.y += n.vy*Math.cos(frame*0.009+i*0.7);
        n.x = Math.max(n.r*2, Math.min(W-n.r*2, n.x));
        n.y = Math.max(n.r*2, Math.min(H-n.r*2, n.y));
      });
      // Orbiting electrons
      PALETTE.forEach((col,i) => {
        const orbit=115+i*7, speed=0.007+i*0.0015;
        const angle=frame*speed+(i*Math.PI*2)/PALETTE.length;
        const dx=160+orbit*Math.cos(angle), dy=160+orbit*Math.sin(angle);
        ctx.beginPath(); ctx.arc(dx,dy,3,0,Math.PI*2);
        ctx.fillStyle=col; ctx.globalAlpha=0.6; ctx.fill(); ctx.globalAlpha=1;
      });
      // Floating formula labels
      const labels = [
        {text:'HCl',x:210,y:56},{text:'NaOH',x:72,y:62},{text:'C₆H₁₂O₆',x:260,y:275},
        {text:'CO₂',x:44,y:262},{text:'CH₄',x:262,y:128},{text:'H₂O',x:66,y:136},
      ];
      labels.forEach((l,i) => {
        ctx.font='bold 11px Inter,sans-serif'; ctx.textAlign='center';
        ctx.fillStyle='rgba(27,67,50,0.35)';
        const y = l.y + Math.sin(frame*0.018+i)*4;
        ctx.fillText(l.text, l.x, y);
      });
      frame++; raf=requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ width:300,height:300,maxWidth:'100%' }}/>;
}

// ── Data ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FlaskConical, label: '130+ Experiments',    desc: 'Biology, Chemistry, Physics, Maths & CS in one place',    accent: '#1B4332', bg: '#F0F7F3', border: '#C8E6D4' },
  { icon: Brain,        label: 'AI Tutor — Dr. Lab', desc: 'Real-time explanations for every action you take',          accent: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  { icon: Beaker,       label: 'Freeform Virtual Lab',desc: 'Drag, mix & react 25+ chemicals on a real bench',          accent: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  { icon: Code,         label: 'CS Algorithm Lab',    desc: 'Visualise sorting, trees, graphs & DP step-by-step',       accent: '#0C4A6E', bg: '#F0F9FF', border: '#BAE6FD' },
];

const SUBJECTS = [
  { id:'biology',  emoji:'🧬', name:'Biology',  color:'#1B4332', bg:'#F0F7F3', border:'#C8E6D4', count:30,
    labs:['DNA Extraction','Protein Synthesis','Cellular Respiration','Mitosis & Meiosis','CRISPR','Virtual Microscopy'] },
  { id:'chemistry',emoji:'⚗️', name:'Chemistry',color:'#92400E', bg:'#FFFBEB', border:'#FDE68A', count:30,
    labs:['Acid-Base Titration','Organic Reactions','Le Chatelier','NMR Spectroscopy','Haber Process','Nanoparticles'] },
  { id:'physics',  emoji:'⚡', name:'Physics',  color:'#1E40AF', bg:'#EFF6FF', border:'#BFDBFE', count:30,
    labs:['Projectile Motion','Photoelectric Effect','Special Relativity','Nuclear Fission','Wave Harmonics','Particle Physics'] },
  { id:'maths',    emoji:'📐', name:'Maths',    color:'#6D28D9', bg:'#F5F3FF', border:'#DDD6FE', count:30,
    labs:['Lorenz Chaos Attractor','Game Theory','Monte Carlo π','Golden Ratio','Group Theory','Riemann Zeta'] },
  { id:'cs',       emoji:'💻', name:'Computer Science', color:'#0C4A6E', bg:'#F0F9FF', border:'#BAE6FD', count:10, isNew:true,
    labs:['Binary Search','Sorting Algorithms','Stack & Queue','Binary Tree Traversal','Graph Algorithms (BFS/DFS)','Big O Notation'] },
];

const STATS = [
  { value:'130+', label:'Experiments' },
  { value:'5',   label:'Subjects' },
  { value:'25+', label:'Chemical Reactions' },
  { value:'Free',label:'Always' },
];

const TESTIMONIALS = [
  { quote:'Finally understood osmosis after 20 minutes in LabAI — better than my whole semester.',      name:'Priya S.',  role:'Grade 11, Biology' },
  { quote:'The protein synthesis animation is incredible. I paused and replayed it 8 times.',          name:'James K.',  role:'Pre-Med Student' },
  { quote:'Le Chatelier\'s principle clicked the moment the simulation shifted. Game changer.',        name:'Leila M.',  role:'A-Level Chemistry' },
];

export default function LandingPage() {
  const { setScreen } = useApp();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background:'linear-gradient(160deg,#FDFCF9 0%,#FAF8F3 100%)' }}>

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto"
        style={{ background:'rgba(253,252,249,0.92)', backdropFilter:'blur(12px)',
          borderBottom:'1px solid rgba(224,239,231,0.6)' }}>
        <div className="flex items-center gap-1.5">
          <span className="logo-lab text-2xl">Lab</span>
          <span className="logo-ai text-2xl">AI</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-xs font-inter" style={{ color:'#52796F' }}>
          {[0,1,2,3,4].map(s=><Star key={s} size={11} fill="#F59E0B" stroke="none"/>)}
          <span className="ml-1.5 font-medium">Trusted by 12,000+ students</span>
        </div>
        <button onClick={()=>setScreen('subject')} className="btn-primary text-sm">
          Start Learning
        </button>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-10 flex flex-col lg:flex-row items-center gap-8">
        {/* Text */}
        <motion.div className="flex-1 min-w-0"
          initial={{ opacity:0,y:22 }} animate={{ opacity:1,y:0 }}
          transition={{ duration:0.6, ease:[0.22,1,0.36,1] }}>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-inter font-medium"
            style={{ background:'#DCFCE7', color:'#1B4332', border:'1px solid #BBF7D0' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'#16A34A' }}/>
            AI Lab Supervisor — Always Online
          </div>

          <h1 className="font-sora font-bold leading-tight mb-4 text-balance"
            style={{ fontSize:'clamp(28px,3.8vw,46px)', color:'#1C1917' }}>
            Your AI lab{' '}
            <span style={{ color:'#1B4332' }}>supervisor,</span>{' '}
            <span style={{ fontStyle:'italic', color:'#F59E0B' }}>available 24/7.</span>
          </h1>

          <p className="font-inter mb-6 leading-relaxed text-pretty"
            style={{ fontSize:15, color:'#57534E', maxWidth:440 }}>
            Millions of students have no access to real lab equipment. LabAI gives every student
            fully interactive virtual experiments — with Dr. Lab explaining the science behind
            every action, in real time.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={()=>setScreen('subject')} className="btn-hero flex items-center gap-2">
              Enter the Lab <ArrowRight size={16}/>
            </button>
            <button onClick={()=>setScreen('virtual-lab')}
              className="flex items-center gap-2 font-sora font-semibold rounded-xl px-5 py-2.5 transition-all hover:scale-105"
              style={{ background:'#FEF3C7', color:'#92400E', border:'1.5px solid #FDE68A',
                fontSize:14, boxShadow:'0 2px 10px rgba(245,158,11,0.15)' }}>
              🧪 Try 3D Virtual Lab
            </button>
            <span className="font-inter text-xs" style={{ color:'#78716C' }}>No sign-up · Free forever</span>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5 mt-5">
            {['🧬 DNA Extraction','⚗️ Acid-Base Titration','⚡ Photoelectric Effect','📐 Lorenz Attractor','💻 Binary Search','🧪 Virtual Lab'].map(p=>(
              <span key={p} className="px-2.5 py-1 rounded-full font-inter text-xs font-medium"
                style={{ background:'#F0F7F3', color:'#2D6A4F', border:'1px solid #C8E6D4' }}>
                {p}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Illustration */}
        <motion.div className="shrink-0 flex items-center justify-center"
          initial={{ opacity:0,scale:0.92 }} animate={{ opacity:1,scale:1 }}
          transition={{ duration:0.65, delay:0.15, ease:[0.22,1,0.36,1] }}>
          <div className="rounded-3xl flex items-center justify-center"
            style={{ width:300,height:300,
              background:'linear-gradient(135deg,#F0F7F3 0%,#FEF9EE 100%)',
              border:'1px solid #E0EFE7',
              boxShadow:'0 8px 36px rgba(27,67,50,0.10)' }}>
            <HeroCanvas/>
          </div>
        </motion.div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-14">
        <motion.div className="rounded-2xl grid grid-cols-2 md:grid-cols-4 overflow-hidden"
          style={{ border:'1px solid #E0EFE7' }}
          initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }}
          transition={{ duration:0.5, delay:0.28 }}>
          {STATS.map((s,i)=>(
            <div key={s.label} className="flex flex-col items-center justify-center py-7 gap-1"
              style={{ background: i%2===0 ? '#F0F7F3' : '#fff',
                borderRight: i<3 ? '1px solid #E0EFE7' : 'none' }}>
              <span className="font-sora font-bold" style={{ fontSize:32, color:'#1B4332', lineHeight:1 }}>{s.value}</span>
              <span className="font-inter text-xs font-medium" style={{ color:'#52796F' }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Feature cards ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-16">
        <div className="text-center mb-8">
          <h2 className="font-sora font-bold text-2xl mb-2 text-balance" style={{ color:'#1C1917' }}>
            Everything a student needs
          </h2>
          <p className="font-inter text-sm text-pretty" style={{ color:'#57534E' }}>
            One platform for Biology, Chemistry, Physics &amp; Maths
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, label, desc, accent, bg, border },i)=>(
            <motion.div key={label}
              className="lab-card p-6 flex flex-col gap-4 h-full cursor-pointer group"
              initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }}
              transition={{ duration:0.48, delay:0.08*i+0.3 }}
              whileHover={{ y:-3, boxShadow:'0 8px 32px rgba(27,67,50,0.12)' }}
              onClick={()=>setScreen('subject')}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:bg, border:`1px solid ${border}` }}>
                <Icon size={22} color={accent}/>
              </div>
              <div>
                <div className="font-sora font-semibold text-sm mb-1 text-balance" style={{ color:'#1C1917' }}>{label}</div>
                <div className="font-inter text-xs leading-relaxed text-pretty" style={{ color:'#78716C' }}>{desc}</div>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs font-medium"
                style={{ color:accent }}>
                Explore <ArrowRight size={12}/>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Subject cards ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-16">
        <div className="text-center mb-8">
          <h2 className="font-sora font-bold text-2xl mb-2 text-balance" style={{ color:'#1C1917' }}>
            5 subjects · 130+ experiments
          </h2>
          <p className="font-inter text-sm text-pretty" style={{ color:'#57534E' }}>
            Covering the topics students find most difficult — made interactive
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SUBJECTS.map((s,i)=>(
            <motion.div key={s.id}
              className="rounded-2xl overflow-hidden cursor-pointer group h-full flex flex-col"
              style={{ border:`1px solid ${s.border}`, background:'#fff',
                boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}
              initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }}
              transition={{ duration:0.48, delay:0.08*i+0.4 }}
              whileHover={{ y:-4, boxShadow:'0 10px 36px rgba(0,0,0,0.11)' }}
              onClick={()=>setScreen('subject')}>
              {/* Header */}
              <div className="px-5 py-5 flex items-center gap-3 relative" style={{ background:s.bg }}>
                <span style={{ fontSize:26 }}>{s.emoji}</span>
                <div>
                  <div className="font-sora font-bold text-base" style={{ color:s.color }}>{s.name}</div>
                  <div className="font-inter text-xs" style={{ color:s.color+'99' }}>{s.count} experiments</div>
                </div>
                {'isNew' in s && s.isNew && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full font-inter text-xs font-semibold"
                    style={{ background:'#FEF3C7', color:'#92400E', border:'1px solid #FDE68A' }}>
                    New ✨
                  </span>
                )}
              </div>
              {/* Labs list */}
              <div className="px-5 py-4 flex-1">
                <ul className="space-y-1.5">
                  {s.labs.map(lab=>(
                    <li key={lab} className="flex items-center gap-2 font-inter text-xs" style={{ color:'#57534E' }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background:s.color }}/>
                      {lab}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-5 pb-4 mt-auto">
                <div className="flex items-center gap-1 text-xs font-semibold font-inter"
                  style={{ color:s.color }}>
                  Open {s.name} <ArrowRight size={11}/>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-16">
        <div className="text-center mb-8">
          <h2 className="font-sora font-bold text-xl mb-1 text-balance" style={{ color:'#1C1917' }}>Students love it</h2>
          <div className="flex justify-center items-center gap-0.5 mt-1">
            {[0,1,2,3,4].map(s=><Star key={s} size={14} fill="#F59E0B" stroke="none"/>)}
            <span className="ml-2 text-xs font-inter" style={{ color:'#78716C' }}>4.9 · 12,000+ students</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t,i)=>(
            <motion.div key={t.name} className="lab-card p-6 h-full flex flex-col"
              initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }}
              transition={{ duration:0.45, delay:0.07*i+0.5 }}>
              <div className="flex gap-0.5 mb-3">
                {[0,1,2,3,4].map(s=><Star key={s} size={12} fill="#F59E0B" stroke="none"/>)}
              </div>
              <p className="font-inter text-sm leading-relaxed mb-4 text-pretty flex-1" style={{ color:'#57534E' }}>
                "{t.quote}"
              </p>
              <div>
                <div className="font-sora font-semibold text-xs" style={{ color:'#1C1917' }}>{t.name}</div>
                <div className="font-inter text-xs" style={{ color:'#78716C' }}>{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        <motion.div className="rounded-2xl px-8 py-14 text-center relative overflow-hidden"
          style={{ background:'#1B4332' }}
          initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }}
          transition={{ duration:0.5, delay:0.6 }}>
          {/* Decorative dots */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[{x:'8%',y:'20%',r:80},{x:'88%',y:'60%',r:110},{x:'55%',y:'88%',r:60}].map((c,i)=>(
              <div key={i} className="absolute rounded-full"
                style={{ left:c.x,top:c.y,width:c.r,height:c.r,
                  background:'rgba(245,158,11,0.07)',transform:'translate(-50%,-50%)' }}/>
            ))}
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-inter font-medium"
              style={{ background:'rgba(255,255,255,0.08)', color:'#84A98C', border:'1px solid rgba(255,255,255,0.12)' }}>
              <Zap size={11}/> Free forever · No account needed
            </div>
            <h2 className="font-sora font-bold text-white text-2xl md:text-3xl mb-3 text-balance">
              Ready to understand science,<br/>not just memorise it?
            </h2>
            <p className="font-inter text-sm mb-8 text-pretty" style={{ color:'#84A98C' }}>
              Start a free experiment now. No credit card. No email. Just science.
            </p>
            <button onClick={()=>setScreen('subject')}
              className="inline-flex items-center gap-2 font-sora font-semibold rounded-xl px-9 py-4 transition-all hover:scale-105"
              style={{ background:'#F59E0B', color:'#1C1917', fontSize:16,
                boxShadow:'0 4px 20px rgba(245,158,11,0.35)' }}>
              Start Learning Now <ArrowRight size={17}/>
            </button>
            <div className="flex justify-center gap-6 mt-8 flex-wrap">
              {['130+ Experiments','5 Subjects','AI Tutor','Freeform Lab','CS Algorithms'].map(f=>(
                <span key={f} className="font-inter text-xs" style={{ color:'rgba(132,169,140,0.8)' }}>✓ {f}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t text-center py-6 warm-divider">
        <p className="font-inter text-xs" style={{ color:'#A8A29E' }}>
          LabAI · Virtual STEM Lab Assistant · © {new Date().getFullYear()} · Free for all students
        </p>
      </footer>
    </div>
  );
}
