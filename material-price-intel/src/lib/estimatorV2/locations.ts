// ===========================================
// Location Multipliers — Bradenton/Sarasota FL Market
// ===========================================

export type LocationConfig = {
  id: string;
  label: string;
  multiplier: number;
  description: string;
  /** Approximate distance from Bradenton in miles */
  distanceMi: number;
};

export const LOCATIONS: LocationConfig[] = [
  {
    id: 'bradenton',
    label: 'Bradenton',
    multiplier: 1.0,
    description: 'Base market — most competitive contractor pricing',
    distanceMi: 0,
  },
  {
    id: 'sarasota',
    label: 'Sarasota',
    multiplier: 1.02,
    description: 'Slightly higher material delivery costs',
    distanceMi: 15,
  },
  {
    id: 'lakewood_ranch',
    label: 'Lakewood Ranch',
    multiplier: 1.03,
    description: 'Master-planned community with HOA requirements',
    distanceMi: 12,
  },
  {
    id: 'palmetto',
    label: 'Palmetto',
    multiplier: 1.0,
    description: 'Similar to Bradenton pricing',
    distanceMi: 5,
  },
  {
    id: 'siesta_key',
    label: 'Siesta Key',
    multiplier: 1.05,
    description: 'Island access adds logistics cost, flood zone considerations',
    distanceMi: 22,
  },
  {
    id: 'longboat_key',
    label: 'Longboat Key',
    multiplier: 1.06,
    description: 'Barrier island — elevated requirements, limited access',
    distanceMi: 25,
  },
  {
    id: 'bird_key',
    label: 'Bird Key / St. Armands',
    multiplier: 1.06,
    description: 'Island premium with strict building requirements',
    distanceMi: 20,
  },
  {
    id: 'anna_maria',
    label: 'Anna Maria Island',
    multiplier: 1.08,
    description: 'Highest logistics cost — island delivery, FEMA flood zone',
    distanceMi: 18,
  },
];

export const LOCATION_MAP = new Map(LOCATIONS.map((l) => [l.id, l]));

export function getLocationMultiplier(locationId: string): number {
  return LOCATION_MAP.get(locationId)?.multiplier ?? 1.0;
}

export function getLocationLabel(locationId: string): string {
  return LOCATION_MAP.get(locationId)?.label ?? locationId;
}
