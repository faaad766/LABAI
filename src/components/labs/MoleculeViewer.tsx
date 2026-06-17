// MoleculeViewer — canvas-based 3D rotating ball-and-stick molecular model
// Pure 2D canvas with rotation math (no Three.js). Click to pause/resume.
import { useEffect, useRef, useState } from 'react';

interface Atom { x: number; y: number; z: number; element: string; radius: number; }
interface Bond { a: number; b: number; order: number; }
interface MoleculeData { atoms: Atom[]; bonds: Bond[]; name: string; formula: string; }

// Atom colour palette (CPK)
const ATOM_COLORS: Record<string, string> = {
  H: '#FFFFFF', C: '#404040', N: '#3050F8', O: '#FF0D0D',
  Cl: '#1FF01F', Na: '#AB5CF2', P: '#FF8000', S: '#FFFF30',
  default: '#FF69B4',
};
const ATOM_RADIUS: Record<string, number> = {
  H: 12, C: 16, N: 15, O: 15, Cl: 16, Na: 18, default: 14,
};

// Molecule library
const MOLECULES: Record<string, MoleculeData> = {
  water: {
    name: 'Water', formula: 'H₂O',
    atoms: [
      { x:  0, y:  0,    z:  0, element:'O', radius:15 },
      { x: -1, y: -0.8,  z:  0, element:'H', radius:11 },
      { x:  1, y: -0.8,  z:  0, element:'H', radius:11 },
    ],
    bonds: [{ a:0,b:1,order:1 }, { a:0,b:2,order:1 }],
  },
  hcl: {
    name: 'Hydrogen Chloride', formula: 'HCl',
    atoms: [
      { x: -0.7, y: 0, z: 0, element:'Cl', radius:16 },
      { x:  0.7, y: 0, z: 0, element:'H',  radius:11 },
    ],
    bonds: [{ a:0,b:1,order:1 }],
  },
  naoh: {
    name: 'Sodium Hydroxide', formula: 'NaOH',
    atoms: [
      { x:-1.2, y: 0, z: 0, element:'Na', radius:18 },
      { x: 0,   y: 0, z: 0, element:'O',  radius:15 },
      { x: 1.2, y: 0, z: 0, element:'H',  radius:11 },
    ],
    bonds: [{ a:0,b:1,order:1 }, { a:1,b:2,order:1 }],
  },
  co2: {
    name: 'Carbon Dioxide', formula: 'CO₂',
    atoms: [
      { x:-1.2, y:0, z:0, element:'O', radius:15 },
      { x: 0,   y:0, z:0, element:'C', radius:16 },
      { x: 1.2, y:0, z:0, element:'O', radius:15 },
    ],
    bonds: [{ a:0,b:1,order:2 }, { a:1,b:2,order:2 }],
  },
  ethanol: {
    name: 'Ethanol', formula: 'C₂H₅OH',
    atoms: [
      { x:-1.5, y:  0,    z:0, element:'C', radius:16 },
      { x: 0,   y:  0,    z:0, element:'C', radius:16 },
      { x: 1.2, y:  0.8,  z:0, element:'O', radius:15 },
      { x: 2.2, y:  0.8,  z:0, element:'H', radius:11 },
      { x:-1.5, y:  1.1,  z:0, element:'H', radius:11 },
      { x:-1.5, y: -1.1,  z:0, element:'H', radius:11 },
      { x:-2.5, y:  0,    z:0, element:'H', radius:11 },
      { x: 0,   y:  1.1,  z:0, element:'H', radius:11 },
      { x: 0,   y: -1.1,  z:0, element:'H', radius:11 },
    ],
    bonds: [
      { a:0,b:1,order:1 }, { a:1,b:2,order:1 }, { a:2,b:3,order:1 },
      { a:0,b:4,order:1 }, { a:0,b:5,order:1 }, { a:0,b:6,order:1 },
      { a:1,b:7,order:1 }, { a:1,b:8,order:1 },
    ],
  },
  benzene: {
    name: 'Benzene', formula: 'C₆H₆',
    atoms: [
      ...Array.from({ length: 6 }, (_, i) => ({
        x: Math.cos((i * Math.PI) / 3) * 1.4,
        y: Math.sin((i * Math.PI) / 3) * 1.4,
        z: 0, element: 'C', radius: 16,
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        x: Math.cos((i * Math.PI) / 3) * 2.4,
        y: Math.sin((i * Math.PI) / 3) * 2.4,
        z: 0, element: 'H', radius: 11,
      })),
    ],
    bonds: [
      ...Array.from({ length: 6 }, (_, i) => ({ a: i, b: (i+1)%6, order: i%2===0 ? 2 : 1 })),
      ...Array.from({ length: 6 }, (_, i) => ({ a: i, b: i+6, order: 1 })),
    ],
  },
  glucose: {
    name: 'Glucose', formula: 'C₆H₁₂O₆',
    atoms: [
      { x: 0,    y:  0,   z: 0,   element:'C', radius:16 },
      { x: 1.3,  y:  0.4, z: 0,   element:'C', radius:16 },
      { x: 1.3,  y:  1.8, z: 0,   element:'O', radius:15 },
      { x:-0.3,  y:  2.2, z: 0,   element:'C', radius:16 },
      { x:-1.5,  y:  1.4, z: 0,   element:'C', radius:16 },
      { x:-1.5,  y:  0,   z: 0,   element:'C', radius:16 },
      { x: 0,    y: -1.3, z: 0,   element:'O', radius:15 },
      { x: 2.4,  y: -0.2, z: 0,   element:'O', radius:15 },
      { x:-0.3,  y:  3.5, z: 0,   element:'C', radius:16 },
      { x:-2.7,  y:  2.0, z: 0,   element:'O', radius:15 },
      { x:-2.7,  y: -0.6, z: 0,   element:'O', radius:15 },
    ],
    bonds: [
      { a:0,b:1,order:1 },{ a:1,b:2,order:1 },{ a:2,b:3,order:1 },
      { a:3,b:4,order:1 },{ a:4,b:5,order:1 },{ a:5,b:0,order:1 },
      { a:0,b:6,order:1 },{ a:1,b:7,order:1 },{ a:3,b:8,order:1 },
      { a:4,b:9,order:1 },{ a:5,b:10,order:1 },
    ],
  },
  dna_base: {
    name: 'DNA Base Pair (A–T)', formula: 'Adenine–Thymine',
    atoms: [
      // Adenine ring atoms
      { x:-2,  y:0,   z:0, element:'N', radius:15 },
      { x:-1,  y:1,   z:0, element:'C', radius:16 },
      { x: 0,  y:0.5, z:0, element:'N', radius:15 },
      { x: 0,  y:-0.5,z:0, element:'C', radius:16 },
      { x:-1,  y:-1,  z:0, element:'C', radius:16 },
      { x:-2,  y:-1,  z:0, element:'N', radius:15 },
      // H-bond bridge
      { x: 1,  y:0.5, z:0, element:'H', radius:11 },
      { x: 1,  y:-0.5,z:0, element:'H', radius:11 },
      // Thymine atoms
      { x: 2,  y:0,   z:0, element:'N', radius:15 },
      { x: 3,  y:1,   z:0, element:'C', radius:16 },
      { x: 4,  y:0.5, z:0, element:'O', radius:15 },
      { x: 3,  y:-1,  z:0, element:'C', radius:16 },
      { x: 4,  y:-0.5,z:0, element:'O', radius:15 },
    ],
    bonds: [
      { a:0,b:1,order:1 },{ a:1,b:2,order:2 },{ a:2,b:3,order:1 },
      { a:3,b:4,order:2 },{ a:4,b:5,order:1 },{ a:5,b:0,order:1 },
      { a:2,b:6,order:1 },{ a:3,b:7,order:1 },
      { a:6,b:8,order:1 },{ a:7,b:8,order:1 },
      { a:8,b:9,order:1 },{ a:9,b:10,order:2 },
      { a:8,b:11,order:1 },{ a:11,b:12,order:2 },
      { a:9,b:11,order:1 },
    ],
  },
  nacl: {
    name: 'Sodium Chloride', formula: 'NaCl',
    atoms: [
      { x:-0.8, y:0, z:0, element:'Na', radius:18 },
      { x: 0.8, y:0, z:0, element:'Cl', radius:16 },
    ],
    bonds: [{ a:0,b:1,order:1 }],
  },
};

