import { useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useLoadSharedEstimate } from '@/hooks/useShareEstimate';
import { calculateV2Estimate } from '@/lib/estimatorV2/calculator';
import { DEFAULT_V2_INPUT } from '@/lib/estimatorV2/types';
import type { EstimatorV2Input } from '@/lib/estimatorV2/types';
import { EstimatorV2Layout } from '@/components/estimatorV2/EstimatorV2Layout';
import { ResultsPageV2 } from '@/components/estimatorV2/results/ResultsPageV2';
import { ArrowRight } from 'lucide-react';

export function SharedEstimatePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useLoadSharedEstimate(id);

  const estimate = useMemo(() => {
    if (!data) return null;
    const input: EstimatorV2Input = {
      ...DEFAULT_V2_INPUT,
      ...(data.estimate_params as Partial<EstimatorV2Input>),
    };
    return calculateV2Estimate(input);
  }, [data]);

  if (isLoading) {
    return (
      <EstimatorV2Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--ev2-text-muted)]">Loading shared estimate...</p>
          </div>
        </div>
      </EstimatorV2Layout>
    );
  }

  if (error || !estimate) {
    return (
      <EstimatorV2Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-[var(--ev2-text)]">Estimate not found</p>
            <p className="text-sm text-[var(--ev2-text-muted)]">
              This shared estimate link may have expired or is invalid.
            </p>
            <Link
              to="/estimate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)] hover:bg-[var(--ev2-gold-light)]
                transition-colors shadow-lg shadow-[var(--ev2-gold-glow)]"
            >
              Build Your Own Estimate
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </EstimatorV2Layout>
    );
  }

  return (
    <EstimatorV2Layout>
      {/* Shared estimate banner */}
      <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg
        bg-[var(--ev2-gold)]/10 border border-[var(--ev2-gold)]/30">
        <p className="text-sm text-[var(--ev2-text-muted)]">
          Viewing a shared estimate.
        </p>
        <Link
          to="/estimate"
          className="text-xs text-[var(--ev2-gold)] hover:text-[var(--ev2-gold-light)] font-medium whitespace-nowrap"
        >
          Build your own &rarr;
        </Link>
      </div>

      <ResultsPageV2 estimate={estimate} />
    </EstimatorV2Layout>
  );
}
