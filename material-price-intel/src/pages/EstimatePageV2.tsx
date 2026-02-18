import { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EstimatorV2Layout } from '@/components/estimatorV2/EstimatorV2Layout';
import { EstimatorV2Progress } from '@/components/estimatorV2/EstimatorV2Progress';
import { RunningTotalBar } from '@/components/estimatorV2/RunningTotalBar';
import { HouseSilhouette } from '@/components/estimatorV2/HouseSilhouette';
import { GettingStartedStepV2 } from '@/components/estimatorV2/steps/GettingStartedStepV2';
import { HomeBasicsStepV2 } from '@/components/estimatorV2/steps/HomeBasicsStepV2';
import { StyleExteriorStep } from '@/components/estimatorV2/steps/StyleExteriorStep';
import { InteriorSelectionsStep } from '@/components/estimatorV2/steps/InteriorSelectionsStep';
import { SpecialFeaturesStep } from '@/components/estimatorV2/steps/SpecialFeaturesStep';
import { ResultsPageV2 } from '@/components/estimatorV2/results/ResultsPageV2';
import { calculateV2Estimate } from '@/lib/estimatorV2/calculator';
import { useEstimateDraftV2 } from '@/hooks/useEstimateDraftV2';
import type { EstimatorV2Input, V2EstimateResult, Stories } from '@/lib/estimatorV2/types';
import { DEFAULT_V2_INPUT } from '@/lib/estimatorV2/types';
import type { FloorPlanExtractionResult } from '@/lib/floorPlanTypes';
import { ArrowRight, ArrowLeft } from 'lucide-react';

// Step transition animation
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

// Reduced-motion variant (no x translation)
const reducedMotionVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export function EstimatePageV2() {
  const { draft, saveDraft, clearDraft } = useEstimateDraftV2();
  const prefersReducedMotion = useReducedMotion();

  // Initialize from draft if available
  const [step, setStep] = useState(() => draft?.step ?? 0);
  const [direction, setDirection] = useState(1);
  const [input, setInput] = useState<EstimatorV2Input>(() => draft?.input ?? { ...DEFAULT_V2_INPUT });
  const [showDraftBanner, setShowDraftBanner] = useState(!!draft);

  // Memoized estimate calculation (recalculates when input changes)
  const estimate: V2EstimateResult = useMemo(
    () => calculateV2Estimate(input),
    [input],
  );

  // Auto-save draft on step/input changes
  useEffect(() => {
    saveDraft(step, input);
  }, [step, input, saveDraft]);

  // Navigation
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [prefersReducedMotion]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [prefersReducedMotion]);

  const goToStep = useCallback((target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [step, prefersReducedMotion]);

  // Update input helper
  const updateInput = useCallback(<K extends keyof EstimatorV2Input>(
    key: K,
    value: EstimatorV2Input[K],
  ) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Floor plan extraction handler
  const handleFloorPlanExtracted = useCallback((result: FloorPlanExtractionResult) => {
    setInput((prev) => ({
      ...prev,
      sqft: result.total_sqft || prev.sqft,
      stories: ([1, 2, 3].includes(result.stories) ? result.stories : prev.stories) as Stories,
      bedrooms: result.bedrooms || prev.bedrooms,
      bathrooms: result.bathrooms || prev.bathrooms,
    }));
    setDirection(1);
    setStep(1);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [prefersReducedMotion]);

  // Start fresh (clear draft)
  const handleStartOver = useCallback(() => {
    clearDraft();
    setInput({ ...DEFAULT_V2_INPUT });
    goToStep(0);
  }, [clearDraft, goToStep]);

  // Dismiss draft banner
  const dismissDraft = useCallback(() => {
    setShowDraftBanner(false);
    clearDraft();
    setStep(0);
    setInput({ ...DEFAULT_V2_INPUT });
  }, [clearDraft]);

  // Show running total bar on steps 1-4
  const showRunningTotal = step >= 1 && step <= 4;

  const variants = prefersReducedMotion ? reducedMotionVariants : stepVariants;

  return (
    <EstimatorV2Layout>
      {/* Draft resume banner */}
      {showDraftBanner && step > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg
            bg-[var(--ev2-gold)]/10 border border-[var(--ev2-gold)]/30"
        >
          <p className="text-sm text-[var(--ev2-text-muted)]">
            Welcome back! We saved your progress from where you left off.
          </p>
          <button
            onClick={dismissDraft}
            className="text-xs text-[var(--ev2-gold)] hover:text-[var(--ev2-gold-light)] font-medium whitespace-nowrap"
          >
            Start Fresh
          </button>
        </motion.div>
      )}

      <div className="flex gap-8 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <EstimatorV2Progress currentStep={step} />

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.3, ease: 'easeInOut' }}
            >
              {step === 0 && (
                <GettingStartedStepV2
                  onStartFromScratch={goNext}
                  onFloorPlanExtracted={handleFloorPlanExtracted}
                />
              )}
              {step === 1 && (
                <HomeBasicsStepV2
                  input={input}
                  updateInput={updateInput}
                />
              )}
              {step === 2 && (
                <StyleExteriorStep
                  input={input}
                  updateInput={updateInput}
                />
              )}
              {step === 3 && (
                <InteriorSelectionsStep
                  input={input}
                  updateInput={updateInput}
                />
              )}
              {step === 4 && (
                <SpecialFeaturesStep
                  input={input}
                  updateInput={updateInput}
                />
              )}
              {step === 5 && (
                <ResultsPageV2 estimate={estimate} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="relative z-50 flex items-center justify-between mt-8 mb-28 no-print">
            {step > 0 ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                  text-[var(--ev2-text-muted)] hover:text-[var(--ev2-text)]
                  bg-[var(--ev2-surface)] hover:bg-[var(--ev2-surface-hover)]
                  border border-[var(--ev2-border)] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step >= 1 && step < 5 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold
                  text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)]
                  transition-colors shadow-lg shadow-[var(--ev2-gold-glow)]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : step === 5 ? (
              <button
                onClick={handleStartOver}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium
                  text-[var(--ev2-text-muted)] hover:text-[var(--ev2-text)]
                  bg-[var(--ev2-surface)] hover:bg-[var(--ev2-surface-hover)]
                  border border-[var(--ev2-border)] transition-colors"
              >
                Start Over
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Side panel: house silhouette (desktop only) */}
        <div className="hidden lg:block w-48 shrink-0 sticky top-20 no-print">
          <HouseSilhouette progress={step} />
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4"
            >
              <p className="text-[10px] text-[var(--ev2-text-dim)] uppercase tracking-wider">
                {input.sqft.toLocaleString()} SF &bull; {input.stories} Story
              </p>
              <p className="text-[10px] text-[var(--ev2-text-dim)]">
                {input.bedrooms} Bed &bull; {input.bathrooms} Bath
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Running total sticky bar */}
      <AnimatePresence>
        {showRunningTotal && (
          <RunningTotalBar
            totalLow={estimate.totalLow}
            totalHigh={estimate.totalHigh}
            sqft={input.sqft}
            visible={showRunningTotal}
          />
        )}
      </AnimatePresence>
    </EstimatorV2Layout>
  );
}
