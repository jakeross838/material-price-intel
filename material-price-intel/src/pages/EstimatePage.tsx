import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { EstimatorProgress } from "@/components/estimator/EstimatorProgress";
import { HomeBasicsStep } from "@/components/estimator/steps/HomeBasicsStep";
import { InteriorStep } from "@/components/estimator/steps/InteriorStep";
import { FinishesStep } from "@/components/estimator/steps/FinishesStep";
import { ExtrasStep } from "@/components/estimator/steps/ExtrasStep";
import { EstimateResults } from "@/components/estimator/EstimateResults";
import { LeadCaptureForm } from "@/components/estimator/LeadCaptureForm";
import { useEstimatorConfig } from "@/hooks/useEstimator";
import { calculateEstimate } from "@/lib/estimateCalculator";
import type { FinishLevel, EstimateParams } from "@/lib/types";

const DEFAULT_PARAMS: EstimateParams = {
  square_footage: 2500,
  stories: 1,
  style: "Ranch",
  finish_level: "standard",
  bedrooms: 3,
  bathrooms: 2,
  kitchen_tier: "standard",
  bath_tier: "standard",
  flooring_preference: "mixed",
  roofing_type: "shingle",
  window_grade: "impact",
  exterior_type: "stucco",
  special_features: [],
};

export function EstimatePage() {
  const [step, setStep] = useState(0);
  const [params, setParams] = useState<EstimateParams>(DEFAULT_PARAMS);
  const [showResults, setShowResults] = useState(false);

  const { data: config, isLoading: configLoading } = useEstimatorConfig(
    params.finish_level as FinishLevel
  );

  function updateField(field: string, value: string | number | string[]) {
    setParams((prev) => ({ ...prev, [field]: value }));
  }

  const estimate = useMemo(() => {
    if (!config || config.length === 0) return null;
    return calculateEstimate(params, config);
  }, [params, config]);

  function handleFinish() {
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Results view
  if (showResults && estimate) {
    return (
      <EstimatorLayout>
        <div className="space-y-8">
          <EstimateResults
            low={estimate.low}
            high={estimate.high}
            sqft={params.square_footage}
            breakdown={estimate.breakdown}
          />
          <LeadCaptureForm
            estimateParams={params}
            estimateLow={estimate.low}
            estimateHigh={estimate.high}
            breakdown={estimate.breakdown}
          />
          <div className="text-center">
            <button
              onClick={() => {
                setShowResults(false);
                setStep(0);
              }}
              className="text-sm text-slate-400 hover:text-slate-600 underline"
            >
              Start Over
            </button>
          </div>
        </div>
      </EstimatorLayout>
    );
  }

  // Loading config
  if (configLoading && step > 0) {
    return (
      <EstimatorLayout>
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading pricing data...
        </div>
      </EstimatorLayout>
    );
  }

  // Wizard steps
  return (
    <EstimatorLayout>
      <EstimatorProgress currentStep={step} />
      <div className="max-w-2xl mx-auto">
        {step === 0 && (
          <HomeBasicsStep
            sqft={params.square_footage}
            stories={params.stories}
            style={params.style}
            onChange={updateField}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <InteriorStep
            finishLevel={params.finish_level}
            bedrooms={params.bedrooms}
            bathrooms={params.bathrooms}
            onChange={updateField}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <FinishesStep
            kitchenTier={params.kitchen_tier}
            bathTier={params.bath_tier}
            flooringPreference={params.flooring_preference}
            onChange={updateField}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ExtrasStep
            roofingType={params.roofing_type}
            windowGrade={params.window_grade}
            exteriorType={params.exterior_type}
            specialFeatures={params.special_features}
            onChange={updateField}
            onNext={handleFinish}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </EstimatorLayout>
  );
}
