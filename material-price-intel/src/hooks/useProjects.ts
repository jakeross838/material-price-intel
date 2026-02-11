import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/types";

// ===========================================
// useProjects
// Fetches all projects for the current org,
// ordered by updated_at desc. RLS enforces org scoping.
// ===========================================

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useProject
// Fetches a single project by ID.
// Disabled when projectId is undefined.
// ===========================================

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

// ===========================================
// useCreateProject
// Mutation to create a new project.
// Looks up organization_id from user_profiles,
// then inserts into projects table.
// ===========================================

type CreateProjectInput = {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  square_footage?: number | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  target_budget?: number | null;
  notes?: string | null;
  start_date?: string | null;
  estimated_completion?: string | null;
};

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      // Get organization_id from user_profiles
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      if (profileError || !profile)
        throw new Error("Could not find user profile");

      // Insert project
      const { data, error } = await supabase
        .from("projects")
        .insert({
          organization_id: profile.organization_id,
          name: input.name,
          address: input.address ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          square_footage: input.square_footage ?? null,
          client_name: input.client_name ?? null,
          client_email: input.client_email ?? null,
          client_phone: input.client_phone ?? null,
          target_budget: input.target_budget ?? null,
          notes: input.notes ?? null,
          start_date: input.start_date ?? null,
          estimated_completion: input.estimated_completion ?? null,
          status: "planning",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ===========================================
// useUpdateProject
// Mutation to update an existing project.
// Invalidates both list and detail caches.
// ===========================================

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Project>;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.id],
      });
    },
  });
}

// ===========================================
// useDeleteProject
// Mutation to delete a project.
// CASCADE will handle rooms/selections/procurement.
// ===========================================

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
