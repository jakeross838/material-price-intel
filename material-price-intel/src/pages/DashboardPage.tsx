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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/lib/types";

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
    </div>
  );
}
