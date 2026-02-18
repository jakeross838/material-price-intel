import { motion } from 'framer-motion';
import { Home, Palette, Sofa, Sparkles, BarChart3 } from 'lucide-react';

const STEPS = [
  { label: 'Home Basics', icon: Home },
  { label: 'Style & Exterior', icon: Palette },
  { label: 'Interior', icon: Sofa },
  { label: 'Features', icon: Sparkles },
  { label: 'Results', icon: BarChart3 },
];

type Props = {
  currentStep: number; // 0-5 (0 = getting started, 1-5 = STEPS[0-4])
};

export function EstimatorV2Progress({ currentStep }: Props) {
  // Step 0 (getting started) shows no progress
  if (currentStep === 0) return null;

  // Map currentStep 1-5 to index 0-4
  const activeIndex = currentStep - 1;

  return (
    <nav className="mb-8 sm:mb-12">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === activeIndex;
          const isCompleted = i < activeIndex;
          const isFuture = i > activeIndex;

          return (
            <div key={step.label} className="flex items-center">
              {/* Step circle */}
              <div className="flex items-center gap-2">
                <motion.div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors duration-300
                    ${isActive
                      ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                      : isCompleted
                        ? 'bg-[var(--ev2-gold)]/20 text-[var(--ev2-gold)] border border-[var(--ev2-gold)]/40'
                        : 'bg-[var(--ev2-surface)] text-[var(--ev2-text-dim)] border border-[var(--ev2-border)]'}
                  `}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.div>
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? 'text-[var(--ev2-gold)]'
                      : isCompleted
                        ? 'text-[var(--ev2-text-muted)]'
                        : 'text-[var(--ev2-text-dim)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="w-8 sm:w-12 h-px mx-2 relative">
                  <div className="absolute inset-0 bg-[var(--ev2-border)]" />
                  {!isFuture && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-[var(--ev2-gold)]/50"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact step indicator */}
      <div className="sm:hidden flex items-center justify-between px-2">
        <span className="text-[var(--ev2-gold)] text-sm font-medium">
          Step {currentStep} of 5
        </span>
        <span className="text-[var(--ev2-text-muted)] text-xs">
          {STEPS[activeIndex]?.label}
        </span>
        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 rounded-full ${
                i <= activeIndex
                  ? 'bg-[var(--ev2-gold)]'
                  : 'bg-[var(--ev2-surface)]'
              }`}
              initial={{ width: 8 }}
              animate={{ width: i === activeIndex ? 20 : 8 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
