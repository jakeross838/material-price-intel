import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import { fmtCurrency, calculateMonthlyPayment } from '@/lib/estimatorV2/types';

type Props = {
  totalLow: number;
  totalHigh: number;
  sqft: number;
  visible: boolean; // hide on step 0 and results
};

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => fmtCurrency(Math.round(v)));
  const [text, setText] = useState(fmtCurrency(0));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setText(v));
    return unsubscribe;
  }, [display]);

  return <span>{text}</span>;
}

export function RunningTotalBar({ totalLow, totalHigh, sqft, visible }: Props) {
  const [expanded, setExpanded] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  const midpoint = Math.round((totalLow + totalHigh) / 2);
  const monthly = Math.round(calculateMonthlyPayment(midpoint));
  const perSqft = sqft > 0 ? Math.round(midpoint / sqft) : 0;

  return (
    <motion.div
      ref={barRef}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      <div className="bg-[var(--ev2-navy-800)]/95 backdrop-blur-md ev2-animated-border-top">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Expanded details */}
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="py-3 border-b border-[var(--ev2-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
            >
              <div>
                <span className="text-[var(--ev2-text-dim)]">Low Estimate</span>
                <p className="text-[var(--ev2-text)] font-medium tabular-nums mt-0.5">
                  {fmtCurrency(totalLow)}
                </p>
              </div>
              <div>
                <span className="text-[var(--ev2-text-dim)]">High Estimate</span>
                <p className="text-[var(--ev2-text)] font-medium tabular-nums mt-0.5">
                  {fmtCurrency(totalHigh)}
                </p>
              </div>
              <div>
                <span className="text-[var(--ev2-text-dim)]">Per Sqft</span>
                <p className="text-[var(--ev2-text)] font-medium tabular-nums mt-0.5">
                  ${perSqft}/SF
                </p>
              </div>
              <div>
                <span className="text-[var(--ev2-text-dim)]">Est. Monthly</span>
                <p className="text-[var(--ev2-text)] font-medium tabular-nums mt-0.5">
                  {fmtCurrency(monthly)}/mo
                </p>
              </div>
            </motion.div>
          )}

          {/* Main bar */}
          <div className="h-14 flex items-center justify-between">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--ev2-gold)]/15 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-[var(--ev2-gold)]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--ev2-text-dim)] leading-none">
                  Estimated Total
                </p>
                <p className="text-lg font-bold text-[var(--ev2-gold)] tabular-nums leading-tight">
                  <AnimatedNumber value={midpoint} />
                </p>
              </div>
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-[var(--ev2-text-dim)] group-hover:text-[var(--ev2-text-muted)]" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 text-[var(--ev2-text-dim)] group-hover:text-[var(--ev2-text-muted)]" />
              )}
            </button>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-[var(--ev2-text-dim)] leading-none">$/SQFT</p>
                <p className="text-sm font-semibold text-[var(--ev2-text)] tabular-nums leading-tight">
                  ${perSqft}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--ev2-text-dim)] leading-none">EST. MONTHLY</p>
                <p className="text-sm font-semibold text-[var(--ev2-text)] tabular-nums leading-tight">
                  {fmtCurrency(monthly)}<span className="text-[var(--ev2-text-dim)] text-[10px]">/mo</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
