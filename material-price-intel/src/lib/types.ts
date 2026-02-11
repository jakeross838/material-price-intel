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

// ===========================================
// Estimating & Procurement types
// ===========================================

export type ProjectStatus = 'planning' | 'estimating' | 'in_progress' | 'completed' | 'on_hold';

export type Project = {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  square_footage: number | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  target_budget: number | null;
  status: ProjectStatus;
  notes: string | null;
  start_date: string | null;
  estimated_completion: string | null;
  created_at: string;
  updated_at: string;
};

export type RoomType = 'interior' | 'exterior' | 'utility' | 'common';

export type ProjectRoom = {
  id: string;
  project_id: string;
  name: string;
  room_type: RoomType;
  sort_order: number;
  notes: string | null;
  created_at: string;
};

export type UpgradeStatus = 'pending' | 'standard' | 'upgrade' | 'downgrade';

export type ProjectSelection = {
  id: string;
  room_id: string;
  category_id: string | null;
  material_id: string | null;
  selection_name: string;
  description: string | null;
  allowance_amount: number | null;
  quantity: number | null;
  unit: string | null;
  estimated_unit_price: number | null;
  estimated_total: number | null;
  actual_unit_price: number | null;
  actual_total: number | null;
  variance_amount: number | null;
  upgrade_status: UpgradeStatus;
  supplier_id: string | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProcurementStatus = 'not_quoted' | 'rfq_sent' | 'quoted' | 'awarded' | 'ordered' | 'delivered' | 'installed';

export type ProcurementItem = {
  id: string;
  selection_id: string;
  quote_id: string | null;
  line_item_id: string | null;
  status: ProcurementStatus;
  po_number: string | null;
  ordered_date: string | null;
  expected_delivery: string | null;
  actual_delivery: string | null;
  committed_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectSummary = {
  total_allowance: number;
  total_estimated: number;
  total_actual: number;
  total_variance: number;
  selection_count: number;
  items_bought_out: number;
};

export type MaterialPriceStats = {
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  quote_count: number;
  latest_price: number | null;
  latest_supplier: string | null;
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
  quote_discount_pct: number | null;
  quote_discount_amount: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type LineItemType = 'material' | 'discount' | 'fee' | 'subtotal_line' | 'note';

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
  line_type: LineItemType;
  effective_unit_price: number | null;
  applies_to_line_item_id: string | null;
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
        Relationships: [
          {
            foreignKeyName: "line_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      material_aliases: {
        Row: MaterialAlias;
        Insert: Omit<MaterialAlias, "id" | "created_at">;
        Update: Partial<Omit<MaterialAlias, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "material_aliases_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Project, "id" | "created_at">>;
        Relationships: [];
      };
      project_rooms: {
        Row: ProjectRoom;
        Insert: Omit<ProjectRoom, "id" | "created_at">;
        Update: Partial<Omit<ProjectRoom, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "project_rooms_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_selections: {
        Row: ProjectSelection;
        Insert: Pick<ProjectSelection, "room_id" | "selection_name" | "upgrade_status" | "sort_order"> & Partial<Omit<ProjectSelection, "id" | "created_at" | "updated_at" | "variance_amount" | "room_id" | "selection_name" | "upgrade_status" | "sort_order">>;
        Update: Partial<Omit<ProjectSelection, "id" | "created_at" | "variance_amount">>;
        Relationships: [
          {
            foreignKeyName: "project_selections_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "project_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_selections_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_selections_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "material_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_selections_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      procurement_items: {
        Row: ProcurementItem;
        Insert: Pick<ProcurementItem, "selection_id" | "status"> & Partial<Omit<ProcurementItem, "id" | "created_at" | "updated_at" | "selection_id" | "status">>;
        Update: Partial<Omit<ProcurementItem, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "procurement_items_selection_id_fkey";
            columns: ["selection_id"];
            isOneToOne: true;
            referencedRelation: "project_selections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procurement_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procurement_items_line_item_id_fkey";
            columns: ["line_item_id"];
            isOneToOne: false;
            referencedRelation: "line_items";
            referencedColumns: ["id"];
          },
        ];
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
          p_quote_discount_pct?: number | null;
          p_quote_discount_amount?: number | null;
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
      get_project_summary: {
        Args: { p_project_id: string };
        Returns: ProjectSummary[];
      };
      get_material_price_stats: {
        Args: { p_material_id: string };
        Returns: MaterialPriceStats[];
      };
    };
  };
};
