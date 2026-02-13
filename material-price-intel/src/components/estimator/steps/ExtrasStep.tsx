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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Extras & Upgrades</h2>
        <p className="text-slate-500 mt-1">
          Roofing, windows, exterior, and special features.
        </p>
      </div>

      {/* Roofing */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Roofing</p>
        <div className="grid grid-cols-3 gap-2">
          {ROOFING_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => onChange("roofing_type", r.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                roofingType === r.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="font-medium text-sm text-slate-900 block">
                {r.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Windows */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Windows</p>
        <div className="grid grid-cols-3 gap-2">
          {WINDOW_OPTIONS.map((w) => (
            <button
              key={w.value}
              onClick={() => onChange("window_grade", w.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                windowGrade === w.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="font-medium text-sm text-slate-900 block">
                {w.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{w.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Exterior */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Exterior</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EXTERIOR_OPTIONS.map((e) => (
            <button
              key={e.value}
              onClick={() => onChange("exterior_type", e.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                exteriorType === e.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="font-medium text-sm text-slate-900 block">
                {e.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{e.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Special Features */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Special Features{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </p>
        <div className="space-y-2">
          {SPECIAL_FEATURES.map((f) => (
            <button
              key={f.value}
              onClick={() => toggleFeature(f.value)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                specialFeatures.includes(f.value)
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                    specialFeatures.includes(f.value)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300"
                  }`}
                >
                  {specialFeatures.includes(f.value) && "\u2713"}
                </div>
                <span className="font-medium text-sm text-slate-900">
                  {f.label}
                </span>
              </div>
              <span className="text-xs text-slate-500">{f.cost}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 text-base"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-12 text-base bg-slate-900 hover:bg-slate-800"
        >
          See My Estimate
        </Button>
      </div>
    </div>
  );
}
