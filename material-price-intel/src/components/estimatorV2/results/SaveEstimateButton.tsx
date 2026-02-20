import { useState } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { useSavedEstimates } from '@/hooks/useSavedEstimates';
import type { EstimatorV2Input } from '@/lib/estimatorV2/types';

type Props = {
  input: EstimatorV2Input;
};

export function SaveEstimateButton({ input }: Props) {
  const { saveEstimate } = useSavedEstimates();
  const [showInput, setShowInput] = useState(false);
  const [label, setLabel] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveEstimate(input, label || undefined);
    setSaved(true);
    setShowInput(false);
    setLabel('');
    setTimeout(() => setSaved(false), 3000);
  };

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
          border border-green-500/30 text-green-400"
      >
        <Check className="h-4 w-4" />
        Saved!
      </button>
    );
  }

  if (showInput) {
    return (
      <div className="inline-flex items-center gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="px-3 py-2 rounded-lg text-sm
            bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
            text-[var(--ev2-text)] placeholder:text-[var(--ev2-text-dim)]/40
            focus:outline-none focus:ring-2 focus:ring-[var(--ev2-gold)]/50
            w-40"
        />
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm font-semibold
            text-[var(--ev2-navy-950)] bg-[var(--ev2-gold)]
            hover:bg-[var(--ev2-gold-light)] transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => { setShowInput(false); setLabel(''); }}
          className="px-3 py-2 rounded-lg text-sm text-[var(--ev2-text-muted)]
            hover:text-[var(--ev2-text)] transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowInput(true)}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
        border border-[var(--ev2-border)] text-[var(--ev2-text)]
        hover:bg-[var(--ev2-surface-hover)] transition-colors"
    >
      <Bookmark className="h-4 w-4" />
      Save Estimate
    </button>
  );
}
