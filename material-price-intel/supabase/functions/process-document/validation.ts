// ===========================================
// Extraction Validation Module
// ===========================================
// Cross-validates extracted data for mathematical consistency.
// Checks line-item math, subtotal aggregation, and grand total
// composition. Each failure produces a warning and reduces
// the overall confidence score.
//
// No external dependencies -- pure TypeScript logic.
// ===========================================

import type { ExtractionResult } from "./types.ts";

export type ValidationWarning = {
  field: string; // e.g., "line_items[2].line_total", "totals.subtotal"
  expected: number;
  actual: number;
  message: string;
};

export type ValidationResult = {
  is_valid: boolean; // true if no critical errors
  warnings: ValidationWarning[];
  adjusted_confidence: number; // overall confidence adjusted down for math errors
};

/**
 * Tolerance-based numeric comparison. Returns true if `a` and `b`
 * are within `tolerance` of each other.
 *
 * If either value is null or undefined, returns true (skip the check).
 */
function isClose(
  a: number | null | undefined,
  b: number | null | undefined,
  tolerance: number,
): boolean {
  if (a == null || b == null) return true;
  return Math.abs(a - b) <= tolerance;
}

/**
 * Validates the mathematical consistency of an extraction result.
 *
 * Checks:
 * 1. Line item math: qty * unit_price vs line_total (with discount handling)
 * 2. Subtotal check: sum of line_totals vs stated subtotal
 * 3. Grand total check: subtotal + tax + delivery vs total_amount
 * 4. Tax rate check: tax_amount / subtotal vs stated tax_rate
 *
 * Returns a ValidationResult with warnings and adjusted confidence.
 */
