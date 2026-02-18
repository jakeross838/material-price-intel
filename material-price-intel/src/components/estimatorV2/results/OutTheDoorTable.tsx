import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { V2EstimateResult } from '@/lib/estimatorV2/types';
import { fmtCurrency } from '@/lib/estimatorV2/types';

type Props = {
  estimate: V2EstimateResult;
};

function Row({
  label,
  low,
  high,
  note,
  bold,
  gold,
}: {
  label: string;
  low: number;
  high: number;
  note?: string;
  bold?: boolean;
  gold?: boolean;
}) {
  const cls = bold
    ? 'text-base font-bold'
    : 'text-sm font-medium';
  const textCls = gold
    ? 'text-[var(--ev2-gold)]'
    : 'text-[var(--ev2-text)]';

  return (
    <div className={`flex items-center justify-between py-3 ${
      bold ? 'border-t-2 border-[var(--ev2-gold)]/30 pt-4 mt-1' : ''
    }`}>
      <div>
        <span className={`${cls} ${textCls}`}>{label}</span>
        {note && <span className="text-[10px] text-[var(--ev2-text-dim)] ml-2">({note})</span>}
      </div>
      <span className={`${cls} ${textCls} tabular-nums`}>
        {fmtCurrency(low)} &ndash; {fmtCurrency(high)}
      </span>
    </div>
  );
}

export function OutTheDoorTable({ estimate }: Props) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-lg font-bold text-[var(--ev2-text)] mb-4">
          Out-the-Door Breakdown
        </h3>
        <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] p-5 sm:p-6 divide-y divide-[var(--ev2-border)]">
          <Row label="Base Construction" low={estimate.baseLow} high={estimate.baseHigh} />
          <Row
            label="Builder Fee"
            low={estimate.builderFeeLow}
            high={estimate.builderFeeHigh}
            note={`${Math.round(estimate.builderFeePercent * 100)}%`}
          />
          <Row
            label="Sales Tax"
            low={estimate.taxLow}
            high={estimate.taxHigh}
            note={`${(estimate.taxRate * 100).toFixed(0)}% on materials`}
          />
          <Row
            label="Permits & Impact Fees"
            low={estimate.permitLow}
            high={estimate.permitHigh}
            note={`${(estimate.permitRate * 100).toFixed(1)}%`}
          />
          <Row
            label="Builder's Risk Insurance"
            low={estimate.insuranceLow}
            high={estimate.insuranceHigh}
            note={`${(estimate.insuranceRate * 100).toFixed(1)}%`}
          />
          <Row
            label="Total Estimate"
            low={estimate.totalLow}
            high={estimate.totalHigh}
            bold
            gold
          />
        </div>
      </motion.div>
    </div>
  );
}
