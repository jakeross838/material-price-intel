import { Minus, Plus, ArrowRight, ArrowLeft, Paintbrush } from "lucide-react";
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
          <Paintbrush className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">Interior Details</h2>
        <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
          Choose your finish level and room count.
        </p>
      </div>

      {/* Finish Level Cards */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-brand-800">Finish Level</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FINISH_LEVELS.map((fl) => (
            <button
              key={fl.value}
              onClick={() => onChange("finish_level", fl.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                finishLevel === fl.value
                  ? "border-brand-600 bg-brand-50 shadow-md ring-1 ring-brand-500/20"
                  : "border-slate-200 hover:border-brand-300 hover:shadow-sm bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-900">{fl.label}</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                    finishLevel === fl.value
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {fl.range}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{fl.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms / Bathrooms */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-brand-200/60 p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-brand-800">Bedrooms</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bedrooms", Math.max(2, bedrooms - 1))}
              disabled={bedrooms <= 2}
              className="rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-3xl font-bold text-brand-800 w-10 text-center tabular-nums">
              {bedrooms}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bedrooms", Math.min(7, bedrooms + 1))}
              disabled={bedrooms >= 7}
              className="rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-brand-200/60 p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-brand-800">Bathrooms</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bathrooms", Math.max(1, bathrooms - 1))}
              disabled={bathrooms <= 1}
              className="rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-3xl font-bold text-brand-800 w-10 text-center tabular-nums">
              {bathrooms}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => onChange("bathrooms", Math.min(6, bathrooms + 1))}
              disabled={bathrooms >= 6}
              className="rounded-full"
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
          className="flex-1 h-13 text-base bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-13 text-base font-semibold bg-brand-700 hover:bg-brand-600 shadow-lg hover:shadow-xl transition-all"
        >
          Next: Finishes
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
