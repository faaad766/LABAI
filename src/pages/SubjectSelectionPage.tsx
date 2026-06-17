import { useState } from 'react';
import { motion } from 'motion/react';
import { FlaskConical, Microscope, Zap, Calculator, TestTubeDiagonal, Code, ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import type { SubjectId } from '@/types';

const SUBJECTS = [
  {
    id: 'biology' as SubjectId, label: 'Biology', icon: Microscope, count: 30, available: true,
    emoji: '🧬', tagline: 'Cells, genetics & life systems',
    accentColor: '#1B4332', accentLight: '#F0F7F3', accentBorder: '#BBF7D0',
    badgeBg: '#DCFCE7', badgeText: '#166534',
  },
  {
    id: 'chemistry' as SubjectId, label: 'Chemistry', icon: FlaskConical, count: 30, available: true,
    emoji: '⚗️', tagline: 'Reactions, bonds & matter',
    accentColor: '#92400E', accentLight: '#FFFBEB', accentBorder: '#FDE68A',
    badgeBg: '#FEF3C7', badgeText: '#78350F',
  },
  {
    id: 'physics' as SubjectId, label: 'Physics', icon: Zap, count: 30, available: true,
    emoji: '⚡', tagline: 'Forces, waves & energy',
    accentColor: '#1E3A5F', accentLight: '#EFF6FF', accentBorder: '#BFDBFE',
    badgeBg: '#DBEAFE', badgeText: '#1E40AF',
  },
  {
    id: 'mathematics' as SubjectId, label: 'Mathematics', icon: Calculator, count: 30, available: true,
    emoji: '📐', tagline: 'Calculus, algebra & proof',
    accentColor: '#4C1D95', accentLight: '#F5F3FF', accentBorder: '#DDD6FE',
    badgeBg: '#EDE9FE', badgeText: '#5B21B6',
  },
  {
    id: 'computer-science' as SubjectId, label: 'Computer Science', icon: Code, count: 10, available: true,
    emoji: '💻', tagline: 'Algorithms, data structures & computation',
    accentColor: '#0C4A6E', accentLight: '#F0F9FF', accentBorder: '#BAE6FD',
    badgeBg: '#E0F2FE', badgeText: '#0369A1',
    isNew: true,
  },
  {
    id: 'virtual-lab' as SubjectId, label: '3D Virtual Lab', icon: TestTubeDiagonal, count: null, available: true,
    emoji: '🧪', tagline: 'Drag-drop glassware · Mix chemicals · Live reactions',
    accentColor: '#0F4C75', accentLight: '#F0F9FF', accentBorder: '#BAE6FD',
    badgeBg: '#E0F2FE', badgeText: '#0369A1',
    isSpecial: true,
  },
];

export default function SubjectSelectionPage() {
  const { setScreen, selectSubject } = useApp();
  const [hovered, setHovered] = useState<SubjectId | null>(null);

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F3' }}>
      {/* Top bar */}
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-1 flex items-center gap-3">
        <button
          onClick={() => setScreen('landing')}
          className="flex items-center gap-1.5 text-sm font-inter transition-colors"
          style={{ color: '#52796F' }}
        >
          <ArrowLeft size={14} />
          Home
        </button>
      </div>

      {/* Header */}
      <motion.div
        className="max-w-3xl mx-auto px-5 pt-6 pb-8 text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className="font-sora font-bold mb-2 text-balance" style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', color: '#1C1917' }}>
          What are you studying today?
        </h1>
        <p className="font-inter text-sm" style={{ color: '#78716C' }}>
          Pick a subject — Dr. Lab will guide you through every experiment
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto px-5 pb-16">
        {/* 2×3 grid for core subjects (including CS) */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          {SUBJECTS.filter(s => !('isSpecial' in s && s.isSpecial)).map((s, i) => {
            const Icon = s.icon;
            const isHov = hovered === s.id;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: i * 0.06 }}
                onClick={() => {
                  if (typeof pendo !== 'undefined') {
                    pendo.track('subject_selected', {
                      subjectId: s.id,
                      subjectName: s.label,
                      experimentCount: s.count,
                    });
                  }
                  selectSubject(s.id);
                }}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-xl p-4 md:p-5 flex flex-col gap-2.5 cursor-pointer select-none"
                style={{
                  background: isHov ? s.accentLight : '#FFFFFF',
                  border: `1.5px solid ${isHov ? s.accentBorder : '#E7E5E0'}`,
                  boxShadow: isHov ? `0 4px 16px rgba(0,0,0,0.08)` : '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: s.accentLight, border: `1px solid ${s.accentBorder}` }}>
                    <Icon size={17} color={s.accentColor} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {'isNew' in s && s.isNew && (
                      <span className="px-1.5 py-0.5 rounded-full font-inter text-xs font-semibold shrink-0"
                        style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                        New ✨
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full font-inter text-xs font-semibold shrink-0"
                      style={{ background: s.badgeBg, color: s.badgeText }}>
                      {s.count} experiments
                    </span>
                  </div>
                </div>
                <div>
                  <h2 className="font-sora font-bold text-sm md:text-base leading-tight" style={{ color: '#1C1917' }}>
                    {s.label}
                  </h2>
                  <p className="font-inter text-xs mt-0.5 leading-snug" style={{ color: '#78716C' }}>{s.tagline}</p>
                </div>
                <div className="flex items-center gap-1 font-sora font-semibold text-xs mt-0.5"
                  style={{ color: s.accentColor }}>
                  Explore →
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full-width 3D Virtual Lab card */}
        {SUBJECTS.filter(s => 'isSpecial' in s && s.isSpecial).map((s, i) => {
          const Icon = s.icon;
          const isHov = hovered === s.id;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: (i + 4) * 0.06 }}
              onClick={() => {
                if (typeof pendo !== 'undefined') {
                  pendo.track('subject_selected', {
                    subjectId: s.id,
                    subjectName: s.label,
                    experimentCount: s.count,
                  });
                }
                selectSubject(s.id);
              }}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              className="rounded-xl p-4 md:p-5 cursor-pointer select-none flex items-center gap-4"
              style={{
                background: isHov ? s.accentLight : '#FFFFFF',
                border: `1.5px solid ${isHov ? s.accentBorder : '#E7E5E0'}`,
                boxShadow: isHov ? `0 4px 20px rgba(0,0,0,0.1)` : '0 1px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Large emoji */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-3xl"
                style={{ background: s.accentLight, border: `1.5px solid ${s.accentBorder}` }}>
                {s.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-sora font-bold text-base leading-tight" style={{ color: '#1C1917' }}>
                    {s.label}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full font-inter text-xs font-semibold"
                    style={{ background: s.badgeBg, color: s.badgeText }}>
                    New ✨
                  </span>
                </div>
                <p className="font-inter text-xs leading-snug" style={{ color: '#78716C' }}>{s.tagline}</p>
                <div className="flex items-center gap-3 mt-2">
                  {['⚗️ Mix solutions', '🔥 Heat & react', '🧫 Bio experiments'].map(tag => (
                    <span key={tag} className="font-inter text-xs px-2 py-0.5 rounded-full"
                      style={{ background: s.accentLight, color: s.accentColor, border: `1px solid ${s.accentBorder}` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1 font-sora font-bold text-sm"
                style={{ color: s.accentColor }}>
                Open Lab →
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
