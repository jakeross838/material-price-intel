import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database, Document } from "@/lib/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function useUploadDocument() {
  const { user } = useAuth();
  const orgIdCache = useRef<string | null>(null);

  async function getOrgId(): Promise<string> {
    if (orgIdCache.current) {
      return orgIdCache.current;
    }

    if (!user) {
      throw new Error("User must be authenticated to upload documents");
    }

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      throw new Error("Failed to load user profile: " + (error?.message ?? "not found"));
    }

    orgIdCache.current = profile.organization_id;
    return profile.organization_id;
  }

  const mutation = useMutation<Document, Error, File>({
    mutationFn: async (file: File) => {
      // Validate file type
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are supported");
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size must be under 50MB");
      }

      if (!user) {
        throw new Error("User must be authenticated to upload documents");
      }

      const orgId = await getOrgId();
      const uuid = crypto.randomUUID();
      const sanitizedName = file.name.replace(/\s+/g, "_");
      const storagePath = `${orgId}/${uuid}_${sanitizedName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        throw new Error("Failed to upload file to storage: " + uploadError.message);
      }

      // Insert document record in database
      const insertData: Database["public"]["Tables"]["documents"]["Insert"] = {
        organization_id: orgId,
        file_path: storagePath,
        file_type: "pdf",
        file_name: file.name,
        file_size_bytes: file.size,
        source: "upload",
        status: "pending",
        uploaded_by: user.id,
        email_from: null,
        email_subject: null,
        email_body: null,
        content_text: null,
        error_message: null,
        quote_id: null,
        started_at: null,
        completed_at: null,
      };

      const { data: doc, error: dbError } = await supabase
        .from("documents")
        .insert(insertData)
        .select()
        .single();

      if (dbError || !doc) {
        // Best-effort cleanup: delete orphaned storage file
        await supabase.storage.from("documents").remove([storagePath]);
        throw new Error("Failed to create document record: " + (dbError?.message ?? "unknown error"));
      }

      return doc;
    },
  });

  return {
    uploadDocument: mutation.mutate,
    uploadDocumentAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
