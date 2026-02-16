import { type LucideIcon } from "lucide-react";
import {
  ChefHat,
  Sofa,
  Crown,
  Bed,
  Bath,
  UtensilsCrossed,
  Monitor,
  WashingMachine,
  Car,
  TreePine,
  Home,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SelectedRoom } from "@/lib/types";

type Props = {
  selectedRooms: SelectedRoom[];
  onChange: (rooms: SelectedRoom[]) => void;
  bedrooms: number;
  bathrooms: number;
  onNext: () => void;
  onBack: () => void;
};

type RoomDefinition = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  locked: boolean; // can't deselect
  defaultSelected: boolean;
  hasCount: boolean;
  getCount?: (bedrooms: number, bathrooms: number) => number;
  minCount?: number;
  maxCount?: number;
};

const ROOM_DEFINITIONS: RoomDefinition[] = [
  {
    id: "kitchen",
    name: "Kitchen",
    description: "The heart of your home",
    icon: ChefHat,
    locked: true,
    defaultSelected: true,
    hasCount: false,
  },
  {
    id: "great_room",
    name: "Great Room",
    description: "Open living and gathering space",
    icon: Sofa,
    locked: true,
    defaultSelected: true,
    hasCount: false,
  },
  {
    id: "master_suite",
    name: "Master Suite",
    description: "Primary bedroom with en-suite bath",
    icon: Crown,
    locked: true,
    defaultSelected: true,
    hasCount: false,
  },
  {
    id: "guest_bedrooms",
    name: "Guest Bedrooms",
    description: "Additional bedrooms for family or guests",
    icon: Bed,
    locked: false,
    defaultSelected: true,
    hasCount: true,
    getCount: (bedrooms) => Math.max(0, bedrooms - 1),
    minCount: 0,
    maxCount: 6,
  },
  {
    id: "guest_bathrooms",
    name: "Guest Bathrooms",
    description: "Additional full or half baths",
    icon: Bath,
    locked: false,
    defaultSelected: true,
    hasCount: true,
    getCount: (_bedrooms, bathrooms) => Math.max(0, bathrooms - 1),
    minCount: 0,
    maxCount: 5,
  },
  {
    id: "dining_room",
    name: "Dining Room",
    description: "Formal or casual dining area",
    icon: UtensilsCrossed,
    locked: false,
    defaultSelected: true,
    hasCount: false,
  },
  {
    id: "office",
    name: "Office",
    description: "Home workspace or study",
    icon: Monitor,
    locked: false,
    defaultSelected: false,
    hasCount: false,
  },
  {
    id: "laundry",
    name: "Laundry",
    description: "Dedicated laundry room",
    icon: WashingMachine,
    locked: false,
    defaultSelected: true,
    hasCount: false,
  },
  {
    id: "garage",
    name: "Garage",
    description: "Attached 2-3 car garage",
    icon: Car,
    locked: false,
    defaultSelected: true,
    hasCount: false,
  },
  {
    id: "outdoor_living",
    name: "Outdoor Living",
    description: "Covered lanai, patio, or screened porch",
    icon: TreePine,
    locked: false,
    defaultSelected: false,
    hasCount: false,
  },
  {
    id: "exterior",
    name: "Exterior",
    description: "Roofing, siding, entry door, driveway, smart home",
    icon: Home,
    locked: true,
    defaultSelected: true,
    hasCount: false,
  },
];

export function RoomSelectionStep({
  selectedRooms,
  onChange,
  bedrooms,
  bathrooms,
  onNext,
  onBack,
}: Props) {
  function isSelected(roomId: string): boolean {
    return selectedRooms.some((r) => r.roomId === roomId);
  }

  function getCount(roomId: string): number {
    return selectedRooms.find((r) => r.roomId === roomId)?.count ?? 0;
  }

  function toggleRoom(def: RoomDefinition) {
    if (def.locked) return;

    if (isSelected(def.id)) {
      onChange(selectedRooms.filter((r) => r.roomId !== def.id));
    } else {
      const count = def.hasCount && def.getCount
        ? def.getCount(bedrooms, bathrooms)
        : 1;
      onChange([
        ...selectedRooms,
        { roomId: def.id, displayName: def.name, count: Math.max(1, count) },
      ]);
    }
  }

  function updateCount(roomId: string, delta: number) {
    const def = ROOM_DEFINITIONS.find((d) => d.id === roomId);
    if (!def) return;

    onChange(
      selectedRooms.map((r) => {
        if (r.roomId !== roomId) return r;
        const next = r.count + delta;
        const min = def.minCount ?? 0;
        const max = def.maxCount ?? 10;
        const clamped = Math.max(min, Math.min(max, next));
        return { ...r, count: clamped };
      }).filter((r) => {
        // If count drops to 0 on a non-locked room, remove it
        if (r.count === 0 && !ROOM_DEFINITIONS.find((d) => d.id === r.roomId)?.locked) {
          return false;
        }
        return true;
      })
    );
  }

  const totalRooms = selectedRooms.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 mb-4">
          <LayoutGrid className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
          Select Your Rooms
        </h2>
        <p className="text-brand-600/70 mt-2 text-sm sm:text-base">
          Pick which rooms to include in your dream home.
        </p>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ROOM_DEFINITIONS.map((def) => {
          const Icon = def.icon;
          const selected = isSelected(def.id);
          const count = getCount(def.id);

          return (
            <div
              key={def.id}
              className={`relative rounded-xl border-2 p-4 transition-all duration-200 ${
                selected
                  ? "border-brand-600 bg-brand-50 shadow-md shadow-brand-600/10 ring-1 ring-brand-500/20"
                  : "border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
              } ${def.locked ? "cursor-default" : "cursor-pointer"}`}
              onClick={() => {
                if (!def.hasCount || !selected) {
                  toggleRoom(def);
                }
              }}
            >
              {/* Lock badge for always-selected rooms */}
              {def.locked && (
                <div className="absolute top-2 right-2">
                  <Lock className="h-3 w-3 text-brand-400" />
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  selected
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Name + Description */}
              <h3
                className={`text-sm font-semibold transition-colors ${
                  selected ? "text-brand-900" : "text-slate-700"
                }`}
              >
                {def.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {def.description}
              </p>

              {/* Counter for rooms with counts */}
              {def.hasCount && selected && (
                <div
                  className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-200/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon-xs"
                    variant="outline"
                    onClick={() => updateCount(def.id, -1)}
                    disabled={count <= (def.minCount ?? 0)}
                    className="rounded-full"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-lg font-bold text-brand-800 w-6 text-center tabular-nums">
                    {count}
                  </span>
                  <Button
                    size="icon-xs"
                    variant="outline"
                    onClick={() => updateCount(def.id, 1)}
                    disabled={count >= (def.maxCount ?? 10)}
                    className="rounded-full"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Room count summary */}
      <div className="text-center">
        <p className="text-sm text-brand-600/70">
          <span className="font-semibold text-brand-800">{totalRooms}</span>{" "}
          {totalRooms === 1 ? "room" : "rooms"} selected
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-13 text-base bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-13 text-base font-semibold bg-brand-700 hover:bg-brand-600 shadow-lg hover:shadow-xl transition-all"
        >
          Next: Finishes
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
