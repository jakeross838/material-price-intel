// ===========================================
// Room Type Configuration
// Static display metadata for the 10 room types
// used by the material catalog browse flow.
// ===========================================

export const ROOM_TYPES = [
  'kitchen', 'master_bath', 'bathroom', 'great_room', 'bedroom',
  'dining_room', 'office', 'laundry', 'garage', 'exterior',
] as const;

export type CatalogRoomType = typeof ROOM_TYPES[number];

export const ROOM_TYPE_CONFIG: Record<CatalogRoomType, {
  displayName: string;
  description: string;
  icon: string; // lucide icon name for reference
}> = {
  kitchen: { displayName: 'Kitchen', description: 'Cabinets, countertops, backsplash, flooring, fixtures', icon: 'ChefHat' },
  master_bath: { displayName: 'Master Bath', description: 'Tile, vanities, fixtures, plumbing, mirrors', icon: 'Bath' },
  bathroom: { displayName: 'Bathroom', description: 'Tile, fixtures, plumbing, vanity', icon: 'ShowerHead' },
  great_room: { displayName: 'Great Room', description: 'Flooring, lighting, windows, paint', icon: 'Sofa' },
  bedroom: { displayName: 'Bedroom', description: 'Flooring, lighting, windows, paint', icon: 'Bed' },
  dining_room: { displayName: 'Dining Room', description: 'Flooring, lighting, windows, paint', icon: 'UtensilsCrossed' },
  office: { displayName: 'Office', description: 'Flooring, lighting, paint', icon: 'Monitor' },
  laundry: { displayName: 'Laundry', description: 'Tile, plumbing, cabinets, fixtures', icon: 'WashingMachine' },
  garage: { displayName: 'Garage', description: 'Flooring, paint', icon: 'Car' },
  exterior: { displayName: 'Exterior', description: 'Roofing, windows, siding, landscaping', icon: 'Home' },
};
