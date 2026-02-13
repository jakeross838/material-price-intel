import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
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

function OptionCard({
  label,
  desc,
  selected,
  onClick,
}: {
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? "border-brand-600 bg-brand-50 shadow-md ring-1 ring-brand-500/20"
          : "border-slate-200 hover:border-brand-300 hover:shadow-sm bg-white"
      }`}
    >
      <span className="font-semibold text-sm text-brand-900">{label}</span>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </button>
  );
}

export function FinishesStep({
  kitchenTier,
  bathTier,
  flooringPreference,
  onChange,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
          <Sparkles className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">Finishes</h2>
        <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
          Customize your kitchen, bathrooms, and flooring.
        </p>
      </div>

      {/* Kitchen Tier */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Kitchen Level</p>
        <div className="grid grid-cols-2 gap-2.5">
          {KITCHEN_TIERS.map((t) => (
            <OptionCard
              key={t.value}
              label={t.label}
              desc={t.desc}
              selected={kitchenTier === t.value}
              onClick={() => onChange("kitchen_tier", t.value)}
            />
          ))}
        </div>
      </div>

      {/* Bath Tier */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Bathroom Level</p>
        <div className="grid grid-cols-2 gap-2.5">
          {BATH_TIERS.map((t) => (
            <OptionCard
              key={t.value}
              label={t.label}
              desc={t.desc}
              selected={bathTier === t.value}
              onClick={() => onChange("bath_tier", t.value)}
            />
          ))}
        </div>
      </div>

      {/* Flooring */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Flooring Preference</p>
        <div className="grid grid-cols-2 gap-2.5">
          {FLOORING_OPTIONS.map((f) => (
            <OptionCard
              key={f.value}
              label={f.label}
              desc={f.desc}
              selected={flooringPreference === f.value}
              onClick={() => onChange("flooring_preference", f.value)}
            />
          ))}
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
          className="flex-1 h-13 text-base font-semibold bg-brand-700 hover:bg-brand-600 shadow-lg hover:shadow-xl transition-all"
        >
          Next: Extras
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
