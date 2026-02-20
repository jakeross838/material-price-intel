import { useState } from 'react';
import { motion } from 'framer-motion';
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

export function ResultsPageV2({ estimate }: Props) {
  const [leadCaptured, setLeadCaptured] = useState(false);
  const midpoint = Math.round((estimate.totalLow + estimate.totalHigh) / 2);
  const { estimates: savedEstimates } = useSavedEstimates();
  const savedCount = savedEstimates.length;

  return (
    <div className="space-y-12 sm:space-y-16 pb-8">
      {/* Hero: animated counter + headline — always visible */}
      <HeroReveal estimate={estimate} />

      {/* Lead capture form — shown before gate */}
      {!leadCaptured && (
        <LeadCaptureFormV2
          estimate={estimate}
          onLeadCaptured={() => setLeadCaptured(true)}
        />
      )}

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

        <div
          className={`transition-all duration-700 ${
            leadCaptured
              ? 'filter-none'
              : 'blur-md opacity-60 pointer-events-none select-none'
          }`}
        >
          <div className="space-y-12 sm:space-y-16">
            {/* Out-the-door table */}
            <OutTheDoorTable estimate={estimate} />

            {/* Cost bars by division */}
            <CostBreakdownBars estimate={estimate} />

            {/* Financing calculator */}
            <FinancingCalculatorV2 outTheDoorMidpoint={midpoint} />

            {/* Construction timeline */}
            <ScheduleTimeline schedule={estimate.schedule} />

            {/* Achievement badges */}
            <AchievementBadges achievements={estimate.achievements} />

            {/* Upsell suggestions */}
            <UpsellCards estimate={estimate} />

            {/* Detailed line items */}
            <DetailedBreakdown estimate={estimate} />
          </div>
        </div>
      </div>

      {/* Actions & CTA — visible after lead capture */}
      {leadCaptured && (
        <div className="text-center space-y-5 py-8 border-t border-[var(--ev2-border)]">
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
        </div>
      )}
    </div>
  );
}
