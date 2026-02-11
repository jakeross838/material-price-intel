import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Plus,
  Loader2,
  FolderKanban,
  ArrowRight,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProjectStatus, ProjectSummary } from "@/lib/types";

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

const statusFilterOptions: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "planning", label: "Planning" },
  { value: "estimating", label: "Estimating" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

type SortKey = "updated" | "name" | "budget" | "status";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Updated" },
  { value: "name", label: "Name" },
  { value: "budget", label: "Budget" },
  { value: "status", label: "Status" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(val: number | null) {
  if (val == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatSqft(val: number | null) {
  if (val == null) return null;
  return `${val.toLocaleString("en-US")} sqft`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectsListPage() {
  const { data: projects, isLoading } = useProjects();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<SortKey>("updated");

  // Fetch summaries for all projects
  const projectIds = useMemo(
    () => (projects ?? []).map((p) => p.id),
    [projects]
  );

  const { data: summaries } = useQuery({
    queryKey: ["project-summaries", projectIds],
    queryFn: async () => {
      const result: Record<string, ProjectSummary> = {};
      await Promise.all(
        projectIds.map(async (pid) => {
          const { data } = await supabase.rpc("get_project_summary", {
            p_project_id: pid,
          });
          if (data?.[0]) {
            result[pid] = data[0];
          }
        })
      );
      return result;
    },
    enabled: projectIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Filter and sort projects
  const filtered = useMemo(() => {
    if (!projects) return [];
    let list = [...projects];

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }

    // Sort
    const statusOrder: ProjectStatus[] = [
      "in_progress",
      "estimating",
      "planning",
      "on_hold",
      "completed",
    ];
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "budget":
          return (b.target_budget ?? 0) - (a.target_budget ?? 0);
        case "status":
          return (
            statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          );
        case "updated":
        default:
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
      }
    });

    return list;
  }, [projects, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading projects...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {projects?.length ?? 0}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            Manage custom home projects, rooms, and material selections
          </p>
        </div>
        <Button asChild>
          <Link to="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filter controls */}
      {projects && projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {statusFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="text-xs border rounded-md px-2 py-1.5 bg-background"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!projects || projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No projects yet. Create your first project to start estimating.
            </p>
            <Button asChild className="mt-4">
              <Link to="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Filter className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No projects match your filters.
            </p>
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => setStatusFilter("all")}
            >
              Clear Filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Project cards grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((project) => {
            const cfg = statusConfig[project.status] ?? statusConfig.planning;
            const budget = formatCurrency(project.target_budget);
            const sqft = formatSqft(project.square_footage);
            const addressParts = [project.address, project.city, project.state]
              .filter(Boolean)
              .join(", ");
            const summary = summaries?.[project.id];
            const selectionCount = summary?.selection_count ?? 0;
            const totalEstimated = summary?.total_estimated ?? 0;

            // Budget health: variance from target_budget
            const variance =
              project.target_budget && totalEstimated > 0
                ? totalEstimated - project.target_budget
                : null;
            const budgetPct =
              project.target_budget && totalEstimated > 0
                ? (totalEstimated / project.target_budget) * 100
                : null;

            return (
              <Card
                key={project.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-lg font-semibold hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.client_name && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {project.client_name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {addressParts && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {addressParts}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {budget && (
                      <span className="font-medium tabular-nums">{budget}</span>
                    )}
                    {sqft && (
                      <span className="text-muted-foreground tabular-nums">
                        {sqft}
                      </span>
                    )}
                    {selectionCount > 0 && (
                      <span className="text-muted-foreground">
                        {selectionCount} selection{selectionCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Budget health bar */}
                  {budgetPct != null && project.target_budget && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          Est: {formatCurrency(totalEstimated)} / Budget:{" "}
                          {formatCurrency(project.target_budget)}
                        </span>
                        {variance != null && (
                          <span
                            className={`font-medium ${
                              variance > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {variance > 0 ? "+" : ""}
                            {formatCurrency(variance)}{" "}
                            {variance > 0 ? "over" : "under"}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            budgetPct > 100
                              ? "bg-red-500"
                              : budgetPct > 90
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(budgetPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/projects/${project.id}`}>
                        View Project
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
