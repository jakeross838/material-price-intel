import { useState } from "react";
import {
  Plus,
  Trash2,
  Home,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  useProjectRooms,
  useCreateRoom,
  useDeleteRoom,
} from "@/hooks/useProjectRooms";
import type { RoomType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Room presets for Florida custom homes
// ---------------------------------------------------------------------------

type RoomPreset = {
  name: string;
  room_type: RoomType;
};

const ROOM_PRESETS: RoomPreset[] = [
  { name: "Kitchen", room_type: "interior" },
  { name: "Master Bath", room_type: "interior" },
  { name: "Master Bedroom", room_type: "interior" },
  { name: "Guest Bath 1", room_type: "interior" },
  { name: "Guest Bath 2", room_type: "interior" },
  { name: "Guest Bedroom 1", room_type: "interior" },
  { name: "Guest Bedroom 2", room_type: "interior" },
  { name: "Great Room", room_type: "common" },
  { name: "Dining Room", room_type: "common" },
  { name: "Laundry", room_type: "utility" },
  { name: "Garage", room_type: "utility" },
  { name: "Exterior", room_type: "exterior" },
  { name: "Pool/Lanai", room_type: "exterior" },
];

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "utility", label: "Utility" },
  { value: "common", label: "Common" },
];

const roomTypeBadge: Record<RoomType, string> = {
  interior: "bg-blue-100 text-blue-700",
  exterior: "bg-green-100 text-green-700",
  utility: "bg-slate-100 text-slate-700",
  common: "bg-purple-100 text-purple-700",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type RoomManagerProps = {
  projectId: string;
  selectedRoomId: string | undefined;
  onSelectRoom: (roomId: string | undefined) => void;
};

export function RoomManager({
  projectId,
  selectedRoomId,
  onSelectRoom,
}: RoomManagerProps) {
  const { data: rooms, isLoading } = useProjectRooms(projectId);
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();

  // Add room form state
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<RoomType>("interior");

  // Preset panel state
  const [showPresets, setShowPresets] = useState(false);
  const [checkedPresets, setCheckedPresets] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleAddRoom() {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;
    createRoom.mutate(
      { project_id: projectId, name: trimmed, room_type: newRoomType },
      {
        onSuccess: (data) => {
          setNewRoomName("");
          setNewRoomType("interior");
          if (!selectedRoomId) onSelectRoom(data.id);
        },
      }
    );
  }

  function handleDeleteRoom(roomId: string, roomName: string) {
    if (
      !window.confirm(
        `Delete "${roomName}" and all its selections? This cannot be undone.`
      )
    )
      return;
    deleteRoom.mutate(
      { id: roomId, project_id: projectId },
      {
        onSuccess: () => {
          if (selectedRoomId === roomId) onSelectRoom(undefined);
        },
      }
    );
  }

  function togglePreset(name: string) {
    setCheckedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleAddPresets() {
    const existingNames = new Set(
      (rooms ?? []).map((r) => r.name.toLowerCase())
    );
    const toAdd = ROOM_PRESETS.filter(
      (p) => checkedPresets.has(p.name) && !existingNames.has(p.name.toLowerCase())
    );
    toAdd.forEach((p) => {
      createRoom.mutate({
        project_id: projectId,
        name: p.name,
        room_type: p.room_type,
      });
    });
    setCheckedPresets(new Set());
    setShowPresets(false);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading rooms...
      </div>
    );
  }

  const existingNames = new Set(
    (rooms ?? []).map((r) => r.name.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Room list */}
      {(rooms ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No rooms yet. Add rooms below or use presets.
        </p>
      ) : (
        <div className="space-y-1">
          {(rooms ?? []).map((room) => (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors ${
                selectedRoomId === room.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedRoomId === room.id ? (
                  <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm truncate">
                  {room.name}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${
                    roomTypeBadge[room.room_type]
                  }`}
                >
                  {room.room_type}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRoom(room.id, room.name);
                }}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add room form */}
      <Card>
        <CardContent className="pt-4 pb-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Add Room
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
              className="h-8 text-sm"
            />
            <select
              value={newRoomType}
              onChange={(e) => setNewRoomType(e.target.value as RoomType)}
              className="h-8 rounded-md border px-2 text-xs bg-background"
            >
              {ROOM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="xs"
            onClick={handleAddRoom}
            disabled={!newRoomName.trim() || createRoom.isPending}
            className="w-full"
          >
            {createRoom.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add Room
          </Button>
        </CardContent>
      </Card>

      {/* Presets panel */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showPresets ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Quick Add: Standard Rooms
          </button>
          {showPresets && (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-1 gap-1">
                {ROOM_PRESETS.map((preset) => {
                  const alreadyExists = existingNames.has(
                    preset.name.toLowerCase()
                  );
                  return (
                    <label
                      key={preset.name}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer hover:bg-muted/50 ${
                        alreadyExists ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedPresets.has(preset.name)}
                        onChange={() => togglePreset(preset.name)}
                        disabled={alreadyExists}
                        className="rounded"
                      />
                      <span className="truncate">{preset.name}</span>
                      <span
                        className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                          roomTypeBadge[preset.room_type]
                        }`}
                      >
                        {preset.room_type}
                      </span>
                      {alreadyExists && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          exists
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={handleAddPresets}
                disabled={checkedPresets.size === 0 || createRoom.isPending}
                className="w-full"
              >
                <CheckSquare className="h-3 w-3" />
                Add Selected ({checkedPresets.size})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
