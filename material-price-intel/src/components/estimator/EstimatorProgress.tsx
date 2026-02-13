import { Check } from "lucide-react";

const STEPS = ["Home Basics", "Interior", "Finishes", "Extras"];

type Props = {
  currentStep: number; // 0-3
};

export function EstimatorProgress({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((label, i) => {
        const isComplete = i < currentStep;
        const isActive = i === currentStep;

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className={`w-6 sm:w-10 h-0.5 mx-1 ${
                  i <= currentStep ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isComplete
                    ? "bg-slate-900 text-white"
                    : isActive
                      ? "bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium ${
                  isActive ? "text-slate-900" : "text-slate-400"
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
