import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Ruler,
  User,
  Activity,
  Plus,
  MapPin,
  Calendar,
  FileText,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/hooks/useProjects";
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError } = useProject(id);

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

  return (
    <div className="space-y-6">
      {/* Back link + page header */}
      <div>
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
          <Button variant="outline" disabled>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Budget</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatCurrency(project.target_budget)}
                </p>
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
                <p className="text-sm text-muted-foreground">Square Footage</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatSqft(project.square_footage)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="text-xl font-bold truncate">
                  {project.client_name ?? "\u2014"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-bold">{cfg.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project details card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {addressParts && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{addressParts}</p>
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

          {!addressParts &&
            !project.start_date &&
            !project.estimated_completion &&
            !project.client_email &&
            !project.notes && (
              <p className="text-sm text-muted-foreground">
                No additional details yet.
              </p>
            )}
        </CardContent>
      </Card>

      {/* Rooms section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Rooms & Areas</CardTitle>
            <Button size="sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Rooms will appear here. Add rooms to start defining material
            selections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
