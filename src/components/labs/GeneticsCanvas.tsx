import { useState } from 'react';

interface Props { onEvent: (e: string) => void; }

type Allele = 'A' | 'a' | 'B' | 'b';
type CrossType = 'mono' | 'di';

const TRAIT_LABELS: Record<string, string> = { A: 'Round (dom)', a: 'wrinkled (rec)', B: 'Yellow (dom)', b: 'green (rec)' };

function getPunnettMono(p1: string, p2: string): string[][] {
  const a = p1.split(''), b = p2.split('');
  return a.map(ai => b.map(bi => [ai,bi].sort().join('')));
}

function getGenotypeCounts(grid: string[][]): Record<string, number> {
  const counts: Record<string,number> = {};
  grid.flat().forEach(g => { counts[g] = (counts[g] ?? 0) + 1; });
  return counts;
}

function isDominant(g: string) { return /[A-Z]/.test(g[0]) || /[A-Z]/.test(g[1]); }

export default function GeneticsCanvas({ onEvent }: Props) {
  const [crossType, setCrossType] = useState<CrossType>('mono');
  const [p1a, setP1a] = useState<Allele>('A');
  const [p1b, setP1b] = useState<Allele>('a');
  const [p2a, setP2a] = useState<Allele>('A');
  const [p2b, setP2b] = useState<Allele>('a');
  const [shown, setShown] = useState(false);

  const run = () => {
    setShown(true);
    const parent1 = p1a + p1b, parent2 = p2a + p2b;
    const grid = getPunnettMono(parent1, parent2);
    const counts = getGenotypeCounts(grid);
    const domCount = grid.flat().filter(isDominant).length;
    const ratio = `${domCount}:${4 - domCount}`;
    onEvent(`Punnett square set up for ${parent1} × ${parent2} cross — offspring phenotype ratio is ${ratio} dominant:recessive`);
  };

  const reset = () => { setShown(false); };

  const grid = shown ? getPunnettMono(p1a + p1b, p2a + p2b) : null;
  const counts = grid ? getGenotypeCounts(grid) : null;

  const BG_DOM = '#F0F7F3'; const BG_REC = '#FEF3C7';
  const CELL_COLORS = (g: string) => isDominant(g) ? BG_DOM : BG_REC;
  const TEXT_COLOR  = (g: string) => isDominant(g) ? '#166534' : '#92400E';

  return (
    <div className="flex-1 flex flex-col p-5 gap-5 overflow-y-auto" style={{ background: '#FDFCF9' }}>
      {/* Cross type */}
      <div className="flex gap-3 items-center flex-wrap">
        <span className="font-sora font-semibold text-sm" style={{ color: '#1C1917' }}>Cross type:</span>
        {(['mono','di'] as CrossType[]).map(t => (
          <button key={t} onClick={() => { setCrossType(t); setShown(false); }}
            className="px-3 py-1.5 rounded-lg font-inter text-xs font-medium transition-all"
            style={{ background: crossType === t ? '#1B4332' : '#fff', color: crossType === t ? '#fff' : '#52796F', border: '1px solid #E7E5E0' }}>
            {t === 'mono' ? 'Monohybrid (1 trait)' : 'Dihybrid (2 traits)'}
          </button>
        ))}
      </div>

      {/* Parent selectors */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Parent 1', vals: [p1a, p1b] as [Allele,Allele], sets: [setP1a, setP1b] },
          { label: 'Parent 2', vals: [p2a, p2b] as [Allele,Allele], sets: [setP2a, setP2b] },
        ].map(({ label, vals, sets }) => (
          <div key={label} className="lab-card p-4">
            <div className="font-sora font-semibold text-sm mb-3" style={{ color: '#1C1917' }}>{label}</div>
            <div className="flex gap-2">
              {vals.map((v, i) => (
                <select key={i} value={v}
                  onChange={e => { sets[i](e.target.value as Allele); setShown(false); }}
                  className="flex-1 rounded-lg px-2 py-1.5 font-inter text-sm outline-none"
                  style={{ border: '1px solid #E7E5E0', background: '#FAF8F3', color: '#1C1917' }}>
                  {crossType === 'mono'
                    ? ['A','a'].map(a => <option key={a}>{a}</option>)
                    : (i === 0 ? ['A','a'] : ['B','b']).map(a => <option key={a}>{a}</option>)
                  }
                </select>
              ))}
            </div>
            <div className="font-inter text-xs mt-2" style={{ color: '#52796F' }}>
              Genotype: <strong>{vals[0]}{vals[1]}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Run button */}
      <div className="flex gap-3">
        <button onClick={run} className="btn-primary text-sm">Complete Cross →</button>
        <button onClick={reset} className="px-3 py-1.5 rounded-lg text-sm font-sora font-semibold transition-all"
          style={{ border: '1px solid #E7E5E0', color: '#1B4332', background: '#fff' }}>Reset</button>
      </div>

      {/* Punnett grid */}
      {shown && grid && counts && (
        <div className="flex flex-col md:flex-row gap-6 animate-fade-slide-up">
          {/* Grid */}
          <div>
            <div className="font-sora font-semibold text-sm mb-3" style={{ color: '#1C1917' }}>Punnett Square</div>
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `32px repeat(2, 56px)` }}>
              {/* Header row */}
              <div />
              {(p2a + p2b).split('').map((a, i) => (
                <div key={i} className="flex items-center justify-center h-8 font-sora font-bold text-sm rounded"
                  style={{ background: '#F0F7F3', color: '#1B4332' }}>{a}</div>
              ))}
              {/* Data rows */}
              {(p1a + p1b).split('').map((rowA, ri) => (
                <>
                  <div key={`h${ri}`} className="flex items-center justify-center w-8 font-sora font-bold text-sm rounded"
                    style={{ background: '#F0F7F3', color: '#1B4332' }}>{rowA}</div>
                  {grid[ri].map((cell, ci) => (
                    <div key={`c${ri}${ci}`}
                      className="flex items-center justify-center h-12 rounded font-sora font-bold text-base"
                      style={{ background: CELL_COLORS(cell), color: TEXT_COLOR(cell), border: '1px solid #E7E5E0' }}>
                      {cell}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="font-sora font-semibold text-sm mb-3" style={{ color: '#1C1917' }}>Offspring Ratios</div>
            <div className="space-y-2.5">
              {Object.entries(counts).map(([geno, count]) => {
                const pct = (count / 4 * 100).toFixed(0);
                const dom = isDominant(geno);
                return (
                  <div key={geno} className="lab-card p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-sora font-bold text-sm" style={{ color: dom ? '#166534' : '#92400E' }}>{geno}</span>
                      <span className="font-inter text-xs" style={{ color: '#78716C' }}>{count}/4 = {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E7E5E0' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: dom ? '#1B4332' : '#F59E0B' }} />
                    </div>
                    <div className="font-inter text-xs mt-1" style={{ color: '#78716C' }}>
                      {dom ? '● Dominant phenotype' : '○ Recessive phenotype'}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Phenotype ratio */}
            <div className="mt-3 rounded-xl p-3" style={{ background: '#F0F7F3', border: '1px solid #BBF7D0' }}>
              <div className="font-sora font-semibold text-sm" style={{ color: '#1B4332' }}>
                Phenotype ratio: {grid.flat().filter(isDominant).length} dominant : {grid.flat().filter(g => !isDominant(g)).length} recessive
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
