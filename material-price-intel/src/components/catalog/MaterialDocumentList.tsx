import { FileText, ExternalLink } from "lucide-react";

// ===========================================
// MaterialDocumentList - Presentational
// ===========================================
// Document list for material catalog detail.
// Spec sheets, install guides, warranties, etc.
// Receives pre-resolved URLs via props.
// ===========================================

type MaterialDocumentListProps = {
  documents: Array<{
    id: string;
    title: string;
    doc_url: string;
    doc_type: string;
    file_size_bytes: number | null;
  }>;
};

// Doc type color mapping
const DOC_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  spec_sheet: { bg: "bg-blue-50", text: "text-blue-700" },
  installation_guide: { bg: "bg-green-50", text: "text-green-700" },
  cut_sheet: { bg: "bg-purple-50", text: "text-purple-700" },
  warranty: { bg: "bg-amber-50", text: "text-amber-700" },
  care_guide: { bg: "bg-teal-50", text: "text-teal-700" },
  other: { bg: "bg-gray-50", text: "text-gray-700" },
};

function getDocTypeColor(docType: string): { bg: string; text: string } {
  return DOC_TYPE_COLORS[docType] ?? DOC_TYPE_COLORS.other;
}

function formatDocType(docType: string): string {
  return docType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialDocumentList({
  documents,
}: MaterialDocumentListProps) {
  // Empty state
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No documents available</p>
      </div>
    );
  }

  // Group by doc_type
  const grouped = new Map<string, typeof documents>();
  for (const doc of documents) {
    const existing = grouped.get(doc.doc_type) ?? [];
    existing.push(doc);
    grouped.set(doc.doc_type, existing);
  }

  const hasMultipleTypes = grouped.size > 1;

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([docType, docs]) => (
        <div key={docType}>
          {/* Section header when multiple types */}
          {hasMultipleTypes && (
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              {formatDocType(docType)}
            </h4>
          )}

          <div className="space-y-1">
            {docs.map((doc) => {
              const color = getDocTypeColor(doc.doc_type);
              return (
                <a
                  key={doc.id}
                  href={doc.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md border hover:bg-muted/50 transition-colors group"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

                  <span className="flex-1 text-sm truncate" title={doc.title}>
                    {doc.title}
                  </span>

                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${color.bg} ${color.text}`}
                  >
                    {formatDocType(doc.doc_type)}
                  </span>

                  {doc.file_size_bytes != null && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size_bytes)}
                    </span>
                  )}

                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
