import { motion, AnimatePresence } from 'framer-motion';
import { Home, MapPin, Plus, Minus } from 'lucide-react';
import type { EstimatorV2Input, Stories, GarageSpaces, CeilingHeight, SewerType, WaterSource } from '@/lib/estimatorV2/types';
import { LOCATIONS } from '@/lib/estimatorV2/locations';

type Props = {
  input: EstimatorV2Input;
  updateInput: <K extends keyof EstimatorV2Input>(key: K, value: EstimatorV2Input[K]) => void;
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
      <h3 className="text-xs font-semibold text-[var(--ev2-text-dim)] uppercase tracking-wider whitespace-nowrap">
        {children}
      </h3>
      <div className="flex-1 h-px bg-gradient-to-r from-[var(--ev2-blue)]/30 to-transparent" />
    </motion.div>
  );
}

function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center justify-between p-3 rounded-xl bg-[var(--ev2-surface)] border border-[var(--ev2-border)]"
    >
      <span className="text-sm font-medium text-[var(--ev2-text)]">{label}</span>
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          whileTap={{ scale: 0.85 }}
          className="w-8 h-8 rounded-full flex items-center justify-center
            bg-[var(--ev2-navy-800)] text-[var(--ev2-text-muted)]
            hover:bg-[var(--ev2-navy-700)] hover:text-[var(--ev2-text)]
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </motion.button>
        <motion.span
          key={value}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="text-lg font-bold text-[var(--ev2-text)] tabular-nums w-8 text-center"
        >
          {value}
        </motion.span>
        <motion.button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          whileTap={{ scale: 0.85 }}
          className="w-8 h-8 rounded-full flex items-center justify-center
            bg-[var(--ev2-navy-800)] text-[var(--ev2-text-muted)]
            hover:bg-[var(--ev2-navy-700)] hover:text-[var(--ev2-text)]
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function ToggleGroup<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <motion.div variants={fadeUp} className="flex gap-2">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <motion.button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            animate={isSelected ? { scale: [0.95, 1.05, 1] } : {}}
            transition={{ duration: 0.25 }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)] shadow-lg shadow-[var(--ev2-gold-glow)]'
                : 'bg-[var(--ev2-surface)] text-[var(--ev2-text-muted)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)] hover:text-[var(--ev2-text)]'
            }`}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export function HomeBasicsStepV2({ input, updateInput }: Props) {
  const sqftPercent = ((input.sqft - 1200) / (10000 - 1200)) * 100;

  return (
    <motion.div
      className="space-y-8"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-14 h-14 rounded-2xl bg-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-4"
        >
          <Home className="h-7 w-7 text-[var(--ev2-gold)]" />
        </motion.div>
        <h2 className="text-2xl font-bold text-[var(--ev2-text)]">Home Basics</h2>
        <p className="text-[var(--ev2-text-muted)] text-sm mt-1">
          Define the size and layout of your dream home
        </p>
      </motion.div>

      {/* Square Footage */}
      <motion.div variants={fadeUp}>
        <SectionLabel>Square Footage</SectionLabel>
        <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] p-4">
          <div className="flex items-baseline justify-between mb-3">
            <motion.span
              key={input.sqft}
              initial={{ scale: 1.15, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-3xl font-bold text-[var(--ev2-text)] tabular-nums"
            >
              {input.sqft.toLocaleString()}
            </motion.span>
            <span className="text-sm text-[var(--ev2-text-dim)]">SF</span>
          </div>
          <input
            type="range"
            min={1200}
            max={10000}
            step={100}
            value={input.sqft}
            onChange={(e) => updateInput('sqft', parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--ev2-gold)]
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[var(--ev2-gold-glow)]
              [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--ev2-gold) 0%, var(--ev2-gold) ${sqftPercent}%, var(--ev2-navy-800) ${sqftPercent}%, var(--ev2-navy-800) 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-[var(--ev2-text-dim)] mt-1">
            <span>1,200 SF</span>
            <span>10,000 SF</span>
          </div>
        </div>
      </motion.div>

      {/* Stories */}
      <motion.div variants={fadeUp}>
        <SectionLabel>Stories</SectionLabel>
        <ToggleGroup<Stories>
          value={input.stories}
          options={[
            { value: 1, label: '1 Story' },
            { value: 2, label: '2 Story' },
            { value: 3, label: '3 Story' },
          ]}
          onChange={(v) => updateInput('stories', v)}
        />
      </motion.div>

      {/* Bedrooms & Bathrooms */}
      <motion.div variants={fadeUp}>
        <SectionLabel>Bedrooms & Bathrooms</SectionLabel>
        <div className="space-y-2">
          <Counter
            label="Bedrooms"
            value={input.bedrooms}
            min={2}
            max={8}
            onChange={(v) => updateInput('bedrooms', v)}
          />
          <Counter
            label="Bathrooms"
            value={input.bathrooms}
            min={1}
            max={8}
            onChange={(v) => updateInput('bathrooms', v)}
          />
        </div>
      </motion.div>

      {/* Garage */}
      <motion.div variants={fadeUp}>
        <SectionLabel>Garage</SectionLabel>
        <ToggleGroup<GarageSpaces>
          value={input.garageSpaces}
          options={[
            { value: 0, label: 'None' },
            { value: 1, label: '1 Car' },
            { value: 2, label: '2 Car' },
            { value: 3, label: '3 Car' },
          ]}
          onChange={(v) => updateInput('garageSpaces', v)}
        />
      </motion.div>

      {/* Site & Lot */}
      <motion.div variants={fadeUp}>
        <SectionLabel>Site & Lot</SectionLabel>
        <div className="space-y-4">
          {/* Lot Size */}
          <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] p-4">
            <div className="flex items-baseline justify-between mb-3">
              <motion.span
                key={input.lotSize}
                initial={{ scale: 1.15, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="text-3xl font-bold text-[var(--ev2-text)] tabular-nums"
              >
                {input.lotSize.toFixed(2)}
              </motion.span>
              <span className="text-sm text-[var(--ev2-text-dim)]">acres</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.05}
              value={input.lotSize}
              onChange={(e) => updateInput('lotSize', parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--ev2-gold)]
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[var(--ev2-gold-glow)]
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--ev2-gold) 0%, var(--ev2-gold) ${((input.lotSize - 0.1) / (5 - 0.1)) * 100}%, var(--ev2-navy-800) ${((input.lotSize - 0.1) / (5 - 0.1)) * 100}%, var(--ev2-navy-800) 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-[var(--ev2-text-dim)] mt-1">
              <span>0.10 acres</span>
              <span>5.00 acres</span>
            </div>
          </div>

          {/* Ceiling Height */}
          <div>
            <label className="block text-xs text-[var(--ev2-text-dim)] mb-1.5">Ceiling Height</label>
            <ToggleGroup<CeilingHeight>
              value={input.ceilingHeight}
              options={[
                { value: 9, label: '9 ft' },
                { value: 10, label: '10 ft' },
                { value: 12, label: '12 ft' },
              ]}
              onChange={(v) => updateInput('ceilingHeight', v)}
            />
          </div>

          {/* Sewer */}
          <div>
            <label className="block text-xs text-[var(--ev2-text-dim)] mb-1.5">Sewer</label>
            <ToggleGroup<SewerType>
              value={input.sewerType}
              options={[
                { value: 'city', label: 'City Sewer' },
                { value: 'septic', label: 'Septic' },
              ]}
              onChange={(v) => updateInput('sewerType', v)}
            />
          </div>

          {/* Water Source */}
          <div>
            <label className="block text-xs text-[var(--ev2-text-dim)] mb-1.5">Water Source</label>
            <ToggleGroup<WaterSource>
              value={input.waterSource}
              options={[
                { value: 'city', label: 'City Water' },
                { value: 'well', label: 'Well' },
              ]}
              onChange={(v) => updateInput('waterSource', v)}
            />
          </div>

          {/* Flood Zone */}
          <div>
            <label className="block text-xs text-[var(--ev2-text-dim)] mb-1.5">Flood Zone</label>
            <motion.button
              type="button"
              onClick={() => updateInput('floodZone', !input.floodZone)}
              whileTap={{ scale: 0.95 }}
              animate={input.floodZone ? { scale: [0.95, 1.05, 1] } : {}}
              transition={{ duration: 0.25 }}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                input.floodZone
                  ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)] shadow-lg shadow-[var(--ev2-gold-glow)]'
                  : 'bg-[var(--ev2-surface)] text-[var(--ev2-text-muted)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)] hover:text-[var(--ev2-text)]'
              }`}
            >
              {input.floodZone ? 'Yes — Flood Zone' : 'No Flood Zone'}
            </motion.button>
            <p className="text-[10px] text-[var(--ev2-text-dim)] mt-1.5">
              Adds elevated construction & flood zone premiums
            </p>
          </div>
        </div>
      </motion.div>

      {/* Location */}
      <motion.div variants={fadeUp}>
        <SectionLabel>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Build Location
          </div>
        </SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LOCATIONS.map((loc) => {
            const isLocSelected = input.location === loc.id;
            return (
            <motion.button
              key={loc.id}
              type="button"
              onClick={() => updateInput('location', loc.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              animate={isLocSelected ? { scale: [0.95, 1.05, 1] } : {}}
              transition={{ duration: 0.25 }}
              className={`relative p-3 rounded-xl text-left transition-all duration-200 ${
                isLocSelected
                  ? 'bg-[var(--ev2-gold-glow)] ring-2 ring-[var(--ev2-gold)] ev2-active-glow'
                  : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)] ev2-card-hover'
              }`}
            >
              <p className={`text-sm font-semibold leading-tight ${
                isLocSelected ? 'text-[var(--ev2-text)]' : 'text-[var(--ev2-text-muted)]'
              }`}>
                {loc.label}
              </p>
              {loc.multiplier > 1 && (
                <p className="text-[10px] text-[var(--ev2-gold)] font-medium mt-1">
                  +{Math.round((loc.multiplier - 1) * 100)}%
                </p>
              )}
            </motion.button>
            );
          })}
        </div>
        {input.location && (
          <p className="text-xs text-[var(--ev2-text-dim)] mt-2">
            {LOCATIONS.find((l) => l.id === input.location)?.description}
          </p>
        )}

        {/* Lot Address */}
        <div className="mt-4">
          <label className="block text-xs text-[var(--ev2-text-dim)] mb-1.5">
            Lot Address <span className="text-[var(--ev2-text-dim)]/60">(optional)</span>
          </label>
          <input
            type="text"
            value={input.lotAddress}
            onChange={(e) => updateInput('lotAddress', e.target.value)}
            placeholder="123 Main St, Bradenton, FL 34209"
            className="w-full px-3 py-2.5 rounded-lg text-sm
              bg-[var(--ev2-surface)] border border-[var(--ev2-border)]
              text-[var(--ev2-text)] placeholder:text-[var(--ev2-text-dim)]/40
              focus:outline-none focus:ring-2 focus:ring-[var(--ev2-gold)]/50 focus:border-[var(--ev2-gold)]
              transition-colors"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
