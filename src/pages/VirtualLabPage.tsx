// VirtualLabPage — Freeform drag-and-drop virtual laboratory (Chemistry + Biology)
// Drag is 100% ref-based: NO setState on pointermove → zero re-render lag
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trash2, RotateCcw, X, Microscope, FlaskConical } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

// ── Types ─────────────────────────────────────────────────────────────
interface Reagent {
  id: string;
  name: string;
  formula: string;
  color: string;
  ph: number;
  type: 'acid'|'base'|'salt'|'indicator'|'organic'|'metal-salt'|'stain'|'bio-sample'|'enzyme'|'buffer';
  category: string;
}
interface VesselReagent { reagent: Reagent; volume: number; }
interface LabItem {
  id: string;
  kind: 'beaker'|'flask'|'test-tube'|'burette'|'burner'|'stand'|'petri-dish'|'dropper'|'graduated-cylinder'|'watch-glass'|'microscope-slide';
  x: number; y: number;
  reagents: VesselReagent[];
  temperature: number;
  isHeating: boolean;
  label: string;
  burnerOn?: boolean;
  snappedTo?: string;   // id of stand this item is clamped to
}
type ReactionEffect = 'precipitate'|'gas'|'colour'|'flame'|'stain'|'neutral'|'bio'|'none';
type Reaction = { text: string; color: string; ts: number; effect: ReactionEffect };

// ── Chemistry reagents ────────────────────────────────────────────────
const CHEM_REAGENTS: Reagent[] = [
  // Acids
  { id:'hcl',    name:'Hydrochloric Acid',  formula:'HCl',      color:'#FCA5A5', ph:1,  type:'acid',      category:'Acids'      },
  { id:'h2so4',  name:'Sulfuric Acid',      formula:'H₂SO₄',    color:'#FCD34D', ph:0,  type:'acid',      category:'Acids'      },
  { id:'hno3',   name:'Nitric Acid',        formula:'HNO₃',     color:'#FDE68A', ph:1,  type:'acid',      category:'Acids'      },
  { id:'acoh',   name:'Acetic Acid',        formula:'CH₃COOH',  color:'#FEF3C7', ph:3,  type:'acid',      category:'Acids'      },
  { id:'h2o2',   name:'Hydrogen Peroxide',  formula:'H₂O₂',     color:'#E0F2FE', ph:6,  type:'acid',      category:'Acids'      },
  // Bases
  { id:'naoh',   name:'Sodium Hydroxide',   formula:'NaOH',     color:'#93C5FD', ph:13, type:'base',      category:'Bases'      },
  { id:'koh',    name:'Potassium Hydroxide',formula:'KOH',      color:'#BAE6FD', ph:13, type:'base',      category:'Bases'      },
  { id:'nh3',    name:'Ammonia',            formula:'NH₃',      color:'#BFDBFE', ph:11, type:'base',      category:'Bases'      },
  { id:'na2co3', name:'Sodium Carbonate',   formula:'Na₂CO₃',   color:'#DBEAFE', ph:11, type:'base',      category:'Bases'      },
  // Salts
  { id:'nacl',   name:'Sodium Chloride',    formula:'NaCl',     color:'#F1F5F9', ph:7,  type:'salt',      category:'Salts'      },
  { id:'agno3',  name:'Silver Nitrate',     formula:'AgNO₃',    color:'#F8FAFC', ph:5,  type:'salt',      category:'Salts'      },
  { id:'cuso4',  name:'Copper(II) Sulfate', formula:'CuSO₄',    color:'#60A5FA', ph:4,  type:'salt',      category:'Salts'      },
  { id:'fecl3',  name:'Iron(III) Chloride', formula:'FeCl₃',    color:'#D97706', ph:2,  type:'salt',      category:'Salts'      },
  { id:'bacl2',  name:'Barium Chloride',    formula:'BaCl₂',    color:'#F1F5F9', ph:7,  type:'salt',      category:'Salts'      },
  { id:'pbno3',  name:'Lead(II) Nitrate',   formula:'Pb(NO₃)₂', color:'#E2E8F0', ph:5,  type:'salt',      category:'Salts'      },
  { id:'kmno4',  name:'Potassium Perm.',    formula:'KMnO₄',    color:'#C084FC', ph:7,  type:'salt',      category:'Salts'      },
  // Metal salts (flame tests)
  { id:'licl',   name:'Lithium Chloride',   formula:'LiCl',     color:'#FEE2E2', ph:7,  type:'metal-salt',category:'Flame Tests'},
  { id:'nacl2',  name:'Sodium Chloride',    formula:'NaCl(s)',  color:'#FEF9C3', ph:7,  type:'metal-salt',category:'Flame Tests'},
  { id:'kcl',    name:'Potassium Chloride', formula:'KCl',      color:'#F3E8FF', ph:7,  type:'metal-salt',category:'Flame Tests'},
  { id:'cucl2',  name:'Copper(II) Chloride',formula:'CuCl₂',    color:'#D1FAE5', ph:4,  type:'metal-salt',category:'Flame Tests'},
  { id:'srcl2',  name:'Strontium Chloride', formula:'SrCl₂',    color:'#FDE8D8', ph:7,  type:'metal-salt',category:'Flame Tests'},
  // Indicators
  { id:'univ',   name:'Universal Indicator',formula:'Ind.',     color:'#A7F3D0', ph:7,  type:'indicator', category:'Indicators' },
  { id:'pheno',  name:'Phenolphthalein',    formula:'PP',       color:'#FDF4FF', ph:7,  type:'indicator', category:'Indicators' },
  { id:'methyl', name:'Methyl Orange',      formula:'MO',       color:'#FFF7ED', ph:7,  type:'indicator', category:'Indicators' },
  // Organic
  { id:'eth',    name:'Ethanol',            formula:'C₂H₅OH',   color:'#D1FAE5', ph:7,  type:'organic',   category:'Organic'    },
  { id:'starch', name:'Starch Solution',    formula:'Starch',   color:'#FFFBEB', ph:7,  type:'organic',   category:'Organic'    },
];

// ── Biology reagents ──────────────────────────────────────────────────
const BIO_REAGENTS: Reagent[] = [
  // Stains
  { id:'methblue', name:'Methylene Blue',  formula:'MB',       color:'#2563EB', ph:7, type:'stain',      category:'Stains'     },
  { id:'iodine',   name:'Iodine Solution', formula:'I₂/KI',    color:'#92400E', ph:7, type:'stain',      category:'Stains'     },
  { id:'eosin',    name:'Eosin Y',         formula:'Eosin',    color:'#DB2777', ph:7, type:'stain',      category:'Stains'     },
  { id:'crysvio',  name:'Crystal Violet',  formula:'CV',       color:'#7C3AED', ph:7, type:'stain',      category:'Stains'     },
  { id:'safranin', name:'Safranin',        formula:'Saf.',     color:'#DC2626', ph:7, type:'stain',      category:'Stains'     },
  // Biological samples
  { id:'onion',    name:'Onion Epid. Cells',formula:'Onion',   color:'#FDE68A', ph:7, type:'bio-sample', category:'Bio Samples'},
  { id:'cheek',    name:'Cheek Cells',     formula:'Cheek',    color:'#FEE2E2', ph:7, type:'bio-sample', category:'Bio Samples'},
  { id:'blood',    name:'Blood Smear',     formula:'Blood',    color:'#EF4444', ph:7, type:'bio-sample', category:'Bio Samples'},
  { id:'yeast',    name:'Yeast (Sacch.)',  formula:'Yeast',    color:'#FEF3C7', ph:7, type:'bio-sample', category:'Bio Samples'},
  { id:'bacteria', name:'E. coli Culture', formula:'E.coli',   color:'#D1FAE5', ph:7, type:'bio-sample', category:'Bio Samples'},
  { id:'chloro',   name:'Chlorophyll Ext.',formula:'Chl.',     color:'#16A34A', ph:7, type:'bio-sample', category:'Bio Samples'},
  // Enzymes
  { id:'amylase',  name:'Amylase',         formula:'Amy.',     color:'#FEF9C3', ph:7, type:'enzyme',     category:'Enzymes'    },
  { id:'catalase', name:'Catalase',        formula:'Cat.',     color:'#ECFDF5', ph:7, type:'enzyme',     category:'Enzymes'    },
  { id:'pepsin',   name:'Pepsin',          formula:'Pep.',     color:'#FFF7ED', ph:2, type:'enzyme',     category:'Enzymes'    },
  // Buffers
  { id:'pbs',      name:'PBS Buffer pH 7.4',formula:'PBS',     color:'#EFF6FF', ph:7, type:'buffer',     category:'Buffers'    },
  { id:'acetbuf',  name:'Acetate Buffer pH 5',formula:'AcBuf', color:'#FFFBEB', ph:5, type:'buffer',     category:'Buffers'    },
];

