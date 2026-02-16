import { useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  outTheDoorMidpoint: number;
};

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function FinancingCalculator({ outTheDoorMidpoint }: Props) {
  const [homePrice, setHomePrice] = useState(outTheDoorMidpoint);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTermYears, setLoanTermYears] = useState<15 | 30>(30);

  const downPaymentAmount = Math.round(homePrice * (downPaymentPct / 100));
  const loanAmount = homePrice - downPaymentAmount;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTermYears * 12;

  let monthlyPayment = 0;
  if (loanAmount > 0 && numPayments > 0) {
    if (monthlyRate > 0) {
      const factor = Math.pow(1 + monthlyRate, numPayments);
      monthlyPayment = Math.round(
        loanAmount * ((monthlyRate * factor) / (factor - 1))
      );
    } else {
      monthlyPayment = Math.round(loanAmount / numPayments);
    }
  }

  const totalPaid = monthlyPayment * numPayments;
  const totalInterest = totalPaid - loanAmount;

  return (
    <div className="print-area bg-white rounded-2xl border border-brand-200/50 overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-brand-600" />
          <p className="text-sm font-semibold text-brand-800">
            Financing Calculator
          </p>
          <span className="text-xs text-brand-400 ml-auto hidden sm:inline">
            Estimate your monthly payment
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-brand-700">Home Price</Label>
            <Input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value) || 0)}
              className="tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-brand-700">
              Down Payment: {downPaymentPct}% ({fmt(downPaymentAmount)})
            </Label>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              className="w-full h-2 rounded-full bg-brand-200 accent-brand-600 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-brand-700">Interest Rate (%)</Label>
            <Input
              type="number"
              step={0.125}
              min={0}
              max={15}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
              className="tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-brand-700">Loan Term</Label>
            <div className="flex gap-2">
              <Button
                variant={loanTermYears === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setLoanTermYears(30)}
                className="flex-1"
              >
                30 Years
              </Button>
              <Button
                variant={loanTermYears === 15 ? "default" : "outline"}
                size="sm"
                onClick={() => setLoanTermYears(15)}
                className="flex-1"
              >
                15 Years
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-brand-50/50">
            <p className="text-lg sm:text-xl font-bold text-brand-900 tabular-nums">
              {fmt(monthlyPayment)}
            </p>
            <p className="text-[11px] text-brand-500">Monthly P&I</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-brand-50/50">
            <p className="text-lg sm:text-xl font-bold text-brand-900 tabular-nums">
              {fmt(loanAmount)}
            </p>
            <p className="text-[11px] text-brand-500">Loan Amount</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-brand-50/50">
            <p className="text-lg sm:text-xl font-bold text-brand-900 tabular-nums">
              {fmt(totalInterest)}
            </p>
            <p className="text-[11px] text-brand-500">Total Interest</p>
          </div>
        </div>

        <p className="text-[11px] text-brand-400">
          Principal &amp; interest only. Does not include property taxes,
          homeowner&rsquo;s insurance, or HOA dues.
        </p>
      </div>
    </div>
  );
}
