import {
  Check,
  Waves,
  ChefHat,
  Zap,
  ArrowUpDown,
  Wine,
  Flame,
  ArrowRight,
  ArrowLeft,
  Paintbrush,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinishLevel } from "@/lib/types";
import { SPECIAL_FEATURES } from "@/lib/estimateCalculator";
import type { LucideIcon } from "lucide-react";

type Props = {
  finishLevel: FinishLevel;
  specialFeatures: string[];
  onFinishLevelChange: (level: FinishLevel) => void;
  onSpecialFeaturesChange: (features: string[]) => void;
  onNext: () => void;
  onBack: () => void;
};

type FinishOption = {
  level: FinishLevel;
  name: string;
  description: string;
  priceRange: string;
};

const FINISH_OPTIONS: FinishOption[] = [
  {
    level: "builder",
    name: "Builder Grade",
    description: "Budget-friendly, quality materials that get the job done right",
    priceRange: "$85 – $120 / sqft",
  },
  {
    level: "standard",
    name: "Standard",
    description: "Popular finishes with great value and solid craftsmanship",
    priceRange: "$120 – $165 / sqft",
  },
  {
    level: "premium",
    name: "Premium",
    description: "Designer selections with elevated details and materials",
    priceRange: "$165 – $230 / sqft",
  },
  {
    level: "luxury",
    name: "Luxury",
    description: "No compromise — the finest materials and bespoke craftsmanship",
    priceRange: "$230 – $350 / sqft",
  },
];

const FEATURE_ICONS: Record<string, LucideIcon> = {
  pool: Waves,
  outdoor_kitchen: ChefHat,
  generator: Zap,
  elevator: ArrowUpDown,
  wine_cellar: Wine,
  outdoor_fireplace: Flame,
};

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function CustomizeStep({
  finishLevel,
  specialFeatures,
  onFinishLevelChange,
  onSpecialFeaturesChange,
  onNext,
  onBack,
}: Props) {
  function toggleFeature(featureId: string) {
    if (specialFeatures.includes(featureId)) {
      onSpecialFeaturesChange(specialFeatures.filter((f) => f !== featureId));
    } else {
      onSpecialFeaturesChange([...specialFeatures, featureId]);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
          <Paintbrush className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
          Customize Your Home
        </h2>
        <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
          Choose your overall finish level and any special features.
        </p>
      </div>

      {/* Finish Level Picker */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Finish Level</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FINISH_OPTIONS.map((opt) => {
            const selected = finishLevel === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => onFinishLevelChange(opt.level)}
                className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                  selected
                    ? "border-brand-600 bg-brand-50 shadow-md shadow-brand-600/10 ring-1 ring-brand-500/20"
                    : "border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
                }`}
              >
                {selected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
                <h3
                  className={`text-base font-bold ${
                    selected ? "text-brand-900" : "text-slate-700"
                  }`}
                >
                  {opt.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed pr-6">
                  {opt.description}
                </p>
                <p
                  className={`text-sm font-semibold mt-2 tabular-nums ${
                    selected ? "text-brand-700" : "text-slate-500"
                  }`}
                >
                  {opt.priceRange}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Features */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">
          Custom Features{" "}
          <span className="font-normal text-brand-500">(optional)</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SPECIAL_FEATURES.map((feat) => {
            const Icon = FEATURE_ICONS[feat.id] ?? Zap;
            const selected = specialFeatures.includes(feat.id);
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => toggleFeature(feat.id)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selected
                    ? "border-brand-600 bg-brand-50 shadow-md shadow-brand-600/10"
                    : "border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
                }`}
              >
                {selected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                    selected
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h4
                  className={`text-sm font-semibold ${
                    selected ? "text-brand-900" : "text-slate-700"
                  }`}
                >
                  {feat.label}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                  {fmt(feat.low)} – {fmt(feat.high)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-13 text-base bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-13 text-base font-semibold bg-brand-700 hover:bg-brand-600 shadow-lg hover:shadow-xl transition-all"
        >
          Review My Estimate
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
