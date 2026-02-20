import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, BarChart3, Bookmark, Plus } from 'lucide-react';
import { EstimatorV2Layout } from '@/components/estimatorV2/EstimatorV2Layout';
import { useSavedEstimates } from '@/hooks/useSavedEstimates';
import { calculateV2Estimate } from '@/lib/estimatorV2/calculator';
import { DEFAULT_V2_INPUT, fmtCurrency, fmtCompact } from '@/lib/estimatorV2/types';
import type { EstimatorV2Input } from '@/lib/estimatorV2/types';

type CompareField = {
  label: string;
  getValue: (input: EstimatorV2Input) => string;
};

const COMPARE_FIELDS: CompareField[] = [
  { label: 'Sq Ft', getValue: (i) => i.sqft.toLocaleString() },
  { label: 'Stories', getValue: (i) => String(i.stories) },
  { label: 'Bedrooms', getValue: (i) => String(i.bedrooms) },
  { label: 'Bathrooms', getValue: (i) => String(i.bathrooms) },
  { label: 'Garage', getValue: (i) => i.garageSpaces === 0 ? 'None' : `${i.garageSpaces}-Car` },
  { label: 'Lot Size', getValue: (i) => `${i.lotSize} acres` },
  { label: 'Ceiling Height', getValue: (i) => `${i.ceilingHeight} ft` },
  { label: 'Finish Level', getValue: (i) => i.finishLevel },
  { label: 'Arch Style', getValue: (i) => i.archStyle },
  { label: 'Cladding', getValue: (i) => i.claddingType },
  { label: 'Roofing', getValue: (i) => i.roofType },
  { label: 'Windows', getValue: (i) => i.windowGrade },
  { label: 'Flooring', getValue: (i) => i.flooringType },
  { label: 'Countertops', getValue: (i) => i.countertopMaterial },
  { label: 'Appliances', getValue: (i) => i.appliancePackage },
  { label: 'Pool', getValue: (i) => i.pool },
  { label: 'Solar', getValue: (i) => i.solarPanels },
  { label: 'Driveway', getValue: (i) => i.drivewayType },
  { label: 'Landscaping', getValue: (i) => i.landscapingTier },
  { label: 'Fence', getValue: (i) => i.fenceType },
  { label: 'Sewer', getValue: (i) => i.sewerType },
  { label: 'Water', getValue: (i) => i.waterSource },
];

