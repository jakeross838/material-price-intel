import { Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STYLES = [
  "Ranch",
  "Colonial",
  "Mediterranean",
  "Contemporary",
  "Craftsman",
  "Coastal",
];

type Props = {
  sqft: number;
  stories: number;
  style: string;
  onChange: (field: string, value: number | string) => void;
  onNext: () => void;
};

export function HomeBasicsStep({ sqft, stories, style, onChange, onNext }: Props) {
  const isValid = sqft >= 1200 && sqft <= 10000;

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
          <Home className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
          Tell us about your dream home
        </h2>
        <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
          Start with the basics — we'll get more specific in the next steps.
        </p>
      </div>

      {/* Square Footage */}
      <div className="space-y-3 bg-white rounded-xl border border-brand-200/60 p-5 shadow-sm">
        <Label className="text-sm font-semibold text-brand-800">
          Square Footage
        </Label>
        <div className="flex items-center gap-4">
          <Input
            type="number"
            min={1200}
            max={10000}
            step={100}
            value={sqft}
            onChange={(e) => onChange("square_footage", parseInt(e.target.value) || 0)}
            className="w-28 text-lg font-semibold text-center"
          />
          <input
            type="range"
            min={1200}
            max={10000}
            step={100}
            value={sqft}
            onChange={(e) => onChange("square_footage", parseInt(e.target.value))}
            className="flex-1 h-2"
            style={{ accentColor: "#5b8291" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">1,200 sqft</p>
          <p className="text-sm font-medium text-brand-700">
            {sqft.toLocaleString()} sqft
            {sqft < 2000 && " — Compact"}
            {sqft >= 2000 && sqft < 3500 && " — Mid-size"}
            {sqft >= 3500 && sqft < 5000 && " — Large"}
            {sqft >= 5000 && " — Estate"}
          </p>
          <p className="text-xs text-slate-400">10,000 sqft</p>
        </div>
      </div>

      {/* Stories */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-brand-800">Stories</Label>
        <div className="flex gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => onChange("stories", n)}
              className={`flex-1 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                stories === n
                  ? "border-brand-600 bg-brand-600 text-white shadow-md"
                  : "border-slate-200 text-slate-600 hover:border-brand-300 hover:shadow-sm bg-white"
              }`}
            >
              {n} Story
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-brand-800">Home Style</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => onChange("style", s)}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                style === s
                  ? "border-brand-600 bg-brand-600 text-white shadow-md"
                  : "border-slate-200 text-slate-600 hover:border-brand-300 hover:shadow-sm bg-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full h-13 text-base font-semibold bg-brand-700 hover:bg-brand-600 shadow-lg hover:shadow-xl transition-all"
      >
        Next: Interior Details
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
