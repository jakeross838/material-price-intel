import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ShieldCheck,
  XCircle,
  FolderKanban,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { DocumentStatus, ProjectStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Status card configuration
// ---------------------------------------------------------------------------

type StatusCardConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  highlight?: boolean;
};

const statusCards: Record<string, StatusCardConfig> = {
  pending: {
    label: "Pending",
    icon: Clock,
    iconColor: "text-amber-600",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    iconColor: "text-blue-600",
  },
  review_needed: {
    label: "Needs Review",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    highlight: true,
  },
  completed: {
    label: "Completed",
    icon: FileText,
    iconColor: "text-green-600",
  },
  approved: {
    label: "Approved",
    icon: ShieldCheck,
    iconColor: "text-emerald-600",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    iconColor: "text-red-600",
  },
};

const statusOrder: DocumentStatus[] = [
  "pending",
  "processing",
  "review_needed",
  "completed",
  "approved",
  "failed",
];

// ---------------------------------------------------------------------------
// Project status badge config
// ---------------------------------------------------------------------------

const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; color: string }
> = {
  planning: { label: "Planning", color: "bg-blue-100 text-blue-800" },
  estimating: { label: "Estimating", color: "bg-amber-100 text-amber-800" },
  in_progress: {
    label: "In Progress",
    color: "bg-green-100 text-green-800",
  },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-800" },
  on_hold: { label: "On Hold", color: "bg-red-100 text-red-800" },
};

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { user } = useAuth();

  // Fetch document counts by status
  const { data: statusCounts } = useQuery({
    queryKey: ["documents", "status-counts"],
    queryFn: async () => {
      const statuses: DocumentStatus[] = [
        "pending",
        "processing",
        "completed",
        "review_needed",
        "approved",
        "failed",
      ];
      const counts: Record<string, number> = {};

      for (const status of statuses) {
        const { count, error } = await supabase
          .from("documents")
          .select("*", { count: "exact", head: true })
          .eq("status", status);

        if (!error) {
          counts[status] = count ?? 0;
        }
      }
      return counts;
    },
  });

  // Fetch documents that need review
  const { data: reviewNeeded } = useQuery({
    queryKey: ["documents", "review-needed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, quote_id, created_at")
        .eq("status", "review_needed")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch active projects (planning, estimating, in_progress)
  const { data: activeProjects } = useQuery({
    queryKey: ["projects", "active-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client_name, status, target_budget, updated_at")
        .in("status", ["planning", "estimating", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // For each project, fetch summary via RPC
      const withSummary = await Promise.all(
        (data ?? []).map(async (project) => {
          const { data: summary } = await supabase.rpc(
            "get_project_summary",
            { p_project_id: project.id }
          );
          const s = summary?.[0] ?? null;
          return { ...project, summary: s };
        })
      );

      return withSummary;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Welcome, {user?.email}
          </p>
        </div>
        <Button asChild>
          <Link to="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Quote
          </Link>
        </Button>
      </div>

      {/* Status overview cards */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight mb-3">
          Document Status Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statusOrder.map((status) => {
            const config = statusCards[status];
            const count = statusCounts?.[status] ?? 0;
            const Icon = config.icon;
            const isHighlighted = config.highlight && count > 0;

            return (
              <Card
                key={status}
                className={cn(
                  isHighlighted && "border-amber-400 bg-amber-50/50"
                )}
              >
                <CardContent className="flex items-center gap-4 pt-6">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted",
                      isHighlighted && "bg-amber-100"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.iconColor)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{count}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Needs attention section */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight mb-3">
          Needs Attention
        </h3>
        {reviewNeeded && reviewNeeded.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {reviewNeeded.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {doc.file_name ?? "Untitled document"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Needs human review
                      </p>
                    </div>
                    {doc.quote_id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/quotes/${doc.quote_id}`}>Review</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                All caught up! No documents need review.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active projects section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold tracking-tight">
            Active Projects
          </h3>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects">
              View All
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {activeProjects && activeProjects.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activeProjects.map((project) => {
                  const cfg =
                    projectStatusConfig[project.status as ProjectStatus] ??
                    projectStatusConfig.planning;
                  const summary = project.summary;
                  const estimated = summary?.total_estimated ?? 0;
                  const actual = summary?.total_actual ?? 0;
                  const budget = project.target_budget;
                  const displayAmount = actual > 0 ? actual : estimated;
                  const displayLabel = actual > 0 ? "Actual" : "Est";

                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <FolderKanban className="h-4 w-4 shrink-0 text-blue-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/projects/${project.id}`}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {project.name}
                          </Link>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {project.client_name && (
                            <span>{project.client_name}</span>
                          )}
                          {displayAmount > 0 && budget ? (
                            <span className="tabular-nums">
                              <DollarSign className="inline h-3 w-3" />
                              {displayLabel}: {formatCurrency(displayAmount)} /{" "}
                              Budget: {formatCurrency(budget)}
                            </span>
                          ) : displayAmount > 0 ? (
                            <span className="tabular-nums">
                              {displayLabel}: {formatCurrency(displayAmount)}
                            </span>
                          ) : budget ? (
                            <span className="tabular-nums">
                              Budget: {formatCurrency(budget)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/projects/${project.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No active projects. Start by creating a project.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/projects/new">Create Project</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
