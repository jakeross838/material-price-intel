import { Link } from "react-router";
import { Plus, Loader2, FolderKanban, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
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
      ) : (
        /* Project cards grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => {
            const cfg = statusConfig[project.status] ?? statusConfig.planning;
            const budget = formatCurrency(project.target_budget);
            const sqft = formatSqft(project.square_footage);
            const addressParts = [project.address, project.city, project.state]
              .filter(Boolean)
              .join(", ");

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
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
                  </div>

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
