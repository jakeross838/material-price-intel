/** A single room detected in a floor plan by AI extraction. */
export type ExtractedRoom = {
  name: string;
  room_type: string;
  estimated_sqft: number | null;
  notes: string | null;
};

/** Result from the extract-floor-plan edge function. */
export type FloorPlanExtractionResult = {
  total_sqft: number;
  stories: number;
  bedrooms: number;
  bathrooms: number;
  style: string | null;
  rooms: ExtractedRoom[];
  material_notes: string[];
  confidence: number;
  extraction_notes: string | null;
};
