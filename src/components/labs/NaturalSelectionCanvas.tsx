import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

const COLORS = ['#22C55E', '#A16207', '#6B7280', '#EF4444', '#1E3A5F'];
const COLOR_NAMES = ['Green', 'Brown', 'Gray', 'Red', 'Blue'];
type Env = 'forest' | 'desert' | 'snow' | 'grass';
const ENV_BG: Record<Env, string> = { forest: '#14532D', desert: '#A16207', snow: '#E2E8F0', grass: '#22C55E' };
const ENV_SURVIVE: Record<Env, number[]> = { forest: [0, 1], desert: [1, 2], snow: [2, 4], grass: [0, 4] };

interface Beetle { id: number; color: number; x: number; y: number; alive: boolean; gen: number }

export default function NaturalSelectionCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [env, setEnv] = useState<Env>('forest');
  const [beetles, setBeetles] = useState<Beetle[]>([]);
  const [generation, setGeneration] = useState(0);
  const [stats, setStats] = useState<Record<number, number>>({});
  const idRef = useRef(0);

  const initPop = (e: Env) => {
    const bs: Beetle[] = Array.from({ length: 30 }, () => ({
      id: idRef.current++,
      color: Math.floor(Math.random() * 5),
      x: Math.random() * 85 + 5,
      y: Math.random() * 80 + 10,
      alive: true, gen: 0,
    }));
    setBeetles(bs); setGeneration(0);
    const s: Record<number, number> = {};
    bs.forEach(b => { s[b.color] = (s[b.color] ?? 0) + 1; });
    setStats(s);
    onEvent(`Initialized population: 30 beetles across 5 color variants in ${e} environment`);
  };

  useEffect(() => { initPop(env); }, [env]);

  const runGeneration = () => {
    setBeetles(prev => {
      const survive = ENV_SURVIVE[env];
      const survivors = prev.map(b => ({ ...b, alive: survive.includes(b.color) || Math.random() > 0.85 }));
      // Reproduce survivors
      const kids: Beetle[] = [];
      survivors.filter(b => b.alive).forEach(b => {
        if (Math.random() > 0.4 && kids.length < 40) {
          kids.push({
            id: idRef.current++,
            color: Math.random() > 0.05 ? b.color : Math.floor(Math.random() * 5),
            x: Math.random() * 85 + 5, y: Math.random() * 80 + 10,
            alive: true, gen: generation + 1,
          });
        }
      });
      const next = [...survivors.filter(b => b.alive), ...kids].slice(0, 50);
      const s: Record<number, number> = {};
      next.forEach(b => { s[b.color] = (s[b.color] ?? 0) + 1; });
      setStats(s);
      const dominant = Object.entries(s).sort((a, b) => b[1] - a[1])[0];
      onEvent(`Generation ${generation + 1}: ${COLOR_NAMES[+dominant[0]]} beetles now dominant (${dominant[1]} individuals). Camouflage survival advantage in ${env} environment.`);
      return next;
    });
    setGeneration(g => g + 1);
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2 flex-wrap">
        {(['forest', 'desert', 'snow', 'grass'] as Env[]).map(e => (
          <button key={e} onClick={() => { setEnv(e); onEvent(`Changed environment to ${e}`); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: env === e ? ENV_BG[e] : '#F5F5F4', color: env === e ? '#FFF' : '#1C1917', border: `1px solid ${env === e ? ENV_BG[e] : '#E7E5E0'}` }}>
            {e}
          </button>
        ))}
      </div>

      {/* Habitat */}
      <div className="relative rounded-xl overflow-hidden" style={{ height: 200, background: ENV_BG[env] }}>
        {beetles.map(b => (
          <motion.div key={b.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
              width: 14, height: 10, borderRadius: '50% 50% 40% 40%',
              background: COLORS[b.color],
              border: '1px solid rgba(255,255,255,0.3)',
              transform: 'translate(-50%,-50%)',
            }} />
        ))}
        <div className="absolute bottom-2 right-2 bg-black/50 rounded-lg px-2 py-1">
          <span className="font-inter text-xs text-white">Gen {generation} · {beetles.length} beetles</span>
        </div>
      </div>

      {/* Color distribution */}
      <div className="flex gap-2 flex-wrap">
        {COLORS.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full" style={{ background: c }} />
            <span className="font-inter text-xs" style={{ color: '#52796F' }}>{COLOR_NAMES[i]}: {stats[i] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={runGeneration} className="flex-1 py-3 rounded-xl text-sm font-sora font-bold"
          style={{ background: ENV_BG[env], color: '#FFF' }}>
          Run Generation {generation + 1} →
        </button>
        <button onClick={() => initPop(env)} className="px-4 py-3 rounded-xl text-sm font-inter"
          style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
