import { motion } from 'motion/react';
import { useApp } from '@/contexts/AppContext';
import { Download, FlaskConical } from 'lucide-react';

const GRADE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  A: { color: '#166534', bg: '#DCFCE7', border: '#86EFAC', label: 'Excellent' },
  B: { color: '#1B4332', bg: '#F0F7F3', border: '#BBF7D0', label: 'Good' },
  C: { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', label: 'Satisfactory' },
  D: { color: '#9F1239', bg: '#FFE4E6', border: '#FECDD3', label: 'Needs Improvement' },
};

interface ReportSection { title: string; content: string; icon: string; }

export default function LabReportPage() {
  const { labReport, setScreen } = useApp();

  if (!labReport) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F3' }}>
        <p className="font-inter text-sm" style={{ color: '#A8A29E' }}>
          No report data. Please complete an experiment first.
        </p>
      </div>
    );
  }

  const grade = labReport.grade?.toUpperCase() || 'B';
  const gc = GRADE_CONFIG[grade] ?? GRADE_CONFIG['B'];

  const sections: ReportSection[] = [
    { title: 'Objective',     icon: '🎯', content: labReport.objective },
    { title: 'Observations',  icon: '👁️', content: labReport.observations },
    { title: 'Analysis',      icon: '🔬', content: labReport.analysis },
    { title: 'Conclusion',    icon: '✅', content: labReport.conclusion },
  ];

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: '#FAF8F3' }}>
      {/* Print header */}
      <div className="hidden print-only mb-8">
        <h1 className="text-2xl font-bold text-black">LabAI — Virtual Lab Report</h1>
        <p className="text-gray-600">{labReport.experimentName} · {labReport.date}</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 no-print"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#F0F7F3', border: '1px solid #BBF7D0' }}
              >
                <FlaskConical size={18} color="#1B4332" />
              </div>
              <h1 className="font-sora font-bold text-2xl" style={{ color: '#1C1917' }}>Lab Report</h1>
            </div>
            <p className="font-inter text-sm" style={{ color: '#78716C' }}>
              {labReport.experimentName} · {labReport.date}
            </p>
          </div>

          {/* Grade badge */}
          <motion.div
            className="flex flex-col items-center shrink-0"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            <div
              className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
              style={{
                background: gc.bg,
                border: `2px solid ${gc.border}`,
              }}
            >
              <span className="font-sora font-bold" style={{ fontSize: 52, lineHeight: 1, color: gc.color }}>
                {grade}
              </span>
            </div>
            <span className="font-inter text-xs mt-1.5 font-medium" style={{ color: gc.color }}>{gc.label}</span>
          </motion.div>
        </motion.div>

        {/* Four report cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              className="lab-card p-6 h-full flex flex-col"
              style={{ borderLeft: '3px solid #1B4332' }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span style={{ fontSize: 18 }}>{section.icon}</span>
                <h2 className="font-sora font-bold text-base" style={{ color: '#1C1917' }}>{section.title}</h2>
              </div>
              <p className="font-inter text-sm leading-relaxed text-pretty flex-1" style={{ color: '#57534E' }}>
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer actions */}
        <motion.div
          className="lab-card p-5 flex flex-col md:flex-row items-center justify-between gap-4 no-print"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center md:text-left">
            <p className="font-inter text-xs mb-0.5" style={{ color: '#A8A29E' }}>Generated by LabAI</p>
            <p className="font-inter text-sm" style={{ color: '#57534E' }}>
              <span className="font-semibold" style={{ color: '#1B4332' }}>{labReport.experimentName}</span>
              {' · '}Grade: <span className="font-semibold" style={{ color: gc.color }}>{grade}</span>
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-inter text-sm font-medium transition-all"
              style={{ background: '#FAF8F3', border: '1px solid #E7E5E0', color: '#57534E' }}
            >
              <Download size={15} />
              Download PDF
            </button>
            <button
              onClick={() => setScreen('subject')}
              className="btn-primary"
            >
              Try Another Experiment →
            </button>
          </div>
        </motion.div>

        {/* Print-only grade */}
        <div className="hidden print-only mt-6">
          <div style={{ border: `2px solid ${gc.color}`, borderRadius: 8, padding: 16, display: 'inline-block' }}>
            <p style={{ fontSize: 48, fontWeight: 700, color: gc.color, margin: 0 }}>{grade}</p>
            <p style={{ color: '#333', margin: 0 }}>{gc.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
