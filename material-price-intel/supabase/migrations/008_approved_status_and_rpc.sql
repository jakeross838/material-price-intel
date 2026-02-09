-- Drop the existing status CHECK constraint (name may be auto-generated)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT c.conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  WHERE c.conrelid = 'public.documents'::regclass
    AND c.contype = 'c'
    AND a.attname = 'status';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE documents DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Re-add with 'approved' included
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'review_needed', 'approved'));

-- ============================================================
-- approve_quote RPC: marks quote as verified and document as approved
-- ============================================================
CREATE OR REPLACE FUNCTION approve_quote(p_quote_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify caller owns this quote's organization
  IF NOT EXISTS (
    SELECT 1 FROM quotes
    WHERE id = p_quote_id
      AND organization_id = public.user_org_id()
  ) THEN
    RAISE EXCEPTION 'Quote not found or access denied';
  END IF;

  -- Mark quote as verified
  UPDATE quotes
  SET is_verified = TRUE
  WHERE id = p_quote_id
    AND organization_id = public.user_org_id();

  -- Mark linked document as approved
  UPDATE documents
  SET status = 'approved',
      completed_at = COALESCE(completed_at, NOW())
  WHERE quote_id = p_quote_id
    AND organization_id = public.user_org_id();
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- ============================================================
-- update_quote_review RPC: saves edits to quote fields and line items
-- ============================================================
CREATE OR REPLACE FUNCTION update_quote_review(
  p_quote_id UUID,
  p_quote_number TEXT DEFAULT NULL,
  p_quote_date DATE DEFAULT NULL,
  p_project_name TEXT DEFAULT NULL,
  p_payment_terms TEXT DEFAULT NULL,
  p_valid_until DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_subtotal NUMERIC DEFAULT NULL,
  p_delivery_cost NUMERIC DEFAULT NULL,
  p_tax_amount NUMERIC DEFAULT NULL,
  p_tax_rate NUMERIC DEFAULT NULL,
  p_total_amount NUMERIC DEFAULT NULL,
  p_line_items JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  item JSONB;
  i INT := 0;
BEGIN
  -- Verify caller owns this quote's organization
  IF NOT EXISTS (
    SELECT 1 FROM quotes
    WHERE id = p_quote_id
      AND organization_id = public.user_org_id()
  ) THEN
    RAISE EXCEPTION 'Quote not found or access denied';
  END IF;

  -- Update quote scalar fields (only non-null params)
  UPDATE quotes SET
    quote_number = COALESCE(p_quote_number, quote_number),
    quote_date = COALESCE(p_quote_date, quote_date),
    project_name = COALESCE(p_project_name, project_name),
    payment_terms = COALESCE(p_payment_terms, payment_terms),
    valid_until = COALESCE(p_valid_until, valid_until),
    notes = COALESCE(p_notes, notes),
    subtotal = COALESCE(p_subtotal, subtotal),
    delivery_cost = COALESCE(p_delivery_cost, delivery_cost),
    tax_amount = COALESCE(p_tax_amount, tax_amount),
    tax_rate = COALESCE(p_tax_rate, tax_rate),
    total_amount = COALESCE(p_total_amount, total_amount)
  WHERE id = p_quote_id
    AND organization_id = public.user_org_id();

  -- Replace line items if provided
  IF p_line_items IS NOT NULL THEN
    DELETE FROM line_items WHERE quote_id = p_quote_id;

    FOR item IN SELECT * FROM jsonb_array_elements(p_line_items)
    LOOP
      INSERT INTO line_items (
        quote_id, raw_description, quantity, unit, unit_price,
        extended_price, discount_pct, discount_amount, line_total,
        notes, sort_order, material_id
      ) VALUES (
        p_quote_id,
        item->>'raw_description',
        (item->>'quantity')::NUMERIC,
        item->>'unit',
        (item->>'unit_price')::NUMERIC,
        (item->>'extended_price')::NUMERIC,
        (item->>'discount_pct')::NUMERIC,
        (item->>'discount_amount')::NUMERIC,
        (item->>'line_total')::NUMERIC,
        item->>'notes',
        i,
        NULL
      );
      i := i + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
