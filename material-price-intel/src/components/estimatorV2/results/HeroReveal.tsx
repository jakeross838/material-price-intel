import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { V2EstimateResult } from '@/lib/estimatorV2/types';
import { fmtCurrency } from '@/lib/estimatorV2/types';

type Props = {
  estimate: V2EstimateResult;
};

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => fmtCurrency(Math.round(v)));
  const [text, setText] = useState(fmtCurrency(0));

  useEffect(() => {
    spring.set(value);
    const unsub = display.on('change', (v) => setText(v));
    return unsub;
  }, [value, spring, display]);

  return <span>{text}</span>;
}

export function HeroReveal({ estimate }: Props) {
  const midpoint = Math.round((estimate.totalLow + estimate.totalHigh) / 2);
  const prefersReducedMotion = useReducedMotion();
  const confettiFired = useRef(false);

  // Fire confetti burst when hero animates in
  useEffect(() => {
    if (confettiFired.current || prefersReducedMotion) return;
    confettiFired.current = true;
    const timer = setTimeout(() => {
      const white = '#ffffff';
      const blue = '#5b8497';
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [white, blue, '#e8eff3', '#b0c4ce'],
        disableForReducedMotion: true,
      });
    }, 2000); // Fire after counter animation
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="text-center py-12 sm:py-20"
    >
      {/* Headline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-xs sm:text-sm text-[var(--ev2-gold)] font-semibold uppercase tracking-[0.2em] mb-4"
      >
        Your Custom Home Estimate
      </motion.p>

      {/* Big animated number */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        className="mb-4 relative"
      >
        <div className="ev2-hero-glow" />
        <p className="text-5xl sm:text-7xl font-bold tabular-nums leading-none ev2-gradient-text relative">
          <AnimatedCounter value={midpoint} duration={2.5} />
        </p>
      </motion.div>

      {/* Range */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="space-y-2"
      >
        <p className="text-sm text-[var(--ev2-text-muted)]">
          Range: {fmtCurrency(estimate.totalLow)} &ndash; {fmtCurrency(estimate.totalHigh)}
        </p>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <span className="text-[var(--ev2-gold)] font-bold tabular-nums">
              ${estimate.perSqftLow} - ${estimate.perSqftHigh}
            </span>
            <span className="text-[var(--ev2-text-dim)] ml-1">/SF</span>
          </div>
          <div className="w-px h-4 bg-[var(--ev2-border)]" />
          <div className="text-center">
            <span className="text-[var(--ev2-gold)] font-bold tabular-nums">
              ${estimate.monthlyLow.toLocaleString()} - ${estimate.monthlyHigh.toLocaleString()}
            </span>
            <span className="text-[var(--ev2-text-dim)] ml-1">/mo</span>
          </div>
        </div>
      </motion.div>

      {/* Location badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ev2-surface)] border border-[var(--ev2-border)] shadow-[0_0_20px_rgba(91,132,151,0.08)]"
      >
        <span className="text-xs text-[var(--ev2-text-dim)]">
          {estimate.input.sqft.toLocaleString()} SF &bull;{' '}
          {estimate.input.stories} Story &bull;{' '}
          {estimate.input.bedrooms} Bed / {estimate.input.bathrooms} Bath &bull;{' '}
          {estimate.locationName}
          {estimate.input.lotAddress && (
            <> &bull; {estimate.input.lotAddress}</>
          )}
        </span>
      </motion.div>
    </motion.div>
  );
}
