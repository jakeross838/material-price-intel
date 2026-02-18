import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { ScheduleResult } from '@/lib/estimatorV2/types';

type Props = {
  schedule: ScheduleResult;
};

export function ScheduleTimeline({ schedule }: Props) {
  const { ref, isVisible } = useScrollReveal();
  const totalWeeks = schedule.totalWeeks;

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--ev2-text)]">
            Construction Timeline
          </h3>
          <div className="text-right">
            <span className="text-2xl font-bold text-[var(--ev2-gold)] tabular-nums">
              {schedule.totalMonths}
            </span>
            <span className="text-sm text-[var(--ev2-text-dim)] ml-1">months</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {schedule.phases.map((phase, i) => {
            const widthPercent = totalWeeks > 0 ? (phase.durationWeeks / totalWeeks) * 100 : 0;
            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="flex items-center gap-3"
              >
                {/* Phase number */}
                <div className="w-6 h-6 rounded-full bg-[var(--ev2-gold)]/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[var(--ev2-gold)]">{i + 1}</span>
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-[var(--ev2-text)] truncate">
                      {phase.name}
                    </span>
                    <span className="text-[10px] text-[var(--ev2-text-dim)] tabular-nums shrink-0 ml-2">
                      {phase.durationWeeks.toFixed(1)} wks
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--ev2-navy-800)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--ev2-gold)]"
                      initial={{ width: 0 }}
                      animate={isVisible ? { width: `${Math.max(widthPercent, 3)}%` } : { width: 0 }}
                      transition={{ duration: 0.6, delay: 0.05 * i, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
