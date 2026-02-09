import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Document } from "@/lib/types";

// ===========================================
// useDocumentStatus
// Subscribe to Realtime changes for a single document.
// Returns the latest document state plus a loading flag.
// ===========================================

export function useDocumentStatus(documentId: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Initial fetch to get current state
    async function fetchDocument() {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId!)
        .single();

      if (!cancelled) {
        if (!error && data) {
          setDocument(data);
        }
        setLoading(false);
      }
    }

    fetchDocument();

    // Subscribe to Realtime updates for this document
    const channel = supabase
      .channel(`document-${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "documents",
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          if (!cancelled) {
            setDocument(payload.new as Document);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  return { document, loading };
}

// ===========================================
// useRecentDocuments
// Fetches recent documents for the current user's organization
// via React Query, with Realtime subscription for live updates.
// RLS policies enforce organization scoping at the database level.
// ===========================================

export function useRecentDocuments(limit: number = 10) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["documents", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Document[];
    },
  });

  // Subscribe to Realtime for all document changes (insert + update)
  useEffect(() => {
    const channel = supabase
      .channel("recent-documents")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
        },
        () => {
          // Invalidate the query so React Query refetches
          queryClient.invalidateQueries({ queryKey: ["documents", "recent"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { documents: data ?? [], isLoading };
}
