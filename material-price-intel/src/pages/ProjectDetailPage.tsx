import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Ruler,
  TrendingDown,
  TrendingUp,
  MapPin,
  Calendar,
  FileText,
  Pencil,
  User,
  Zap,
  Check,
  LayoutList,
  ShoppingCart,
  BarChart3,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useProjectRooms } from "@/hooks/useProjectRooms";
import { useProjectSelections } from "@/hooks/useProjectSelections";
import { useAutoEstimate } from "@/hooks/useEstimateBuilder";
import { RoomManager } from "@/components/projects/RoomManager";
import { SelectionEditor } from "@/components/projects/SelectionEditor";
import { ProcurementTracker } from "@/components/projects/ProcurementTracker";
import { BudgetDashboard } from "@/components/projects/BudgetDashboard";
import { SelectionSheet } from "@/components/projects/SelectionSheet";
import type { ProjectStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  planning: { label: "Planning", color: "bg-blue-100 text-blue-800" },
  estimating: { label: "Estimating", color: "bg-amber-100 text-amber-800" },
  in_progress: { label: "In Progress", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-800" },
  on_hold: { label: "On Hold", color: "bg-red-100 text-red-800" },
};

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type ProjectTab = "selections" | "procurement" | "budget" | "sheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number | null) {
  if (val == null) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatSqft(val: number | null) {
  if (val == null) return "\u2014";
  return `${val.toLocaleString("en-US")} sqft`;
}

function formatDate(val: string | null) {
  if (!val) return null;
  return new Date(val).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function defaultTab(status: ProjectStatus | undefined): ProjectTab {
  if (status === "in_progress") return "procurement";
  return "selections";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError } = useProject(id);
  const { data: rooms } = useProjectRooms(id);
  const { data: allSelections } = useProjectSelections(id);

  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<ProjectTab>("selections");
  const [tabInitialized, setTabInitialized] = useState(false);
  const [autoEstimateProgress, setAutoEstimateProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [autoEstimateResult, setAutoEstimateResult] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(true);
  const autoEstimate = useAutoEstimate();
  const updateProject = useUpdateProject();

  // Set default tab based on project status when project loads
  useEffect(() => {
    if (project && !tabInitialized) {
      setActiveTab(defaultTab(project.status));
      setTabInitialized(true);
    }
  }, [project, tabInitialized]);

  // Auto-select first room when rooms load
  useEffect(() => {
    if (!selectedRoomId && rooms && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  // Selections that need estimates: have material_id but no estimated_unit_price
  const selectionsNeedingEstimates = (allSelections ?? []).filter(
    (s) => s.material_id && s.estimated_unit_price == null
  );

  // Auto-estimate all selections with materials but no price
  const handleAutoEstimateAll = useCallback(async () => {
    if (selectionsNeedingEstimates.length === 0) return;

    setAutoEstimateProgress({ current: 0, total: selectionsNeedingEstimates.length });
    let completed = 0;
    let failed = 0;

    for (const sel of selectionsNeedingEstimates) {
      try {
        await autoEstimate.mutateAsync({
          selectionId: sel.id,
          roomId: sel.room_id,
          materialId: sel.material_id!,
          quantity: sel.quantity,
          priceStrategy: "average",
        });
        completed++;
      } catch {
        failed++;
      }
      setAutoEstimateProgress({
        current: completed + failed,
        total: selectionsNeedingEstimates.length,
      });
    }

    setAutoEstimateProgress(null);
    const msg =
      failed > 0
        ? `${completed} items estimated, ${failed} had no pricing data`
        : `${completed} item${completed !== 1 ? "s" : ""} estimated`;
    setAutoEstimateResult(msg);
    setTimeout(() => setAutoEstimateResult(null), 4000);

    // Transition project status to 'estimating' if currently 'planning'
    if (project?.status === "planning" && completed > 0) {
      updateProject.mutate({ id: project.id, updates: { status: "estimating" } });
    }
  }, [selectionsNeedingEstimates, autoEstimate, project, updateProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading project...
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Project not found or you do not have access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cfg = statusConfig[project.status] ?? statusConfig.planning;
  const addressParts = [project.address, project.city, project.state]
    .filter(Boolean)
    .join(", ");

  // Compute aggregated totals from all selections
  const totalAllowance = (allSelections ?? []).reduce(
    (sum, s) => sum + (s.allowance_amount ?? 0),
    0
  );
  const totalEstimated = (allSelections ?? []).reduce(
    (sum, s) => sum + (s.estimated_total ?? 0),
    0
  );
  const totalActual = (allSelections ?? []).reduce(
    (sum, s) => sum + (s.actual_total ?? 0),
    0
  );
  const hasActuals = (allSelections ?? []).some((s) => s.actual_total != null);
  const totalVariance = hasActuals ? totalActual - totalAllowance : null;

  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-6">
      {/* Back link + page header */}
      <div className="no-print">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
            >
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {autoEstimateResult && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {autoEstimateResult}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoEstimateAll}
              disabled={
                selectionsNeedingEstimates.length === 0 ||
                autoEstimateProgress !== null
              }
            >
              {autoEstimateProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estimating {autoEstimateProgress.current} of{" "}
                  {autoEstimateProgress.total}...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Auto-Estimate All
                  {selectionsNeedingEstimates.length > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      ({selectionsNeedingEstimates.length})
                    </span>
                  )}
                </>
              )}
            </Button>
            <Button variant="outline" disabled>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Allowance</p>
                <p className="text-xl font-bold tabular-nums">
                  {totalAllowance > 0
                    ? formatCurrency(totalAllowance)
                    : formatCurrency(project.target_budget)}
                </p>
                {totalAllowance > 0 && project.target_budget && (
                  <p className="text-[10px] text-muted-foreground">
                    Budget: {formatCurrency(project.target_budget)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Ruler className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Estimated
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {totalEstimated > 0
                    ? formatCurrency(totalEstimated)
                    : formatSqft(project.square_footage)}
                </p>
                {totalEstimated > 0 && project.square_footage && (
                  <p className="text-[10px] text-muted-foreground">
                    {formatSqft(project.square_footage)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                {hasActuals ? (
                  <DollarSign className="h-5 w-5 text-purple-600" />
                ) : (
                  <User className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {hasActuals ? "Total Actual" : "Client"}
                </p>
                <p className="text-xl font-bold tabular-nums truncate">
                  {hasActuals
                    ? formatCurrency(totalActual)
                    : project.client_name ?? "\u2014"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  totalVariance != null
                    ? totalVariance > 0
                      ? "bg-red-100"
                      : "bg-green-100"
                    : "bg-amber-100"
                }`}
              >
                {totalVariance != null ? (
                  totalVariance > 0 ? (
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-green-600" />
                  )
                ) : (
                  <FileText className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {totalVariance != null ? "Variance" : "Selections"}
                </p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    totalVariance != null
                      ? totalVariance > 0
                        ? "text-red-600"
                        : totalVariance < 0
                          ? "text-green-600"
                          : ""
                      : ""
                  }`}
                >
                  {totalVariance != null
                    ? formatCurrency(totalVariance)
                    : (allSelections ?? []).length}
                </p>
                {totalVariance != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {totalVariance > 0 ? "Over budget" : "Under budget"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project details card (collapsible feel - compact) */}
      {(addressParts ||
        project.start_date ||
        project.estimated_completion ||
        project.client_email ||
        project.notes) && (
        <Card className="no-print">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {addressParts && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {addressParts}
                  </p>
                </div>
              </div>
            )}
            {(project.start_date || project.estimated_completion) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Timeline</p>
                  <p className="text-sm text-muted-foreground">
                    {project.start_date && (
                      <span>Start: {formatDate(project.start_date)}</span>
                    )}
                    {project.start_date && project.estimated_completion && (
                      <span> &mdash; </span>
                    )}
                    {project.estimated_completion && (
                      <span>
                        Est. Completion:{" "}
                        {formatDate(project.estimated_completion)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
            {project.client_email && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Client Contact</p>
                  <p className="text-sm text-muted-foreground">
                    {project.client_email}
                    {project.client_phone && ` | ${project.client_phone}`}
                  </p>
                </div>
              </div>
            )}
            {project.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {project.notes}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab navigation */}
      <div className="no-print flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("selections")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "selections"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          }`}
        >
          <LayoutList className="h-4 w-4" />
          Rooms & Selections
        </button>
        <button
          onClick={() => setActiveTab("procurement")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "procurement"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Procurement
        </button>
        <button
          onClick={() => setActiveTab("budget")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "budget"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Budget
        </button>
        <button
          onClick={() => setActiveTab("sheet")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sheet"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          }`}
        >
          <Printer className="h-4 w-4" />
          Selection Sheet
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "selections" && (
        <div className="flex gap-6">
          {/* Left panel: Room list */}
          <div className="w-1/3 shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Rooms & Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <RoomManager
                  projectId={id!}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Selections for selected room */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedRoom
                    ? `${selectedRoom.name} Selections`
                    : "Material Selections"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRoomId ? (
                  <SelectionEditor roomId={selectedRoomId} projectId={id!} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select a room to view and manage its material selections.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "procurement" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Procurement Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcurementTracker projectId={id!} />
          </CardContent>
        </Card>
      )}

      {activeTab === "budget" && (
        <BudgetDashboard
          projectId={id!}
          targetBudget={project.target_budget}
        />
      )}

      {activeTab === "sheet" && (
        <div>
          {/* Toolbar (hidden in print) */}
          <div className="no-print flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
            <Button
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showPricing}
                onChange={(e) => setShowPricing(e.target.checked)}
                className="rounded border-border"
              />
              Show Pricing
            </label>
            <span className="text-xs text-muted-foreground ml-auto">
              Date: {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Selection Sheet (visible in print) */}
          <div className="border rounded-lg p-8 bg-white">
            <SelectionSheet
              projectId={id!}
              project={project}
              showPricing={showPricing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
