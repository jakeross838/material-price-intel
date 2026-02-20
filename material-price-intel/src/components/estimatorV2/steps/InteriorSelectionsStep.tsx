import { motion } from 'framer-motion';
import { Sofa, Check } from 'lucide-react';
import type {
  EstimatorV2Input, FinishTier, FlooringType, CountertopMaterial, AppliancePackage,
} from '@/lib/estimatorV2/types';
import {
  FINISH_TIER_LABELS, FINISH_TIER_ORDER,
  FLOORING_META, COUNTERTOP_META, APPLIANCE_PACKAGE_META,
} from '@/lib/estimatorV2/types';

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

const TIER_DESCRIPTIONS: Record<FinishTier, string> = {
  builder: 'Cost-effective materials, standard fixtures, functional design',
  standard: 'Quality materials, upgraded fixtures, solid craftsmanship',
  premium: 'High-end materials, designer fixtures, custom details',
  luxury: 'Top-tier materials, bespoke finishes, no compromises',
};

const TIER_PRICE_LABELS: Record<FinishTier, string> = {
  builder: '$',
  standard: '$$',
  premium: '$$$',
  luxury: '$$$$',
};

// Representative texture images for flooring
const FLOORING_IMAGES: Record<FlooringType, string> = {
  lvp: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=100&h=100&fit=crop',
  engineered: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&h=100&fit=crop',
  solid_hardwood: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=100&h=100&fit=crop',
  european_oak: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=100&h=100&fit=crop',
};

// Representative texture images for countertops
const COUNTERTOP_IMAGES: Record<CountertopMaterial, string> = {
  laminate: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop',
  granite: 'https://images.unsplash.com/photo-1600573472591-ee6e68e792d0?w=100&h=100&fit=crop',
  quartz: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=100&h=100&fit=crop',
  marble: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=100&h=100&fit=crop',
};

function TierSelector({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: FinishTier;
  onChange: (v: FinishTier) => void;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-[var(--ev2-text)]">{label}</p>
        {description && (
          <p className="text-[10px] text-[var(--ev2-text-dim)]">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {FINISH_TIER_ORDER.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => onChange(tier)}
            className={`py-2.5 px-2 rounded-lg text-center transition-all duration-200 ${
              value === tier
                ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)] shadow-lg shadow-[var(--ev2-gold-glow)]'
                : 'bg-[var(--ev2-surface)] text-[var(--ev2-text-muted)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)]'
            }`}
          >
            <p className="text-xs font-semibold leading-tight">{FINISH_TIER_LABELS[tier]}</p>
            <p className={`text-[10px] mt-0.5 ${
              value === tier ? 'text-[var(--ev2-navy-950)]/70' : 'text-[var(--ev2-text-dim)]'
            }`}>
              {TIER_PRICE_LABELS[tier]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function MaterialSelector<T extends string>({
  label,
  value,
  onChange,
  options,
  images,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Record<string, { label: string; tier: FinishTier; popular?: boolean }>;
  images: Record<string, string>;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(options) as [T, { label: string; tier: FinishTier; popular?: boolean }][]).map(
          ([key, meta]) => (
            <motion.button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center p-3 rounded-xl text-center transition-all duration-200 ${
                value === key
                  ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)]'
                  : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)]'
              }`}
            >
              {/* Texture swatch */}
              <div className={`w-14 h-14 rounded-full overflow-hidden mb-2 transition-all duration-200 ${
                value === key
                  ? 'ring-2 ring-[var(--ev2-gold)] ring-offset-2 ring-offset-[var(--ev2-navy-950)] scale-110'
                  : 'opacity-70'
              }`}>
                <img
                  src={images[key]}
                  alt={meta.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-xs font-semibold text-[var(--ev2-text)] leading-tight">
                {meta.label}
              </p>
              <p className="text-[10px] text-[var(--ev2-text-dim)] capitalize mt-0.5">
                {meta.tier}
              </p>
              {meta.popular && (
                <span className="absolute top-1.5 right-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]">
                  Popular
                </span>
              )}
              {value === key && (
                <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)] flex items-center justify-center">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}

export function InteriorSelectionsStep({ input, updateInput }: Props) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ev2-blue)]/20 to-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-4">
          <Sofa className="h-7 w-7 text-[var(--ev2-gold)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--ev2-text)]">Interior Selections</h2>
        <p className="text-[var(--ev2-text-muted)] text-sm mt-1">
          Choose your finish level and key interior materials
        </p>
      </div>

      {/* Overall Finish Level */}
      <div>
        <SectionLabel>Overall Finish Level</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FINISH_TIER_ORDER.map((tier) => (
            <motion.button
              key={tier}
              type="button"
              onClick={() => updateInput('finishLevel', tier)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                input.finishLevel === tier
                  ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)]'
                  : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[var(--ev2-text)]">
                  {FINISH_TIER_LABELS[tier]}
                </p>
                <span className={`text-xs font-semibold ${
                  input.finishLevel === tier ? 'text-[var(--ev2-gold)]' : 'text-[var(--ev2-text-dim)]'
                }`}>
                  {TIER_PRICE_LABELS[tier]}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ev2-text-muted)] leading-relaxed">
                {TIER_DESCRIPTIONS[tier]}
              </p>
              {tier === 'standard' && (
                <span className="absolute top-2 right-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]">
                  Most Popular
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Kitchen & Bathroom Tier Overrides */}
      <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] p-4 space-y-4">
        <p className="text-xs text-[var(--ev2-text-dim)]">
          Optionally upgrade specific rooms beyond your overall finish level:
        </p>
        <TierSelector
          label="Kitchen Tier"
          value={input.kitchenTier}
          onChange={(v) => updateInput('kitchenTier', v)}
          description="Cabinets, appliances, countertops"
        />
        <TierSelector
          label="Bathroom Tier"
          value={input.bathroomTier}
          onChange={(v) => updateInput('bathroomTier', v)}
          description="Vanities, fixtures, tile"
        />
      </div>

      {/* Flooring */}
      <MaterialSelector<FlooringType>
        label="Flooring"
        value={input.flooringType}
        onChange={(v) => updateInput('flooringType', v)}
        options={FLOORING_META}
        images={FLOORING_IMAGES}
      />

      {/* Countertops */}
      <MaterialSelector<CountertopMaterial>
        label="Countertop Material"
        value={input.countertopMaterial}
        onChange={(v) => updateInput('countertopMaterial', v)}
        options={COUNTERTOP_META}
        images={COUNTERTOP_IMAGES}
      />

      {/* Kitchen Appliance Package */}
      <div>
        <SectionLabel>Kitchen Appliance Package</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(APPLIANCE_PACKAGE_META) as [AppliancePackage, { label: string }][]).map(
            ([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateInput('appliancePackage', key)}
                className={`py-2.5 px-3 rounded-lg text-center transition-all duration-200 ${
                  input.appliancePackage === key
                    ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)] shadow-lg shadow-[var(--ev2-gold-glow)]'
                    : 'bg-[var(--ev2-surface)] text-[var(--ev2-text-muted)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)] hover:text-[var(--ev2-text)]'
                }`}
              >
                <p className="text-xs font-semibold">{meta.label}</p>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