// Rotation matrix helpers
function rotateY(atoms: Atom[], angle: number): Atom[] {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return atoms.map(a => ({
    ...a,
    x: a.x * cos + a.z * sin,
    z: -a.x * sin + a.z * cos,
  }));
}
function rotateX(atoms: Atom[], angle: number): Atom[] {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  return atoms.map(a => ({
    ...a,
    y: a.y * cos - a.z * sin,
    z: a.y * sin + a.z * cos,
  }));
}

interface Props {
  molecule: keyof typeof MOLECULES;
  size?: number;
  showLabel?: boolean;
}

export default function MoleculeViewer({ molecule: molKey, size = 160, showLabel = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef  = useRef({ y: 0, x: 0.3 });
  const rafRef    = useRef<number>(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const mol = MOLECULES[molKey] ?? MOLECULES.water;
  const scale = size / 6;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width  = size;
    const H = canvas.height = size;
    const cx = W / 2, cy = H / 2;

    function project(a: Atom) {
      const fov = size * 1.2;
      const z = a.z + 4;
      const s = fov / z;
      return { px: cx + a.x * s * scale, py: cy - a.y * s * scale, pz: a.z, s };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      if (!pausedRef.current) {
        angleRef.current.y += 0.012;
      }

      let atoms = rotateY(mol.atoms, angleRef.current.y);
      atoms = rotateX(atoms, angleRef.current.x);

      // Sort by z for painter's algorithm
      const projected = atoms.map((a, i) => ({ ...project(a), element: a.element, radius: a.radius, idx: i }));
      const sorted = [...projected].sort((a, b) => a.pz - b.pz);

      // Draw bonds first
      for (const bond of mol.bonds) {
        const pa = projected[bond.a];
        const pb = projected[bond.b];
        const offset = bond.order > 1 ? 3 : 0;
        for (let o = 0; o < bond.order; o++) {
          const dx = pb.py - pa.py, dy = pa.px - pb.px;
          const len = Math.sqrt(dx*dx + dy*dy) || 1;
          const nx = (dx/len) * offset * (o - (bond.order-1)/2);
          const ny = (dy/len) * offset * (o - (bond.order-1)/2);
          ctx.beginPath();
          ctx.moveTo(pa.px + nx, pa.py + ny);
          ctx.lineTo(pb.px + nx, pb.py + ny);
          ctx.strokeStyle = 'rgba(120,120,120,0.7)';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      }

      // Draw atoms
      for (const a of sorted) {
        const r = (a.radius * a.s * scale) / (size / 6) * 0.7;
        const baseColor = ATOM_COLORS[a.element] ?? ATOM_COLORS.default;
        // Lighting: front lighter, back darker
        const light = Math.max(0.4, Math.min(1, 0.7 + a.pz * 0.15));
        const grad = ctx.createRadialGradient(a.px - r*0.3, a.py - r*0.3, r*0.05, a.px, a.py, r);
        grad.addColorStop(0, `rgba(255,255,255,${light * 0.6})`);
        grad.addColorStop(0.4, baseColor);
        grad.addColorStop(1,   `rgba(0,0,0,0.4)`);
        ctx.beginPath();
        ctx.arc(a.px, a.py, Math.max(3, r), 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Outline
        ctx.strokeStyle = `rgba(0,0,0,${0.2 + light * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Element label for large atoms
        if (r > 9) {
          ctx.fillStyle = a.element === 'H' ? '#555' : '#fff';
          ctx.font = `bold ${Math.round(r * 0.7)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(a.element, a.px, a.py);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [molKey, size, scale]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0F172A 0%,#1E293B 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        title="Click to pause/resume rotation"
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ display:'block', cursor:'pointer' }}
          onClick={() => setPaused(p => !p)}
        />
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background:'rgba(0,0,0,0.6)', color:'rgba(255,255,255,0.8)' }}>
              Paused
            </span>
          </div>
        )}
        {/* Pause hint */}
        {!paused && (
          <div className="absolute bottom-1 right-1.5 text-xs pointer-events-none"
            style={{ color:'rgba(255,255,255,0.3)', fontSize:9 }}>
            click to pause
          </div>
        )}
      </div>
      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-bold" style={{ color:'#1C1917', fontFamily:'Sora,sans-serif' }}>{mol.name}</p>
          <p className="text-xs" style={{ color:'#78716C', fontSize:10 }}>{mol.formula}</p>
        </div>
      )}
    </div>
  );
}

// Re-export molecule keys for convenience
export { MOLECULES };
export type MoleculeKey = keyof typeof MOLECULES;
