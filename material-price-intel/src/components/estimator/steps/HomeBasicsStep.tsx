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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Tell us about your dream home
        </h2>
        <p className="text-slate-500 mt-1">
          Start with the basics — we'll get more specific in the next steps.
        </p>
      </div>

      {/* Square Footage */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
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
            className="w-32 text-lg font-medium"
          />
          <input
            type="range"
            min={1200}
            max={10000}
            step={100}
            value={sqft}
            onChange={(e) => onChange("square_footage", parseInt(e.target.value))}
            className="flex-1 accent-slate-900"
          />
        </div>
        <p className="text-xs text-slate-400">
          {sqft.toLocaleString()} sqft
          {sqft < 2000 && " — Compact"}
          {sqft >= 2000 && sqft < 3500 && " — Mid-size"}
          {sqft >= 3500 && sqft < 5000 && " — Large"}
          {sqft >= 5000 && " — Estate"}
        </p>
      </div>

      {/* Stories */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Stories</Label>
        <div className="flex gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => onChange("stories", n)}
              className={`flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                stories === n
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {n} Story
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Home Style</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => onChange("style", s)}
              className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                style === s
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
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
        className="w-full h-12 text-base bg-slate-900 hover:bg-slate-800"
      >
        Next: Interior Details
      </Button>
    </div>
  );
}
