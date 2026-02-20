// ===========================================
// Construction Schedule Engine
// 12-phase timeline with durations scaling by size & finish
// ===========================================

import type { EstimatorV2Input, SchedulePhase, ScheduleResult } from './types';

type PhaseTemplate = {
  id: string;
  name: string;
  baseWeeks: number;
  /** Extra weeks per 1,000 SF above 2,000 */
  sizeScale: number;
  /** Extra weeks for premium/luxury finish */
  finishScale: Record<string, number>;
  description: string;
};

const PHASE_TEMPLATES: PhaseTemplate[] = [
  {
    id: 'permitting',
    name: 'Permitting & Approvals',
    baseWeeks: 4,
    sizeScale: 0,
    finishScale: { builder: 0, standard: 0, premium: 1, luxury: 2 },
    description: 'Building permits, HOA approvals, utility coordination',
  },
  {
    id: 'site_prep',
    name: 'Site Preparation',
    baseWeeks: 2,
    sizeScale: 0.3,
    finishScale: { builder: 0, standard: 0, premium: 0.5, luxury: 1 },
    description: 'Clearing, grading, erosion control, temporary utilities',
  },
  {
    id: 'foundation',
    name: 'Foundation',
    baseWeeks: 3,
    sizeScale: 0.5,
    finishScale: { builder: 0, standard: 0, premium: 1, luxury: 2 },
    description: 'Footings, slab or pilings, waterproofing, backfill',
  },
  {
    id: 'framing',
    name: 'Framing & Structure',
    baseWeeks: 4,
    sizeScale: 0.8,
    finishScale: { builder: 0, standard: 0, premium: 1, luxury: 2 },
    description: 'Wall framing, roof trusses, sheathing, windows rough opening',
  },
  {
    id: 'roofing',
    name: 'Roofing & Dry-In',
    baseWeeks: 2,
    sizeScale: 0.3,
    finishScale: { builder: 0, standard: 0, premium: 0.5, luxury: 1 },
    description: 'Underlayment, roofing material, flashing, dry-in inspection',
  },
  {
    id: 'mep_rough',
    name: 'MEP Rough-In',
    baseWeeks: 3,
    sizeScale: 0.5,
    finishScale: { builder: 0, standard: 0.5, premium: 1, luxury: 2 },
    description: 'Plumbing, HVAC ductwork, electrical wiring, low-voltage',
  },
  {
    id: 'exterior',
    name: 'Exterior Finishes',
    baseWeeks: 3,
    sizeScale: 0.5,
    finishScale: { builder: 0, standard: 0.5, premium: 1, luxury: 2 },
    description: 'Siding/stucco, windows, exterior doors, paint',
  },
  {
    id: 'insulation_drywall',
    name: 'Insulation & Drywall',
    baseWeeks: 3,
    sizeScale: 0.5,
    finishScale: { builder: 0, standard: 0, premium: 0.5, luxury: 1 },
    description: 'Insulation install, drywall hang, tape, mud, texture/smooth',
  },
  {
    id: 'interior_finishes',
    name: 'Interior Finishes',
    baseWeeks: 5,
    sizeScale: 1.0,
    finishScale: { builder: 0, standard: 1, premium: 2, luxury: 4 },
    description: 'Cabinets, countertops, tile, flooring, trim, paint, closets',
  },
  {
    id: 'mep_trim',
    name: 'MEP Trim & Fixtures',
    baseWeeks: 2,
    sizeScale: 0.3,
    finishScale: { builder: 0, standard: 0, premium: 0.5, luxury: 1 },
    description: 'Fixture install, panel termination, HVAC startup, appliances',
  },
  {
    id: 'specialty',
    name: 'Specialty Features',
    baseWeeks: 0,
    sizeScale: 0,
    finishScale: { builder: 0, standard: 0, premium: 0, luxury: 0 },
    description: 'Pool, elevator, outdoor kitchen, smart home integration',
  },
  {
    id: 'final',
    name: 'Final Inspections & Punch List',
    baseWeeks: 2,
    sizeScale: 0.3,
    finishScale: { builder: 0, standard: 0.5, premium: 1, luxury: 2 },
    description: 'CO inspection, punch list, final clean, landscaping, walkthrough',
  },
];

/**
 * Calculate specialty phase duration based on selected features.
 */
function specialtyWeeks(input: EstimatorV2Input): number {
  let weeks = 0;
  if (input.pool !== 'none') weeks += input.pool === 'infinity' ? 10 : 6;
  if (input.elevator !== 'none') weeks += 4;
  if (input.outdoorKitchen) weeks += 2;
  if (input.seawall) weeks += 4;
  if (input.smartHome === 'full') weeks += 2;
  else if (input.smartHome === 'standard') weeks += 1;
  if (input.solarPanels !== 'none') weeks += input.solarPanels === 'full' ? 2 : 1;
  if (input.sewerType === 'septic') weeks += 1;
  if (input.waterSource === 'well') weeks += 1;
  return weeks;
}

export function calculateSchedule(input: EstimatorV2Input): ScheduleResult {
  const extraThousandSF = Math.max(0, (input.sqft - 2000) / 1000);
  const phases: SchedulePhase[] = [];

  for (const template of PHASE_TEMPLATES) {
    let duration = template.baseWeeks;

    // Size scaling
    duration += template.sizeScale * extraThousandSF;

    // Finish level scaling
    duration += template.finishScale[input.finishLevel] ?? 0;

    // Multi-story adds to framing & MEP
    if (input.stories > 1 && ['framing', 'mep_rough', 'insulation_drywall'].includes(template.id)) {
      duration += (input.stories - 1) * 1.5;
    }

    // Elevated construction or flood zone adds to foundation
    if ((input.elevatedConstruction || input.floodZone) && template.id === 'foundation') {
      duration += 3;
    }

    // 12-ft ceilings add time to framing, insulation/drywall, interior finishes
    if (input.ceilingHeight === 12 && ['framing', 'insulation_drywall', 'interior_finishes'].includes(template.id)) {
      duration += 0.5;
    }

    // Specialty phase override
    if (template.id === 'specialty') {
      duration = specialtyWeeks(input);
    }

    // Round to nearest 0.5 week
    duration = Math.round(duration * 2) / 2;

    if (duration <= 0) continue;

    phases.push({
      id: template.id,
      name: template.name,
      durationWeeks: duration,
      description: template.description,
    });
  }

  const totalWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
  const totalMonths = Math.round((totalWeeks / 4.33) * 10) / 10;

  return { phases, totalWeeks, totalMonths };
}
