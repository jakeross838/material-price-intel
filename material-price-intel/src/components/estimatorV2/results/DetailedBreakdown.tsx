import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { V2EstimateResult, CsiDivision, V2LineItem } from '@/lib/estimatorV2/types';
import { CSI_DIVISION_LABELS, fmtCurrency } from '@/lib/estimatorV2/types';

type Props = {
  estimate: V2EstimateResult;
};

const DIVISION_ORDER: CsiDivision[] = [
  'sitework', 'foundation', 'framing', 'roofing', 'exterior',
  'doors_windows', 'interior_finishes', 'mechanical', 'electrical',
  'specialties', 'overhead',
];

function DivisionSection({
  division,
  items,
  totalLow,
  totalHigh,
}: {
  division: CsiDivision;
  items: V2LineItem[];
  totalLow: number;
  totalHigh: number;
}) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="border-b border-[var(--ev2-border)] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-[var(--ev2-navy-900)]/50 transition-colors rounded"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={`h-4 w-4 text-[var(--ev2-text-dim)] transition-transform ${open ? 'rotate-180' : ''}`} />
          <span className="text-sm font-semibold text-[var(--ev2-text)]">
            {CSI_DIVISION_LABELS[division]}
          </span>
          <span className="text-[10px] text-[var(--ev2-text-dim)]">
            ({items.length} items)
          </span>
        </div>
        <span className="text-sm font-medium text-[var(--ev2-text-muted)] tabular-nums">
          {fmtCurrency(totalLow)} &ndash; {fmtCurrency(totalHigh)}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-3 pl-7 pr-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[var(--ev2-text-dim)]">
                    <th className="text-left font-medium py-1">Item</th>
                    <th className="text-right font-medium py-1 w-16">Qty</th>
                    <th className="text-right font-medium py-1 w-20">Unit</th>
                    <th className="text-right font-medium py-1 w-32">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--ev2-border)]/50">
                      <td className="py-1.5 text-[var(--ev2-text-muted)] pr-2">{item.displayName}</td>
                      <td className="py-1.5 text-right text-[var(--ev2-text-dim)] tabular-nums">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="py-1.5 text-right text-[var(--ev2-text-dim)]">{item.unit}</td>
                      <td className="py-1.5 text-right text-[var(--ev2-text-muted)] tabular-nums">
                        {fmtCurrency(item.totalLow)} &ndash; {fmtCurrency(item.totalHigh)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DetailedBreakdown({ estimate }: Props) {
  const { ref, isVisible } = useScrollReveal();

  // Group line items by division
  const grouped = new Map<CsiDivision, V2LineItem[]>();
  for (const div of DIVISION_ORDER) {
    grouped.set(div, []);
  }
  for (const item of estimate.lineItems) {
    grouped.get(item.csiDivision)?.push(item);
  }

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-lg font-bold text-[var(--ev2-text)] mb-4">
          Detailed Line Items
        </h3>
        <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] p-3 sm:p-4">
          {DIVISION_ORDER.map((div) => {
            const items = grouped.get(div) ?? [];
            return (
              <DivisionSection
                key={div}
                division={div}
                items={items}
                totalLow={estimate.divisionTotals[div].low}
                totalHigh={estimate.divisionTotals[div].high}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
