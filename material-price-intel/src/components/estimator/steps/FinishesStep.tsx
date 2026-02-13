import { Button } from "@/components/ui/button";

const KITCHEN_TIERS = [
  { value: "basic", label: "Basic", desc: "Stock cabinets, laminate counters" },
  { value: "standard", label: "Standard", desc: "Semi-custom cabinets, quartz counters" },
  { value: "chefs", label: "Chef's Kitchen", desc: "Custom cabinets, stone counters, pro appliances" },
  { value: "gourmet", label: "Gourmet", desc: "Fully custom, imported stone, commercial-grade" },
];

const BATH_TIERS = [
  { value: "basic", label: "Basic", desc: "Standard fixtures, fiberglass tub/shower" },
  { value: "standard", label: "Standard", desc: "Upgraded fixtures, tile shower, stone counters" },
  { value: "spa", label: "Spa", desc: "Freestanding tub, rain shower, heated floors" },
  { value: "resort", label: "Resort", desc: "Steam shower, soaking tub, smart mirrors" },
];

const FLOORING_OPTIONS = [
  { value: "lvp", label: "Luxury Vinyl", desc: "Waterproof, durable, cost-effective" },
  { value: "hardwood", label: "Hardwood", desc: "Classic oak, maple, or exotic species" },
  { value: "tile", label: "Tile", desc: "Porcelain or natural stone throughout" },
  { value: "mixed", label: "Mixed", desc: "Hardwood living areas, tile wet rooms" },
];

type Props = {
  kitchenTier: string;
  bathTier: string;
  flooringPreference: string;
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function FinishesStep({
  kitchenTier,
  bathTier,
  flooringPreference,
  onChange,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Finishes</h2>
        <p className="text-slate-500 mt-1">
          Customize your kitchen, bathrooms, and flooring.
        </p>
      </div>

      {/* Kitchen Tier */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Kitchen Level</p>
        <div className="grid grid-cols-2 gap-2">
          {KITCHEN_TIERS.map((t) => (
            <button
              key={t.value}
              onClick={() => onChange("kitchen_tier", t.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                kitchenTier === t.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="font-medium text-sm text-slate-900">
                {t.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bath Tier */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Bathroom Level</p>
        <div className="grid grid-cols-2 gap-2">
          {BATH_TIERS.map((t) => (
            <button
              key={t.value}
              onClick={() => onChange("bath_tier", t.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                bathTier === t.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="font-medium text-sm text-slate-900">
                {t.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Flooring */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Flooring Preference</p>
        <div className="grid grid-cols-2 gap-2">
          {FLOORING_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange("flooring_preference", f.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                flooringPreference === f.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="font-medium text-sm text-slate-900">
                {f.label}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
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
          Next: Extras
        </Button>
      </div>
    </div>
  );
}
