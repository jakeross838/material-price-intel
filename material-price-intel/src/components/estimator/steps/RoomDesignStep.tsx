import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Check, ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROOM_TEMPLATES, SELECTION_OPTIONS } from "@/lib/roomEstimatorData";
import type { FinishLevel, EstimatorConfig } from "@/lib/types";
import type { SelectionOption } from "@/lib/roomEstimatorData";

// -------------------------------------------
// Types
// -------------------------------------------

type SelectedRoom = {
  roomId: string;
  displayName: string;
  count: number;
};

type RoomCategorySelection = {
  roomId: string;
  category: string;
  finishLevel: FinishLevel;
};

type Props = {
  rooms: SelectedRoom[];
  selections: RoomCategorySelection[];
  onSelectionsChange: (selections: RoomCategorySelection[]) => void;
  sqft: number;
  allConfig: EstimatorConfig[];
  onNext: () => void;
  onBack: () => void;
};

// -------------------------------------------
// Constants
// -------------------------------------------

const FINISH_LEVELS: FinishLevel[] = ["builder", "standard", "premium", "luxury"];

const FINISH_LEVEL_BADGES: Record<FinishLevel, { label: string; color: string }> = {
  builder: { label: "Builder", color: "bg-slate-100 text-slate-600" },
  standard: { label: "Standard", color: "bg-brand-100 text-brand-700" },
  premium: { label: "Premium", color: "bg-amber-100 text-amber-700" },
  luxury: { label: "Luxury", color: "bg-violet-100 text-violet-700" },
};

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  cabinets: "Cabinets",
  countertops: "Countertops",
  flooring: "Flooring",
  backsplash: "Backsplash",
  appliances: "Appliances",
  fixtures: "Fixtures",
  vanity: "Vanity",
  shower_tile: "Shower Tile",
  lighting: "Lighting",
  paint: "Paint & Finishes",
  windows: "Windows",
  roofing: "Roofing",
  siding: "Exterior Siding",
  plumbing: "Plumbing",
  landscaping: "Landscaping",
};

// -------------------------------------------
// Helpers
// -------------------------------------------

function findTemplate(roomId: string) {
  // roomId may be like "guest_bedroom_2", template id would be "guest_bedroom"
  const direct = ROOM_TEMPLATES.find((t) => t.id === roomId);
  if (direct) return direct;
  // Strip trailing _N for numbered rooms
  const baseId = roomId.replace(/_\d+$/, "");
  return ROOM_TEMPLATES.find((t) => t.id === baseId);
}

function getCategoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY_NAMES[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function getRoomSqft(room: SelectedRoom, totalSqft: number): number {
  const template = findTemplate(room.roomId);
  if (!template) return 0;
  return Math.round((template.defaultSqftPercent / 100) * totalSqft);
}

function getCategoriesForRoom(room: SelectedRoom): string[] {
  const template = findTemplate(room.roomId);
  return template?.categories ?? [];
}

function getPriceRange(
  category: string,
  finishLevel: FinishLevel,
  roomSqft: number,
  allConfig: EstimatorConfig[]
): { low: number; high: number } | null {
  const config = allConfig.find(
    (c) => c.category === category && c.finish_level === finishLevel
  );
  if (!config) return null;
  return {
    low: Math.round(config.cost_per_sqft_low * roomSqft),
    high: Math.round(config.cost_per_sqft_high * roomSqft),
  };
}

// -------------------------------------------
// Sub-components
// -------------------------------------------

function OptionCard({
  option,
  isSelected,
  priceRange,
  finishLevel,
  onClick,
}: {
  option: SelectionOption;
  isSelected: boolean;
  priceRange: { low: number; high: number } | null;
  finishLevel: FinishLevel;
  onClick: () => void;
}) {
  const badge = FINISH_LEVEL_BADGES[finishLevel];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-200 text-left bg-white",
        "hover:shadow-lg hover:-translate-y-0.5",
        isSelected
          ? "border-brand-600 ring-2 ring-brand-500/20 bg-brand-50/50 shadow-md"
          : "border-slate-200 hover:border-brand-300"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={option.imageUrl}
          alt={option.label}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Finish badge overlay */}
        <span
          className={cn(
            "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            badge.color
          )}
        >
          {badge.label}
        </span>
        {/* Selected check overlay */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 space-y-1.5">
        <h4 className="font-semibold text-sm text-brand-900 leading-snug">
          {option.label}
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {option.description}
        </p>
      </div>

      {/* Price */}
      {priceRange && (
        <div
          className={cn(
            "px-3.5 pb-3.5",
            isSelected ? "text-brand-700" : "text-slate-600"
          )}
        >
          <p className="text-sm font-bold tabular-nums">
            {formatCurrency(priceRange.low)} &ndash; {formatCurrency(priceRange.high)}
          </p>
        </div>
      )}
    </button>
  );
}

