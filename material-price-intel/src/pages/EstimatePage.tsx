import { useState, useMemo, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { EstimatorLayout } from "@/components/estimator/EstimatorLayout";
import { EstimatorProgress } from "@/components/estimator/EstimatorProgress";
import { GettingStartedStep } from "@/components/estimator/steps/GettingStartedStep";
import { HomeBasicsStep } from "@/components/estimator/steps/HomeBasicsStep";
import { RoomSelectionStep } from "@/components/estimator/steps/RoomSelectionStep";
import { RoomDesignStep } from "@/components/estimator/steps/RoomDesignStep";
import { EstimateResults } from "@/components/estimator/EstimateResults";
import { LeadCaptureForm } from "@/components/estimator/LeadCaptureForm";
import { useAllEstimatorConfig } from "@/hooks/useEstimator";
import { calculateRoomEstimate } from "@/lib/estimateCalculator";
import type { RoomSelections, RoomEstimateResult } from "@/lib/estimateCalculator";
import type { FinishLevel, EstimateParams } from "@/lib/types";
import type { FloorPlanExtractionResult } from "@/lib/floorPlanTypes";
import { ROOM_TEMPLATES } from "@/lib/roomEstimatorData";

// -------------------------------------------
// Local types for room selection / design state
// -------------------------------------------

/** Room entry as tracked by RoomSelectionStep (grouped, with count). */
type SelectedRoom = {
  roomId: string;
  displayName: string;
  count: number;
};

/** Per-room, per-category finish choice as tracked by RoomDesignStep. */
type RoomCategorySelection = {
  roomId: string;
  category: string;
  finishLevel: FinishLevel;
};

// -------------------------------------------
// Mapping from selection step room IDs to
// ROOM_TEMPLATE IDs used by the design step
// -------------------------------------------

type ExpandedRoom = {
  roomId: string;
  displayName: string;
  count: number;
};

/**
 * Expand the grouped room list from RoomSelectionStep into
 * individual room entries suitable for RoomDesignStep.
 *
 * Rules:
 *  - "master_suite" splits into "master_bedroom" + "master_bath"
 *  - "guest_bedrooms" (count N) becomes N individual "guest_bedroom" rooms
 *  - "guest_bathrooms" (count N) becomes N individual "guest_bath" rooms
 *  - Everything else maps 1:1 (count is always 1)
 */
function expandRoomsForDesign(selected: SelectedRoom[]): ExpandedRoom[] {
  const expanded: ExpandedRoom[] = [];

  for (const room of selected) {
    switch (room.roomId) {
      case "master_suite":
        expanded.push({
          roomId: "master_bedroom",
          displayName: "Master Bedroom",
          count: 1,
        });
        expanded.push({
          roomId: "master_bath",
          displayName: "Master Bath",
          count: 1,
        });
        break;

      case "guest_bedrooms":
        if (room.count === 1) {
          expanded.push({
            roomId: "guest_bedroom",
            displayName: "Guest Bedroom",
            count: 1,
          });
        } else {
          for (let i = 1; i <= room.count; i++) {
            expanded.push({
              roomId: `guest_bedroom_${i}`,
              displayName: `Guest Bedroom ${i}`,
              count: 1,
            });
          }
        }
        break;

      case "guest_bathrooms":
        if (room.count === 1) {
          expanded.push({
            roomId: "guest_bath",
            displayName: "Guest Bath",
            count: 1,
          });
        } else {
          for (let i = 1; i <= room.count; i++) {
            expanded.push({
              roomId: `guest_bath_${i}`,
              displayName: `Guest Bath ${i}`,
              count: 1,
            });
          }
        }
        break;

      default:
        // 1:1 mapping -- roomId matches ROOM_TEMPLATES id
        expanded.push({
          roomId: room.roomId,
          displayName: room.displayName,
          count: 1,
        });
        break;
    }
  }

  return expanded;
}

/**
 * Build initial selectedRooms from bedroom/bathroom counts.
 * Locked rooms (kitchen, great_room, master_suite, exterior) are always included.
 * Guest bedrooms and bathrooms are populated based on the counts.
 * Optional rooms (dining, laundry, garage) default to selected.
 */
function buildInitialRoomList(
  bedrooms: number,
  bathrooms: number
): SelectedRoom[] {
  const rooms: SelectedRoom[] = [
    { roomId: "kitchen", displayName: "Kitchen", count: 1 },
    { roomId: "great_room", displayName: "Great Room", count: 1 },
    { roomId: "master_suite", displayName: "Master Suite", count: 1 },
  ];

  // Guest bedrooms: total bedrooms minus master = guest count
  const guestBeds = Math.max(0, bedrooms - 1);
  if (guestBeds > 0) {
    rooms.push({
      roomId: "guest_bedrooms",
      displayName: "Guest Bedrooms",
      count: guestBeds,
    });
  }

  // Guest bathrooms: total bathrooms minus master bath = guest count
  const guestBaths = Math.max(0, bathrooms - 1);
  if (guestBaths > 0) {
    rooms.push({
      roomId: "guest_bathrooms",
      displayName: "Guest Bathrooms",
      count: guestBaths,
    });
  }

  // Default optional rooms
  rooms.push({ roomId: "dining_room", displayName: "Dining Room", count: 1 });
  rooms.push({ roomId: "laundry", displayName: "Laundry", count: 1 });
  rooms.push({ roomId: "garage", displayName: "Garage", count: 1 });
  rooms.push({ roomId: "exterior", displayName: "Exterior", count: 1 });

  return rooms;
}

/**
 * Build room list from AI floor plan extraction results.
 * Maps extracted room_types to SelectedRoom entries, ensuring locked rooms are always present.
 */
function buildRoomListFromExtraction(
  extraction: FloorPlanExtractionResult,
  bedrooms: number,
  bathrooms: number
): SelectedRoom[] {
  const rooms: SelectedRoom[] = [];
  const seen = new Set<string>();

  for (const extractedRoom of extraction.rooms) {
    const roomType = extractedRoom.room_type;
    if (seen.has(roomType)) continue;
    seen.add(roomType);

    switch (roomType) {
      case "kitchen":
        rooms.push({ roomId: "kitchen", displayName: "Kitchen", count: 1 });
        break;
      case "great_room":
        rooms.push({ roomId: "great_room", displayName: "Great Room", count: 1 });
        break;
      case "master_suite":
        rooms.push({ roomId: "master_suite", displayName: "Master Suite", count: 1 });
        break;
      case "guest_bedrooms":
        rooms.push({ roomId: "guest_bedrooms", displayName: "Guest Bedrooms", count: Math.max(1, bedrooms - 1) });
        break;
      case "guest_bathrooms":
        rooms.push({ roomId: "guest_bathrooms", displayName: "Guest Bathrooms", count: Math.max(1, bathrooms - 1) });
        break;
      case "dining_room":
        rooms.push({ roomId: "dining_room", displayName: "Dining Room", count: 1 });
        break;
      case "office":
        rooms.push({ roomId: "office", displayName: "Office", count: 1 });
        break;
      case "laundry":
        rooms.push({ roomId: "laundry", displayName: "Laundry", count: 1 });
        break;
      case "garage":
        rooms.push({ roomId: "garage", displayName: "Garage", count: 1 });
        break;
      case "outdoor_living":
        rooms.push({ roomId: "outdoor_living", displayName: "Outdoor Living", count: 1 });
        break;
    }
  }

  // Ensure locked rooms are always present
  if (!seen.has("kitchen")) rooms.unshift({ roomId: "kitchen", displayName: "Kitchen", count: 1 });
  if (!seen.has("great_room")) rooms.splice(1, 0, { roomId: "great_room", displayName: "Great Room", count: 1 });
  if (!seen.has("master_suite")) rooms.splice(2, 0, { roomId: "master_suite", displayName: "Master Suite", count: 1 });
  rooms.push({ roomId: "exterior", displayName: "Exterior", count: 1 });

  return rooms;
}

/**
 * Build a RoomSelections[] for the calculator from expanded rooms + category selections.
 */
function buildRoomSelectionsForCalc(
  expandedRooms: ExpandedRoom[],
  categorySelections: RoomCategorySelection[],
  totalSqft: number
): RoomSelections[] {
  return expandedRooms.map((room) => {
    const template = ROOM_TEMPLATES.find((t) => t.id === room.roomId)
      ?? ROOM_TEMPLATES.find((t) => t.id === room.roomId.replace(/_\d+$/, ""));
    const pct = template?.defaultSqftPercent ?? 0;
    const sqftAllocation = Math.round((pct / 100) * totalSqft);

    const categories = categorySelections
      .filter((s) => s.roomId === room.roomId)
      .map((s) => ({ category: s.category, finishLevel: s.finishLevel }));

    return {
      roomId: room.roomId,
      roomName: room.displayName,
      sqftAllocation,
      categories,
    };
  });
}

/**
 * Build a legacy EstimateParams object from current state.
 * Used by LeadCaptureForm which still expects the old shape.
 */
function buildEstimateParams(
  sqft: number,
  stories: number,
  style: string,
  bedrooms: number,
  bathrooms: number
): EstimateParams {
  return {
    square_footage: sqft,
    stories,
    style,
    finish_level: "standard", // placeholder -- not used for room-based calc
    bedrooms,
    bathrooms,
    kitchen_tier: "standard",
    bath_tier: "standard",
    flooring_preference: "mixed",
    roofing_type: "shingle",
    window_grade: "impact",
    exterior_type: "stucco",
    special_features: [],
  };
}

// -------------------------------------------
// Main Page
// -------------------------------------------

export function EstimatePage() {
  // Step tracking: 0=GettingStarted, 1=HomeBasics, 2=RoomSelection, 3=Design, 4=Results
  const [step, setStep] = useState(0);

  // Home basics
  const [sqft, setSqft] = useState(2500);
  const [stories, setStories] = useState(1);
  const [style, setStyle] = useState("Coastal");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);

  // AI floor plan extraction
  const [aiExtraction, setAiExtraction] = useState<FloorPlanExtractionResult | null>(null);

  // Room-based state
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [selections, setSelections] = useState<RoomCategorySelection[]>([]);

  // Results
  const [showResults, setShowResults] = useState(false);
  const [estimate, setEstimate] = useState<RoomEstimateResult | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Fetch ALL estimator config (all finish levels)
  const { data: allConfig, isLoading: configLoading } = useAllEstimatorConfig();

  useEffect(() => {
    document.title = "Dream Home Designer | Ross Built Custom Homes";
    return () => {
      document.title = "Material Price Intel";
    };
  }, []);

  // Generic field updater for HomeBasicsStep
  function updateBasics(field: string, value: string | number) {
    switch (field) {
      case "square_footage":
        setSqft(value as number);
        break;
      case "stories":
        setStories(value as number);
        break;
      case "style":
        setStyle(value as string);
        break;
      case "bedrooms":
        setBedrooms(value as number);
        break;
      case "bathrooms":
        setBathrooms(value as number);
        break;
    }
  }

  // GettingStartedStep: user chose "Start from Scratch"
  function handleStartFromScratch() {
    setAiExtraction(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // GettingStartedStep: AI extraction completed
  function handleFloorPlanExtracted(result: FloorPlanExtractionResult) {
    setAiExtraction(result);
    setSqft(result.total_sqft);
    setStories(result.stories);
    setBedrooms(result.bedrooms);
    setBathrooms(result.bathrooms);
    if (result.style) setStyle(result.style);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Advance from Home Basics to Room Selection
  function handleBasicsNext() {
    if (aiExtraction) {
      setSelectedRooms(buildRoomListFromExtraction(aiExtraction, bedrooms, bathrooms));
    } else {
      setSelectedRooms(buildInitialRoomList(bedrooms, bathrooms));
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Advance from Room Selection to Design
  function handleRoomSelectionNext() {
    // Clean up selections for rooms that were removed
    const expandedRoomIds = new Set(
      expandRoomsForDesign(selectedRooms).map((r) => r.roomId)
    );
    setSelections((prev) =>
      prev.filter((s) => expandedRoomIds.has(s.roomId))
    );
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Stable callback for RoomDesignStep
  const handleSelectionsChange = useCallback(
    (next: RoomCategorySelection[]) => setSelections(next),
    []
  );

  // Advance from Design to Results
  function handleDesignNext() {
    if (!allConfig || allConfig.length === 0) return;

    const expandedRooms = expandRoomsForDesign(selectedRooms);
    const roomSelections = buildRoomSelectionsForCalc(
      expandedRooms,
      selections,
      sqft
    );
    const result = calculateRoomEstimate(roomSelections, allConfig);
    setEstimate(result);
    setShowResults(true);
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Expanded rooms for design step (memoized)
  const designRooms = useMemo(
    () => expandRoomsForDesign(selectedRooms),
    [selectedRooms]
  );

  // Build legacy params for LeadCaptureForm
  const estimateParams = useMemo(
    () => buildEstimateParams(sqft, stories, style, bedrooms, bathrooms),
    [sqft, stories, style, bedrooms, bathrooms]
  );

  // Results view
  if (showResults && estimate) {
    return (
      <EstimatorLayout>
        <div className="space-y-8">
          <EstimateResults
            low={estimate.low}
            high={estimate.high}
            sqft={sqft}
            roomBreakdowns={estimate.roomBreakdowns}
            breakdown={estimate.breakdown}
            gated={!leadCaptured}
          />
          <LeadCaptureForm
            estimateParams={estimateParams}
            estimateLow={estimate.low}
            estimateHigh={estimate.high}
            breakdown={estimate.breakdown}
            roomBreakdowns={estimate.roomBreakdowns}
            onLeadCaptured={() => setLeadCaptured(true)}
          />
          <div className="text-center">
            <button
              onClick={() => {
                setShowResults(false);
                setEstimate(null);
                setAiExtraction(null);
                setLeadCaptured(false);
                setStep(0);
                setSelections([]);
                setSelectedRooms([]);
              }}
              className="text-sm text-slate-400 hover:text-slate-600 underline"
            >
              Start Over
            </button>
          </div>
        </div>
      </EstimatorLayout>
    );
  }

  // Loading config
  if (configLoading && step > 1) {
    return (
      <EstimatorLayout>
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading pricing data...
        </div>
      </EstimatorLayout>
    );
  }

  // Wizard steps
  return (
    <EstimatorLayout>
      <EstimatorProgress currentStep={step} />
      <div className={step === 3 ? "max-w-5xl mx-auto" : "max-w-2xl mx-auto"}>
        {step === 0 && (
          <GettingStartedStep
            onStartFromScratch={handleStartFromScratch}
            onFloorPlanExtracted={handleFloorPlanExtracted}
          />
        )}
        {step === 1 && (
          <HomeBasicsStep
            sqft={sqft}
            stories={stories}
            style={style}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            onChange={updateBasics}
            onNext={handleBasicsNext}
            aiExtracted={!!aiExtraction}
          />
        )}
        {step === 2 && (
          <RoomSelectionStep
            selectedRooms={selectedRooms}
            onChange={setSelectedRooms}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            onNext={handleRoomSelectionNext}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && allConfig && (
          <RoomDesignStep
            rooms={designRooms}
            selections={selections}
            onSelectionsChange={handleSelectionsChange}
            sqft={sqft}
            allConfig={allConfig}
            onNext={handleDesignNext}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </EstimatorLayout>
  );
}
