// ===========================================
// Achievement Badge Engine
// Evaluates which badges the user has earned
// based on their estimator selections.
// ===========================================

import type { EstimatorV2Input, Achievement, AchievementId } from './types';

type AchievementDef = Achievement & {
  /** Returns true if the user earned this badge */
  testFn: (input: EstimatorV2Input) => boolean;
};

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'island_ready',
    label: 'Island Ready',
    description: 'Elevated construction with hurricane-grade windows — ready for waterfront living',
    icon: '🏝️',
    testFn: (i) => i.elevatedConstruction && (i.windowGrade === 'hurricane' || i.windowGrade === 'full_wall'),
  },
  {
    id: 'eco_warrior',
    label: 'Eco Warrior',
    description: 'Solar power + premium construction = minimal carbon footprint',
    icon: '🌿',
    testFn: (i) => i.solarPanels !== 'none' && (i.finishLevel === 'premium' || i.finishLevel === 'luxury'),
  },
  {
    id: 'chefs_paradise',
    label: "Chef's Paradise",
    description: 'Premium+ kitchen with top-tier appliances and countertops',
    icon: '👨‍🍳',
    testFn: (i) =>
      (i.kitchenTier === 'premium' || i.kitchenTier === 'luxury') &&
      (i.countertopMaterial === 'quartz' || i.countertopMaterial === 'marble'),
  },
  {
    id: 'resort_living',
    label: 'Resort Living',
    description: 'Pool + outdoor kitchen = permanent vacation at home',
    icon: '🌴',
    testFn: (i) => i.pool !== 'none' && i.outdoorKitchen,
  },
  {
    id: 'smart_estate',
    label: 'Smart Estate',
    description: 'Full smart home integration with automated everything',
    icon: '🤖',
    testFn: (i) => i.smartHome === 'full' || i.smartHome === 'standard',
  },
  {
    id: 'hurricane_proof',
    label: 'Hurricane Proof',
    description: 'Impact windows + generator + premium construction = storm ready',
    icon: '🛡️',
    testFn: (i) =>
      (i.windowGrade === 'hurricane' || i.windowGrade === 'full_wall') &&
      i.generator,
  },
  {
    id: 'entertainer',
    label: 'The Entertainer',
    description: 'Outdoor kitchen + fireplace + generous deck space',
    icon: '🎉',
    testFn: (i) =>
      i.outdoorKitchen && i.fireplace !== 'none' && i.deckSqft >= 200,
  },
  {
    id: 'sky_high',
    label: 'Sky High',
    description: 'Multi-story home with elevator access',
    icon: '🏗️',
    testFn: (i) => i.stories >= 2 && i.elevator !== 'none',
  },
];

/**
 * Evaluate which achievements the user has earned.
 */
export function evaluateAchievements(input: EstimatorV2Input): Achievement[] {
  return ACHIEVEMENT_DEFS
    .filter((def) => def.testFn(input))
    .map(({ id, label, description, icon }) => ({ id, label, description, icon }));
}

/**
 * Get all possible achievements (for display/preview).
 */
export function getAllAchievements(): Omit<AchievementDef, 'testFn'>[] {
  return ACHIEVEMENT_DEFS.map(({ id, label, description, icon }) => ({
    id: id as AchievementId,
    label,
    description,
    icon,
  }));
}
