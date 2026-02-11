-- ===========================================
-- MIGRATION 012: Estimating & Procurement Schema
-- Adds projects, project_rooms, project_selections,
-- and procurement_items tables with RLS, indexes,
-- triggers, and RPC functions.
-- ===========================================

-- ===========================================
-- TABLE: projects
-- ===========================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Bradenton',
  state TEXT DEFAULT 'FL',
  square_footage NUMERIC(10,2),
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  target_budget NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'estimating', 'in_progress', 'completed', 'on_hold')),
  notes TEXT,
  start_date DATE,
  estimated_completion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, name)
);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABLE: project_rooms
-- ===========================================
CREATE TABLE project_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'interior'
    CHECK (room_type IN ('interior', 'exterior', 'utility', 'common')),
  sort_order INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, name)
);

-- ===========================================
-- TABLE: project_selections
-- ===========================================
CREATE TABLE project_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES project_rooms(id) ON DELETE CASCADE,
  category_id UUID REFERENCES material_categories(id),
  material_id UUID REFERENCES materials(id),
  selection_name TEXT NOT NULL,
  description TEXT,
  allowance_amount NUMERIC(12,2),
  quantity NUMERIC(12,4),
  unit TEXT DEFAULT 'sqft',
  estimated_unit_price NUMERIC(12,4),
  estimated_total NUMERIC(12,2),
  actual_unit_price NUMERIC(12,4),
  actual_total NUMERIC(12,2),
  variance_amount NUMERIC(12,2) GENERATED ALWAYS AS (
    COALESCE(actual_total, estimated_total, 0) - COALESCE(allowance_amount, 0)
  ) STORED,
  upgrade_status TEXT DEFAULT 'pending'
    CHECK (upgrade_status IN ('pending', 'standard', 'upgrade', 'downgrade')),
  supplier_id UUID REFERENCES suppliers(id),
  sort_order INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_project_selections_updated_at
  BEFORE UPDATE ON project_selections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TABLE: procurement_items
-- ===========================================
CREATE TABLE procurement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id UUID NOT NULL REFERENCES project_selections(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id),
  line_item_id UUID REFERENCES line_items(id),
  status TEXT NOT NULL DEFAULT 'not_quoted'
    CHECK (status IN ('not_quoted', 'rfq_sent', 'quoted', 'awarded', 'ordered', 'delivered', 'installed')),
  po_number TEXT,
  ordered_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  committed_price NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (selection_id)
);

CREATE TRIGGER update_procurement_items_updated_at
  BEFORE UPDATE ON procurement_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ENABLE RLS ON ALL NEW TABLES
-- ===========================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_items ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS: projects (org-scoped, same pattern as suppliers)
-- ===========================================
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (organization_id = public.user_org_id());

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (organization_id = public.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- RLS: project_rooms (via parent project's org)
-- ===========================================
CREATE POLICY "project_rooms_select" ON project_rooms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_rooms.project_id
      AND projects.organization_id = public.user_org_id()
  ));

CREATE POLICY "project_rooms_insert" ON project_rooms FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_rooms.project_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "project_rooms_update" ON project_rooms FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_rooms.project_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "project_rooms_delete" ON project_rooms FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_rooms.project_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ));

-- ===========================================
-- RLS: project_selections (via room -> project chain)
-- ===========================================
CREATE POLICY "project_selections_select" ON project_selections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_rooms
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_rooms.id = project_selections.room_id
      AND projects.organization_id = public.user_org_id()
  ));

CREATE POLICY "project_selections_insert" ON project_selections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM project_rooms
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_rooms.id = project_selections.room_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "project_selections_update" ON project_selections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM project_rooms
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_rooms.id = project_selections.room_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "project_selections_delete" ON project_selections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM project_rooms
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_rooms.id = project_selections.room_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ));

-- ===========================================
-- RLS: procurement_items (via selection -> room -> project chain)
-- ===========================================
CREATE POLICY "procurement_items_select" ON procurement_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = procurement_items.selection_id
      AND projects.organization_id = public.user_org_id()
  ));

