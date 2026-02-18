import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

type Props = {
  label: string;
  description?: string;
  imageUrl?: string;
  selected: boolean;
  onClick: () => void;
  tag?: string; // "Most Popular", "Best Value", "Builder's Choice"
  priceImpact?: string; // "+$47/month"
  disabled?: boolean;
};

export function SelectionCard({
  label,
  description,
  imageUrl,
  selected,
  onClick,
  tag,
  priceImpact,
  disabled,
}: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative text-left rounded-xl overflow-hidden transition-all duration-200 w-full
        ${selected
          ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)]'
          : 'bg-[var(--ev2-surface)] hover:bg-[var(--ev2-surface-hover)] border border-[var(--ev2-border)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Image */}
      {imageUrl && (
        <div className="aspect-[16/10] overflow-hidden bg-[var(--ev2-navy-800)]">
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ev2-text)] leading-tight">
              {label}
            </p>
            {description && (
              <p className="text-xs text-[var(--ev2-text-muted)] mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          {/* Check indicator */}
          <div
            className={`
              w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5
              ${selected
                ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                : 'border border-[var(--ev2-border)]'}
            `}
          >
            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
          </div>
        </div>

        {/* Price impact */}
        {priceImpact && (
          <p className="text-[11px] text-[var(--ev2-gold)] font-medium mt-2">
            {priceImpact}
          </p>
        )}
      </div>

      {/* Tag badge */}
      {tag && (
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]">
            {tag}
          </span>
        </div>
      )}
    </motion.button>
  );
}
