import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Search, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getExperimentsBySubject } from '@/lib/experiments';
import type { ExperimentId, Difficulty } from '@/types';

const DIFF_CONFIG: Record<Difficulty, { label: string; cls: string; sortOrder: number }> = {
  Beginner:     { label: 'Beginner',     cls: 'badge-beginner',     sortOrder: 0 },
  Intermediate: { label: 'Intermediate', cls: 'badge-intermediate', sortOrder: 1 },
  Advanced:     { label: 'Advanced',     cls: 'badge-advanced',     sortOrder: 2 },
};
const DIFF_MINS: Record<Difficulty, string> = {
  Beginner: '15 min', Intermediate: '25 min', Advanced: '35 min',
};

const SUBJECT_META: Record<string, { label: string; emoji: string; color: string; lightBg: string; border: string; tagline: string }> = {
  biology:          { label: 'Biology',          emoji: '🧬', color: '#1B4332', lightBg: '#F0F7F3', border: '#BBF7D0', tagline: 'Life science experiments' },
  chemistry:        { label: 'Chemistry',        emoji: '⚗️', color: '#92400E', lightBg: '#FFFBEB', border: '#FDE68A', tagline: 'Chemical reactions & matter' },
  physics:          { label: 'Physics',          emoji: '⚡', color: '#1E3A5F', lightBg: '#EFF6FF', border: '#BFDBFE', tagline: 'Forces, waves & energy' },
  mathematics:      { label: 'Mathematics',      emoji: '📐', color: '#4C1D95', lightBg: '#F5F3FF', border: '#DDD6FE', tagline: 'Calculus, algebra & proof' },
  'computer-science': { label: 'Computer Science', emoji: '💻', color: '#0C4A6E', lightBg: '#F0F9FF', border: '#BAE6FD', tagline: 'Algorithms, data structures & computation' },
};

const DIFFICULTY_FILTERS: Array<{ label: string; value: Difficulty | 'All' }> = [
  { label: 'All levels', value: 'All' },
  { label: 'Beginner',   value: 'Beginner' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced',  value: 'Advanced' },
];

export default function ExperimentSelectionPage() {
  const { selectedSubject, setScreen, selectExperiment } = useApp();
  const experiments = selectedSubject ? getExperimentsBySubject(selectedSubject) : [];
  const meta = SUBJECT_META[selectedSubject ?? 'biology'];

  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'All'>('All');

  const filtered = useMemo(() => {
    return experiments.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.shortDescription.toLowerCase().includes(search.toLowerCase());
      const matchDiff = diffFilter === 'All' || e.difficulty === diffFilter;
      return matchSearch && matchDiff;
    });
  }, [experiments, search, diffFilter]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!search && diffFilter === 'All') return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      if (typeof pendo !== 'undefined') {
        pendo.track('experiment_search_performed', {
          searchQuery: search,
          difficultyFilter: diffFilter,
          subjectId: selectedSubject ?? '',
          resultsCount: filtered.length,
          totalExperiments: experiments.length,
        });
      }
    }, 500);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [search, diffFilter, filtered.length, experiments.length, selectedSubject]);

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F3' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 md:px-6 py-3"
        style={{ background: 'rgba(250,248,243,0.96)', borderBottom: '1px solid #E7E5E0', backdropFilter: 'blur(8px)' }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setScreen('subject')}
            className="flex items-center gap-1 font-inter text-sm transition-colors shrink-0"
            style={{ color: '#52796F' }}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          {/* Subject pill */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-sora font-semibold text-sm shrink-0"
            style={{ background: meta.lightBg, color: meta.color, border: `1px solid ${meta.border}` }}
          >
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
          </div>
          <span className="font-inter text-xs hidden sm:inline" style={{ color: '#A8A29E' }}>
            {filtered.length} / {experiments.length} experiments
          </span>
        </div>
      </div>

      {/* Page title */}
      <motion.div
        className="max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-sora font-bold mb-1 text-balance" style={{ fontSize: 'clamp(20px, 3vw, 30px)', color: '#1C1917' }}>
          Choose your experiment
        </h1>
        <p className="font-inter text-sm" style={{ color: '#78716C' }}>
          {meta.tagline} — Dr. Lab explains every interaction live
        </p>
      </motion.div>

      {/* Search + filter bar */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-4 flex gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-[180px] rounded-lg px-3 py-2"
          style={{ background: '#FFFFFF', border: '1.5px solid #E7E5E0' }}
        >
          <Search size={14} color="#A8A29E" className="shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search experiments..."
            className="flex-1 min-w-0 text-sm font-inter outline-none bg-transparent"
            style={{ color: '#1C1917' }}
          />
        </div>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 shrink-0"
          style={{ background: '#FFFFFF', border: '1.5px solid #E7E5E0' }}
        >
          <Filter size={13} color="#A8A29E" className="shrink-0" />
          <select
            value={diffFilter}
            onChange={e => setDiffFilter(e.target.value as Difficulty | 'All')}
            className="text-sm font-inter outline-none bg-transparent cursor-pointer"
            style={{ color: '#1C1917' }}
          >
            {DIFFICULTY_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Experiment cards — 2-col grid on desktop */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-inter text-sm" style={{ color: '#A8A29E' }}>No experiments match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filtered.map((exp, i) => {
              const diff = DIFF_CONFIG[exp.difficulty];
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  onClick={() => {
                    if (typeof pendo !== 'undefined') {
                      pendo.track('experiment_selected', {
                        experimentId: exp.id,
                        experimentName: exp.name,
                        subjectId: selectedSubject ?? '',
                        difficulty: exp.difficulty,
                        estimatedDuration: DIFF_MINS[exp.difficulty],
                      });
                    }
                    selectExperiment(exp.id as ExperimentId);
                  }}
                  className="rounded-xl overflow-hidden cursor-pointer group"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E7E5E0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.18s ease',
                  }}
                  whileHover={{
                    y: -2,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                    borderColor: meta.border,
                  }}
                >
                  {/* Colored top strip */}
                  <div className="h-1 w-full" style={{ background: meta.color }} />

                  <div className="p-4 flex gap-3">
                    {/* Emoji icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: meta.lightBg, border: `1px solid ${meta.border}` }}
                    >
                      {exp.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="font-sora font-semibold text-sm leading-tight" style={{ color: '#1C1917' }}>
                          {exp.name}
                        </h2>
                        <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full font-inter text-xs font-medium ${diff.cls}`}>
                          {diff.label}
                        </span>
                      </div>
                      <p className="font-inter text-xs leading-relaxed text-pretty" style={{ color: '#78716C' }}>
                        {exp.shortDescription}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-inter text-xs" style={{ color: '#A8A29E' }}>
                          ⏱ {DIFF_MINS[exp.difficulty]}
                        </span>
                        <span
                          className="font-sora font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: meta.color }}
                        >
                          Start →
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

