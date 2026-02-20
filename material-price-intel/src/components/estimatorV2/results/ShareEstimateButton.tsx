import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useShareEstimate } from '@/hooks/useShareEstimate';
import type { V2EstimateResult } from '@/lib/estimatorV2/types';

type Props = {
  estimate: V2EstimateResult;
};

export function ShareEstimateButton({ estimate }: Props) {
  const [copied, setCopied] = useState(false);
  const shareMutation = useShareEstimate();

  const handleShare = async () => {
    try {
      const id = await shareMutation.mutateAsync({
        input: estimate.input,
        estimateLow: estimate.totalLow,
        estimateHigh: estimate.totalHigh,
      });

      const url = `${window.location.origin}/estimate/shared/${id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Silently fail — the button already shows loading state
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={shareMutation.isPending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
        border border-[var(--ev2-border)] text-[var(--ev2-text)]
        hover:bg-[var(--ev2-surface-hover)] transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-400" />
          Link Copied!
        </>
      ) : shareMutation.isPending ? (
        <>
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Sharing...
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share Estimate
        </>
      )}
    </button>
  );
}