function RoomSidebar({
  rooms,
  activeRoomIndex,
  completedRooms,
  onRoomClick,
}: {
  rooms: SelectedRoom[];
  activeRoomIndex: number;
  completedRooms: Set<string>;
  onRoomClick: (index: number) => void;
}) {
  return (
    <nav className="hidden lg:block w-52 shrink-0">
      <div className="sticky top-4 bg-brand-50/80 rounded-xl border border-brand-200/50 overflow-hidden">
        <div className="px-4 py-3 bg-brand-100/60 border-b border-brand-200/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700">
            Your Rooms
          </h3>
        </div>
        <ul className="py-1.5">
          {rooms.map((room, i) => {
            const isActive = i === activeRoomIndex;
            const isComplete = completedRooms.has(room.roomId);
            return (
              <li key={room.roomId}>
                <button
                  type="button"
                  onClick={() => onRoomClick(i)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-all",
                    isActive
                      ? "bg-white border-l-[3px] border-l-brand-600 text-brand-900 font-semibold shadow-sm"
                      : "border-l-[3px] border-l-transparent hover:bg-white/60 text-slate-600 hover:text-brand-800"
                  )}
                >
                  {isComplete ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shrink-0">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0",
                        isActive
                          ? "bg-brand-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span className="truncate">{room.displayName}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function MobileRoomTabs({
  rooms,
  activeRoomIndex,
  completedRooms,
  onRoomClick,
}: {
  rooms: SelectedRoom[];
  activeRoomIndex: number;
  completedRooms: Set<string>;
  onRoomClick: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const tab = activeRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeRoomIndex]);

  return (
    <div className="lg:hidden -mx-4 mb-6">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {rooms.map((room, i) => {
          const isActive = i === activeRoomIndex;
          const isComplete = completedRooms.has(room.roomId);
          return (
            <button
              key={room.roomId}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onRoomClick(i)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                isActive
                  ? "bg-brand-600 text-white shadow-md"
                  : isComplete
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300"
              )}
            >
              {isComplete && !isActive && (
                <Check className="h-3 w-3" strokeWidth={3} />
              )}
              {room.displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === current
              ? "w-6 bg-brand-600"
              : i < current
                ? "w-1.5 bg-brand-400"
                : "w-1.5 bg-slate-200"
          )}
        />
      ))}
    </div>
  );
}

function RunningTotalBar({
  totalLow,
  totalHigh,
  roomCount,
  completedCount,
}: {
  totalLow: number;
  totalHigh: number;
  roomCount: number;
  completedCount: number;
}) {
  const progress = roomCount > 0 ? (completedCount / roomCount) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-900 text-white shadow-2xl border-t border-brand-700/50">
      {/* Thin progress bar at very top */}
      <div className="h-0.5 bg-brand-800 w-full">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-emerald-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-wider text-brand-300/70 font-medium">
              Estimated Total
            </p>
          </div>
          <p className="text-lg sm:text-xl font-bold tracking-tight tabular-nums">
            {totalLow > 0 ? (
              <>
                {formatCurrency(totalLow)} &ndash; {formatCurrency(totalHigh)}
              </>
            ) : (
              <span className="text-brand-400 text-base">Select finishes to see pricing</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-300/70">
          <span className="hidden sm:inline">
            {completedCount} of {roomCount} rooms
          </span>
          <span className="sm:hidden">
            {completedCount}/{roomCount}
          </span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------
// Main Component
// -------------------------------------------

export function RoomDesignStep({
  rooms,
  selections,
  onSelectionsChange,
  sqft,
  allConfig,
  onNext,
  onBack,
}: Props) {
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms[activeRoomIndex];
  const roomCategories = useMemo(
    () => getCategoriesForRoom(activeRoom),
    [activeRoom]
  );

  const activeCategory = roomCategories[activeCategoryIndex] ?? null;
  const roomSqft = getRoomSqft(activeRoom, sqft);

  // Initialize defaults for unvisited rooms -- seed "standard" for all categories
  useEffect(() => {
    if (!activeRoom) return;
    const categories = getCategoriesForRoom(activeRoom);
    const existingForRoom = selections.filter(
      (s) => s.roomId === activeRoom.roomId
    );
    if (existingForRoom.length >= categories.length) return;

    const missing = categories.filter(
      (cat) => !existingForRoom.some((s) => s.category === cat)
    );
    if (missing.length === 0) return;

    const newDefaults: RoomCategorySelection[] = missing.map((cat) => ({
      roomId: activeRoom.roomId,
      category: cat,
      finishLevel: "standard" as FinishLevel,
    }));

    onSelectionsChange([...selections, ...newDefaults]);
  }, [activeRoom, selections, onSelectionsChange]);

  // Completed rooms
  const completedRooms = useMemo(() => {
    const completed = new Set<string>();
    for (const room of rooms) {
      const cats = getCategoriesForRoom(room);
      const roomSels = selections.filter((s) => s.roomId === room.roomId);
      if (cats.length > 0 && roomSels.length >= cats.length) {
        completed.add(room.roomId);
      }
    }
    return completed;
  }, [rooms, selections]);

  // Get current selection for active room + category
  const currentSelection = useMemo(
    () =>
      selections.find(
        (s) => s.roomId === activeRoom?.roomId && s.category === activeCategory
      ),
    [selections, activeRoom, activeCategory]
  );

  // Running total
  const { totalLow, totalHigh } = useMemo(() => {
    let low = 0;
    let high = 0;

    for (const sel of selections) {
      const room = rooms.find((r) => r.roomId === sel.roomId);
      if (!room) continue;
      const rSqft = getRoomSqft(room, sqft);
      const price = getPriceRange(sel.category, sel.finishLevel, rSqft, allConfig);
      if (price) {
        low += price.low;
        high += price.high;
      }
    }

    return { totalLow: low, totalHigh: high };
  }, [selections, rooms, sqft, allConfig]);

  // Category transition animation
  const transitionToCategory = useCallback(
    (nextCategoryIndex: number, nextRoomIndex?: number) => {
      setAnimatingOut(true);
      setTimeout(() => {
        if (nextRoomIndex !== undefined) {
          setActiveRoomIndex(nextRoomIndex);
          setActiveCategoryIndex(nextCategoryIndex);
        } else {
          setActiveCategoryIndex(nextCategoryIndex);
        }
        setAnimatingOut(false);
        // Scroll content area to top smoothly
        if (contentRef.current) {
          contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
    },
    []
  );

  // Handle selecting a finish level for current category
  const handleSelect = useCallback(
    (finishLevel: FinishLevel) => {
      if (!activeRoom || !activeCategory) return;

      const updated = selections.map((s) =>
        s.roomId === activeRoom.roomId && s.category === activeCategory
          ? { ...s, finishLevel }
          : s
      );

      // If selection didn't exist, add it
      const exists = updated.some(
        (s) => s.roomId === activeRoom.roomId && s.category === activeCategory
      );
      if (!exists) {
        updated.push({
          roomId: activeRoom.roomId,
          category: activeCategory,
          finishLevel,
        });
      }

      onSelectionsChange(updated);

      // Auto-advance after a brief pause for the selection animation to feel intentional
      setTimeout(() => {
        if (activeCategoryIndex < roomCategories.length - 1) {
          // Next category in same room
          transitionToCategory(activeCategoryIndex + 1);
        } else if (activeRoomIndex < rooms.length - 1) {
          // Next room
          transitionToCategory(0, activeRoomIndex + 1);
        }
        // else: last category of last room -- user clicks "Review" button
      }, 350);
    },
    [
      activeRoom,
      activeCategory,
      selections,
      onSelectionsChange,
      activeCategoryIndex,
      roomCategories.length,
      activeRoomIndex,
      rooms.length,
      transitionToCategory,
    ]
  );

  // Navigate to a specific room
  const handleRoomClick = useCallback(
    (index: number) => {
      if (index === activeRoomIndex) return;
      transitionToCategory(0, index);
    },
    [activeRoomIndex, transitionToCategory]
  );

  // Get options for current category
  const categoryOptions = useMemo(() => {
    if (!activeCategory) return [];
    return SELECTION_OPTIONS[activeCategory] ?? [];
  }, [activeCategory]);

  // Check if all rooms are complete
  const allComplete = completedRooms.size === rooms.length;
  const isLastCategory =
    activeCategoryIndex === roomCategories.length - 1 &&
    activeRoomIndex === rooms.length - 1;

  if (!activeRoom || !activeCategory) return null;

  return (
    <div className="pb-20" ref={contentRef}>
      {/* Mobile room tabs */}
      <MobileRoomTabs
        rooms={rooms}
        activeRoomIndex={activeRoomIndex}
        completedRooms={completedRooms}
        onRoomClick={handleRoomClick}
      />

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <RoomSidebar
          rooms={rooms}
          activeRoomIndex={activeRoomIndex}
          completedRooms={completedRooms}
          onRoomClick={handleRoomClick}
        />

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Room header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-brand-500 font-medium mb-1">
              <span>Room {activeRoomIndex + 1} of {rooms.length}</span>
              <ChevronRight className="h-3 w-3" />
              <span>{activeRoom.displayName}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">
              Choose your {getCategoryDisplayName(activeCategory)}
            </h2>
            <div className="flex items-center gap-4 mt-3">
              <CategoryProgressDots
                total={roomCategories.length}
                current={activeCategoryIndex}
              />
              <span className="text-xs text-slate-400 font-medium">
                {activeCategoryIndex + 1} of {roomCategories.length} categories
              </span>
            </div>
            {roomSqft > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                {activeRoom.displayName}: ~{roomSqft.toLocaleString()} sqft allocated
              </p>
            )}
          </div>

          {/* Option Cards */}
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-200",
              animatingOut
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0"
            )}
          >
            {FINISH_LEVELS.map((level) => {
              const option = categoryOptions.find(
                (o) => o.finishLevel === level
              );
              if (!option) return null;

              const isSelected = currentSelection?.finishLevel === level;
              const priceRange = getPriceRange(
                activeCategory,
                level,
                roomSqft,
                allConfig
              );

              return (
                <OptionCard
                  key={level}
                  option={option}
                  isSelected={isSelected}
                  priceRange={priceRange}
                  finishLevel={level}
                  onClick={() => handleSelect(level)}
                />
              );
            })}
          </div>

          {/* Category navigation (manual) */}
          <div className="flex items-center justify-between mt-8 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeCategoryIndex > 0) {
                  transitionToCategory(activeCategoryIndex - 1);
                } else if (activeRoomIndex > 0) {
                  const prevRoom = rooms[activeRoomIndex - 1];
                  const prevCats = getCategoriesForRoom(prevRoom);
                  transitionToCategory(prevCats.length - 1, activeRoomIndex - 1);
                } else {
                  onBack();
                }
              }}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {activeCategoryIndex > 0
                ? "Prev Category"
                : activeRoomIndex > 0
                  ? "Prev Room"
                  : "Back"}
            </Button>

            {isLastCategory && allComplete ? (
              <Button
                onClick={onNext}
                className="gap-1.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg hover:shadow-xl transition-all"
              >
                Review Estimate
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeCategoryIndex < roomCategories.length - 1) {
                    transitionToCategory(activeCategoryIndex + 1);
                  } else if (activeRoomIndex < rooms.length - 1) {
                    transitionToCategory(0, activeRoomIndex + 1);
                  }
                }}
                className="gap-1.5"
              >
                {activeCategoryIndex < roomCategories.length - 1
                  ? "Next Category"
                  : "Next Room"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* "Review Estimate" button when all rooms complete but not on last */}
          {allComplete && !isLastCategory && (
            <div className="mt-6 text-center">
              <Button
                onClick={onNext}
                className="gap-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-lg hover:shadow-xl transition-all px-8"
              >
                All rooms done -- Review Estimate
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Running total sticky bar */}
      <RunningTotalBar
        totalLow={totalLow}
        totalHigh={totalHigh}
        roomCount={rooms.length}
        completedCount={completedRooms.size}
      />
    </div>
  );
}