export function validateExtraction(
  extraction: ExtractionResult,
): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // -------------------------------------------------
  // 1. Line item math checks
  // -------------------------------------------------
  for (let i = 0; i < extraction.line_items.length; i++) {
    const item = extraction.line_items[i];

    // Check extended_price == qty * unit_price
    if (item.quantity != null && item.unit_price != null && item.extended_price != null) {
      const expectedExtended = item.quantity * item.unit_price;
      // Tolerance: 1% or $0.02, whichever is greater
      const tolerance = Math.max(Math.abs(expectedExtended) * 0.01, 0.02);
      if (!isClose(expectedExtended, item.extended_price, tolerance)) {
        warnings.push({
          field: `line_items[${i}].extended_price`,
          expected: Math.round(expectedExtended * 100) / 100,
          actual: item.extended_price,
          message: `Extended price mismatch: ${item.quantity} x ${item.unit_price} = ${expectedExtended.toFixed(2)}, got ${item.extended_price}`,
        });
      }
    }

    // Check line_total matches expected (with discount handling)
    if (item.quantity != null && item.unit_price != null && item.line_total != null) {
      let expectedTotal = item.quantity * item.unit_price;

      // Apply discount if present
      if (item.discount_amount != null) {
        expectedTotal -= item.discount_amount;
      } else if (item.discount_pct != null) {
        expectedTotal -= expectedTotal * (item.discount_pct / 100);
      }

      // Tolerance: 1% or $0.02, whichever is greater
      const tolerance = Math.max(Math.abs(expectedTotal) * 0.01, 0.02);
      if (!isClose(expectedTotal, item.line_total, tolerance)) {
        warnings.push({
          field: `line_items[${i}].line_total`,
          expected: Math.round(expectedTotal * 100) / 100,
          actual: item.line_total,
          message: `Line total mismatch: expected ${expectedTotal.toFixed(2)}, got ${item.line_total}`,
        });
      }
    }
  }

  // -------------------------------------------------
  // 2. Subtotal check: sum of line_totals vs subtotal
  // -------------------------------------------------
  const lineTotals = extraction.line_items
    .map((item) => item.line_total)
    .filter((t): t is number => t != null);

  if (extraction.totals.subtotal != null && lineTotals.length >= 2) {
    const sumOfLineTotals = lineTotals.reduce((sum, t) => sum + t, 0);
    // $1.00 tolerance for subtotal (quotes sometimes have adjustments)
    if (!isClose(sumOfLineTotals, extraction.totals.subtotal, 1.0)) {
      warnings.push({
        field: "totals.subtotal",
        expected: Math.round(sumOfLineTotals * 100) / 100,
        actual: extraction.totals.subtotal,
        message: `Subtotal mismatch: sum of line totals is ${sumOfLineTotals.toFixed(2)}, stated subtotal is ${extraction.totals.subtotal}`,
      });
    }
  }

  // -------------------------------------------------
  // 3. Grand total check: subtotal + tax + delivery vs total_amount
  // -------------------------------------------------
  if (extraction.totals.total_amount != null) {
    // Use stated subtotal, or fall back to sum of line totals
    const baseAmount =
      extraction.totals.subtotal ??
      (lineTotals.length > 0
        ? lineTotals.reduce((sum, t) => sum + t, 0)
        : null);

    if (baseAmount != null) {
      const expectedTotal =
        baseAmount +
        (extraction.totals.tax_amount ?? 0) +
        (extraction.totals.delivery_cost ?? 0);

      // $1.00 tolerance for grand total
      if (!isClose(expectedTotal, extraction.totals.total_amount, 1.0)) {
        warnings.push({
          field: "totals.total_amount",
          expected: Math.round(expectedTotal * 100) / 100,
          actual: extraction.totals.total_amount,
          message: `Grand total mismatch: subtotal (${baseAmount.toFixed(2)}) + tax (${(extraction.totals.tax_amount ?? 0).toFixed(2)}) + delivery (${(extraction.totals.delivery_cost ?? 0).toFixed(2)}) = ${expectedTotal.toFixed(2)}, stated total is ${extraction.totals.total_amount}`,
        });
      }
    }
  }

  // -------------------------------------------------
  // 4. Tax rate check
  // -------------------------------------------------
  if (
    extraction.totals.tax_amount != null &&
    extraction.totals.subtotal != null &&
    extraction.totals.subtotal > 0
  ) {
    const computedRate =
      extraction.totals.tax_amount / extraction.totals.subtotal;

    if (extraction.totals.tax_rate != null) {
      // Check stated rate matches computed rate (within 0.005 tolerance)
      if (!isClose(computedRate, extraction.totals.tax_rate, 0.005)) {
        warnings.push({
          field: "totals.tax_rate",
          expected: Math.round(computedRate * 10000) / 10000,
          actual: extraction.totals.tax_rate,
          message: `Tax rate mismatch: computed ${(computedRate * 100).toFixed(2)}% from tax/subtotal, stated rate is ${(extraction.totals.tax_rate * 100).toFixed(2)}%`,
        });
      }
    }
    // If tax_rate is null but computed rate looks like Florida 7%, no warning needed
    // (informational only -- not a math error)
  }

  // -------------------------------------------------
  // 5. Line type consistency checks
  // -------------------------------------------------
  for (let i = 0; i < extraction.line_items.length; i++) {
    const item = extraction.line_items[i];

    // 5a. Material items should have unit_price
    if (item.line_type === 'material' && item.unit_price == null && item.pricing_flag !== 'call_for_pricing') {
      warnings.push({
        field: `line_items[${i}].unit_price`,
        expected: -1, // sentinel: not a numeric comparison
        actual: 0,
        message: `Material line item "${item.raw_description}" has no unit_price and is not flagged as call-for-pricing`,
      });
    }

    // 5b. Impossible: $0.00 unit_price on a material (unless flagged)
    if (item.line_type === 'material' && item.unit_price === 0 && item.pricing_flag !== 'zero_price') {
      warnings.push({
        field: `line_items[${i}].unit_price`,
        expected: -1,
        actual: 0,
        message: `Material "${item.raw_description}" has $0.00 unit price but is not flagged as zero_price`,
      });
    }

    // 5c. Discount lines should have negative line_total or discount info
    if (item.line_type === 'discount') {
      const hasDiscountData = (item.discount_pct != null) || (item.discount_amount != null) || (item.line_total != null && item.line_total < 0);
      if (!hasDiscountData) {
        warnings.push({
          field: `line_items[${i}].line_type`,
          expected: -1,
          actual: 0,
          message: `Line item classified as "discount" but has no discount_pct, discount_amount, or negative line_total: "${item.raw_description}"`,
        });
      }
    }

    // 5d. Negative quantity without credit context
    if (item.quantity != null && item.quantity < 0 && !item.is_credit) {
      warnings.push({
        field: `line_items[${i}].quantity`,
        expected: 0,
        actual: item.quantity,
        message: `Negative quantity (${item.quantity}) on non-credit line "${item.raw_description}" -- may need review`,
      });
    }

    // 5e. Subtotal lines should not be counted in totals
    // (This is informational -- the persistence layer handles exclusion)
    if (item.line_type === 'subtotal_line' && item.line_total != null) {
      // No warning needed, but we track it for subtotal calculation adjustments
    }
  }

  // -------------------------------------------------
  // 6. Adjusted subtotal check (excluding non-material items)
  // -------------------------------------------------
  // If the basic subtotal check (section 2) produced a warning,
  // try recalculating excluding subtotal_line items which shouldn't be double-counted
  const materialAndFeeLineTotals = extraction.line_items
    .filter((item) => item.line_type !== 'subtotal_line' && item.line_type !== 'note')
    .map((item) => item.line_total)
    .filter((t): t is number => t != null);

  if (extraction.totals.subtotal != null && materialAndFeeLineTotals.length >= 2) {
    const adjustedSum = materialAndFeeLineTotals.reduce((sum, t) => sum + t, 0);
    // If the adjusted sum is closer to stated subtotal than the raw sum,
    // remove the section-2 warning (it was caused by including subtotal lines)
    if (isClose(adjustedSum, extraction.totals.subtotal, 1.0)) {
      const subtotalWarningIdx = warnings.findIndex(w => w.field === 'totals.subtotal');
      if (subtotalWarningIdx !== -1) {
        warnings.splice(subtotalWarningIdx, 1);
      }
    }
  }

  // -------------------------------------------------
  // Confidence adjustment
  // -------------------------------------------------
  // Start with overall_confidence, reduce by 0.05 per warning (max 0.3 reduction)
  const reduction = Math.min(warnings.length * 0.05, 0.3);
  const adjustedConfidence = Math.max(
    extraction.overall_confidence - reduction,
    0.1,
  );

  return {
    is_valid: warnings.length === 0,
    warnings,
    adjusted_confidence: Math.round(adjustedConfidence * 100) / 100,
  };
}