CREATE POLICY "procurement_items_insert" ON procurement_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = procurement_items.selection_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "procurement_items_update" ON procurement_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = procurement_items.selection_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "procurement_items_delete" ON procurement_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM project_selections
    JOIN project_rooms ON project_rooms.id = project_selections.room_id
    JOIN projects ON projects.id = project_rooms.project_id
    WHERE project_selections.id = procurement_items.selection_id
      AND projects.organization_id = public.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ));

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_rooms_project ON project_rooms(project_id);
CREATE INDEX idx_project_selections_room ON project_selections(room_id);
CREATE INDEX idx_project_selections_material ON project_selections(material_id);
CREATE INDEX idx_project_selections_category ON project_selections(category_id);
CREATE INDEX idx_procurement_items_selection ON procurement_items(selection_id);
CREATE INDEX idx_procurement_items_quote ON procurement_items(quote_id);
CREATE INDEX idx_procurement_items_status ON procurement_items(status);

-- ===========================================
-- RPC: get_project_summary
-- Returns aggregated totals for a project.
-- ===========================================
CREATE OR REPLACE FUNCTION get_project_summary(p_project_id UUID)
RETURNS TABLE (
  total_allowance NUMERIC,
  total_estimated NUMERIC,
  total_actual NUMERIC,
  total_variance NUMERIC,
  selection_count BIGINT,
  items_bought_out BIGINT
) AS $$
BEGIN
  -- Verify caller's org owns the project
  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
      AND organization_id = public.user_org_id()
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(ps.allowance_amount), 0) AS total_allowance,
    COALESCE(SUM(ps.estimated_total), 0) AS total_estimated,
    COALESCE(SUM(ps.actual_total), 0) AS total_actual,
    COALESCE(SUM(ps.variance_amount), 0) AS total_variance,
    COUNT(ps.id) AS selection_count,
    (
      SELECT COUNT(*)
      FROM procurement_items pi
      JOIN project_selections ps2 ON ps2.id = pi.selection_id
      JOIN project_rooms pr2 ON pr2.id = ps2.room_id
      WHERE pr2.project_id = p_project_id
        AND pi.status IN ('awarded', 'ordered', 'delivered', 'installed')
    ) AS items_bought_out
  FROM project_selections ps
  JOIN project_rooms pr ON pr.id = ps.room_id
  WHERE pr.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ===========================================
-- RPC: get_material_price_stats
-- Returns pricing statistics for a material.
-- ===========================================
CREATE OR REPLACE FUNCTION get_material_price_stats(p_material_id UUID)
RETURNS TABLE (
  avg_price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  quote_count BIGINT,
  latest_price NUMERIC,
  latest_supplier TEXT
) AS $$
BEGIN
  -- Verify caller's org owns the material
  IF NOT EXISTS (
    SELECT 1 FROM materials
    WHERE id = p_material_id
      AND organization_id = public.user_org_id()
  ) THEN
    RAISE EXCEPTION 'Material not found or access denied';
  END IF;

  RETURN QUERY
  SELECT
    AVG(li.effective_unit_price) AS avg_price,
    MIN(li.effective_unit_price) AS min_price,
    MAX(li.effective_unit_price) AS max_price,
    COUNT(DISTINCT q.id) AS quote_count,
    (
      SELECT li2.effective_unit_price
      FROM line_items li2
      JOIN quotes q2 ON q2.id = li2.quote_id
      WHERE li2.material_id = p_material_id
        AND li2.line_type = 'material'
        AND q2.is_verified = TRUE
      ORDER BY q2.quote_date DESC NULLS LAST, q2.created_at DESC
      LIMIT 1
    ) AS latest_price,
    (
      SELECT s.name
      FROM line_items li3
      JOIN quotes q3 ON q3.id = li3.quote_id
      JOIN suppliers s ON s.id = q3.supplier_id
      WHERE li3.material_id = p_material_id
        AND li3.line_type = 'material'
        AND q3.is_verified = TRUE
      ORDER BY q3.quote_date DESC NULLS LAST, q3.created_at DESC
      LIMIT 1
    ) AS latest_supplier
  FROM line_items li
  JOIN quotes q ON q.id = li.quote_id
  WHERE li.material_id = p_material_id
    AND li.line_type = 'material'
    AND q.is_verified = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
