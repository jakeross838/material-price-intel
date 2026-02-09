import { FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRecentDocuments } from "@/hooks/useDocumentStatus";
import type { DocumentStatus } from "@/lib/types";

// ===========================================
// Format bytes into a human-readable file size string.
// ===========================================
function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ===========================================
// Status badge styling keyed by document status.
// ===========================================
const statusConfig: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 animate-pulse",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800",
  },
  review_needed: {
    label: "Review Needed",
    className: "bg-orange-100 text-orange-800",
  },
};

// ===========================================
// RecentUploads
// Displays a list of recently uploaded documents with status badges.
// Data is fetched via useRecentDocuments (React Query + Realtime).
// ===========================================
export function RecentUploads() {
  const { documents, isLoading } = useRecentDocuments();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">Recent Uploads</h3>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Loading documents...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && documents.length === 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 py-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet
          </p>
        </div>
      )}

      {/* Document list */}
      {!isLoading && documents.length > 0 && (
        <div className="divide-y divide-border rounded-lg border">
          {documents.map((doc) => {
            const config = statusConfig[doc.status];
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />

                {/* File name -- truncated */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {doc.file_name ?? "Untitled document"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size_bytes)}
                    {" \u00B7 "}
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    config.className
                  )}
                  title={
                    doc.status === "failed" && doc.error_message
                      ? doc.error_message
                      : undefined
                  }
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
