import { Check } from "lucide-react";

const STEPS = ["Get Started", "Home Basics", "Your Rooms", "Design", "Estimate"];

type Props = {
  currentStep: number; // 0-4
};

export function EstimatorProgress({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 sm:gap-1 mb-10">
      {STEPS.map((label, i) => {
        const isComplete = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-8 sm:w-14 h-0.5 ${
                  i <= currentStep
                    ? "bg-gradient-to-r from-brand-500 to-brand-600"
                    : "bg-slate-200"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isComplete
                    ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md"
                    : isActive
                      ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white ring-2 ring-brand-500 ring-offset-2 shadow-lg"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium transition-colors ${
                  isActive
                    ? "text-brand-700 font-semibold"
                    : isComplete
                      ? "text-brand-600"
                      : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
