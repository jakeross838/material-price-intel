import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { V2EstimateResult, FinishTier, EstimatorV2Input } from '@/lib/estimatorV2/types';
import { FINISH_TIER_LABELS, calculateMonthlyPayment, fmtCompact, fmtCurrency } from '@/lib/estimatorV2/types';
import { calculateV2Estimate } from '@/lib/estimatorV2/calculator';

type Props = {
  estimate: V2EstimateResult;
};

type UpsellOption = {
  title: string;
  description: string;
  additionalCost: number;
  monthlyImpact: number;
};

function generateUpsells(estimate: V2EstimateResult): UpsellOption[] {
  const input = estimate.input;
  const upsells: UpsellOption[] = [];

  // Suggest upgrading finish level
  const tierUpgrade: Record<FinishTier, FinishTier | null> = {
    builder: 'standard',
    standard: 'premium',
    premium: 'luxury',
    luxury: null,
  };
  const nextTier = tierUpgrade[input.finishLevel];
  if (nextTier) {
    const upgraded: EstimatorV2Input = { ...input, finishLevel: nextTier };
    const upgradedEstimate = calculateV2Estimate(upgraded);
    const midDiff = Math.round(
      ((upgradedEstimate.totalLow + upgradedEstimate.totalHigh) / 2) -
      ((estimate.totalLow + estimate.totalHigh) / 2)
    );
    if (midDiff > 0) {
      upsells.push({
        title: `Upgrade to ${FINISH_TIER_LABELS[nextTier]}`,
        description: `Elevate all finishes to ${FINISH_TIER_LABELS[nextTier].toLowerCase()} grade for a noticeably more refined result.`,
        additionalCost: midDiff,
        monthlyImpact: Math.round(calculateMonthlyPayment(midDiff)),
      });
    }
  }

  // Suggest pool if not added
  if (input.pool === 'none') {
    upsells.push({
      title: 'Add a Pool',
      description: 'A gunite pool with custom finishes — the centerpiece of Florida outdoor living.',
      additionalCost: 80000,
      monthlyImpact: Math.round(calculateMonthlyPayment(80000)),
    });
  }

  // Suggest outdoor kitchen if not added
  if (!input.outdoorKitchen) {
    upsells.push({
      title: 'Outdoor Kitchen',
      description: 'Built-in grill, countertops, and refrigeration for the ultimate entertaining space.',
      additionalCost: 35000,
      monthlyImpact: Math.round(calculateMonthlyPayment(35000)),
    });
  }

  // Suggest smart home if basic or none
  if (input.smartHome === 'none' || input.smartHome === 'basic') {
    upsells.push({
      title: 'Full Smart Home',
      description: 'Automated lighting, climate, security, and whole-home audio with one-touch control.',
      additionalCost: 30000,
      monthlyImpact: Math.round(calculateMonthlyPayment(30000)),
    });
  }

  return upsells.slice(0, 3);
}

export function UpsellCards({ estimate }: Props) {
  const { ref, isVisible } = useScrollReveal();
  const upsells = generateUpsells(estimate);

  if (upsells.length === 0) return null;

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[var(--ev2-gold)]" />
          <h3 className="text-lg font-bold text-[var(--ev2-text)]">
            What More Gets You
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {upsells.map((upsell, i) => (
            <motion.div
              key={upsell.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] p-4 hover:border-[var(--ev2-gold)]/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-bold text-[var(--ev2-text)]">{upsell.title}</p>
                <ArrowUpRight className="h-4 w-4 text-[var(--ev2-gold)] shrink-0" />
              </div>
              <p className="text-xs text-[var(--ev2-text-muted)] leading-relaxed mb-3">
                {upsell.description}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[var(--ev2-gold)] tabular-nums">
                  {fmtCompact(upsell.additionalCost)}
                </span>
                <span className="text-[10px] text-[var(--ev2-text-dim)]">
                  +${upsell.monthlyImpact.toLocaleString()}/mo
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