export function CompareEstimatesPage() {
  const { estimates, deleteEstimate } = useSavedEstimates();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const selectedEstimates = useMemo(() => {
    return selectedIds
      .map((id) => estimates.find((e) => e.id === id))
      .filter(Boolean)
      .map((saved) => {
        const input: EstimatorV2Input = { ...DEFAULT_V2_INPUT, ...saved!.input };
        return {
          saved: saved!,
          result: calculateV2Estimate(input),
        };
      });
  }, [selectedIds, estimates]);

  // Find fields that differ between selected estimates
  const diffFields = useMemo(() => {
    if (selectedEstimates.length < 2) return [];
    return COMPARE_FIELDS.filter((field) => {
      const values = selectedEstimates.map((e) => field.getValue(e.saved.input));
      return new Set(values).size > 1;
    });
  }, [selectedEstimates]);

  if (estimates.length === 0) {
    return (
      <EstimatorV2Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--ev2-blue)]/20 to-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto">
              <Bookmark className="h-8 w-8 text-[var(--ev2-text-dim)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--ev2-text)]">No saved estimates yet</p>
              <p className="text-sm text-[var(--ev2-text-muted)] mt-1 max-w-sm mx-auto">
                Build an estimate and save it from the results page to compare different configurations side by side.
              </p>
            </div>
            <Link
              to="/estimate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)]
                transition-colors shadow-lg shadow-[var(--ev2-gold-glow)]"
            >
              Build an Estimate
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </EstimatorV2Layout>
    );
  }

  return (
    <EstimatorV2Layout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ev2-blue)]/20 to-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-7 w-7 text-[var(--ev2-gold)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--ev2-text)]">
            {estimates.length === 1 ? 'Saved Estimates' : 'Compare Estimates'}
          </h1>
          <p className="text-sm text-[var(--ev2-text-muted)] mt-1">
            {estimates.length === 1
              ? 'Save one more estimate to compare side by side'
              : 'Select 2-3 saved estimates to compare side by side'
            }
          </p>
        </motion.div>

        {/* Selection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {estimates.map((saved, idx) => {
              const isSelected = selectedIds.includes(saved.id);
              const result = calculateV2Estimate({ ...DEFAULT_V2_INPUT, ...saved.input });
              const mid = Math.round((result.totalLow + result.totalHigh) / 2);

              return (
                <motion.button
                  key={saved.id}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => toggleSelect(saved.id)}
                  disabled={!isSelected && selectedIds.length >= 3}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)] ev2-active-glow'
                      : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)] disabled:opacity-40 ev2-card-hover'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold text-[var(--ev2-text)]">{saved.label}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEstimate(saved.id);
                        setSelectedIds((prev) => prev.filter((x) => x !== saved.id));
                      }}
                      className="p-1 rounded text-[var(--ev2-text-dim)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-lg font-bold text-[var(--ev2-gold)] tabular-nums">
                    {fmtCompact(mid)}
                  </p>
                  <p className="text-[10px] text-[var(--ev2-text-dim)] mt-1">
                    {saved.input.sqft?.toLocaleString()} SF &bull; {saved.input.stories} Story &bull; {saved.input.finishLevel}
                  </p>
                  <p className="text-[10px] text-[var(--ev2-text-dim)]">
                    Saved {new Date(saved.savedAt).toLocaleDateString()}
                  </p>
                  {/* Selection indicator */}
                  <motion.div
                    animate={isSelected ? { scale: [0.5, 1.2, 1] } : { scale: 1 }}
                    className={`absolute top-3 right-10 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                        : 'border border-[var(--ev2-border)]'
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </motion.div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {/* "Build another" card */}
          <Link
            to="/estimate"
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[var(--ev2-border)] hover:border-[var(--ev2-gold)]/30 text-center transition-all duration-200 hover:bg-[var(--ev2-surface)] min-h-[120px]"
          >
            <Plus className="h-6 w-6 text-[var(--ev2-text-dim)] mb-2" />
            <p className="text-xs font-medium text-[var(--ev2-text-muted)]">Build Another Estimate</p>
          </Link>
        </div>

        {/* Prompt to select when only viewing */}
        {estimates.length >= 2 && selectedEstimates.length < 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6"
          >
            <p className="text-sm text-[var(--ev2-text-dim)]">
              Tap 2-3 estimates above to see a side-by-side comparison
            </p>
          </motion.div>
        )}

        {/* Comparison table */}
        <AnimatePresence>
          {selectedEstimates.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Totals comparison */}
              <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] overflow-hidden">
                <div className="p-4 border-b border-[var(--ev2-border)] flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--ev2-blue)]/30" />
                  <h2 className="text-sm font-bold text-[var(--ev2-text)] uppercase tracking-wider">Cost Summary</h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--ev2-blue)]/30" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--ev2-border)]">
                        <th className="text-left p-3 text-[var(--ev2-text-dim)] font-medium w-40">Metric</th>
                        {selectedEstimates.map(({ saved }) => (
                          <th key={saved.id} className="text-right p-3 text-[var(--ev2-text)] font-semibold">
                            {saved.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <CompareRow
                        label="Total (Mid)"
                        values={selectedEstimates.map(({ result }) =>
                          fmtCurrency(Math.round((result.totalLow + result.totalHigh) / 2))
                        )}
                        highlight
                      />
                      <CompareRow
                        label="Range Low"
                        values={selectedEstimates.map(({ result }) => fmtCurrency(result.totalLow))}
                      />
                      <CompareRow
                        label="Range High"
                        values={selectedEstimates.map(({ result }) => fmtCurrency(result.totalHigh))}
                      />
                      <CompareRow
                        label="Per Sq Ft"
                        values={selectedEstimates.map(({ result }) =>
                          `${fmtCurrency(result.perSqftLow)} - ${fmtCurrency(result.perSqftHigh)}`
                        )}
                      />
                      <CompareRow
                        label="Monthly"
                        values={selectedEstimates.map(({ result }) =>
                          `$${result.monthlyLow.toLocaleString()} - $${result.monthlyHigh.toLocaleString()}`
                        )}
                      />
                      <CompareRow
                        label="Build Time"
                        values={selectedEstimates.map(({ result }) =>
                          `${result.schedule.totalMonths} months`
                        )}
                      />
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Configuration differences */}
              {diffFields.length > 0 && (
                <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--ev2-border)] flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--ev2-blue)]/30" />
                    <h2 className="text-sm font-bold text-[var(--ev2-text)] uppercase tracking-wider">
                      Configuration Differences
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--ev2-blue)]/30" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--ev2-border)]">
                          <th className="text-left p-3 text-[var(--ev2-text-dim)] font-medium w-40">Field</th>
                          {selectedEstimates.map(({ saved }) => (
                            <th key={saved.id} className="text-right p-3 text-[var(--ev2-text)] font-semibold">
                              {saved.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {diffFields.map((field) => (
                          <CompareRow
                            key={field.label}
                            label={field.label}
                            values={selectedEstimates.map(({ saved }) => field.getValue(saved.input))}
                            highlight
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back link */}
        <div className="text-center">
          <Link
            to="/estimate"
            className="text-sm text-[var(--ev2-gold)] hover:text-[var(--ev2-gold-light)] font-medium transition-colors"
          >
            &larr; Back to Estimator
          </Link>
        </div>
      </div>
    </EstimatorV2Layout>
  );
}

function CompareRow({
  label,
  values,
  highlight = false,
}: {
  label: string;
  values: string[];
  highlight?: boolean;
}) {
  return (
    <tr className={`border-b border-[var(--ev2-border)]/50 ${highlight ? 'bg-[var(--ev2-gold)]/5' : ''}`}>
      <td className="p-3 text-[var(--ev2-text-muted)] font-medium">{label}</td>
      {values.map((val, i) => (
        <td key={i} className="p-3 text-right text-[var(--ev2-text)] tabular-nums font-medium">
          {val}
        </td>
      ))}
    </tr>
  );
}
