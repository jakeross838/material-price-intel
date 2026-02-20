import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { V2EstimateResult, CsiDivision } from '@/lib/estimatorV2/types';
import { CSI_DIVISION_LABELS, fmtCompact } from '@/lib/estimatorV2/types';

type Props = {
  estimate: V2EstimateResult;
};

const DIVISION_ORDER: CsiDivision[] = [
  'foundation', 'framing', 'roofing', 'exterior', 'doors_windows',
  'interior_finishes', 'mechanical', 'electrical', 'specialties',
  'sitework', 'overhead',
];

export function CostBreakdownBars({ estimate }: Props) {
  const { ref, isVisible } = useScrollReveal();

  // Find max for scaling
  const entries = DIVISION_ORDER.map((div) => ({
    division: div,
    label: CSI_DIVISION_LABELS[div],
    midpoint: Math.round((estimate.divisionTotals[div].low + estimate.divisionTotals[div].high) / 2),
    low: estimate.divisionTotals[div].low,
    high: estimate.divisionTotals[div].high,
  })).filter((e) => e.midpoint > 0);

  const maxValue = Math.max(...entries.map((e) => e.high));

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-lg font-bold text-[var(--ev2-text)] mb-4">
          Cost by Division
        </h3>
        <div className="space-y-3">
          {entries.map((entry, i) => {
            const widthPercent = maxValue > 0 ? (entry.high / maxValue) * 100 : 0;
            return (
              <div key={entry.division}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--ev2-text-muted)]">
                    {entry.label}
                  </span>
                  <span className="text-xs text-[var(--ev2-text-dim)] tabular-nums">
                    {fmtCompact(entry.low)} &ndash; {fmtCompact(entry.high)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[var(--ev2-navy-800)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--ev2-blue)]/60 via-[var(--ev2-gold)]/70 to-[var(--ev2-gold)]"
                    initial={{ width: 0 }}
                    animate={isVisible ? { width: `${widthPercent}%` } : { width: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
