-- ===========================================
-- HELPER FUNCTION: Get current user's organization ID
-- ===========================================
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.user_profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ===========================================
-- ENABLE RLS ON ALL TABLES
-- ===========================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- ORGANIZATIONS: Users see their own org
-- ===========================================
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id = auth.user_org_id());

-- ===========================================
-- USER PROFILES: Users see own org profiles, update own profile, admin manages all
-- ===========================================
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
  USING (organization_id = auth.user_org_id());

CREATE POLICY "profiles_update_own" ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_admin" ON user_profiles FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "profiles_delete_admin" ON user_profiles FOR DELETE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- SUPPLIERS: Organization-scoped CRUD
-- ===========================================
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT
  USING (organization_id = auth.user_org_id());

CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- MATERIAL CATEGORIES: Global read, admin write
-- ===========================================
CREATE POLICY "categories_select" ON material_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_insert" ON material_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "categories_update" ON material_categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "categories_delete" ON material_categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- MATERIALS: Organization-scoped CRUD
-- ===========================================
CREATE POLICY "materials_select" ON materials FOR SELECT
  USING (organization_id = auth.user_org_id());

CREATE POLICY "materials_insert" ON materials FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "materials_update" ON materials FOR UPDATE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "materials_delete" ON materials FOR DELETE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- DOCUMENTS: Organization-scoped CRUD
-- ===========================================
CREATE POLICY "documents_select" ON documents FOR SELECT
  USING (organization_id = auth.user_org_id());

CREATE POLICY "documents_insert" ON documents FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "documents_update" ON documents FOR UPDATE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "documents_delete" ON documents FOR DELETE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- QUOTES: Organization-scoped CRUD
-- ===========================================
CREATE POLICY "quotes_select" ON quotes FOR SELECT
  USING (organization_id = auth.user_org_id());

CREATE POLICY "quotes_insert" ON quotes FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "quotes_update" ON quotes FOR UPDATE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "quotes_delete" ON quotes FOR DELETE
  USING (organization_id = auth.user_org_id()
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===========================================
-- LINE ITEMS: Access via parent quote's organization
-- ===========================================
CREATE POLICY "line_items_select" ON line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = line_items.quote_id
      AND quotes.organization_id = auth.user_org_id()
  ));

CREATE POLICY "line_items_insert" ON line_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = line_items.quote_id
      AND quotes.organization_id = auth.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "line_items_update" ON line_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = line_items.quote_id
      AND quotes.organization_id = auth.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  ));

CREATE POLICY "line_items_delete" ON line_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = line_items.quote_id
      AND quotes.organization_id = auth.user_org_id()
      AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ));
