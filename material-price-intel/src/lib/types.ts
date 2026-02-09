// ===========================================
// Database row types -- mirror the SQL schema exactly
// Using `type` aliases (not `interface`) so they satisfy
// Record<string, unknown> for Supabase client generics.
// ===========================================

export type Organization = {
  id: string;
  name: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  organization_id: string;
  display_name: string;
  role: "admin" | "editor" | "viewer";
  created_at: string;
};

export type Supplier = {
  id: string;
  organization_id: string;
  name: string;
  normalized_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MaterialCategory = {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
};

export type Material = {
  id: string;
  organization_id: string;
  category_id: string;
  canonical_name: string;
  species: string | null;
  dimensions: string | null;
  grade: string | null;
  treatment: string | null;
  unit_of_measure: string;
  description: string | null;
  aliases: string[];
  category_attributes: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MaterialAlias = {
  id: string;
  material_id: string;
  alias: string;
  normalized_alias: string;
  source_quote_id: string | null;
  created_at: string;
};

export type DocumentFileType = "pdf" | "xlsx" | "csv" | "email_text";
export type DocumentSource = "upload" | "email";
export type DocumentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "review_needed"
  | "approved";

export type Document = {
  id: string;
  organization_id: string;
  file_path: string | null;
  file_type: DocumentFileType;
  file_name: string | null;
  file_size_bytes: number | null;
  source: DocumentSource;
  email_from: string | null;
  email_subject: string | null;
  email_body: string | null;
  content_text: string | null;
  status: DocumentStatus;
  error_message: string | null;
  quote_id: string | null;
  uploaded_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Quote = {
  id: string;
  organization_id: string;
  document_id: string | null;
  supplier_id: string;
  quote_number: string | null;
  quote_date: string | null;
  valid_until: string | null;
  project_name: string | null;
  subtotal: number | null;
  delivery_cost: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  total_amount: number | null;
  payment_terms: string | null;
  notes: string | null;
  confidence_score: number | null;
  raw_extraction: Record<string, unknown> | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type LineItem = {
  id: string;
  quote_id: string;
  material_id: string | null;
  raw_description: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  extended_price: number | null;
  discount_pct: number | null;
  discount_amount: number | null;
  line_total: number | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
};

// ===========================================
// Supabase Database type helper
// Enables typed Supabase client usage:
//   const supabase = createClient<Database>(url, key);
//   // Now supabase.from('quotes').select() returns typed Quote rows
// ===========================================
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, "id" | "created_at">;
        Update: Partial<Omit<Organization, "id">>;
        Relationships: [];
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "created_at">;
        Update: Partial<Omit<UserProfile, "id">>;
        Relationships: [];
      };
      suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Supplier, "id" | "created_at">>;
        Relationships: [];
      };
      material_categories: {
        Row: MaterialCategory;
        Insert: Omit<MaterialCategory, "id">;
        Update: Partial<Omit<MaterialCategory, "id">>;
        Relationships: [];
      };
      materials: {
        Row: Material;
        Insert: Omit<Material, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Material, "id" | "created_at">>;
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, "id" | "created_at">;
        Update: Partial<Omit<Document, "id" | "created_at">>;
        Relationships: [];
      };
      quotes: {
        Row: Quote;
        Insert: Omit<Quote, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Quote, "id" | "created_at">>;
        Relationships: [];
      };
      line_items: {
        Row: LineItem;
        Insert: Omit<LineItem, "id" | "created_at">;
        Update: Partial<Omit<LineItem, "id" | "created_at">>;
        Relationships: [];
      };
      material_aliases: {
        Row: MaterialAlias;
        Insert: Omit<MaterialAlias, "id" | "created_at">;
        Update: Partial<Omit<MaterialAlias, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_quote: {
        Args: { p_quote_id: string };
        Returns: undefined;
      };
      update_quote_review: {
        Args: {
          p_quote_id: string;
          p_quote_number?: string | null;
          p_quote_date?: string | null;
          p_project_name?: string | null;
          p_payment_terms?: string | null;
          p_valid_until?: string | null;
          p_notes?: string | null;
          p_subtotal?: number | null;
          p_delivery_cost?: number | null;
          p_tax_amount?: number | null;
          p_tax_rate?: number | null;
          p_total_amount?: number | null;
          p_line_items?: string | null;
        };
        Returns: undefined;
      };
      merge_materials: {
        Args: { p_keep_id: string; p_merge_id: string };
        Returns: undefined;
      };
      find_similar_material: {
        Args: {
          p_org_id: string;
          p_search_name: string;
          p_threshold?: number;
        };
        Returns: Array<{
          id: string;
          canonical_name: string;
          similarity: number;
        }>;
      };
    };
  };
};
