import { motion } from 'framer-motion';

type Props = {
  /** 0=none, 1=foundation, 2=walls, 3=roof, 4=interior, 5=complete */
  progress: number;
};

/**
 * Progressive house reveal SVG. Desktop only.
 * Fills in sections as the user completes steps.
 */
export function HouseSilhouette({ progress }: Props) {
  const gold = 'var(--ev2-gold)';
  const dim = 'var(--ev2-navy-700)';

  return (
    <div className="hidden lg:block w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Foundation */}
        <motion.rect
          x="30" y="160" width="140" height="15" rx="2"
          fill={progress >= 1 ? gold : dim}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: progress >= 1 ? 1 : 0.3 }}
          transition={{ duration: 0.6 }}
        />

        {/* Left wall */}
        <motion.rect
          x="30" y="80" width="12" height="80" rx="1"
          fill={progress >= 2 ? gold : dim}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: progress >= 2 ? 1 : 0.3, opacity: progress >= 2 ? 1 : 0.3 }}
          style={{ originY: 1, originX: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />

        {/* Right wall */}
        <motion.rect
          x="158" y="80" width="12" height="80" rx="1"
          fill={progress >= 2 ? gold : dim}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: progress >= 2 ? 1 : 0.3, opacity: progress >= 2 ? 1 : 0.3 }}
          style={{ originY: 1, originX: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        />

        {/* Roof */}
        <motion.polygon
          points="100,30 20,85 180,85"
          fill={progress >= 3 ? gold : dim}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: progress >= 3 ? 1 : 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />

        {/* Chimney */}
        <motion.rect
          x="140" y="40" width="12" height="35" rx="1"
          fill={progress >= 3 ? gold : dim}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: progress >= 3 ? 1 : 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Door */}
        <motion.rect
          x="88" y="115" width="24" height="45" rx="3"
          fill={progress >= 4 ? gold : dim}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: progress >= 4 ? 0.7 : 0.3 }}
          transition={{ duration: 0.5 }}
        />
        <motion.circle
          cx="107" cy="138" r="2"
          fill={progress >= 4 ? 'var(--ev2-navy-950)' : 'transparent'}
          transition={{ duration: 0.3 }}
        />

        {/* Windows */}
        {[[50, 100], [50, 130], [130, 100], [130, 130]].map(([x, y], i) => (
          <motion.rect
            key={i}
            x={x} y={y} width="18" height="14" rx="2"
            fill={progress >= 4 ? gold : dim}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: progress >= 4 ? 0.6 : 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          />
        ))}

        {/* Glow effect on completion */}
        {progress >= 5 && (
          <motion.rect
            x="20" y="25" width="160" height="155" rx="8"
            fill="none"
            stroke={gold}
            strokeWidth="1.5"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.4, pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}
      </svg>
    </div>
  );
}
