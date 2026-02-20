import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Waves, ArrowUpDown, Flame, Wifi, Zap,
  Anchor, TreePine, ScreenShare, UtensilsCrossed, Plus, Minus,
  Sun, Car, Flower2, Fence, Droplets,
} from 'lucide-react';
import type {
  EstimatorV2Input, PoolType, ElevatorType, FireplaceType, SmartHomeLevel,
  SolarOption, DrivewayType, LandscapingTier, FenceType,
} from '@/lib/estimatorV2/types';
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

function fmtMonthly(amount: number): string {
  const monthly = Math.round(calculateMonthlyPayment(amount));
  return `+$${monthly.toLocaleString()}/mo`;
}

/** Animated checkmark that draws in */
function AnimatedCheck() {
  return (
    <motion.svg
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}

/** Toggle card for boolean features */
function FeatureToggle({
  icon: Icon,
  label,
  description,
  monthlyEstimate,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  monthlyEstimate: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      layout
      className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 ${
        active
          ? 'ring-2 ring-[var(--ev2-gold)] bg-[var(--ev2-gold-glow)] ev2-active-glow'
          : 'bg-[var(--ev2-surface)] border border-[var(--ev2-border)] hover:bg-[var(--ev2-surface-hover)] ev2-card-hover'
      }`}
    >
      <motion.div
        animate={active
          ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
          : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${
          active
            ? 'bg-gradient-to-br from-[var(--ev2-gold)] to-[var(--ev2-blue-light)] text-[var(--ev2-navy-950)]'
            : 'bg-[var(--ev2-navy-800)] text-[var(--ev2-text-dim)]'
        }`}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--ev2-text)]">{label}</p>
          <motion.div
            animate={active
              ? { scale: [0.8, 1.15, 1], backgroundColor: 'var(--ev2-gold)' }
              : { scale: 1 }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
              active
                ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)]'
                : 'border border-[var(--ev2-border)]'
            }`}
          >
            <AnimatePresence>
              {active && <AnimatedCheck />}
            </AnimatePresence>
          </motion.div>
        </div>
        <p className="text-xs text-[var(--ev2-text-muted)] mt-0.5">{description}</p>
        <AnimatePresence>
          {active && (
            <motion.p
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] text-[var(--ev2-gold)] font-medium mt-1"
            >
              {monthlyEstimate}
            </motion.p>
          )}
        </AnimatePresence>
        {!active && (
          <p className="text-[11px] text-[var(--ev2-text-dim)] font-medium mt-1">
            {monthlyEstimate}
          </p>
        )}
      </div>
    </motion.button>
  );
}

/** Multi-option selector (e.g., pool type, elevator type) */
function FeatureSelector<T extends string>({
  icon: Icon,
  label,
  description,
  value,
  options,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  value: T;
  options: { value: T; label: string; cost: number }[];
  onChange: (v: T) => void;
}) {
  const isUpgraded = value !== options[0].value;

  return (
    <motion.div
      animate={isUpgraded
        ? { borderColor: 'rgba(255,255,255,0.25)' }
        : { borderColor: 'rgba(255,255,255,0.10)' }
      }
      className="bg-[var(--ev2-surface)] rounded-xl border p-4 transition-shadow duration-300"
      style={isUpgraded ? { boxShadow: '0 0 20px rgba(91,132,151,0.1)' } : {}}
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          animate={isUpgraded
            ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }
            : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${
            isUpgraded
              ? 'bg-gradient-to-br from-[var(--ev2-gold)] to-[var(--ev2-blue-light)] text-[var(--ev2-navy-950)]'
              : 'bg-[var(--ev2-navy-800)] text-[var(--ev2-text-dim)]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-[var(--ev2-text)]">{label}</p>
          <p className="text-xs text-[var(--ev2-text-muted)]">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.95 }}
              animate={isSelected ? { scale: [0.95, 1.04, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`py-2.5 px-3 rounded-lg text-center transition-all duration-200 ${
                isSelected
                  ? 'bg-[var(--ev2-gold)] text-[var(--ev2-navy-950)] shadow-lg shadow-[var(--ev2-gold-glow)]'
                  : 'bg-[var(--ev2-navy-800)] text-[var(--ev2-text-muted)] hover:bg-[var(--ev2-navy-700)] hover:text-[var(--ev2-text)]'
              }`}
            >
              <p className="text-xs font-semibold">{opt.label}</p>
              {opt.cost > 0 && (
                <p className={`text-[10px] mt-0.5 ${
                  isSelected ? 'text-[var(--ev2-navy-950)]/70' : 'text-[var(--ev2-text-dim)]'
                }`}>
                  {fmtMonthly(opt.cost)}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function SpecialFeaturesStep({ input, updateInput }: Props) {
  const deckPercent = ((input.deckSqft) / 1500) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ev2-blue)]/20 to-[var(--ev2-gold)]/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-7 w-7 text-[var(--ev2-gold)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--ev2-text)]">Special Features</h2>
        <p className="text-[var(--ev2-text-muted)] text-sm mt-1">
          Add the features that make your home extraordinary
        </p>
      </div>

      {/* Group 1: Entertainment & Living */}
      <div className="space-y-4">
        <SectionLabel>Entertainment & Living</SectionLabel>

        <FeatureSelector<PoolType>
          icon={Waves}
          label="Swimming Pool"
          description="Gunite pool with custom finishes"
          value={input.pool}
          onChange={(v) => updateInput('pool', v)}
          options={[
            { value: 'none', label: 'No Pool', cost: 0 },
            { value: 'standard', label: 'Standard', cost: 80000 },
            { value: 'infinity', label: 'Infinity Edge', cost: 150000 },
          ]}
        />

        <FeatureToggle
          icon={UtensilsCrossed}
          label="Outdoor Kitchen"
          description="Built-in grill, sink, counters, and refrigeration"
          monthlyEstimate={fmtMonthly(35000)}
          active={input.outdoorKitchen}
          onClick={() => updateInput('outdoorKitchen', !input.outdoorKitchen)}
        />

        <FeatureSelector<FireplaceType>
          icon={Flame}
          label="Fireplace"
          description="Indoor gas or masonry fireplace"
          value={input.fireplace}
          onChange={(v) => updateInput('fireplace', v)}
          options={[
            { value: 'none', label: 'None', cost: 0 },
            { value: 'linear', label: 'Linear Gas', cost: 8000 },
            { value: 'custom', label: 'Custom Masonry', cost: 20000 },
          ]}
        />

        <FeatureToggle
          icon={ScreenShare}
          label="Screened Porch / Lanai"
          description="Bug-free outdoor living, approximately 10% of home size"
          monthlyEstimate={fmtMonthly(input.sqft * 0.1 * 50)}
          active={input.screenedPorch}
          onClick={() => updateInput('screenedPorch', !input.screenedPorch)}
        />

        {/* Deck sqft */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ev2-text-dim)] uppercase tracking-wider mb-3">
            <TreePine className="h-3.5 w-3.5" />
            Deck / Patio
          </div>
          <div className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-border)] p-4">
            <div className="flex items-baseline justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--ev2-text)] tabular-nums">
                  {input.deckSqft.toLocaleString()}
                </span>
                <span className="text-sm text-[var(--ev2-text-dim)]">SF</span>
              </div>
              {input.deckSqft > 0 && (
                <span className="text-[11px] text-[var(--ev2-gold)] font-medium">
                  {fmtMonthly(input.deckSqft * 40)}
                </span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={1500}
              step={50}
              value={input.deckSqft}
              onChange={(e) => updateInput('deckSqft', parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--ev2-gold)]
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[var(--ev2-gold-glow)]
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--ev2-gold) 0%, var(--ev2-gold) ${deckPercent}%, var(--ev2-navy-800) ${deckPercent}%, var(--ev2-navy-800) 100%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-[var(--ev2-text-dim)] mt-1">
              <span>None</span>
              <span>1,500 SF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Group 2: Infrastructure & Site */}
      <div className="space-y-4">
        <SectionLabel>Infrastructure & Site</SectionLabel>

        <FeatureSelector<SolarOption>
          icon={Sun}
          label="Solar Panels"
          description="Rooftop solar array for energy savings"
          value={input.solarPanels}
          onChange={(v) => updateInput('solarPanels', v)}
          options={[
            { value: 'none', label: 'None', cost: 0 },
            { value: 'partial', label: 'Partial Array', cost: 20000 },
            { value: 'full', label: 'Full Roof', cost: 40000 },
          ]}
        />

        <FeatureSelector<DrivewayType>
          icon={Car}
          label="Driveway"
          description="Driveway material and finish"
          value={input.drivewayType}
          onChange={(v) => updateInput('drivewayType', v)}
          options={[
            { value: 'shell', label: 'Shell', cost: 0 },
            { value: 'concrete', label: 'Concrete', cost: 5000 },
            { value: 'pavers', label: 'Pavers', cost: 15000 },
          ]}
        />

        <FeatureSelector<LandscapingTier>
          icon={Flower2}
          label="Landscaping"
          description="Landscaping design and irrigation"
          value={input.landscapingTier}
          onChange={(v) => updateInput('landscapingTier', v)}
          options={[
            { value: 'sod', label: 'Sod Only', cost: 0 },
            { value: 'basic', label: 'Basic', cost: 8000 },
            { value: 'full', label: 'Full Design', cost: 25000 },
          ]}
        />

        <FeatureSelector<FenceType>
          icon={Fence}
          label="Fence"
          description="Property perimeter fencing"
          value={input.fenceType}
          onChange={(v) => updateInput('fenceType', v)}
          options={[
            { value: 'none', label: 'None', cost: 0 },
            { value: 'vinyl', label: 'Vinyl', cost: 15000 },
            { value: 'aluminum', label: 'Aluminum', cost: 20000 },
            { value: 'wood', label: 'Wood Privacy', cost: 18000 },
          ]}
        />

        <FeatureToggle
          icon={Droplets}
          label="Whole-Home Water Filtration"
          description="Multi-stage filtration system for all water in the home"
          monthlyEstimate={fmtMonthly(5500)}
          active={input.waterFiltration}
          onClick={() => updateInput('waterFiltration', !input.waterFiltration)}
        />

        <FeatureToggle
          icon={Zap}
          label="Whole-Home Generator"
          description="Automatic backup power for the entire home"
          monthlyEstimate={fmtMonthly(15000)}
          active={input.generator}
          onClick={() => updateInput('generator', !input.generator)}
        />

        <FeatureToggle
          icon={Anchor}
          label="Seawall / Bulkhead"
          description="Waterfront protection and dock-ready infrastructure"
          monthlyEstimate={fmtMonthly(65000)}
          active={input.seawall}
          onClick={() => updateInput('seawall', !input.seawall)}
        />
      </div>

      {/* Group 3: Smart & Access */}
      <div className="space-y-4">
        <SectionLabel>Smart & Access</SectionLabel>

        <FeatureSelector<SmartHomeLevel>
          icon={Wifi}
          label="Smart Home"
          description="Home automation & controls"
          value={input.smartHome}
          onChange={(v) => updateInput('smartHome', v)}
          options={[
            { value: 'none', label: 'None', cost: 0 },
            { value: 'basic', label: 'Basic', cost: 6000 },
            { value: 'standard', label: 'Full System', cost: 25000 },
            { value: 'full', label: 'Integrated', cost: 60000 },
          ]}
        />

        <FeatureSelector<ElevatorType>
          icon={ArrowUpDown}
          label="Residential Elevator"
          description="Hydraulic or traction elevator"
          value={input.elevator}
          onChange={(v) => updateInput('elevator', v)}
          options={[
            { value: 'none', label: 'None', cost: 0 },
            { value: '2stop', label: '2-Stop', cost: 50000 },
            { value: '3stop', label: '3-Stop', cost: 75000 },
          ]}
        />
      </div>
    </div>
  );
}
