-- ===========================================
-- BACKFILL: Reclassify existing line items
-- ===========================================
-- Phase 9 requirement: re-classify already-imported line items
-- with the new type system without losing any data.
--
-- Strategy: Pattern-match raw_description against common discount,
-- fee, subtotal, and note patterns. Conservative approach -- only
-- reclassify high-confidence matches; leave ambiguous items as 'material'
-- for human review.
-- ===========================================

-- -----------------------------------------------
-- 1. Reclassify DISCOUNT lines
-- -----------------------------------------------
-- Matches common discount descriptions. These typically have:
-- - Word "discount" in description
-- - Negative line_total
-- - discount_pct or discount_amount set
-- -----------------------------------------------
UPDATE line_items
SET line_type = 'discount'
WHERE line_type = 'material'
  AND (
    -- Description-based patterns (case-insensitive)
    LOWER(raw_description) ~ '^\s*(discount|price adjustment|loyalty credit|volume discount|customer discount|trade discount)'
    OR LOWER(raw_description) ~ '\b(discount|price reduction|credit applied|promotional credit)\s*$'
    OR (LOWER(raw_description) LIKE '%discount%' AND (line_total IS NULL OR line_total <= 0))
    -- Structural patterns: no qty/unit but has discount info
    OR (
      quantity IS NULL
      AND unit IS NULL
      AND unit_price IS NULL
      AND (discount_pct IS NOT NULL OR discount_amount IS NOT NULL)
    )
    -- Negative line_total with discount-like description
    OR (
      line_total < 0
      AND LOWER(raw_description) SIMILAR TO '%(discount|credit|adjustment|rebate|allowance)%'
    )
  );

-- -----------------------------------------------
-- 2. Reclassify FEE lines
-- -----------------------------------------------
-- Matches surcharges and fees that are not physical materials.
-- -----------------------------------------------
UPDATE line_items
SET line_type = 'fee'
WHERE line_type = 'material'
  AND (
    LOWER(raw_description) ~ '^\s*(minimum order|fuel surcharge|rush order|handling fee|restocking|setup fee|cutting fee|processing fee)'
    OR LOWER(raw_description) SIMILAR TO '%(surcharge|minimum charge|service fee|setup charge|processing charge|handling charge|environmental fee)%'
  )
  -- Safety: only reclassify if it looks fee-like (positive amount, no unit suggesting a material)
  AND (unit IS NULL OR LOWER(unit) NOT IN ('pc', 'lf', 'bf', 'sqft', 'ea', 'bundle', 'sheet'));

-- -----------------------------------------------
-- 3. Reclassify SUBTOTAL lines
-- -----------------------------------------------
-- Matches subtotal/section total descriptions.
-- -----------------------------------------------
UPDATE line_items
SET line_type = 'subtotal_line'
WHERE line_type = 'material'
  AND (
    LOWER(raw_description) ~ '^\s*(sub\s*total|section total|material total|lumber total|total|grand total)'
    OR LOWER(raw_description) SIMILAR TO '%(subtotal|sub total|section total)%'
  )
  -- Safety: subtotals typically have no quantity or unit
  AND quantity IS NULL
  AND unit IS NULL;

-- -----------------------------------------------
-- 4. Reclassify NOTE lines
-- -----------------------------------------------
-- Matches informational text with no pricing data.
-- -----------------------------------------------
UPDATE line_items
SET line_type = 'note'
WHERE line_type = 'material'
  AND unit_price IS NULL
  AND quantity IS NULL
  AND line_total IS NULL
  AND extended_price IS NULL
  AND (
    LOWER(raw_description) SIMILAR TO '%(prices valid|subject to|all lumber is|note:|terms:|conditions:|please note|prices subject)%'
    OR LENGTH(raw_description) > 100  -- Very long descriptions with no prices are likely notes
  );

-- -----------------------------------------------
-- 5. Compute effective_unit_price for ALL material items
-- -----------------------------------------------
-- This handles the common case where the material line itself has
-- discount_pct or discount_amount. Cross-line discount attribution
-- requires AI re-processing and cannot be done in SQL alone.
-- -----------------------------------------------
UPDATE line_items
SET effective_unit_price = CASE
  -- If discount_amount is set and quantity > 0, subtract per-unit discount
  WHEN discount_amount IS NOT NULL AND quantity IS NOT NULL AND quantity > 0
    THEN GREATEST(0, unit_price - (discount_amount / quantity))
  -- If discount_pct is set, apply percentage
  WHEN discount_pct IS NOT NULL
    THEN GREATEST(0, unit_price * (1 - discount_pct / 100))
  -- No discount: effective = raw
  ELSE unit_price
END
WHERE line_type = 'material'
  AND unit_price IS NOT NULL;

-- -----------------------------------------------
-- 6. Unlink non-material items from canonical materials
-- -----------------------------------------------
-- If any discount/fee/subtotal/note items were previously linked
-- to a canonical material by the normalization engine, unlink them.
-- This prevents discount lines from appearing in material price history.
-- -----------------------------------------------
UPDATE line_items
SET material_id = NULL
WHERE line_type != 'material'
  AND material_id IS NOT NULL;
