import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinishLevel } from "@/lib/types";

const FINISH_LEVELS: {
  value: FinishLevel;
  label: string;
  desc: string;
  range: string;
}[] = [
  {
    value: "builder",
    label: "Builder Grade",
    desc: "Quality construction with standard finishes. Great value.",
    range: "$165 - $190 /sqft",
  },
  {
    value: "standard",
    label: "Standard",
    desc: "Upgraded finishes, name-brand fixtures, hardwood options.",
    range: "$195 - $230 /sqft",
  },
  {
    value: "premium",
    label: "Premium",
    desc: "High-end materials, custom cabinetry, designer finishes.",
    range: "$230 - $275 /sqft",
  },
  {
    value: "luxury",
    label: "Luxury",
    desc: "Top-of-the-line everything. Imported materials, smart home.",
    range: "$280 - $350 /sqft",
  },
];

type Props = {
  finishLevel: FinishLevel;
  bedrooms: number;
  bathrooms: number;
  onChange: (field: string, value: string | number) => void;
  onNext: () => void;
  onBack: () => void;
};

export function InteriorStep({
  finishLevel,
  bedrooms,
  bathrooms,
  onChange,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Interior Details</h2>
        <p className="text-slate-500 mt-1">
          Choose your finish level and room count.
        </p>
      </div>

      {/* Finish Level Cards */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Finish Level</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FINISH_LEVELS.map((fl) => (
            <button
              key={fl.value}
              onClick={() => onChange("finish_level", fl.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                finishLevel === fl.value
                  ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{fl.label}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    finishLevel === fl.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {fl.range}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{fl.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms / Bathrooms */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Bedrooms</p>
          <div className="flex items-center gap-3">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bedrooms", Math.max(2, bedrooms - 1))}
              disabled={bedrooms <= 2}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-2xl font-bold text-slate-900 w-8 text-center">
              {bedrooms}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bedrooms", Math.min(7, bedrooms + 1))}
              disabled={bedrooms >= 7}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Bathrooms</p>
          <div className="flex items-center gap-3">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bathrooms", Math.max(1, bathrooms - 1))}
              disabled={bathrooms <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-2xl font-bold text-slate-900 w-8 text-center">
              {bathrooms}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bathrooms", Math.min(6, bathrooms + 1))}
              disabled={bathrooms >= 6}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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
          Next: Finishes
        </Button>
      </div>
    </div>
  );
}
