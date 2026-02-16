import { useState, useMemo, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { EstimatorProgress } from "@/components/estimator/EstimatorProgress";
import { GettingStartedStep } from "@/components/estimator/steps/GettingStartedStep";
import { HomeBasicsStep } from "@/components/estimator/steps/HomeBasicsStep";
import { CustomizeStep } from "@/components/estimator/steps/CustomizeStep";
import { EstimateResults } from "@/components/estimator/EstimateResults";
import { LeadCaptureForm } from "@/components/estimator/LeadCaptureForm";
import { useAllEstimatorConfig } from "@/hooks/useEstimator";
import { useEstimateDraft } from "@/hooks/useEstimateDraft";
import { calculateSimplifiedEstimate } from "@/lib/estimateCalculator";
import type { RoomEstimateResult } from "@/lib/estimateCalculator";
import type { FinishLevel, EstimateParams } from "@/lib/types";
import type { FloorPlanExtractionResult } from "@/lib/floorPlanTypes";

/**
 * Build a legacy EstimateParams object from current state.
 * Used by LeadCaptureForm which expects the old shape.
 */
function buildEstimateParams(
  sqft: number,
  stories: number,
  style: string,
  bedrooms: number,
  bathrooms: number,
  finishLevel: FinishLevel,
  specialFeatures: string[]
): EstimateParams {
  return {
    square_footage: sqft,
    stories,
    style,
    finish_level: finishLevel,
    bedrooms,
    bathrooms,
    kitchen_tier: "standard",
    bath_tier: "standard",
    flooring_preference: "mixed",
    roofing_type: "shingle",
    window_grade: "impact",
    exterior_type: "stucco",
    special_features: specialFeatures,
  };
}

// -------------------------------------------
// Main Page
// -------------------------------------------

export function EstimatePage() {
  // Step tracking: 0=GettingStarted, 1=HomeBasics, 2=Customize, 3=Results
  const [step, setStep] = useState(0);

  // Home basics
  const [sqft, setSqft] = useState(2500);
  const [stories, setStories] = useState(1);
  const [style, setStyle] = useState("Coastal");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [location, setLocation] = useState("bradenton");

  // AI floor plan extraction
  const [aiExtraction, setAiExtraction] = useState<FloorPlanExtractionResult | null>(null);

  // Customize state
  const [finishLevel, setFinishLevel] = useState<FinishLevel>("standard");
  const [specialFeatures, setSpecialFeatures] = useState<string[]>([]);

  // Results
  const [showResults, setShowResults] = useState(false);
  const [estimate, setEstimate] = useState<RoomEstimateResult | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Fetch ALL estimator config (all finish levels)
  const { data: allConfig, isLoading: configLoading } = useAllEstimatorConfig();

  // Save & Resume
  const { draft, saveDraft, clearDraft } = useEstimateDraft();

  useEffect(() => {
    document.title = "Dream Home Designer | Ross Built Custom Homes";
    return () => {
      document.title = "Material Price Intel";
    };
  }, []);

  // Auto-save wizard progress to localStorage (only for wizard steps, not results)
  useEffect(() => {
    if (step < 1 || step > 2) return;
    saveDraft({ step, sqft, stories, style, bedrooms, bathrooms, location, finishLevel, specialFeatures });
  }, [step, sqft, stories, style, bedrooms, bathrooms, location, finishLevel, specialFeatures, saveDraft]);

  // Generic field updater for HomeBasicsStep
  function updateBasics(field: string, value: string | number) {
    switch (field) {
      case "square_footage":
        setSqft(value as number);
        break;
      case "stories":
        setStories(value as number);
        break;
      case "style":
        setStyle(value as string);
        break;
      case "bedrooms":
        setBedrooms(value as number);
        break;
      case "bathrooms":
        setBathrooms(value as number);
        break;
      case "location":
        setLocation(value as string);
        break;
    }
  }

  // GettingStartedStep: user chose "Start from Scratch"
  function handleStartFromScratch() {
    setAiExtraction(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Resume from saved draft
  const handleResume = useCallback(() => {
    if (!draft) return;
    setSqft(draft.sqft);
    setStories(draft.stories);
    setStyle(draft.style);
    setBedrooms(draft.bedrooms);
    setBathrooms(draft.bathrooms);
    setLocation(draft.location);
    setFinishLevel(draft.finishLevel);
    setSpecialFeatures(draft.specialFeatures);
    setStep(Math.min(draft.step, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [draft]);

  // GettingStartedStep: AI extraction completed
  function handleFloorPlanExtracted(result: FloorPlanExtractionResult) {
    setAiExtraction(result);
    setSqft(result.total_sqft);
    setStories(result.stories);
    setBedrooms(result.bedrooms);
    setBathrooms(result.bathrooms);
    if (result.style) setStyle(result.style);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Advance from Home Basics to Customize
  function handleBasicsNext() {
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Advance from Customize to Results
  function handleCustomizeNext() {
    if (!allConfig || allConfig.length === 0) return;

    const result = calculateSimplifiedEstimate(
      { sqft, stories, bedrooms, bathrooms, finishLevel, location, specialFeatures },
      allConfig
    );
    setEstimate(result);
    setShowResults(true);
    setStep(3);
    clearDraft();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Build legacy params for LeadCaptureForm
  const estimateParams = useMemo(
    () => buildEstimateParams(sqft, stories, style, bedrooms, bathrooms, finishLevel, specialFeatures),
    [sqft, stories, style, bedrooms, bathrooms, finishLevel, specialFeatures]
  );

  // Results view
  if (showResults && estimate) {
    return (
      <EstimatorLayout>
        <div className="space-y-8">
          <EstimateResults
            low={estimate.low}
            high={estimate.high}
            sqft={sqft}
            roomBreakdowns={estimate.roomBreakdowns}
            breakdown={estimate.breakdown}
            gated={!leadCaptured}
            finishLevel={finishLevel}
            style={style}
          />
          <LeadCaptureForm
            estimateParams={estimateParams}
            estimateLow={estimate.low}
            estimateHigh={estimate.high}
            breakdown={estimate.breakdown}
            roomBreakdowns={estimate.roomBreakdowns}
            onLeadCaptured={() => setLeadCaptured(true)}
          />
          <div className="text-center">
            <button
              onClick={() => {
                setShowResults(false);
                setEstimate(null);
                setAiExtraction(null);
                setLeadCaptured(false);
                setStep(0);
                setFinishLevel("standard");
                setSpecialFeatures([]);
                setLocation("bradenton");
                clearDraft();
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
  if (configLoading && step > 1) {
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
          <GettingStartedStep
            onStartFromScratch={handleStartFromScratch}
            onFloorPlanExtracted={handleFloorPlanExtracted}
            draft={draft}
            onResume={handleResume}
          />
        )}
        {step === 1 && (
          <HomeBasicsStep
            sqft={sqft}
            stories={stories}
            style={style}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            location={location}
            onChange={updateBasics}
            onNext={handleBasicsNext}
            aiExtracted={!!aiExtraction}
          />
        )}
        {step === 2 && (
          <CustomizeStep
            finishLevel={finishLevel}
            specialFeatures={specialFeatures}
            onFinishLevelChange={setFinishLevel}
            onSpecialFeaturesChange={setSpecialFeatures}
            onNext={handleCustomizeNext}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </EstimatorLayout>
  );
}
