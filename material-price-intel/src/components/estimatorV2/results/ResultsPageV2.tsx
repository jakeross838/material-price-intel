import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Download } from 'lucide-react';
import { Link } from 'react-router';
import type { V2EstimateResult } from '@/lib/estimatorV2/types';
import { printEstimate } from '@/lib/estimatorV2/printEstimate';
import { HeroReveal } from './HeroReveal';
import { OutTheDoorTable } from './OutTheDoorTable';
import { CostBreakdownBars } from './CostBreakdownBars';
import { ScheduleTimeline } from './ScheduleTimeline';
import { AchievementBadges } from './AchievementBadges';
import { UpsellCards } from './UpsellCards';
import { DetailedBreakdown } from './DetailedBreakdown';
import { LeadCaptureFormV2 } from '../LeadCaptureFormV2';
import { FinancingCalculatorV2 } from '../FinancingCalculatorV2';
import { ShareEstimateButton } from './ShareEstimateButton';
import { SaveEstimateButton } from './SaveEstimateButton';
import { useSavedEstimates } from '@/hooks/useSavedEstimates';

type Props = {
  estimate: V2EstimateResult;
};

const sectionCascade = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
  }),
};

export function ResultsPageV2({ estimate }: Props) {
  const [leadCaptured, setLeadCaptured] = useState(false);
  const midpoint = Math.round((estimate.totalLow + estimate.totalHigh) / 2);
  const { estimates: savedEstimates } = useSavedEstimates();
  const savedCount = savedEstimates.length;

  return (
    <div className="space-y-12 sm:space-y-16 pb-8">
      {/* Hero: animated counter + headline — always visible */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <HeroReveal estimate={estimate} />
      </motion.div>

      {/* Lead capture form — shown before gate */}
      <AnimatePresence>
        {!leadCaptured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, height: 0, marginTop: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LeadCaptureFormV2
              estimate={estimate}
              onLeadCaptured={() => setLeadCaptured(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gated content: blurred if not captured, full if captured */}
      <div className="relative">
        {!leadCaptured && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-32 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--ev2-navy-900)]/95 border border-[var(--ev2-gold)]/40 shadow-xl pointer-events-auto"
            >
              <Lock className="h-4 w-4 text-[var(--ev2-gold)]" />
              <span className="text-sm font-medium text-[var(--ev2-text)]">
                Enter your info above to unlock the full breakdown
              </span>
            </motion.div>
          </div>
        )}

        <motion.div
          animate={leadCaptured ? { filter: 'blur(0px)', opacity: 1 } : { filter: 'blur(8px)', opacity: 0.6 }}
          transition={{ duration: 0.7 }}
          className={!leadCaptured ? 'pointer-events-none select-none' : ''}
        >
          <div className="space-y-12 sm:space-y-16">
            {/* Out-the-door table */}
            <motion.div variants={sectionCascade} initial="hidden" animate={leadCaptured ? 'show' : 'hidden'} custom={0}>
              <OutTheDoorTable estimate={estimate} />
            </motion.div>

            {/* Cost bars by division */}
            <motion.div variants={sectionCascade} initial="hidden" animate={leadCaptured ? 'show' : 'hidden'} custom={1}>
              <CostBreakdownBars estimate={estimate} />
            </motion.div>

            {/* Financing calculator */}
            <motion.div variants={sectionCascade} initial="hidden" animate={leadCaptured ? 'show' : 'hidden'} custom={2}>
              <FinancingCalculatorV2 outTheDoorMidpoint={midpoint} />
            </motion.div>

            {/* Construction timeline */}
            <motion.div variants={sectionCascade} initial="hidden" animate={leadCaptured ? 'show' : 'hidden'} custom={3}>
              <ScheduleTimeline schedule={estimate.schedule} />
            </motion.div>

            {/* Achievement badges */}
            <motion.div variants={sectionCascade} initial="hidden" animate={leadCaptured ? 'show' : 'hidden'} custom={4}>
              <AchievementBadges achievements={estimate.achievements} />
            </motion.div>

            {/* Upsell suggestions */}
            <motion.div variants={sectionCascade} initial="hidden" animate={leadCaptured ? 'show' : 'hidden'} custom={5}>
              <UpsellCards estimate={estimate} />
            </motion.div>

            {/* Detailed line items */}
            <motion.div variants={sectionCascade} initial="hidden" animate={leadCaptured ? 'show' : 'hidden'} custom={6}>
              <DetailedBreakdown estimate={estimate} />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Actions & CTA — visible after lead capture */}
      {leadCaptured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-center space-y-5 py-8 border-t border-[var(--ev2-border)]"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => printEstimate(estimate)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                border border-[var(--ev2-border)] text-[var(--ev2-text)]
                hover:bg-[var(--ev2-surface-hover)] transition-colors"
            >
              <Download className="h-4 w-4" />
              Save as PDF
            </button>
            <ShareEstimateButton estimate={estimate} />
            <SaveEstimateButton input={estimate.input} />
            <a
              href="https://calendly.com/rossbuilt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold
                text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)]
                transition-colors shadow-lg shadow-[var(--ev2-gold-glow)]"
            >
              Schedule a Consultation
            </a>
          </div>
          {savedCount >= 1 && (
            <Link
              to="/estimate/compare"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
                text-[var(--ev2-gold)] hover:text-[var(--ev2-gold-light)] hover:border-[var(--ev2-gold)]/30
                transition-all duration-200"
            >
              {savedCount >= 2
                ? `Compare ${savedCount} saved estimates`
                : `${savedCount} saved estimate — save another to compare`
              }
              &rarr;
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
