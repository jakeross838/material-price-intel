import { motion, AnimatePresence } from 'framer-motion';
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
      whileTap={{ scale: 0.96 }}
      animate={selected ? { scale: [0.97, 1.03, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`
        relative text-left rounded-xl overflow-hidden transition-all duration-200 w-full
        ${selected
          ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)] ev2-active-glow'
          : 'bg-[var(--ev2-surface)] hover:bg-[var(--ev2-surface-hover)] border border-[var(--ev2-border)] ev2-card-hover'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Image */}
      {imageUrl && (
        <div className="aspect-[16/10] overflow-hidden bg-[var(--ev2-navy-800)]">
          <img
            src={imageUrl}
            alt={label}
            className={`w-full h-full object-cover transition-all duration-300 ${
              selected ? 'opacity-100 scale-105' : 'opacity-80 hover:opacity-90'
            }`}
            loading="lazy"
          />
          {/* Selected shimmer overlay */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-[var(--ev2-navy-950)]/60 via-transparent to-[var(--ev2-blue)]/10 pointer-events-none"
              />
            )}
          </AnimatePresence>
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
          <motion.div
            animate={selected
              ? { scale: [0.5, 1.2, 1] }
              : { scale: 1 }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`
              w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 transition-colors
              ${selected
                ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                : 'border border-[var(--ev2-border)]'}
            `}
          >
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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
