import { useState, useRef, useEffect } from 'react';

interface Node { id: number; x: number; y: number; visited: boolean; label: string }
interface Edge { from: number; to: number; active: boolean }

const PRESETS = {
  simple: { nodes: [[100,100],[300,80],[480,130],[390,240],[200,260],[100,200]] as [number,number][], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[1,4],[2,4]] },
  tree: { nodes: [[260,40],[140,120],[380,120],[80,200],[200,200],[320,200],[440,200]] as [number,number][], edges: [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]] },
};

export default function GraphTheoryCanvas({ onEvent }: { onEvent: (e: string) => void }) {
  const [preset, setPreset] = useState<'simple'|'tree'>('simple');
  const [algo, setAlgo] = useState<'bfs'|'dfs'>('bfs');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<number[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initGraph = (p: 'simple'|'tree') => {
    const { nodes: ns, edges: es } = PRESETS[p];
    setNodes(ns.map((pos, i) => ({ id: i, x: pos[0], y: pos[1], visited: false, label: String.fromCharCode(65 + i) })));
    setEdges(es.map(([f, t]) => ({ from: f, to: t, active: false })));
    setStep(0); setPath([]);
  };
  useEffect(() => { initGraph(preset); }, [preset]);

  const runStep = () => {
    const visited = new Set(path);
    if (step === 0 && path.length === 0) {
      setPath([0]);
      onEvent(`${algo.toUpperCase()} started from node A`);
      setStep(1);
      return;
    }
    const adj: Record<number, number[]> = {};
    edges.forEach(e => { adj[e.from] = [...(adj[e.from] ?? []), e.to]; adj[e.to] = [...(adj[e.to] ?? []), e.from]; });
    const queue = algo === 'bfs' ? [...path] : [...path];
    const current = algo === 'bfs' ? queue[0] : queue[queue.length - 1];
    const neighbors = (adj[current] ?? []).filter(n => !visited.has(n));
    if (neighbors.length > 0) {
      const next = neighbors[0];
      const newPath = [...path, next];
      setPath(newPath);
      setEdges(prev => prev.map(e => (e.from === current && e.to === next) || (e.from === next && e.to === current) ? { ...e, active: true } : e));
      onEvent(`${algo.toUpperCase()} step ${step}: visited ${nodes[next]?.label ?? next}. Path: ${newPath.map(n => nodes[n]?.label ?? n).join(' → ')}`);
    } else {
      onEvent(`${algo.toUpperCase()} complete! Visited ${path.length} nodes: ${path.map(n => nodes[n]?.label ?? n).join(' → ')}`);
    }
    setStep(s => s + 1);
  };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    // Edges
    edges.forEach(e => {
      const n1 = nodes[e.from], n2 = nodes[e.to];
      if (!n1 || !n2) return;
      ctx.strokeStyle = e.active ? '#F59E0B' : '#CBD5E1'; ctx.lineWidth = e.active ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
    });
    // Nodes
    nodes.forEach((n, i) => {
      const inPath = path.includes(i);
      ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = i === path[path.length - 1] ? '#F59E0B' : inPath ? '#22C55E' : '#EFF6FF'; ctx.fill();
      ctx.strokeStyle = '#1E3A5F'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 12px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + 5); ctx.textAlign = 'left';
    });
    // Path label
    if (path.length > 0) {
      ctx.fillStyle = '#1C1917'; ctx.font = 'bold 11px Inter,sans-serif';
      ctx.fillText(`${algo.toUpperCase()}: ${path.map(n => nodes[n]?.label).join(' → ')}`, 10, H - 8);
    }
  }, [nodes, edges, path, algo]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const idx = nodes.findIndex(n => Math.hypot(n.x - mx, n.y - my) < 22);
    if (idx >= 0) setDragging(idx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging === null) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setNodes(prev => prev.map((n, i) => i === dragging ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top } : n));
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex gap-2">
        {(['simple','tree'] as const).map(p => (
          <button key={p} onClick={() => { setPreset(p); onEvent(`Graph: ${p}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize"
            style={{ background: preset === p ? '#3B82F6' : '#EFF6FF', color: preset === p ? '#FFF' : '#1E3A5F', border: '1px solid #BFDBFE' }}>
            {p} graph
          </button>
        ))}
        {(['bfs','dfs'] as const).map(a => (
          <button key={a} onClick={() => { setAlgo(a); initGraph(preset); onEvent(`Algorithm: ${a.toUpperCase()}`); }}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase"
            style={{ background: algo === a ? '#F59E0B' : '#FFFBEB', color: algo === a ? '#FFF' : '#92400E', border: '1px solid #FDE68A' }}>
            {a}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={520} height={260} className="w-full rounded-xl cursor-grab"
        style={{ border: '1px solid #BFDBFE', background: '#F8FAFC' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)} />
      <p className="font-inter text-xs text-center" style={{ color: '#A8A29E' }}>Drag nodes to rearrange the graph</p>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[{ l: 'Nodes', v: nodes.length, c: '#3B82F6' }, { l: 'Edges', v: edges.length, c: '#1E3A5F' }, { l: 'Visited', v: path.length, c: '#22C55E' }].map(({ l, v, c }) => (
          <div key={l} className="rounded-xl p-2 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <p className="font-inter" style={{ color: '#52796F' }}>{l}</p>
            <p className="font-sora font-bold text-xl" style={{ color: c }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={runStep} className="flex-1 py-3 rounded-xl text-sm font-sora font-bold"
          style={{ background: '#3B82F6', color: '#FFF' }}>
          → {algo.toUpperCase()} Step {step + 1}
        </button>
        <button onClick={() => initGraph(preset)} className="px-4 py-3 rounded-xl text-sm font-inter"
          style={{ background: '#F5F5F4', color: '#1C1917', border: '1px solid #E7E5E0' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