// ── Reaction matrix ────────────────────────────────────────────────────
interface RxnRule {
  ids: [string, string];
  text: string;
  color: string;
  effect: ReactionEffect;
  resultColor?: string;
}
const REACTION_RULES: RxnRule[] = [
  // Precipitates
  { ids:['agno3','nacl'],  text:'⚪ White precipitate! AgNO₃ + NaCl → AgCl↓ + NaNO₃',  color:'#6B7280', effect:'precipitate', resultColor:'#F8FAFC' },
  { ids:['agno3','hcl'],   text:'⚪ White precipitate! Ag⁺ + Cl⁻ → AgCl↓',              color:'#6B7280', effect:'precipitate', resultColor:'#F1F5F9' },
  { ids:['pbno3','nacl'],  text:'⚪ White precipitate! Pb²⁺ + 2Cl⁻ → PbCl₂↓',          color:'#6B7280', effect:'precipitate', resultColor:'#F1F5F9' },
  { ids:['pbno3','h2so4'], text:'⚪ White precipitate! Pb²⁺ + SO₄²⁻ → PbSO₄↓',         color:'#6B7280', effect:'precipitate', resultColor:'#F8FAFC' },
  { ids:['bacl2','h2so4'], text:'⚪ White precipitate! Ba²⁺ + SO₄²⁻ → BaSO₄↓',         color:'#6B7280', effect:'precipitate', resultColor:'#F8FAFC' },
  { ids:['cuso4','naoh'],  text:'🔵 Blue precipitate! Cu²⁺ + 2OH⁻ → Cu(OH)₂↓',         color:'#2563EB', effect:'precipitate', resultColor:'#BFDBFE' },
  { ids:['cuso4','koh'],   text:'🔵 Blue precipitate! Cu²⁺ + 2OH⁻ → Cu(OH)₂↓',         color:'#2563EB', effect:'precipitate', resultColor:'#BFDBFE' },
  { ids:['fecl3','naoh'],  text:'🟤 Rusty precipitate! Fe³⁺ + 3OH⁻ → Fe(OH)₃↓',        color:'#92400E', effect:'precipitate', resultColor:'#FCD34D' },
  { ids:['fecl3','koh'],   text:'🟤 Rusty precipitate! Fe³⁺ + 3OH⁻ → Fe(OH)₃↓',        color:'#92400E', effect:'precipitate', resultColor:'#FCD34D' },
  // Gas evolution
  { ids:['hcl','na2co3'],  text:'🫧 CO₂ gas! HCl + Na₂CO₃ → NaCl + H₂O + CO₂↑',       color:'#D97706', effect:'gas' },
  { ids:['h2so4','na2co3'],text:'🫧 CO₂ gas! H₂SO₄ + Na₂CO₃ → CO₂ bubbles',            color:'#D97706', effect:'gas' },
  { ids:['hno3','na2co3'], text:'🫧 CO₂ gas! HNO₃ + Na₂CO₃ → CO₂ bubbles',             color:'#D97706', effect:'gas' },
  { ids:['acoh','na2co3'], text:'🫧 CO₂ gas (slow)! Weak acid + carbonate → CO₂↑',      color:'#D97706', effect:'gas' },
  { ids:['h2o2','catalase'],text:'🫧 O₂ gas! H₂O₂ → 2H₂O + O₂↑ (catalase-catalysed)',  color:'#10B981', effect:'gas' },
  // Neutralisation
  { ids:['hcl','naoh'],    text:'⚡ Neutralisation! HCl + NaOH → NaCl + H₂O',           color:'#16A34A', effect:'neutral', resultColor:'#F1F5F9' },
  { ids:['hcl','koh'],     text:'⚡ Neutralisation! HCl + KOH → KCl + H₂O',             color:'#16A34A', effect:'neutral', resultColor:'#F1F5F9' },
  { ids:['h2so4','naoh'],  text:'⚡ Neutralisation! H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',   color:'#16A34A', effect:'neutral', resultColor:'#F1F5F9' },
  { ids:['hno3','naoh'],   text:'⚡ Neutralisation! HNO₃ + NaOH → NaNO₃ + H₂O',        color:'#16A34A', effect:'neutral', resultColor:'#F1F5F9' },
  // Colour changes — indicators
  { ids:['hcl','univ'],    text:'🔴 Universal indicator turns RED — strong acid (pH 1)',  color:'#DC2626', effect:'colour', resultColor:'#FCA5A5' },
  { ids:['naoh','univ'],   text:'🟣 Universal indicator turns PURPLE — strong base',      color:'#7C3AED', effect:'colour', resultColor:'#C4B5FD' },
  { ids:['acoh','univ'],   text:'🟠 Universal indicator turns ORANGE — weak acid (pH 4)', color:'#EA580C', effect:'colour', resultColor:'#FDBA74' },
  { ids:['naoh','pheno'],  text:'🌸 Phenolphthalein turns PINK in base!',                color:'#DB2777', effect:'colour', resultColor:'#FBCFE8' },
  { ids:['hcl','pheno'],   text:'⚪ Phenolphthalein remains colourless in acid',          color:'#6B7280', effect:'colour' },
  { ids:['hcl','methyl'],  text:'🔴 Methyl orange turns RED in acid!',                   color:'#DC2626', effect:'colour', resultColor:'#FCA5A5' },
  { ids:['naoh','methyl'], text:'🟡 Methyl orange turns YELLOW in base',                 color:'#CA8A04', effect:'colour', resultColor:'#FDE68A' },
  { ids:['kmno4','eth'],   text:'💜→⚪ KMnO₄ decolorises! Ethanol oxidised',             color:'#7C3AED', effect:'colour', resultColor:'#F8FAFC' },
  { ids:['kmno4','h2so4'], text:'💜 KMnO₄ + H₂SO₄ — strong oxidant in acid solution',  color:'#7C3AED', effect:'colour' },
  // Biology staining reactions
  { ids:['iodine','starch'],    text:'⬛ Iodine + Starch → Blue-black colour! Starch confirmed',  color:'#1E3A5F', effect:'stain', resultColor:'#1E3A5F' },
  { ids:['iodine','onion'],     text:'🟤 Iodine stains onion cells — nuclei visible',              color:'#92400E', effect:'stain', resultColor:'#92400E' },
  { ids:['methblue','cheek'],   text:'🔵 Methylene blue stains cheek cell nuclei blue',            color:'#2563EB', effect:'stain', resultColor:'#60A5FA' },
  { ids:['methblue','bacteria'],text:'🔵 Methylene blue stains bacterial cells — simple stain done',color:'#2563EB', effect:'stain', resultColor:'#93C5FD' },
  { ids:['eosin','cheek'],      text:'🩷 Eosin stains cytoplasm pink — differential staining',     color:'#DB2777', effect:'stain', resultColor:'#FBCFE8' },
  { ids:['eosin','blood'],      text:'🩷 Eosin stains RBC cytoplasm pink — blood smear ready',     color:'#DB2777', effect:'stain', resultColor:'#FCA5A5' },
  { ids:['crysvio','bacteria'], text:'🟣 Crystal violet: Gram stain step 1 — cells stained purple',color:'#7C3AED', effect:'stain', resultColor:'#C4B5FD' },
  { ids:['safranin','bacteria'],text:'🔴 Safranin counterstain — Gram-negative cells turn red!',   color:'#DC2626', effect:'stain', resultColor:'#FCA5A5' },
  // Enzyme reactions
  { ids:['amylase','starch'],   text:'✅ Amylase digests starch → maltose. Starch disappearing!', color:'#16A34A', effect:'bio', resultColor:'#F1F5F9' },
  { ids:['pepsin','hcl'],       text:'⚗️ Pepsin active in acid (pH 2) — optimal for protein digestion',color:'#92400E',effect:'bio'},
  { ids:['catalase','h2o2'],    text:'🫧 Catalase decomposes H₂O₂ → O₂ + H₂O vigorously!',       color:'#10B981', effect:'gas', resultColor:'#F0FDF4' },
  // Yeast fermentation
  { ids:['yeast','eth'],        text:'🍺 Yeast ferments — ethanol produced, CO₂ bubbles rising!', color:'#D97706', effect:'gas' },
  // Chlorophyll
  { ids:['eth','chloro'],       text:'🌿 Ethanol extracts chlorophyll — solution turns bright green!',color:'#16A34A',effect:'colour',resultColor:'#DCFCE7'},
];

const FLAME_COLOURS: Record<string, { color: string; name: string }> = {
  licl:  { color:'#EF4444', name:'Red'     },
  nacl2: { color:'#F59E0B', name:'Yellow'  },
  kcl:   { color:'#A78BFA', name:'Lilac'   },
  cucl2: { color:'#10B981', name:'Green'   },
  srcl2: { color:'#DC2626', name:'Crimson' },
};

function findReaction(a: Reagent, b: Reagent): RxnRule | null {
  for (const rule of REACTION_RULES) {
    const [r1, r2] = rule.ids;
    if ((a.id === r1 && b.id === r2) || (a.id === r2 && b.id === r1)) return rule;
  }
  return null;
}

// ── Colour helpers ─────────────────────────────────────────────────────
function blendColors(reagents: VesselReagent[]): string {
  if (!reagents.length) return 'rgba(180,220,255,0.25)';
  if (reagents.length === 1) return reagents[0].reagent.color + 'CC';
  let r=0,g=0,b=0,tot=0;
  for (const c of reagents) {
    const hex = c.reagent.color.replace('#','');
    r += parseInt(hex.slice(0,2),16)*c.volume;
    g += parseInt(hex.slice(2,4),16)*c.volume;
    b += parseInt(hex.slice(4,6),16)*c.volume;
    tot += c.volume;
  }
  if (!tot) return 'rgba(180,220,255,0.25)';
  const h = (n: number) => Math.min(255,Math.round(n/tot)).toString(16).padStart(2,'0');
  return `#${h(r)}${h(g)}${h(b)}CC`;
}
function mixPh(reagents: VesselReagent[]): number {
  if (!reagents.length) return 7;
  const tot = reagents.reduce((s,c)=>s+c.volume,0);
  return tot ? reagents.reduce((s,c)=>s+c.reagent.ph*c.volume,0)/tot : 7;
}
function phBarColor(ph: number): string {
  if (ph<=2) return '#EF4444'; if (ph<=5) return '#F97316';
  if (ph<=6) return '#EAB308'; if (ph<=8) return '#22C55E';
  if (ph<=10) return '#3B82F6'; return '#8B5CF6';
}

