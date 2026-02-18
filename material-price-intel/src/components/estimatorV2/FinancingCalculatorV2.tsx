import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { fmtCurrency } from '@/lib/estimatorV2/types';

type Props = {
  outTheDoorMidpoint: number;
};

export function FinancingCalculatorV2({ outTheDoorMidpoint }: Props) {
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
      monthlyPayment = Math.round(loanAmount * ((monthlyRate * factor) / (factor - 1)));
    } else {
      monthlyPayment = Math.round(loanAmount / numPayments);
    }
  }

  const totalInterest = monthlyPayment * numPayments - loanAmount;

  const pctFill = `${(downPaymentPct / 50) * 100}%`;

  return (
    <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--ev2-border)] flex items-center gap-2">
        <Calculator className="h-4 w-4 text-[var(--ev2-gold)]" />
        <p className="text-sm font-semibold text-[var(--ev2-text)]">
          Financing Calculator
        </p>
        <span className="text-xs text-[var(--ev2-text-dim)] ml-auto hidden sm:inline">
          Estimate your monthly payment
        </span>
      </div>

      <div className="p-5 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--ev2-text-muted)]">Home Price</label>
            <input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg bg-[var(--ev2-navy-900)] border border-[var(--ev2-border)]
                text-sm text-[var(--ev2-text)] tabular-nums focus:outline-none focus:border-[var(--ev2-gold)]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--ev2-text-muted)]">
              Down Payment: {downPaymentPct}% ({fmtCurrency(downPaymentAmount)})
            </label>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={downPaymentPct}
              onChange={(e) => setDownPaymentPct(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--ev2-gold) 0%, var(--ev2-gold) ${pctFill}, var(--ev2-navy-900) ${pctFill}, var(--ev2-navy-900) 100%)`,
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--ev2-text-muted)]">Interest Rate (%)</label>
            <input
              type="number"
              step={0.125}
              min={0}
              max={15}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-lg bg-[var(--ev2-navy-900)] border border-[var(--ev2-border)]
                text-sm text-[var(--ev2-text)] tabular-nums focus:outline-none focus:border-[var(--ev2-gold)]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--ev2-text-muted)]">Loan Term</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLoanTermYears(30)}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                  loanTermYears === 30
                    ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                    : 'bg-[var(--ev2-navy-900)] text-[var(--ev2-text-muted)] border border-[var(--ev2-border)] hover:border-[var(--ev2-gold)]/30'
                }`}
              >
                30 Years
              </button>
              <button
                onClick={() => setLoanTermYears(15)}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                  loanTermYears === 15
                    ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                    : 'bg-[var(--ev2-navy-900)] text-[var(--ev2-text-muted)] border border-[var(--ev2-border)] hover:border-[var(--ev2-gold)]/30'
                }`}
              >
                15 Years
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-[var(--ev2-navy-900)]/80 border border-[var(--ev2-border)]">
            <p className="text-lg sm:text-xl font-bold text-[var(--ev2-gold)] tabular-nums">
              {fmtCurrency(monthlyPayment)}
            </p>
            <p className="text-[11px] text-[var(--ev2-text-dim)]">Monthly P&I</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[var(--ev2-navy-900)]/80 border border-[var(--ev2-border)]">
            <p className="text-lg sm:text-xl font-bold text-[var(--ev2-text)] tabular-nums">
              {fmtCurrency(loanAmount)}
            </p>
            <p className="text-[11px] text-[var(--ev2-text-dim)]">Loan Amount</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[var(--ev2-navy-900)]/80 border border-[var(--ev2-border)]">
            <p className="text-lg sm:text-xl font-bold text-[var(--ev2-text)] tabular-nums">
              {fmtCurrency(totalInterest)}
            </p>
            <p className="text-[11px] text-[var(--ev2-text-dim)]">Total Interest</p>
          </div>
        </div>

        <p className="text-[11px] text-[var(--ev2-text-dim)]">
          Principal &amp; interest only. Does not include property taxes,
          homeowner's insurance, or HOA dues.
        </p>
      </div>
    </div>
  );
}
