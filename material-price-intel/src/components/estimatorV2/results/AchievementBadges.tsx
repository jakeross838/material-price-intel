import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { Achievement } from '@/lib/estimatorV2/types';

type Props = {
  achievements: Achievement[];
};

export function AchievementBadges({ achievements }: Props) {
  const { ref, isVisible } = useScrollReveal();

  if (achievements.length === 0) return null;

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-lg font-bold text-[var(--ev2-text)] mb-4">
          Achievements Unlocked
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={isVisible ? { rotateY: 0, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i, ease: 'easeOut' }}
              className="bg-[var(--ev2-surface)] rounded-xl border border-[var(--ev2-gold)]/30 p-4 text-center"
              style={{ perspective: 600 }}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <p className="text-xs font-bold text-[var(--ev2-gold)] leading-tight">
                {badge.label}
              </p>
              <p className="text-[10px] text-[var(--ev2-text-dim)] mt-1 leading-snug">
                {badge.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
