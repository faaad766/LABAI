import { AnimatePresence, motion, type Variants } from 'motion/react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import LandingPage from '@/pages/LandingPage';
import SubjectSelectionPage from '@/pages/SubjectSelectionPage';
import ExperimentSelectionPage from '@/pages/ExperimentSelectionPage';
import LabBenchPage from '@/pages/LabBenchPage';
import LabReportPage from '@/pages/LabReportPage';
import QuizPage from '@/pages/QuizPage';
import VirtualLabPage from '@/pages/VirtualLabPage';

const PAGE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] } },
};

function LabApp() {
  const { screen } = useApp();

  return (
    <AnimatePresence mode="wait">
      {screen === 'landing' && (
        <motion.div key="landing" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="min-h-screen">
          <LandingPage />
        </motion.div>
      )}
      {screen === 'subject' && (
        <motion.div key="subject" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="min-h-screen">
          <SubjectSelectionPage />
        </motion.div>
      )}
      {screen === 'selection' && (
        <motion.div key="selection" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="min-h-screen">
          <ExperimentSelectionPage />
        </motion.div>
      )}
      {screen === 'lab' && (
        <motion.div key="lab" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="min-h-screen">
          <LabBenchPage />
        </motion.div>
      )}
      {screen === 'report' && (
        <motion.div key="report" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="min-h-screen">
          <LabReportPage />
        </motion.div>
      )}
      {screen === 'quiz' && (
        <motion.div key="quiz" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="min-h-screen">
          <QuizPage />
        </motion.div>
      )}
      {screen === 'virtual-lab' && (
        <motion.div key="virtual-lab" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="h-screen">
          <VirtualLabPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <LabApp />
    </AppProvider>
  );
}
