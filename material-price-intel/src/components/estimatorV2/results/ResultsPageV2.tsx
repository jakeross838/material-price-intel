import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { V2EstimateResult } from '@/lib/estimatorV2/types';
import { HeroReveal } from './HeroReveal';
import { OutTheDoorTable } from './OutTheDoorTable';
import { CostBreakdownBars } from './CostBreakdownBars';
import { ScheduleTimeline } from './ScheduleTimeline';
import { AchievementBadges } from './AchievementBadges';
import { UpsellCards } from './UpsellCards';
import { DetailedBreakdown } from './DetailedBreakdown';
import { LeadCaptureFormV2 } from '../LeadCaptureFormV2';
import { FinancingCalculatorV2 } from '../FinancingCalculatorV2';

type Props = {
  estimate: V2EstimateResult;
};

export function ResultsPageV2({ estimate }: Props) {
  const [leadCaptured, setLeadCaptured] = useState(false);
  const midpoint = Math.round((estimate.totalLow + estimate.totalHigh) / 2);

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

      {/* Lead capture form again at bottom if already captured — for sharing */}
      {leadCaptured && (
        <div className="text-center space-y-3 py-8 border-t border-[var(--ev2-border)]">
          <p className="text-sm text-[var(--ev2-text-muted)]">
            Ready to take the next step?
          </p>
          <a
            href="https://calendly.com/rossbuilt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold
              text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)]
              transition-colors shadow-lg shadow-[var(--ev2-gold-glow)]"
          >
            Schedule a Consultation
          </a>
        </div>
      )}
    </div>
  );
}