// ── SVG components ─────────────────────────────────────────────────────
function BeakerSVG({ reagents, isHeating, size=80 }: { reagents: VesselReagent[]; isHeating: boolean; size?: number }) {
  const fill = blendColors(reagents);
  const level = Math.min(1, reagents.reduce((s,c)=>s+c.volume,0)/80);
  const W = size, H = size*1.1;
  const bodyX=W*0.12, bodyY=H*0.1, bodyW=W*0.76, bodyH=H*0.78;
  const liquidY = bodyY + bodyH*(1-level);
  const liquidH = bodyH*level;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
      <defs><clipPath id={`bk-clip-${size}`}><rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="2"/></clipPath></defs>
      <ellipse cx={W/2} cy={H*0.95} rx={W*0.3} ry={3} fill="rgba(0,0,0,0.12)" />
      {level>0 && <rect x={bodyX+1} y={liquidY} width={bodyW-2} height={liquidH}
        fill={fill} clipPath={`url(#bk-clip-${size})`} style={{transition:'all 0.5s ease'}}/>}
      {level>0 && <ellipse cx={W/2} cy={liquidY} rx={bodyW*0.45} ry={3}
        fill="rgba(255,255,255,0.35)" clipPath={`url(#bk-clip-${size})`}>
        {isHeating && <animate attributeName="ry" values="2;4;2" dur="0.9s" repeatCount="indefinite"/>}
      </ellipse>}
      {isHeating && level>0 && [0.25,0.5,0.75].map((f,i)=>(
        <circle key={i} cx={bodyX+bodyW*f} cy={liquidY+8} r="2.5" fill="rgba(255,255,255,0.55)">
          <animate attributeName="cy" values={`${liquidY+8};${liquidY-8}`} dur={`${0.6+i*0.18}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur={`${0.6+i*0.18}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="3"
        fill="rgba(220,240,255,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      <rect x={bodyX+3} y={bodyY+4} width={3} height={bodyH-8} rx="1.5"
        fill="rgba(255,255,255,0.4)"/>
      <rect x={bodyX-3} y={bodyY} width={bodyW+6} height={5} rx="2.5"
        fill="rgba(191,219,254,0.8)" stroke="rgba(147,197,253,0.7)" strokeWidth="1"/>
      {[0.25,0.5,0.75].map((f,i)=>(
        <line key={i} x1={bodyX} y1={bodyY+bodyH*f} x2={bodyX+W*0.1} y2={bodyY+bodyH*f}
          stroke="rgba(147,197,253,0.5)" strokeWidth="1"/>
      ))}
      <path d={`M ${bodyX+bodyW-4} ${bodyY} L ${bodyX+bodyW+6} ${bodyY-6}`}
        stroke="rgba(147,197,253,0.8)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {isHeating && <rect x={bodyX} y={bodyY+bodyH-6} width={bodyW} height={6} rx="1"
        fill="#FCA5A5" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.1s" repeatCount="indefinite"/>
      </rect>}
    </svg>
  );
}

function FlaskSVG({ reagents, isHeating }: { reagents: VesselReagent[]; isHeating: boolean }) {
  const fill = blendColors(reagents);
  const level = Math.min(1, reagents.reduce((s,c)=>s+c.volume,0)/70);
  return (
    <svg width="72" height="96" viewBox="0 0 72 96" style={{overflow:'visible'}}>
      <defs><clipPath id="flask-liq"><path d="M23 36 L6 72 Q3 88 36 88 Q69 88 66 72 L49 36Z"/></clipPath></defs>
      <ellipse cx="36" cy="92" rx="22" ry="3" fill="rgba(0,0,0,0.12)"/>
      {level>0 && <path d="M23 36 L6 72 Q3 88 36 88 Q69 88 66 72 L49 36Z"
        fill={fill} style={{transition:'all 0.5s'}} clipPath="url(#flask-liq)"/>}
      {level>0 && <ellipse cx="36" cy={88-52*level} rx="22" ry="3" fill="rgba(255,255,255,0.3)" clipPath="url(#flask-liq)"/>}
      {isHeating && level>0 && [20,36,52].map((x,i)=>(
        <circle key={i} cx={x} cy={88-52*level} r="2" fill="rgba(255,255,255,0.55)">
          <animate attributeName="cy" values={`${88-52*level};${88-52*level-12}`} dur={`${0.65+i*0.2}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0" dur={`${0.65+i*0.2}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <rect x="23" y="4" width="26" height="34" rx="3" fill="rgba(220,240,255,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      <path d="M23 36 L6 72 Q3 88 36 88 Q69 88 66 72 L49 36Z" fill="rgba(220,240,255,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      <rect x="25" y="7" width="3" height="28" rx="1.5" fill="rgba(255,255,255,0.4)"/>
      <rect x="20" y="2" width="32" height="6" rx="3" fill="rgba(191,219,254,0.8)" stroke="rgba(147,197,253,0.7)" strokeWidth="1"/>
      {isHeating && <ellipse cx="36" cy="86" rx="20" ry="4" fill="#FCA5A5" opacity="0.55">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.1s" repeatCount="indefinite"/>
      </ellipse>}
    </svg>
  );
}

function TestTubeSVG({ reagents, isHeating, clamped }: { reagents: VesselReagent[]; isHeating: boolean; clamped?: boolean }) {
  const fill = blendColors(reagents);
  const level = Math.min(1, reagents.reduce((s,c)=>s+c.volume,0)/40);
  return (
    <svg width="34" height="110" viewBox="0 0 34 110" style={{overflow:'visible'}}>
      <defs><clipPath id="tt-liq"><path d="M8 5 L8 87 Q8 97 17 97 Q26 97 26 87 L26 5Z"/></clipPath></defs>
      <ellipse cx="17" cy="100" rx="10" ry="2.5" fill="rgba(0,0,0,0.12)"/>
      {level>0 && <rect x="9" y={87-82*level} width="16" height={82*level} fill={fill}
        clipPath="url(#tt-liq)" style={{transition:'all 0.5s'}}/>}
      {level>0 && <ellipse cx="17" cy={87-82*level} rx="7" ry="2" fill="rgba(255,255,255,0.3)" clipPath="url(#tt-liq)"/>}
      {isHeating && level>0 && <circle cx="17" cy={87-82*level} r="1.8" fill="rgba(255,255,255,0.55)">
        <animate attributeName="cy" values={`${87-82*level};${87-82*level-10}`} dur="0.7s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0" dur="0.7s" repeatCount="indefinite"/>
      </circle>}
      <rect x="8" y="5" width="18" height="82" rx="2" fill="rgba(220,240,255,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      <path d="M8 87 Q8 97 17 97 Q26 97 26 87" fill="rgba(220,240,255,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      <rect x="9" y="7" width="2.5" height="78" rx="1.25" fill="rgba(255,255,255,0.4)"/>
      <rect x="6" y="3" width="22" height="5" rx="2.5" fill="rgba(191,219,254,0.8)" stroke="rgba(147,197,253,0.7)" strokeWidth="1"/>
      {/* Clamp indicator */}
      {clamped && <rect x="0" y="18" width="8" height="10" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="1"/>}
    </svg>
  );
}

function BuretteSVG({ reagents }: { reagents: VesselReagent[] }) {
  const fill = blendColors(reagents);
  const level = Math.min(1, reagents.reduce((s,c)=>s+c.volume,0)/60);
  return (
    <svg width="28" height="140" viewBox="0 0 28 140" style={{overflow:'visible'}}>
      <defs><clipPath id="bur-liq"><rect x="8" y="8" width="12" height="110" rx="1"/></clipPath></defs>
      <ellipse cx="14" cy="136" rx="5" ry="2" fill="rgba(0,0,0,0.15)"/>
      {/* Liquid */}
      {level>0 && <rect x="9" y={118-110*level} width="10" height={110*level}
        fill={fill} clipPath="url(#bur-liq)" style={{transition:'all 0.5s'}}/>}
      {/* Tube */}
      <rect x="8" y="8" width="12" height="110" rx="2"
        fill="rgba(220,240,255,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.5"/>
      {/* Graduation marks */}
      {[0.2,0.4,0.6,0.8].map((f,i)=>(
        <g key={i}>
          <line x1="8" y1={8+110*f} x2="14" y2={8+110*f} stroke="rgba(147,197,253,0.6)" strokeWidth="1"/>
          <text x="16" y={8+110*f+4} fontSize="6" fill="rgba(100,100,120,0.7)" fontFamily="Inter,sans-serif">{(f*50).toFixed(0)}</text>
        </g>
      ))}
      {/* Stopcock */}
      <rect x="5" y="118" width="18" height="7" rx="3.5" fill="#4B5563" stroke="#374151" strokeWidth="1"/>
      <rect x="11" y="115" width="6" height="4" rx="1" fill="#6B7280"/>
      {/* Tip */}
      <path d="M12 125 L12 136 M16 125 L16 136" stroke="rgba(147,197,253,0.8)" strokeWidth="1.5" fill="none"/>
      <path d="M12 134 Q14 138 16 134" stroke="rgba(147,197,253,0.8)" strokeWidth="1.5" fill="none"/>
      {/* Top cap */}
      <rect x="8" y="4" width="12" height="5" rx="2.5" fill="rgba(191,219,254,0.8)" stroke="rgba(147,197,253,0.7)" strokeWidth="1"/>
      {/* Highlight */}
      <rect x="9" y="9" width="2" height="108" rx="1" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

function GraduatedCylinderSVG({ reagents }: { reagents: VesselReagent[] }) {
  const fill = blendColors(reagents);
  const level = Math.min(1, reagents.reduce((s,c)=>s+c.volume,0)/100);
  return (
    <svg width="40" height="120" viewBox="0 0 40 120" style={{overflow:'visible'}}>
      <defs><clipPath id="gc-liq"><rect x="10" y="14" width="20" height="90" rx="1"/></clipPath></defs>
      <ellipse cx="20" cy="115" rx="15" ry="3.5" fill="rgba(0,0,0,0.12)"/>
      {level>0 && <rect x="11" y={104-90*level} width="18" height={90*level}
        fill={fill} clipPath="url(#gc-liq)" style={{transition:'all 0.5s'}}/>}
      {level>0 && <ellipse cx="20" cy={104-90*level} rx="8" ry="2.5" fill="rgba(255,255,255,0.3)" clipPath="url(#gc-liq)"/>}
      <rect x="10" y="14" width="20" height="90" rx="3"
        fill="rgba(220,240,255,0.10)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      {/* Base */}
      <ellipse cx="20" cy="108" rx="14" ry="5" fill="rgba(220,240,255,0.2)" stroke="rgba(147,197,253,0.7)" strokeWidth="1.5"/>
      {/* Graduation ticks + labels */}
      {[0.2,0.4,0.6,0.8,1.0].map((f,i)=>(
        <g key={i}>
          <line x1="10" y1={14+90*(1-f)} x2="17" y2={14+90*(1-f)} stroke="rgba(147,197,253,0.7)" strokeWidth="1"/>
          <text x="0" y={14+90*(1-f)+4} fontSize="7" fill="rgba(80,80,100,0.8)" fontFamily="Inter,sans-serif">{(f*100).toFixed(0)}</text>
        </g>
      ))}
      {/* Spout */}
      <path d="M28 16 Q35 12 35 8" stroke="rgba(147,197,253,0.8)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Top lip */}
      <rect x="8" y="12" width="24" height="4" rx="2" fill="rgba(191,219,254,0.8)" stroke="rgba(147,197,253,0.7)" strokeWidth="1"/>
      {/* Highlight */}
      <rect x="11" y="15" width="2.5" height="88" rx="1.25" fill="rgba(255,255,255,0.4)"/>
    </svg>
  );
}

function PetriDishSVG({ reagents }: { reagents: VesselReagent[] }) {
  const fill = blendColors(reagents);
  const hasSample = reagents.length > 0;
  return (
    <svg width="80" height="55" viewBox="0 0 80 55" style={{overflow:'visible'}}>
      <ellipse cx="40" cy="50" rx="32" ry="4" fill="rgba(0,0,0,0.10)"/>
      {/* Dish base */}
      <ellipse cx="40" cy="38" rx="34" ry="10" fill="rgba(220,240,255,0.15)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.5"/>
      {/* Liquid / sample */}
      {hasSample && <ellipse cx="40" cy="37" rx="30" ry="8" fill={fill} opacity="0.85"/>}
      {/* Colony dots for bio samples */}
      {hasSample && reagents.some(r=>r.reagent.type==='bio-sample') && [
        {cx:32,cy:36},{cx:40,cy:34},{cx:48,cy:37},{cx:36,cy:40},{cx:45,cy:40}
      ].map((p,i)=>(
        <circle key={i} cx={p.cx} cy={p.cy} r="2.5" fill={reagents[0].reagent.color} opacity="0.9"/>
      ))}
      {/* Lid */}
      <ellipse cx="40" cy="28" rx="34" ry="10" fill="rgba(220,240,255,0.08)" stroke="rgba(147,197,253,0.7)" strokeWidth="1.5"/>
      <ellipse cx="40" cy="27" rx="30" ry="7" fill="rgba(255,255,255,0.12)"/>
      {/* Lid highlight */}
      <ellipse cx="32" cy="25" rx="8" ry="3" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

function WatchGlassSVG({ reagents }: { reagents: VesselReagent[] }) {
  const fill = blendColors(reagents);
  const hasContent = reagents.length > 0;
  return (
    <svg width="60" height="30" viewBox="0 0 60 30" style={{overflow:'visible'}}>
      <ellipse cx="30" cy="27" rx="24" ry="3" fill="rgba(0,0,0,0.10)"/>
      {hasContent && <ellipse cx="30" cy="20" rx="20" ry="6" fill={fill} opacity="0.9"/>}
      <path d="M6 20 Q30 4 54 20" fill="rgba(220,240,255,0.15)" stroke="rgba(147,197,253,0.85)" strokeWidth="2"/>
      <path d="M6 20 Q30 26 54 20" fill="rgba(220,240,255,0.08)" stroke="rgba(147,197,253,0.7)" strokeWidth="1.5"/>
      <path d="M10 18 Q30 8 50 18" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function MicroscopeSlideSVG({ reagents }: { reagents: VesselReagent[] }) {
  const fill = blendColors(reagents);
  const hasContent = reagents.length > 0;
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" style={{overflow:'visible'}}>
      <ellipse cx="44" cy="33" rx="40" ry="3" fill="rgba(0,0,0,0.10)"/>
      {/* Glass slide */}
      <rect x="4" y="10" width="80" height="20" rx="2"
        fill="rgba(220,240,255,0.20)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.5"/>
      {/* Coverslip */}
      <rect x="24" y="11" width="40" height="18" rx="1"
        fill={hasContent ? fill : 'rgba(220,240,255,0.10)'} opacity="0.9"
        stroke="rgba(147,197,253,0.6)" strokeWidth="1"/>
      {/* Cell dots when stained */}
      {hasContent && reagents.some(r=>['stain','bio-sample'].includes(r.reagent.type)) && [
        {cx:32,cy:20},{cx:40,cy:17},{cx:48,cy:21},{cx:36,cy:24},{cx:52,cy:18},{cx:56,cy:23}
      ].map((p,i)=>(
        <circle key={i} cx={p.cx} cy={p.cy} r="3" fill={reagents[0].reagent.color} opacity="0.75"/>
      ))}
      {/* Slide label area */}
      <rect x="4" y="10" width="18" height="20" rx="1" fill="rgba(255,255,255,0.4)" stroke="rgba(147,197,253,0.4)" strokeWidth="1"/>
      {/* Highlight */}
      <rect x="26" y="12" width="36" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)"/>
    </svg>
  );
}

function DroppedCylinderSVG({ reagents }: { reagents: VesselReagent[] }) {
  const fill = blendColors(reagents);
  const level = Math.min(1, reagents.reduce((s,c)=>s+c.volume,0)/20);
  return (
    <svg width="24" height="70" viewBox="0 0 24 70" style={{overflow:'visible'}}>
      {/* Bulb */}
      <ellipse cx="12" cy="56" rx="10" ry="10" fill={level>0 ? fill : 'rgba(220,240,255,0.2)'}
        stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      <ellipse cx="12" cy="56" rx="10" ry="10"
        fill="rgba(220,240,255,0.12)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8"/>
      {level>0 && <ellipse cx="12" cy="56" rx="7" ry="7" fill={fill} opacity="0.8"/>}
      {/* Tube */}
      <rect x="9" y="4" width="6" height="44" rx="3"
        fill="rgba(220,240,255,0.15)" stroke="rgba(147,197,253,0.85)" strokeWidth="1.5"/>
      {/* Rubber bulb */}
      <ellipse cx="12" cy="5" rx="7" ry="5" fill="#374151" stroke="#1F2937" strokeWidth="1"/>
      <ellipse cx="10" cy="4" rx="2" ry="1.5" fill="#6B7280" opacity="0.4"/>
      {/* Tip */}
      <path d="M11 48 Q12 52 13 48" stroke="rgba(147,197,253,0.8)" strokeWidth="1.5" fill="none"/>
      {/* Highlight */}
      <rect x="10" y="5" width="1.5" height="42" rx="0.75" fill="rgba(255,255,255,0.4)"/>
    </svg>
  );
}

function BunsenBurnerSVG({ on, flameColor }: { on: boolean; flameColor?: string }) {
  const fc = flameColor || '#F97316';
  return (
    <svg width="60" height="90" viewBox="0 0 60 90" style={{overflow:'visible'}}>
      {on && <>
        <ellipse cx="30" cy="25" rx="12" ry="20" fill={fc} opacity="0.35">
          <animate attributeName="ry" values="18;22;18" dur="0.4s" repeatCount="indefinite"/>
          <animate attributeName="cx" values="29;31;29" dur="0.3s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="30" cy="28" rx="8" ry="15" fill={fc} opacity="0.65">
          <animate attributeName="ry" values="13;17;13" dur="0.35s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="30" cy="33" rx="5" ry="9" fill="#60A5FA" opacity="0.85">
          <animate attributeName="ry" values="8;10;8" dur="0.3s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="30" cy="15" rx="14" ry="6" fill={fc} opacity="0.12">
          <animate attributeName="cy" values="15;8;15" dur="0.5s" repeatCount="indefinite"/>
        </ellipse>
      </>}
      <rect x="22" y="38" width="16" height="28" rx="3" fill="#6B7280" stroke="#4B5563" strokeWidth="1.5"/>
      <rect x="24" y="40" width="3" height="24" rx="1.5" fill="#9CA3AF" opacity="0.5"/>
      <rect x="20" y="54" width="20" height="8" rx="4" fill="#4B5563" stroke="#374151" strokeWidth="1"/>
      <rect x="15" y="66" width="30" height="8" rx="3" fill="#374151" stroke="#1F2937" strokeWidth="1"/>
      <rect x="10" y="72" width="40" height="6" rx="3" fill="#1F2937"/>
      <path d="M30 78 Q30 84 22 86" stroke="#374151" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="20" cy="59" r="3" fill={on ? '#EF4444' : '#6B7280'} stroke="#4B5563" strokeWidth="1"/>
    </svg>
  );
}

// Stand with two clamp positions
function LabStandSVG({ clampedIds }: { clampedIds: string[] }) {
  return (
    <svg width="50" height="120" viewBox="0 0 50 120">
      <rect x="5" y="108" width="40" height="10" rx="3" fill="#4B5563" stroke="#374151" strokeWidth="1"/>
      <rect x="22" y="10" width="6" height="100" rx="3" fill="#6B7280" stroke="#4B5563" strokeWidth="1"/>
      <rect x="23" y="10" width="2" height="100" rx="1" fill="#9CA3AF" opacity="0.4"/>
      {/* Two clamp positions */}
      {[28, 58].map((y,i)=>(
        <g key={i}>
          <rect x="26" y={y} width="18" height="10" rx="2" fill={clampedIds[i] ? '#92400E' : '#78716C'} stroke="#78350F" strokeWidth="1"/>
          <rect x="26" y={y+3} width="18" height="1.5" rx="0.75" fill="#B45309" opacity="0.6"/>
          {/* Clamp arm */}
          <line x1="44" y1={y+5} x2="50" y2={y+5} stroke="#78350F" strokeWidth="2" strokeLinecap="round"/>
          {clampedIds[i] && (
            <circle cx="28" cy={y+5} r="3" fill="#F59E0B" opacity="0.8"/>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Snap constants ─────────────────────────────────────────────────────
const SNAP_RADIUS = 60; // px
// Clamp offsets relative to stand top-left
const CLAMP_OFFSETS = [
  { dx: 44, dy: 31 },   // upper clamp — item's left aligns here
  { dx: 44, dy: 61 },   // lower clamp
];
const SNAPPABLE_KINDS = new Set<LabItem['kind']>(['test-tube','flask','burette','graduated-cylinder','dropper']);

// ── Item counter ───────────────────────────────────────────────────────
let _id = 100;
function newId() { return `item_${_id++}`; }
function makeItem(kind: LabItem['kind'], x: number, y: number): LabItem {
  const labels: Record<LabItem['kind'], string> = {
    beaker:'Beaker', flask:'Flask', 'test-tube':'Test Tube', burette:'Burette',
    burner:'Bunsen Burner', stand:'Stand', 'petri-dish':'Petri Dish',
    dropper:'Dropper', 'graduated-cylinder':'Grad. Cylinder', 'watch-glass':'Watch Glass',
    'microscope-slide':'Micro Slide',
  };
  return { id: newId(), kind, x, y, reagents:[], temperature:25, isHeating:false, label:`${labels[kind]} ${_id-100}` };
}

// ── Main component ─────────────────────────────────────────────────────
export default function VirtualLabPage() {
  const { setScreen } = useApp();
  const [labMode, setLabMode] = useState<'chemistry'|'biology'>('chemistry');

  const [items, setItems] = useState<LabItem[]>([
    makeItem('beaker',     90, 200),
    makeItem('flask',     230, 210),
    makeItem('test-tube', 370, 220),
    makeItem('burner',    165, 330),
    makeItem('stand',      60, 130),
  ]);
  const [selected, setSelected]               = useState<string | null>(null);
  const [selectedReagent, setSelectedReagent] = useState<Reagent | null>(null);
  const [reactions, setReactions]             = useState<Reaction[]>([]);
  const [openCategory, setOpenCategory]       = useState<string>('Acids');
  const [flameColor, setFlameColor]           = useState<string | undefined>(undefined);

  // ── Drag: pure-ref, zero setState on pointermove ────────────────────
  const dragRef  = useRef<{ id:string; ox:number; oy:number; sx:number; sy:number; moved:boolean } | null>(null);
  const itemEls  = useRef<Record<string, HTMLDivElement | null>>({});
  const posRef   = useRef<Record<string, { x:number; y:number }>>({});
  const benchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    for (const item of items) posRef.current[item.id] = { x:item.x, y:item.y };
  }, [items]);

  const pushReaction = useCallback((rxn: Omit<Reaction,'ts'>) => {
    setReactions(r => [{ ...rxn, ts:Date.now() }, ...r].slice(0,10));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const el = itemEls.current[id];
    if (el) el.style.cursor = 'grabbing';
    const pos = posRef.current[id] ?? { x:0, y:0 };
    dragRef.current = { id, ox:e.clientX-pos.x, oy:e.clientY-pos.y, sx:e.clientX, sy:e.clientY, moved:false };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !benchRef.current) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.sqrt(dx*dx+dy*dy) < 6) return;
    d.moved = true;
    const rect = benchRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(e.clientX - d.ox, rect.width  - 80));
    const ny = Math.max(0, Math.min(e.clientY - d.oy, rect.height - 110));
    posRef.current[d.id] = { x:nx, y:ny };
    const el = itemEls.current[d.id];
    if (el) el.style.transform = `translate(${nx}px, ${ny}px)`;

    // If dragging a stand: move all items snapped to it
    const draggedItem = items.find(i => i.id === d.id);
    if (draggedItem?.kind === 'stand') {
      items.forEach(item => {
        if (item.snappedTo !== d.id) return;
        const clampIdx = item.snappedTo ? getClampIndex(item, items) : -1;
        if (clampIdx < 0) return;
        const off = CLAMP_OFFSETS[clampIdx];
        const snapX = nx + off.dx;
        const snapY = ny + off.dy;
        posRef.current[item.id] = { x:snapX, y:snapY };
        const iel = itemEls.current[item.id];
        if (iel) iel.style.transform = `translate(${snapX}px, ${snapY}px)`;
      });
    }
  }, [items]);

  const onPointerUp = useCallback((e: React.PointerEvent, id: string) => {
    const d = dragRef.current;
    dragRef.current = null;
    const el = itemEls.current[id];
    if (el) el.style.cursor = 'grab';

    if (!d || !d.moved) {
      // tap — add reagent or select
      if (selectedReagent) {
        const chem = selectedReagent;
        const targetItem = items.find(it => it.id === id);
        if (targetItem && targetItem.kind !== 'burner' && targetItem.kind !== 'stand') {
          if (typeof pendo !== 'undefined') {
            pendo.track('reagent_added_to_vessel', {
              reagentId: chem.id,
              reagentName: chem.name,
              reagentFormula: chem.formula,
              reagentType: chem.type,
              reagentCategory: chem.category,
              vesselKind: targetItem.kind,
              vesselLabel: targetItem.label,
              labMode,
              existingReagentsCount: targetItem.reagents.length,
            });
          }
        }
        setItems(prev => prev.map(it => {
          if (it.id !== id) return it;
          if (it.kind === 'burner' || it.kind === 'stand') return it;
          const existing = it.reagents.find(c => c.reagent.id === chem.id);
          let newReagents: VesselReagent[];
          if (existing) {
            newReagents = it.reagents.map(c =>
              c.reagent.id === chem.id ? { ...c, volume:c.volume+15 } : c
            );
          } else {
            newReagents = [...it.reagents, { reagent:chem, volume:15 }];
            for (const ec of it.reagents) {
              const rxn = findReaction(ec.reagent, chem);
              if (rxn) {
                pushReaction({ text:rxn.text, color:rxn.color, effect:rxn.effect });
                if (typeof pendo !== 'undefined') {
                  pendo.track('virtual_lab_reaction_triggered', {
                    reactionText: rxn.text.slice(0, 200),
                    reactionEffect: rxn.effect,
                    reactionColor: rxn.color,
                    labMode,
                    reagent1Id: ec.reagent.id,
                    reagent2Id: chem.id,
                    vesselKind: it.kind,
                  });
                }
                break;
              }
            }
            if (chem.type === 'metal-salt') {
              const flame = FLAME_COLOURS[chem.id];
              if (flame) {
                pushReaction({ text:`🔥 Flame test: ${chem.name} → ${flame.name} flame`, color:flame.color, effect:'flame' });
                setFlameColor(flame.color);
                if (typeof pendo !== 'undefined') {
                  pendo.track('flame_test_performed', {
                    metalSaltId: chem.id,
                    metalSaltName: chem.name,
                    flameColor: flame.color,
                    flameColorName: flame.name,
                    vesselKind: it.kind,
                    labMode,
                  });
                }
              }
            }
          }
          return { ...it, reagents:newReagents };
        }));
        setSelectedReagent(null);
      } else {
        setSelected(prev => prev === id ? null : id);
      }
      return;
    }

    // drag end — commit position + check snap to stand
    const finalPos = posRef.current[id];
    if (!finalPos) return;
    if (el) el.style.transform = '';

    setItems(prev => {
      const dragged = prev.find(i => i.id === id);
      if (!dragged) return prev;

      // Try snapping to a stand if item is snappable
      let snappedTo: string | undefined = undefined;
      if (SNAPPABLE_KINDS.has(dragged.kind)) {
        for (const stand of prev.filter(i => i.kind === 'stand')) {
          const sp = posRef.current[stand.id] ?? { x:stand.x, y:stand.y };
          // Count already-snapped items
          const snapped = prev.filter(i => i.snappedTo === stand.id && i.id !== id);
          if (snapped.length >= CLAMP_OFFSETS.length) continue;
          const clampIdx = snapped.length;
          const off = CLAMP_OFFSETS[clampIdx];
          const tx = sp.x + off.dx, ty = sp.y + off.dy;
          const dist = Math.sqrt((finalPos.x-tx)**2 + (finalPos.y-ty)**2);
          if (dist < SNAP_RADIUS) {
            snappedTo = stand.id;
            // Animate snap
            posRef.current[id] = { x:tx, y:ty };
            if (el) el.style.transform = `translate(${tx}px, ${ty}px)`;
            setTimeout(() => { if (el) el.style.transform = ''; }, 50);
            pushReaction({ text:`🔬 ${dragged.label} clamped to stand — held securely`, color:'#92400E', effect:'none' });
            break;
          }
        }
      }
      // Unsnap if dragged far from stand
      let prevSnap = dragged.snappedTo;
      if (prevSnap && !snappedTo) {
        const sp = posRef.current[prevSnap];
        if (sp) {
          const dist = Math.sqrt((finalPos.x-sp.x)**2 + (finalPos.y-sp.y)**2);
          if (dist > SNAP_RADIUS * 1.5) {
            snappedTo = undefined;
            prevSnap = undefined;
          } else {
            snappedTo = prevSnap; // still close, keep snapped
          }
        }
      }
      const snapPos = snappedTo ? (() => {
        const stand = prev.find(i => i.id === snappedTo);
        const sp = stand ? posRef.current[stand.id] ?? {x:stand.x,y:stand.y} : finalPos;
        const snappedSiblings = prev.filter(i => i.snappedTo === snappedTo && i.id !== id);
        const off = CLAMP_OFFSETS[Math.min(snappedSiblings.length, CLAMP_OFFSETS.length-1)];
        return { x:sp.x+off.dx, y:sp.y+off.dy };
      })() : finalPos;

      return prev.map(it =>
        it.id === id ? { ...it, x:snapPos.x, y:snapPos.y, snappedTo } : it
      );
    });
    e.preventDefault();
  }, [selectedReagent, pushReaction, items]);

  const toggleBurner = (id: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const newOn = !it.burnerOn;
      if (newOn) {
        const burner = it;
        setTimeout(() => {
          setItems(cur => cur.map(v => {
            if (v.kind==='burner'||v.kind==='stand') return v;
            const dx=v.x-burner.x, dy=v.y-burner.y;
            if (Math.sqrt(dx*dx+dy*dy)<130) {
              if (v.reagents.length>0) pushReaction({ text:`🔥 ${v.label} is heating — vapour rising!`, color:'#DC2626', effect:'none' });
              return { ...v, isHeating:newOn, temperature:newOn?100:25 };
            }
            return v;
          }));
        }, 1500);
      }
      return { ...it, burnerOn:newOn };
    }));
  };

  const emptyItem = (id: string) =>
    setItems(prev => prev.map(it => it.id===id ? { ...it, reagents:[], temperature:25, isHeating:false } : it));
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id!==id));
    if (selected===id) setSelected(null);
  };
  const addItem = (kind: LabItem['kind']) => {
    const rect = benchRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width*0.35 + Math.random()*130 : 200;
    const cy = rect ? rect.height*0.25 + Math.random()*120 : 150;
    if (typeof pendo !== 'undefined') {
      const labels: Record<LabItem['kind'], string> = {
        beaker:'Beaker', flask:'Flask', 'test-tube':'Test Tube', burette:'Burette',
        burner:'Bunsen Burner', stand:'Stand', 'petri-dish':'Petri Dish',
        dropper:'Dropper', 'graduated-cylinder':'Grad. Cylinder', 'watch-glass':'Watch Glass',
        'microscope-slide':'Micro Slide',
      };
      pendo.track('virtual_lab_equipment_added', {
        equipmentKind: kind,
        equipmentLabel: labels[kind],
        labMode,
        totalItemsOnBench: items.length + 1,
      });
    }
    setItems(prev => [...prev, makeItem(kind, cx, cy)]);
  };

  const pour = (fromId: string, toId: string) => {
    if (fromId===toId) return;
    const fromItem = items.find(v=>v.id===fromId);
    const toItem = items.find(v=>v.id===toId);
    if (fromItem && toItem) {
      const totalVol = fromItem.reagents.reduce((s,c)=>s+c.volume,0);
      if (typeof pendo !== 'undefined' && totalVol > 0) {
        let hasReaction = false;
        for (const fc of fromItem.reagents)
          for (const tc of toItem.reagents) {
            if (findReaction(fc.reagent, tc.reagent)) { hasReaction = true; break; }
          }
        pendo.track('solution_poured_between_vessels', {
          sourceVesselKind: fromItem.kind,
          sourceVesselLabel: fromItem.label,
          targetVesselKind: toItem.kind,
          targetVesselLabel: toItem.label,
          volumePoured: Math.min(20, totalVol),
          reagentsPoured: fromItem.reagents.length,
          labMode,
          triggeredReaction: hasReaction,
        });
      }
    }
    setItems(prev => {
      const from = prev.find(v=>v.id===fromId), to = prev.find(v=>v.id===toId);
      if (!from||!to) return prev;
      const totalVol = from.reagents.reduce((s,c)=>s+c.volume,0);
      if (totalVol===0) return prev;
      const ratio = Math.min(1, 20/totalVol);
      for (const fc of from.reagents)
        for (const tc of to.reagents) {
          const rxn = findReaction(fc.reagent, tc.reagent);
          if (rxn) {
            pushReaction({ text:rxn.text, color:rxn.color, effect:rxn.effect });
            if (typeof pendo !== 'undefined') {
              pendo.track('virtual_lab_reaction_triggered', {
                reactionText: rxn.text.slice(0, 200),
                reactionEffect: rxn.effect,
                reactionColor: rxn.color,
                labMode,
                reagent1Id: fc.reagent.id,
                reagent2Id: tc.reagent.id,
                vesselKind: to.kind,
              });
            }
            break;
          }
        }
      return prev.map(v => {
        if (v.id===fromId) return { ...v, reagents: v.reagents.map(c=>({...c,volume:c.volume*(1-ratio)})).filter(c=>c.volume>0.5) };
        if (v.id===toId) {
          const merged = [...v.reagents];
          for (const fc of from.reagents) {
            const idx = merged.findIndex(m=>m.reagent.id===fc.reagent.id);
            idx>=0 ? (merged[idx]={...merged[idx],volume:merged[idx].volume+fc.volume*ratio})
                   : merged.push({reagent:fc.reagent,volume:fc.volume*ratio});
          }
          return { ...v, reagents:merged };
        }
        return v;
      });
    });
  };

  const onBenchPointerMove = onPointerMove;
  const selectedItem = items.find(i=>i.id===selected) ?? null;
  const vessels = items.filter(i=>i.kind!=='burner'&&i.kind!=='stand');
  const ph = selectedItem ? mixPh(selectedItem.reagents) : 7;

  const REAGENTS = labMode === 'chemistry' ? CHEM_REAGENTS : BIO_REAGENTS;
  const categories = Array.from(new Set(REAGENTS.map(c=>c.category)));

  const EQUIPMENT: { kind:LabItem['kind']; label:string; emoji:string }[] = labMode === 'chemistry' ? [
    { kind:'beaker',             label:'Beaker',       emoji:'🧪' },
    { kind:'flask',              label:'Flask',         emoji:'⚗️' },
    { kind:'test-tube',          label:'Test Tube',     emoji:'🔬' },
    { kind:'burette',            label:'Burette',       emoji:'📏' },
    { kind:'graduated-cylinder', label:'Grad. Cyl.',    emoji:'🥃' },
    { kind:'watch-glass',        label:'Watch Glass',   emoji:'🫙' },
    { kind:'burner',             label:'Bunsen',        emoji:'🔥' },
    { kind:'stand',              label:'Stand',         emoji:'🏗️' },
  ] : [
    { kind:'petri-dish',         label:'Petri Dish',    emoji:'🧫' },
    { kind:'microscope-slide',   label:'Micro Slide',   emoji:'🔭' },
    { kind:'beaker',             label:'Beaker',        emoji:'🧪' },
    { kind:'test-tube',          label:'Test Tube',     emoji:'🔬' },
    { kind:'dropper',            label:'Dropper',       emoji:'💧' },
    { kind:'watch-glass',        label:'Watch Glass',   emoji:'🫙' },
    { kind:'burner',             label:'Bunsen',        emoji:'🔥' },
    { kind:'stand',              label:'Stand',         emoji:'🏗️' },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background:'#FDFCF9', fontFamily:'Inter,sans-serif' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-2.5 z-20"
        style={{ background:'#fff', borderBottom:'1px solid #E7E5E0' }}>
        <button onClick={()=>setScreen('subject')}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
          style={{ color:'#52796F', background:'#F0F7F3' }}>
          <ArrowLeft size={13}/> Subjects
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{labMode==='chemistry'?'⚗️':'🧬'}</span>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>
              Freeform Virtual Laboratory
            </p>
            <p className="text-xs truncate" style={{ color:'#A8A29E' }}>
              Drag equipment · Snap to stand · Click reagent then vessel
            </p>
          </div>
        </div>
        {/* Mode toggle */}
        <div className="flex shrink-0 rounded-lg overflow-hidden" style={{ border:'1px solid #E7E5E0' }}>
          {(['chemistry','biology'] as const).map(mode => (
            <button key={mode} onClick={()=>{
              if (typeof pendo !== 'undefined' && labMode !== mode) {
                pendo.track('virtual_lab_mode_switched', {
                  newMode: mode,
                  previousMode: labMode,
                });
              }
              setLabMode(mode); setOpenCategory(mode==='chemistry'?'Acids':'Stains'); setSelectedReagent(null);
            }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: labMode===mode ? (mode==='chemistry'?'#FEF3C7':'#DCFCE7') : '#fff',
                color: labMode===mode ? (mode==='chemistry'?'#92400E':'#1B4332') : '#78716C',
              }}>
              {mode==='chemistry' ? <FlaskConical size={11}/> : <Microscope size={11}/>}
              {mode.charAt(0).toUpperCase()+mode.slice(1)}
            </button>
          ))}
        </div>
        {selectedReagent && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
            style={{ background:'#FEF3C7', border:'1px solid #FDE68A', color:'#92400E' }}>
            <span style={{ background:selectedReagent.color, borderRadius:999, width:8, height:8, display:'inline-block' }}/>
            {selectedReagent.formula} — click a vessel
            <button onClick={()=>setSelectedReagent(null)} className="ml-1 opacity-60 hover:opacity-100"><X size={12}/></button>
          </div>
        )}
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* ── LEFT: Equipment + Reagents ────────────────────────── */}
        <aside className="w-44 shrink-0 flex flex-col overflow-y-auto"
          style={{ background:'#FAFAF8', borderRight:'1px solid #E7E5E0' }}>
          <div className="px-2.5 pt-3 pb-2">
            <p className="text-xs font-bold mb-2" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>Equipment</p>
            <div className="grid grid-cols-2 gap-1">
              {EQUIPMENT.map(eq=>(
                <button key={eq.kind+eq.label} onClick={()=>addItem(eq.kind)}
                  className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs transition-all active:scale-95"
                  style={{ background:'#fff', border:'1px solid #E7E5E0', color:'#44403C' }}
                  title={`Add ${eq.label}`}>
                  <span>{eq.emoji}</span>
                  <span style={{ fontSize:10 }}>{eq.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mx-2.5 border-t my-1" style={{ borderColor:'#E7E5E0' }} />
          <div className="px-2.5 pb-3 flex-1">
            <p className="text-xs font-bold mb-1" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>
              {labMode==='chemistry' ? 'Reagents' : 'Biology Reagents'}
            </p>
            <p className="text-xs mb-2" style={{ color:'#A8A29E', fontSize:10 }}>Click to select, then click vessel</p>
            {categories.map(cat=>(
              <div key={cat} className="mb-1">
                <button
                  className="w-full text-left text-xs font-semibold px-1.5 py-1 rounded flex items-center justify-between"
                  style={{ color:'#52796F', background:openCategory===cat?'#F0F7F3':'transparent' }}
                  onClick={()=>setOpenCategory(openCategory===cat?'':cat)}>
                  {cat}
                  <span style={{ transform:openCategory===cat?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s', display:'inline-block', fontSize:10 }}>▾</span>
                </button>
                {openCategory===cat && (
                  <div className="flex flex-col gap-0.5 mt-0.5 ml-1">
                    {REAGENTS.filter(c=>c.category===cat).map(chem=>(
                      <button key={chem.id}
                        onClick={()=>setSelectedReagent(selectedReagent?.id===chem.id?null:chem)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all active:scale-95"
                        style={{
                          background:selectedReagent?.id===chem.id?'#FEF3C7':'#fff',
                          border:selectedReagent?.id===chem.id?'1px solid #F59E0B':'1px solid #E7E5E0',
                        }}>
                        <span className="shrink-0 rounded-full" style={{ width:8,height:8,background:chem.color,display:'inline-block' }}/>
                        <span className="font-bold truncate" style={{ fontSize:10, color:'#1C1917', fontFamily:'Sora,sans-serif' }}>{chem.formula}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* ── CENTER: Lab bench ─────────────────────────────────── */}
        <main
          ref={benchRef}
          className="flex-1 min-w-0 relative overflow-hidden"
          onPointerMove={onBenchPointerMove}
          style={{
            background:`linear-gradient(180deg,
              #D4E8F0 0%, #C8DDE8 30%,
              #B8956A 55%, #A07850 58%,
              #8B6540 60%, #7A5830 62%,
              #C4A882 62%, #BBA070 100%)`,
            cursor:'default', touchAction:'none',
          }}>
          {/* Window */}
          <div className="absolute" style={{ top:0,left:'10%',right:'10%',height:'50%',
            background:'linear-gradient(180deg,#E8F4F8 0%,#C8DDE8 100%)',borderRadius:'0 0 12px 12px',
            border:'6px solid #8B7355',borderTop:'none',opacity:0.8 }}/>
          <div className="absolute" style={{ top:16,left:'26%',right:'26%',height:'38%',
            borderBottom:'3px solid #8B7355',opacity:0.5,pointerEvents:'none' }}/>
          <div className="absolute" style={{ top:16,left:'50%',bottom:'52%',
            width:'3px',background:'#8B7355',opacity:0.5,pointerEvents:'none' }}/>
          {/* Shelf */}
          <div className="absolute" style={{ top:'40%',left:0,right:0,height:8,
            background:'#8B6540',boxShadow:'0 4px 8px rgba(0,0,0,0.25)',zIndex:1 }}/>
          {/* Bench edge */}
          <div className="absolute" style={{ top:'60%',left:0,right:0,height:8,
            background:'#6B4F2A',boxShadow:'0 4px 12px rgba(0,0,0,0.3)',zIndex:1 }}/>
          {/* Wood grain */}
          <div className="absolute" style={{ top:'60%',left:0,right:0,bottom:0,zIndex:0,
            backgroundImage:`repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(0,0,0,0.03) 40px,rgba(0,0,0,0.03) 41px),
              repeating-linear-gradient(180deg,transparent,transparent 8px,rgba(255,255,255,0.04) 8px,rgba(255,255,255,0.04) 9px)` }}/>
          {/* Snap hint text */}
          <div className="absolute top-3 right-4 text-xs opacity-35 pointer-events-none"
            style={{ color:'#44403C' }}>
            Drag near stand to clamp · Click reagent then vessel
          </div>

          {/* Snap radius indicator — shown when dragging snappable item near a stand */}
          {items.map(item => item.kind==='stand' && (
            <div key={`snap-${item.id}`} className="absolute pointer-events-none"
              style={{ left:item.x+25, top:item.y+25, width:SNAP_RADIUS*2, height:SNAP_RADIUS*2,
                marginLeft:-SNAP_RADIUS, marginTop:-SNAP_RADIUS,
                border:'1px dashed rgba(146,64,14,0.20)', borderRadius:'50%', zIndex:5 }}/>
          ))}

          {/* Items */}
          {items.map(item => (
            <div key={item.id}
              ref={el=>{ itemEls.current[item.id]=el; }}
              className="absolute"
              style={{ left:0, top:0, transform:`translate(${item.x}px,${item.y}px)`,
                zIndex: selected===item.id ? 20 : 10,
                cursor:'grab', willChange:'transform', touchAction:'none' }}
              onPointerDown={e=>onPointerDown(e,item.id)}
              onPointerUp={e=>onPointerUp(e,item.id)}>
              {item.kind==='beaker'     && <BeakerSVG reagents={item.reagents} isHeating={item.isHeating}/>}
              {item.kind==='flask'      && <FlaskSVG reagents={item.reagents} isHeating={item.isHeating}/>}
              {item.kind==='test-tube'  && <TestTubeSVG reagents={item.reagents} isHeating={item.isHeating} clamped={!!item.snappedTo}/>}
              {item.kind==='burette'    && <BuretteSVG reagents={item.reagents}/>}
              {item.kind==='graduated-cylinder' && <GraduatedCylinderSVG reagents={item.reagents}/>}
              {item.kind==='petri-dish' && <PetriDishSVG reagents={item.reagents}/>}
              {item.kind==='watch-glass'&& <WatchGlassSVG reagents={item.reagents}/>}
              {item.kind==='microscope-slide' && <MicroscopeSlideSVG reagents={item.reagents}/>}
              {item.kind==='dropper'    && <DroppedCylinderSVG reagents={item.reagents}/>}
              {item.kind==='burner'     && (
                <div onClick={()=>toggleBurner(item.id)} style={{cursor:'pointer'}}>
                  <BunsenBurnerSVG on={!!item.burnerOn} flameColor={flameColor}/>
                </div>
              )}
              {item.kind==='stand' && (
                <LabStandSVG clampedIds={items.filter(i=>i.snappedTo===item.id).map(i=>i.id)}/>
              )}
              {/* Clamp badge */}
              {item.snappedTo && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="text-xs px-1 rounded" style={{ background:'#92400E', color:'#fff', fontSize:8 }}>clamped</span>
                </div>
              )}
              {/* Label */}
              <div className="text-center mt-0.5 font-medium pointer-events-none"
                style={{ fontSize:9, color:'rgba(44,33,0,0.6)', fontFamily:'Inter,sans-serif',
                  textShadow:'0 1px 2px rgba(255,255,255,0.6)' }}>
                {item.label}
              </div>
              {/* Selection ring */}
              {selected===item.id && (
                <div className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{ boxShadow:'0 0 0 2px #F59E0B, 0 0 12px rgba(245,158,11,0.4)' }}/>
              )}
              {/* Reagent drop target highlight */}
              {selectedReagent && item.kind!=='burner' && item.kind!=='stand' && (
                <div className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{ boxShadow:`0 0 0 2px ${selectedReagent.color}, 0 0 16px ${selectedReagent.color}66`,
                    animation:'pulse 1s infinite' }}/>
              )}
            </div>
          ))}

          {/* Gas bubble effect */}
          <AnimatePresence>
            {reactions.slice(0,1).map(r => r.effect==='gas' && (
              <motion.div key={r.ts} className="absolute pointer-events-none"
                style={{ top:'30%', left:'50%', transform:'translateX(-50%)' }}
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
                transition={{duration:0.4}}>
                {['🫧','🫧','🫧'].map((b,i)=>(
                  <span key={i} className="text-2xl" style={{ display:'inline-block', marginLeft:i*8,
                    animation:`float-up ${0.8+i*0.2}s ease-out forwards` }}>{b}</span>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Reaction log */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
            style={{ background:'rgba(28,25,23,0.88)', backdropFilter:'blur(8px)', minHeight:40, zIndex:30 }}>
            <div className="flex items-start gap-3 overflow-x-auto">
              {reactions.length===0 ? (
                <p className="text-xs opacity-40" style={{ color:'#D1D5DB', whiteSpace:'nowrap' }}>
                  Reaction log — mix chemicals or stain samples to observe…
                </p>
              ) : reactions.slice(0,3).map((r,i)=>(
                <motion.span key={r.ts} className="text-xs shrink-0 font-medium"
                  style={{ color:r.color, opacity:1-i*0.25 }}
                  initial={{opacity:0,x:-6}} animate={{opacity:1-i*0.25,x:0}}>
                  {r.text}
                </motion.span>
              ))}
            </div>
          </div>
        </main>

        {/* ── RIGHT: Inspector ──────────────────────────────────── */}
        <aside className="w-52 shrink-0 flex flex-col overflow-y-auto"
          style={{ background:'#FAFAF8', borderLeft:'1px solid #E7E5E0' }}>
          {selectedItem ? (
            <div className="flex flex-col gap-0 h-full">
              <div className="flex items-center justify-between px-3 py-3"
                style={{ borderBottom:'1px solid #E7E5E0' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>{selectedItem.label}</p>
                  <p className="text-xs capitalize" style={{ color:'#A8A29E' }}>{selectedItem.kind.replace('-',' ')}</p>
                  {selectedItem.snappedTo && (
                    <p className="text-xs font-medium" style={{ color:'#92400E' }}>🔧 Clamped to stand</p>
                  )}
                </div>
                <button onClick={()=>removeItem(selectedItem.id)}
                  className="p-1.5 rounded-lg hover:opacity-80"
                  style={{ color:'#DC2626', background:'#FFF5F5', border:'1px solid #FEE2E2' }}>
                  <Trash2 size={12}/>
                </button>
              </div>

              {/* Burner controls */}
              {selectedItem.kind==='burner' && (
                <div className="mx-3 mt-3 p-3 rounded-xl" style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                  <p className="font-bold text-xs mb-2" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>Bunsen Burner</p>
                  <button onClick={()=>toggleBurner(selectedItem.id)}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background:selectedItem.burnerOn?'#FEE2E2':'#F0F7F3',
                      color:selectedItem.burnerOn?'#DC2626':'#16A34A',
                      border:`1px solid ${selectedItem.burnerOn?'#FECDD3':'#BBF7D0'}`, fontFamily:'Sora,sans-serif' }}>
                    {selectedItem.burnerOn?'🔥 Turn Off':'🔥 Ignite Burner'}
                  </button>
                  <p className="text-xs mt-2" style={{ color:'#A8A29E', fontSize:10 }}>
                    {selectedItem.burnerOn?'Heats vessels within 130px':'Click to ignite'}
                  </p>
                  {flameColor && (
                    <div className="mt-2 p-2 rounded-lg" style={{ background:flameColor+'22', border:`1px solid ${flameColor}44` }}>
                      <p className="text-xs font-bold" style={{ color:flameColor, fontFamily:'Sora,sans-serif' }}>Flame colour active</p>
                      <button onClick={()=>setFlameColor(undefined)} className="text-xs opacity-60 hover:opacity-100 mt-0.5" style={{color:'#6B7280'}}>Reset to normal</button>
                    </div>
                  )}
                </div>
              )}

              {/* Stand clamp info */}
              {selectedItem.kind==='stand' && (
                <div className="mx-3 mt-3 p-3 rounded-xl" style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                  <p className="font-bold text-xs mb-1" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>Lab Stand</p>
                  <p className="text-xs" style={{ color:'#A8A29E', fontSize:10 }}>
                    Holds up to 2 items. Drag a test tube, flask, burette or dropper near the stand clamps to snap in place.
                  </p>
                  {items.filter(i=>i.snappedTo===selectedItem.id).length>0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      <p className="text-xs font-semibold" style={{ color:'#92400E' }}>Clamped:</p>
                      {items.filter(i=>i.snappedTo===selectedItem.id).map(ci=>(
                        <p key={ci.id} className="text-xs" style={{ color:'#78716C' }}>• {ci.label}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* pH meter */}
              {selectedItem.kind!=='burner'&&selectedItem.kind!=='stand'&&selectedItem.reagents.length>0 && (
                <div className="mx-3 mt-3 p-3 rounded-xl" style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>pH Meter</span>
                    <span className="font-bold text-lg" style={{ color:phBarColor(ph), fontFamily:'Sora,sans-serif' }}>{ph.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden relative"
                    style={{ background:'linear-gradient(to right,#EF4444,#F97316,#EAB308,#22C55E,#3B82F6,#8B5CF6)' }}>
                    <div className="absolute top-0 w-2.5 h-full rounded-full bg-white border-2 border-gray-400 shadow"
                      style={{ left:`${(ph/14)*100}%`, transform:'translateX(-50%)', transition:'left 0.4s' }}/>
                  </div>
                  <div className="flex justify-between mt-1 text-xs" style={{ color:'#A8A29E', fontSize:10 }}>
                    <span>Acid 0</span><span>Neutral 7</span><span>14 Base</span>
                  </div>
                </div>
              )}

              {/* Temperature */}
              {selectedItem.kind!=='burner'&&selectedItem.kind!=='stand' && (
                <div className="mx-3 mt-2 p-3 rounded-xl" style={{ background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>🌡️ Temperature</span>
                    <span className="font-bold text-sm" style={{ color:selectedItem.isHeating?'#EF4444':'#1C1917', fontFamily:'Sora,sans-serif' }}>
                      {selectedItem.temperature}°C
                    </span>
                  </div>
                  <button
                    onClick={()=>setItems(prev=>prev.map(it=>it.id===selectedItem.id
                      ? {...it,isHeating:!it.isHeating,temperature:!it.isHeating?100:25}:it))}
                    className="w-full py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background:selectedItem.isHeating?'#FEE2E2':'#F0F7F3',
                      color:selectedItem.isHeating?'#DC2626':'#16A34A',
                      border:`1px solid ${selectedItem.isHeating?'#FECDD3':'#BBF7D0'}`, fontFamily:'Sora,sans-serif' }}>
                    {selectedItem.isHeating?'🔥 Stop Heating':'🔥 Heat Vessel'}
                  </button>
                </div>
              )}

              {/* Contents */}
              {selectedItem.kind!=='burner'&&selectedItem.kind!=='stand' && (
                <div className="mx-3 mt-2">
                  <p className="font-bold text-xs mb-1.5" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>
                    Contents ({selectedItem.reagents.reduce((s,c)=>s+c.volume,0).toFixed(0)} mL)
                  </p>
                  {selectedItem.reagents.length===0 ? (
                    <p className="text-xs" style={{ color:'#A8A29E' }}>Empty — click a reagent, then this vessel</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {selectedItem.reagents.map(({reagent,volume})=>(
                        <div key={reagent.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                          style={{ background:'#fff', border:'1px solid #E7E5E0' }}>
                          <span className="shrink-0 rounded-full" style={{ width:8,height:8,background:reagent.color,display:'inline-block' }}/>
                          <span className="font-bold text-xs flex-1 truncate" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>{reagent.formula}</span>
                          <span className="text-xs shrink-0" style={{ color:'#A8A29E' }}>{volume.toFixed(0)}mL</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pour into */}
              {selectedItem.kind!=='burner'&&selectedItem.kind!=='stand'&&selectedItem.reagents.length>0&&vessels.filter(v=>v.id!==selectedItem.id).length>0 && (
                <div className="mx-3 mt-2">
                  <p className="font-bold text-xs mb-1.5" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>Pour into…</p>
                  <div className="flex flex-col gap-1">
                    {vessels.filter(v=>v.id!==selectedItem.id).map(v=>(
                      <button key={v.id} onClick={()=>pour(selectedItem.id,v.id)}
                        className="text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                        style={{ background:'#F0F7F3', border:'1px solid #BBF7D0', color:'#1B4332' }}>
                        → {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.kind!=='burner'&&selectedItem.kind!=='stand' && (
                <div className="mx-3 mt-auto pt-2 mb-3">
                  <button onClick={()=>emptyItem(selectedItem.id)}
                    className="w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-80"
                    style={{ background:'#fff', border:'1px solid #E7E5E0', color:'#78716C' }}>
                    <RotateCcw size={10}/> Empty vessel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="text-3xl mb-3">{labMode==='chemistry'?'⚗️':'🔬'}</div>
              <p className="font-bold text-sm mb-2" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>
                {labMode==='chemistry'?'Chemistry Lab':'Biology Lab'}
              </p>
              <p className="text-xs leading-relaxed" style={{ color:'#A8A29E' }}>
                {labMode==='chemistry'
                  ? 'Add equipment from the left. Select a reagent, then click a vessel to add it. Drag test tubes to the stand to clamp them.'
                  : 'Add a petri dish or slide, select a stain, then click the dish to stain your sample. Drag near the stand to hold upright.'}
              </p>
              <div className="mt-4 p-3 rounded-xl text-left w-full" style={{ background:'#F0F7F3', border:'1px solid #C8E6D4' }}>
                <p className="text-xs font-semibold mb-2" style={{ color:'#1B4332', fontFamily:'Sora,sans-serif' }}>Quick start:</p>
                {(labMode==='chemistry' ? [
                  '1. Add a beaker + stand',
                  '2. Drag test tube near stand to clamp',
                  '3. Select HCl, click vessel',
                  '4. Select NaOH, click same vessel',
                  '5. Neutralisation!',
                ] : [
                  '1. Add petri dish + microscope slide',
                  '2. Select Onion Cells, click dish',
                  '3. Select Iodine, click same dish',
                  '4. Watch the staining reaction!',
                  '5. Add methylene blue to slide',
                ]).map((s,i)=>(
                  <p key={i} className="text-xs" style={{ color:'#52796F' }}>{s}</p>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// Helper: find which clamp index a snapped item occupies
function getClampIndex(item: LabItem, items: LabItem[]): number {
  if (!item.snappedTo) return -1;
  const siblings = items.filter(i => i.snappedTo === item.snappedTo && i.id !== item.id);
  return siblings.length < CLAMP_OFFSETS.length ? siblings.length : 0;
}
