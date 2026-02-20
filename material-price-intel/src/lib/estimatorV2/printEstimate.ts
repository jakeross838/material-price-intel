import type { V2EstimateResult, CsiDivision } from './types';
import { CSI_DIVISION_LABELS, fmtCurrency, ARCH_STYLE_META, CLADDING_META, ROOF_META, WINDOW_GRADE_META, FLOORING_META, COUNTERTOP_META, APPLIANCE_PACKAGE_META } from './types';
import { getLocationLabel } from './locations';

const DIVISION_ORDER: CsiDivision[] = [
  'sitework', 'foundation', 'framing', 'roofing', 'exterior',
  'doors_windows', 'interior_finishes', 'mechanical', 'electrical',
  'specialties', 'overhead',
];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function printEstimate(estimate: V2EstimateResult) {
  const { input } = estimate;
  const mid = Math.round((estimate.totalLow + estimate.totalHigh) / 2);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const archLabel = ARCH_STYLE_META[input.archStyle]?.label ?? input.archStyle;
  const claddingLabel = CLADDING_META[input.claddingType]?.label ?? input.claddingType;
  const roofLabel = ROOF_META[input.roofType]?.label ?? input.roofType;
  const windowLabel = WINDOW_GRADE_META[input.windowGrade]?.label ?? input.windowGrade;
  const flooringLabel = FLOORING_META[input.flooringType]?.label ?? input.flooringType;
  const countertopLabel = COUNTERTOP_META[input.countertopMaterial]?.label ?? input.countertopMaterial;
  const applianceLabel = APPLIANCE_PACKAGE_META[input.appliancePackage]?.label ?? input.appliancePackage;
  const locationLabel = getLocationLabel(input.location);

  // Build division HTML
  let divisionsHTML = '';
  for (const div of DIVISION_ORDER) {
    const items = estimate.lineItems.filter(li => li.csiDivision === div);
    if (items.length === 0) continue;
    const totals = estimate.divisionTotals[div];

    divisionsHTML += `
      <div class="division">
        <div class="division-header">
          <span>${esc(CSI_DIVISION_LABELS[div])}</span>
          <span>${fmtCurrency(totals.low)} &ndash; ${fmtCurrency(totals.high)}</span>
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th class="r">Qty</th><th class="r">Unit</th><th class="r">Range</th></tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${esc(item.displayName)}</td>
                <td class="r">${item.quantity.toLocaleString()}</td>
                <td class="r">${esc(item.unit)}</td>
                <td class="r">${fmtCurrency(item.totalLow)} &ndash; ${fmtCurrency(item.totalHigh)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Schedule HTML
  const scheduleHTML = estimate.schedule.phases.map(p =>
    `<tr><td>${esc(p.name)}</td><td class="r">${p.durationWeeks} weeks</td><td>${esc(p.description)}</td></tr>`
  ).join('');

  // Special features summary
  const features: string[] = [];
  if (input.pool !== 'none') features.push(`Pool (${input.pool})`);
  if (input.elevator !== 'none') features.push(`Elevator (${input.elevator})`);
  if (input.outdoorKitchen) features.push('Outdoor Kitchen');
  if (input.fireplace !== 'none') features.push(`Fireplace (${input.fireplace})`);
  if (input.smartHome !== 'none') features.push(`Smart Home (${input.smartHome})`);
  if (input.generator) features.push('Whole-Home Generator');
  if (input.seawall) features.push('Seawall');
  if (input.deckSqft > 0) features.push(`Deck/Patio (${input.deckSqft.toLocaleString()} SF)`);
  if (input.screenedPorch) features.push('Screened Porch');
  if (input.elevatedConstruction) features.push('Elevated/Piling Construction');
  if (input.floodZone) features.push('Flood Zone');
  if (input.solarPanels !== 'none') features.push(`Solar (${input.solarPanels})`);
  if (input.drivewayType !== 'concrete') features.push(`Driveway (${input.drivewayType})`);
  if (input.landscapingTier !== 'basic') features.push(`Landscaping (${input.landscapingTier})`);
  if (input.fenceType !== 'none') features.push(`Fence (${input.fenceType})`);
  if (input.waterFiltration) features.push('Whole-Home Water Filtration');
  if (input.sewerType === 'septic') features.push('Septic System');
  if (input.waterSource === 'well') features.push('Well Water');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Estimate — Ross Built Custom Homes</title>
<style>
  @page { margin: 0.6in 0.7in; size: letter; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1c1c1c; font-size: 11px; line-height: 1.5; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #5b8497; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { font-size: 18px; font-weight: 700; color: #1c1c1c; letter-spacing: -0.3px; }
  .brand span { color: #5b8497; }
  .date { font-size: 10px; color: #666; }
  .hero { text-align: center; padding: 18px 0; margin-bottom: 16px; background: #f6f9fa; border-radius: 8px; }
  .hero .total { font-size: 28px; font-weight: 800; color: #1c1c1c; }
  .hero .range { font-size: 12px; color: #5b8497; margin-top: 2px; }
  .hero .psf { font-size: 10px; color: #888; margin-top: 4px; }
  h2 { font-size: 13px; font-weight: 700; color: #5b8497; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #dde8ed; }
  .specs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 4px; }
  .spec { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #e0e0e0; }
  .spec-label { color: #666; }
  .spec-value { font-weight: 600; }
  .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .summary-table td { padding: 5px 0; border-bottom: 1px solid #eee; }
  .summary-table td:last-child { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  .summary-table tr.total-row td { border-top: 2px solid #5b8497; border-bottom: none; font-weight: 800; font-size: 12px; padding-top: 8px; }
  .division { margin-bottom: 10px; break-inside: avoid; }
  .division-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 11px; padding: 4px 6px; background: #f0f5f7; border-radius: 4px; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { text-align: left; font-weight: 600; color: #888; padding: 2px 4px; border-bottom: 1px solid #eee; }
  td { padding: 2px 4px; border-bottom: 1px solid #f5f5f5; }
  .r { text-align: right; }
  .schedule-table { width: 100%; border-collapse: collapse; }
  .schedule-table td { padding: 4px 6px; border-bottom: 1px solid #eee; font-size: 10px; }
  .schedule-table td:nth-child(2) { text-align: right; font-weight: 600; white-space: nowrap; }
  .schedule-total { font-weight: 700; font-size: 11px; margin-top: 6px; color: #5b8497; }
  .features-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .feature-tag { font-size: 10px; padding: 2px 8px; background: #edf3f6; border-radius: 10px; color: #3a6a7c; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #dde8ed; font-size: 9px; color: #999; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand"><span>Ross Built</span> Custom Homes</div>
    <div class="date">Preliminary Estimate &mdash; ${esc(date)}</div>
  </div>

  <div class="hero">
    <div class="total">${fmtCurrency(mid)}</div>
    <div class="range">${fmtCurrency(estimate.totalLow)} &ndash; ${fmtCurrency(estimate.totalHigh)}</div>
    <div class="psf">${fmtCurrency(estimate.perSqftLow)} &ndash; ${fmtCurrency(estimate.perSqftHigh)} per SF &bull; ${input.sqft.toLocaleString()} SF &bull; ${esc(locationLabel)}${input.lotAddress ? ` &bull; ${esc(input.lotAddress)}` : ''}</div>
  </div>

  <h2>Home Configuration</h2>
  <div class="specs">
    <div class="spec"><span class="spec-label">Square Footage</span><span class="spec-value">${input.sqft.toLocaleString()} SF</span></div>
    <div class="spec"><span class="spec-label">Stories</span><span class="spec-value">${input.stories}</span></div>
    <div class="spec"><span class="spec-label">Bedrooms</span><span class="spec-value">${input.bedrooms}</span></div>
    <div class="spec"><span class="spec-label">Bathrooms</span><span class="spec-value">${input.bathrooms}</span></div>
    <div class="spec"><span class="spec-label">Garage</span><span class="spec-value">${input.garageSpaces === 0 ? 'None' : `${input.garageSpaces}-Car`}</span></div>
    <div class="spec"><span class="spec-label">Location</span><span class="spec-value">${esc(locationLabel)}${estimate.locationMultiplier > 1 ? ` (+${Math.round((estimate.locationMultiplier - 1) * 100)}%)` : ''}</span></div>${input.lotAddress ? `
    <div class="spec"><span class="spec-label">Lot Address</span><span class="spec-value">${esc(input.lotAddress)}</span></div>` : ''}
    <div class="spec"><span class="spec-label">Architecture</span><span class="spec-value">${esc(archLabel)}</span></div>
    <div class="spec"><span class="spec-label">Cladding</span><span class="spec-value">${esc(claddingLabel)}</span></div>
    <div class="spec"><span class="spec-label">Roofing</span><span class="spec-value">${esc(roofLabel)}</span></div>
    <div class="spec"><span class="spec-label">Windows</span><span class="spec-value">${esc(windowLabel)}</span></div>
    <div class="spec"><span class="spec-label">Flooring</span><span class="spec-value">${esc(flooringLabel)}</span></div>
    <div class="spec"><span class="spec-label">Countertops</span><span class="spec-value">${esc(countertopLabel)}</span></div>
    <div class="spec"><span class="spec-label">Appliances</span><span class="spec-value">${esc(applianceLabel)}</span></div>
    <div class="spec"><span class="spec-label">Lot Size</span><span class="spec-value">${input.lotSize} acres</span></div>
    <div class="spec"><span class="spec-label">Ceiling Height</span><span class="spec-value">${input.ceilingHeight} ft</span></div>
    <div class="spec"><span class="spec-label">Sewer</span><span class="spec-value">${input.sewerType === 'city' ? 'City Sewer' : 'Septic'}</span></div>
    <div class="spec"><span class="spec-label">Water</span><span class="spec-value">${input.waterSource === 'city' ? 'City Water' : 'Well'}</span></div>
  </div>

  ${features.length > 0 ? `
  <h2>Special Features</h2>
  <div class="features-list">
    ${features.map(f => `<span class="feature-tag">${esc(f)}</span>`).join('')}
  </div>` : ''}

  <h2>Out-the-Door Breakdown</h2>
  <table class="summary-table">
    <tr><td>Base Construction</td><td>${fmtCurrency(estimate.baseLow)} &ndash; ${fmtCurrency(estimate.baseHigh)}</td></tr>
    <tr><td>Builder Fee (${Math.round(estimate.builderFeePercent * 100)}%)</td><td>${fmtCurrency(estimate.builderFeeLow)} &ndash; ${fmtCurrency(estimate.builderFeeHigh)}</td></tr>
    <tr><td>Sales Tax (${(estimate.taxRate * 100).toFixed(0)}% on materials)</td><td>${fmtCurrency(estimate.taxLow)} &ndash; ${fmtCurrency(estimate.taxHigh)}</td></tr>
    <tr><td>Permits &amp; Impact Fees (${(estimate.permitRate * 100).toFixed(1)}%)</td><td>${fmtCurrency(estimate.permitLow)} &ndash; ${fmtCurrency(estimate.permitHigh)}</td></tr>
    <tr><td>Builder's Risk Insurance (${(estimate.insuranceRate * 100).toFixed(1)}%)</td><td>${fmtCurrency(estimate.insuranceLow)} &ndash; ${fmtCurrency(estimate.insuranceHigh)}</td></tr>
    <tr class="total-row"><td>Total Estimate</td><td>${fmtCurrency(estimate.totalLow)} &ndash; ${fmtCurrency(estimate.totalHigh)}</td></tr>
  </table>

  <h2>Cost Breakdown by Division</h2>
  ${divisionsHTML}

  <h2>Estimated Construction Timeline</h2>
  <table class="schedule-table">
    ${scheduleHTML}
  </table>
  <div class="schedule-total">${estimate.schedule.totalWeeks} weeks total (~${estimate.schedule.totalMonths} months)</div>

  <div class="footer">
    <p>This estimate is for preliminary budget guidance only and does not constitute a binding quote.</p>
    <p>Actual costs may vary based on site conditions, material availability, and final design specifications.</p>
    <p style="margin-top:4px">Ross Built Custom Homes &bull; 305 67th St W, Bradenton, FL 34209 &bull; (941) 778-7600 &bull; rossbuilt.com</p>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups to download your estimate.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Small delay to ensure styles render before print dialog
  setTimeout(() => win.print(), 400);
}
