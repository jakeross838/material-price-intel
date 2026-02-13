import { ArrowLeft, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROOFING_OPTIONS = [
  { value: "shingle", label: "Asphalt Shingle", desc: "Most common, 25-30 year life" },
  { value: "metal", label: "Standing Seam Metal", desc: "50+ year life, energy efficient" },
  { value: "tile", label: "Concrete/Clay Tile", desc: "Classic FL look, very durable" },
];

const WINDOW_OPTIONS = [
  { value: "standard", label: "Standard", desc: "Double-pane, energy efficient" },
  { value: "impact", label: "Impact-Rated", desc: "Hurricane protection, required in many FL zones" },
  { value: "hurricane", label: "Hurricane Premium", desc: "Large missile rated, top-tier protection" },
];

const EXTERIOR_OPTIONS = [
  { value: "stucco", label: "Stucco", desc: "Classic Florida finish" },
  { value: "siding", label: "Hardie Siding", desc: "Fiber cement, low maintenance" },
  { value: "brick", label: "Brick", desc: "Traditional, long-lasting" },
  { value: "stone", label: "Stone Accent", desc: "Mixed stone + stucco or siding" },
];

const SPECIAL_FEATURES = [
  { value: "pool", label: "Swimming Pool", cost: "$35K - $80K" },
  { value: "outdoor_kitchen", label: "Outdoor Kitchen", cost: "$15K - $40K" },
  { value: "smart_home", label: "Smart Home System", cost: "$8K - $25K" },
  { value: "generator", label: "Whole-Home Generator", cost: "$8K - $18K" },
  { value: "elevator", label: "Residential Elevator", cost: "$25K - $50K" },
];

type Props = {
  roofingType: string;
  windowGrade: string;
  exteriorType: string;
  specialFeatures: string[];
  onChange: (field: string, value: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function ExtrasStep({
  roofingType,
  windowGrade,
  exteriorType,
  specialFeatures,
  onChange,
  onNext,
  onBack,
}: Props) {
  function toggleFeature(feature: string) {
    const next = specialFeatures.includes(feature)
      ? specialFeatures.filter((f) => f !== feature)
      : [...specialFeatures, feature];
    onChange("special_features", next);
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
          <Star className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
          Extras &amp; Upgrades
        </h2>
        <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
          Roofing, windows, exterior, and special features.
        </p>
      </div>

      {/* Roofing */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Roofing</p>
        <div className="grid grid-cols-3 gap-2.5">
          {ROOFING_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => onChange("roofing_type", r.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                roofingType === r.value
                  ? "border-brand-600 bg-brand-50 shadow-md ring-1 ring-brand-500/20"
                  : "border-slate-200 hover:border-brand-300 hover:shadow-sm bg-white"
              }`}
            >
              <span className="font-semibold text-sm text-brand-900 block">
                {r.label}
              </span>
              <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Windows */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Windows</p>
        <div className="grid grid-cols-3 gap-2.5">
          {WINDOW_OPTIONS.map((w) => (
            <button
              key={w.value}
              onClick={() => onChange("window_grade", w.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                windowGrade === w.value
                  ? "border-brand-600 bg-brand-50 shadow-md ring-1 ring-brand-500/20"
                  : "border-slate-200 hover:border-brand-300 hover:shadow-sm bg-white"
              }`}
            >
              <span className="font-semibold text-sm text-brand-900 block">
                {w.label}
              </span>
              <p className="text-xs text-slate-500 mt-1">{w.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Exterior */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Exterior</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {EXTERIOR_OPTIONS.map((e) => (
            <button
              key={e.value}
              onClick={() => onChange("exterior_type", e.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                exteriorType === e.value
                  ? "border-brand-600 bg-brand-50 shadow-md ring-1 ring-brand-500/20"
                  : "border-slate-200 hover:border-brand-300 hover:shadow-sm bg-white"
              }`}
            >
              <span className="font-semibold text-sm text-brand-900 block">
                {e.label}
              </span>
              <p className="text-xs text-slate-500 mt-1">{e.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Special Features */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">
          Special Features{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </p>
        <div className="space-y-2">
          {SPECIAL_FEATURES.map((f) => {
            const isSelected = specialFeatures.includes(f.value);
            return (
              <button
                key={f.value}
                onClick={() => toggleFeature(f.value)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? "border-brand-600 bg-brand-50 shadow-md"
                    : "border-slate-200 hover:border-brand-300 hover:shadow-sm bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-brand-600 text-white shadow-sm"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </div>
                  <span className="font-semibold text-sm text-brand-900">
                    {f.label}
                  </span>
                </div>
                <span className={`text-xs font-medium ${isSelected ? "text-brand-700" : "text-slate-400"}`}>
                  {f.cost}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
          className="flex-1 h-13 text-base font-semibold bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg hover:shadow-xl transition-all"
        >
          See My Estimate
        </Button>
      </div>
    </div>
  );
}
