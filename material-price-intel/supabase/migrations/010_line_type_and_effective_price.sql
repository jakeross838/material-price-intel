-- ==========================================================
-- Migration 010: Line type classification, effective pricing,
-- and quote-level discount columns
-- ==========================================================

-- 1. Add line_type column to line_items
ALTER TABLE line_items ADD COLUMN line_type TEXT NOT NULL DEFAULT 'material'
  CHECK (line_type IN ('material', 'discount', 'fee', 'subtotal_line', 'note'));

-- 2. Add effective_unit_price column to line_items
ALTER TABLE line_items ADD COLUMN effective_unit_price NUMERIC(12,4);

-- 3. Add applies_to_line_item_id self-referencing FK for discount attribution
ALTER TABLE line_items ADD COLUMN applies_to_line_item_id UUID REFERENCES line_items(id) ON DELETE SET NULL;

-- 4. Add quote-level discount columns to quotes
ALTER TABLE quotes ADD COLUMN quote_discount_pct NUMERIC(5,2);
ALTER TABLE quotes ADD COLUMN quote_discount_amount NUMERIC(12,2);

-- 5. Index on line_type for filtering queries
CREATE INDEX idx_line_items_line_type ON line_items(line_type);

-- 6. Backfill effective_unit_price for existing rows where discount data exists
UPDATE line_items
SET effective_unit_price = CASE
  WHEN discount_amount IS NOT NULL AND quantity IS NOT NULL AND quantity > 0
    THEN unit_price - (discount_amount / quantity)
  WHEN discount_pct IS NOT NULL
    THEN unit_price * (1 - discount_pct / 100)
  ELSE unit_price
END
WHERE unit_price IS NOT NULL;

-- 7. Update update_quote_review RPC to handle new fields
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
  p_line_items JSONB DEFAULT NULL,
  p_quote_discount_pct NUMERIC DEFAULT NULL,
  p_quote_discount_amount NUMERIC DEFAULT NULL
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
    total_amount = COALESCE(p_total_amount, total_amount),
    quote_discount_pct = COALESCE(p_quote_discount_pct, quote_discount_pct),
    quote_discount_amount = COALESCE(p_quote_discount_amount, quote_discount_amount)
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
        notes, sort_order, material_id, line_type, effective_unit_price,
        applies_to_line_item_id
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
        NULL,
        COALESCE(item->>'line_type', 'material'),
        (item->>'effective_unit_price')::NUMERIC,
        NULL
      );
      i := i + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
