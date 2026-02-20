import { motion } from 'framer-motion';
import { Palette, AlertTriangle } from 'lucide-react';
import { SelectionCard } from '../SelectionCard';
import type { EstimatorV2Input, ArchStyle, CladdingType, RoofType, WindowGrade } from '@/lib/estimatorV2/types';
import { ARCH_STYLE_META, CLADDING_META, ROOF_META, WINDOW_GRADE_META } from '@/lib/estimatorV2/types';
import { calculateMonthlyPayment } from '@/lib/estimatorV2/types';

type Props = {
  input: EstimatorV2Input;
  updateInput: <K extends keyof EstimatorV2Input>(key: K, value: EstimatorV2Input[K]) => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-xs font-semibold text-[var(--ev2-text-dim)] uppercase tracking-wider whitespace-nowrap">
        {children}
      </h3>
      <div className="flex-1 h-px bg-gradient-to-r from-[var(--ev2-blue)]/30 to-transparent" />
    </div>
  );
}

// Representative Unsplash images for architectural styles
const ARCH_STYLE_IMAGES: Record<ArchStyle, string> = {
  coastal: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop',
  mediterranean: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop',
  modern: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=250&fit=crop',
  craftsman: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=250&fit=crop',
  colonial: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=250&fit=crop',
  farmhouse: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=250&fit=crop',
  tropical: 'https://images.unsplash.com/photo-1600573472591-ee6e68e792d0?w=400&h=250&fit=crop',
};

// Texture swatch images for cladding
const CLADDING_IMAGES: Record<CladdingType, string> = {
  vinyl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=100&h=100&fit=crop',
  fiber_cement: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&h=100&fit=crop',
  stucco: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=100&h=100&fit=crop',
  stucco_stone: 'https://images.unsplash.com/photo-1600573472591-ee6e68e792d0?w=100&h=100&fit=crop',
  natural_stone: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=100&h=100&fit=crop',
  cedar_stone: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=100&h=100&fit=crop',
};

function fmtMonthly(amount: number): string {
  const monthly = Math.round(calculateMonthlyPayment(amount));
  if (monthly > 0) return `+$${monthly.toLocaleString()}/mo`;
  return 'Base';
}

export function StyleExteriorStep({ input, updateInput }: Props) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ev2-blue)]/20 to-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-4">
          <Palette className="h-7 w-7 text-[var(--ev2-gold)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--ev2-text)]">Style & Exterior</h2>
        <p className="text-[var(--ev2-text-muted)] text-sm mt-1">
          Choose the look and feel of your home's exterior
        </p>
      </div>

      {/* Architectural Style */}
      <div>
        <SectionLabel>Architectural Style</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(Object.entries(ARCH_STYLE_META) as [ArchStyle, typeof ARCH_STYLE_META[ArchStyle]][]).map(
            ([key, meta]) => (
              <SelectionCard
                key={key}
                label={meta.label}
                description={meta.description}
                imageUrl={ARCH_STYLE_IMAGES[key]}
                selected={input.archStyle === key}
                onClick={() => updateInput('archStyle', key)}
                tag={meta.popular ? 'Most Popular' : undefined}
              />
            ),
          )}
        </div>
      </div>

      {/* Exterior Cladding */}
      <div>
        <SectionLabel>Exterior Cladding</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.entries(CLADDING_META) as [CladdingType, typeof CLADDING_META[CladdingType]][]).map(
            ([key, meta]) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => updateInput('claddingType', key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                  input.claddingType === key
                    ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)]'
                    : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)]'
                }`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-[var(--ev2-navy-800)]">
                  <img
                    src={CLADDING_IMAGES[key]}
                    alt={meta.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ev2-text)] leading-tight">
                    {meta.label}
                  </p>
                  <p className="text-[10px] text-[var(--ev2-gold)] font-medium mt-0.5 capitalize">
                    {meta.tier} tier
                  </p>
                  {meta.popular && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]">
                      Popular
                    </span>
                  )}
                </div>
              </motion.button>
            ),
          )}
        </div>
      </div>

      {/* Roofing */}
      <div>
        <SectionLabel>Roofing</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.entries(ROOF_META) as [RoofType, typeof ROOF_META[RoofType]][]).map(
            ([key, meta]) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => updateInput('roofType', key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                  input.roofType === key
                    ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)]'
                    : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)]'
                }`}
              >
                <p className="text-sm font-semibold text-[var(--ev2-text)]">{meta.label}</p>
                <p className="text-[10px] text-[var(--ev2-gold)] font-medium mt-0.5 capitalize">
                  {meta.tier} tier
                </p>
                {meta.popular && (
                  <span className="absolute top-2 right-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]">
                    Popular
                  </span>
                )}
              </motion.button>
            ),
          )}
        </div>
      </div>

      {/* Windows */}
      <div>
        <SectionLabel>Window Grade</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(WINDOW_GRADE_META) as [WindowGrade, typeof WINDOW_GRADE_META[WindowGrade]][]).map(
            ([key, meta]) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => updateInput('windowGrade', key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl text-center transition-all duration-200 ${
                  input.windowGrade === key
                    ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)]'
                    : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)]'
                }`}
              >
                <p className="text-sm font-semibold text-[var(--ev2-text)] leading-tight">
                  {meta.label}
                </p>
                {meta.popular && (
                  <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]">
                    Popular
                  </span>
                )}
              </motion.button>
            ),
          )}
        </div>
      </div>

      {/* Elevated Construction */}
      <div>
        <SectionLabel>Elevated Construction</SectionLabel>
        <motion.button
          type="button"
          onClick={() => updateInput('elevatedConstruction', !input.elevatedConstruction)}
          whileHover={{ scale: 1.01 }}
          className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200 ${
            input.elevatedConstruction
              ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)]'
              : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)]'
          }`}
        >
          <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
            input.elevatedConstruction
              ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
              : 'border-2 border-[var(--ev2-border)]'
          }`}>
            {input.elevatedConstruction && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--ev2-text)]">
              Elevated / Piling Construction
            </p>
            <p className="text-xs text-[var(--ev2-text-muted)] mt-1">
              Required for coastal flood zones. Raises the home on concrete or steel pilings above base flood elevation.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[11px] text-amber-400 font-medium">
                Adds significant cost ({fmtMonthly(input.sqft * 40)})
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
