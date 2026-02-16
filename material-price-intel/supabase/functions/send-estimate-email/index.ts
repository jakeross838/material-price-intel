// ===========================================
// Edge Function: send-estimate-email
// ===========================================
// Sends two emails via Resend:
//   1. User: branded HTML estimate summary
//   2. Admin: lead notification with full details
// Gracefully skips if RESEND_API_KEY not set.
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RoomSummary = {
  roomName: string;
  finishLevel: string;
  low: number;
  high: number;
};

type EmailRequest = {
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_message?: string;
  estimate_low: number;
  estimate_high: number;
  sqft: number;
  stories: number;
  style: string;
  bedrooms: number;
  bathrooms: number;
  room_summaries: RoomSummary[];
};

function fmt(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

// Out-the-door multiplier (must match EstimateResults.tsx)
const OTD_RATE = 1 + 0.07 + 0.015 + 0.02 + 0.025 + 0.08; // 1.21

function buildUserEmailHtml(req: EmailRequest): string {
  const firstName = req.contact_name.split(" ")[0];
  const otdLow = Math.round(req.estimate_low * OTD_RATE);
  const otdHigh = Math.round(req.estimate_high * OTD_RATE);

  const roomRows = req.room_summaries
    .map(
      (r) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${r.roomName}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize; color: #6b7280;">${r.finishLevel}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${fmt(r.low)} &ndash; ${fmt(r.high)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2d3f47, #354b54); border-radius:12px 12px 0 0; padding:32px; text-align:center; color:#fff;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Ross Built Custom Homes</h1>
      <p style="margin:0;font-size:13px;opacity:0.7;">Bradenton &amp; Sarasota, FL</p>
    </div>

    <!-- Hero estimate -->
    <div style="background:#fff;padding:32px;text-align:center;border-bottom:1px solid #e5e7eb;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Hi ${firstName}, your estimated build cost is</p>
      <h2 style="margin:0;font-size:32px;font-weight:800;color:#2d3f47;">${fmt(req.estimate_low)} &mdash; ${fmt(req.estimate_high)}</h2>
      <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;">
        ${req.sqft.toLocaleString()} sqft &bull; ${req.bedrooms} bed / ${req.bathrooms} bath &bull; ${req.stories}-story ${req.style}
      </p>
    </div>

    <!-- Out-the-door -->
    <div style="background:#fff;padding:24px 32px;border-bottom:1px solid #e5e7eb;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#2d3f47;font-weight:700;">Out-the-Door Estimate</h3>
      <p style="margin:0;font-size:13px;color:#6b7280;">Including FL sales tax, permits, delivery, insurance &amp; GC overhead:</p>
      <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#2d3f47;">${fmt(otdLow)} &mdash; ${fmt(otdHigh)}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">$${Math.round(otdLow / req.sqft)} &ndash; $${Math.round(otdHigh / req.sqft)} per sqft out-the-door</p>
    </div>

    <!-- Room summary -->
    ${req.room_summaries.length > 0 ? `
    <div style="background:#fff;padding:24px 32px;border-bottom:1px solid #e5e7eb;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#2d3f47;font-weight:700;">Your Room Selections</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Room</th>
            <th style="padding:8px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Finish</th>
            <th style="padding:8px 12px;text-align:right;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">Range</th>
          </tr>
        </thead>
        <tbody>${roomRows}</tbody>
        <tfoot>
          <tr style="background:#2d3f47;">
            <td colspan="2" style="padding:10px 12px;color:#fff;font-weight:700;font-size:14px;">Total</td>
            <td style="padding:10px 12px;color:#fff;font-weight:700;font-size:14px;text-align:right;">${fmt(req.estimate_low)} &ndash; ${fmt(req.estimate_high)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ` : ""}

    <!-- CTA -->
    <div style="background:#fff;padding:32px;text-align:center;border-radius:0 0 12px 12px;">
      <h3 style="margin:0 0 8px;font-size:18px;color:#2d3f47;font-weight:700;">Ready to get started?</h3>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Let's turn this estimate into your dream home.</p>
      <a href="tel:9417787600" style="display:inline-block;background:#2d3f47;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Call (941) 778-7600
      </a>
      <p style="margin:16px 0 0;">
        <a href="https://calendly.com/rossbuilt" style="color:#5b8291;font-size:13px;text-decoration:underline;">
          Or schedule a call online
        </a>
      </p>
    </div>

    <!-- Disclaimer -->
    <div style="padding:20px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
        This estimate is for planning purposes only and does not constitute a bid or contract.
        Actual costs will vary based on final design, material selections, site conditions, and market pricing.<br/>
        &copy; 2026 Ross Built Custom Homes &bull; Licensed &amp; Insured &bull; EST. 2006
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildAdminEmailHtml(req: EmailRequest): string {
  const roomRows = req.room_summaries
    .map(
      (r) => `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#374151;">${r.roomName}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;text-transform:capitalize;">${r.finishLevel}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;">${fmt(r.low)} &ndash; ${fmt(r.high)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#2d3f47;color:#fff;padding:16px 24px;">
      <h2 style="margin:0;font-size:17px;font-weight:700;">New Dream Home Estimate Lead</h2>
    </div>
    <div style="padding:24px;">
      <h3 style="margin:0 0 12px;font-size:14px;color:#374151;font-weight:700;">Contact Info</h3>
      <table style="font-size:13px;color:#374151;margin-bottom:20px;">
        <tr><td style="font-weight:600;padding:4px 16px 4px 0;vertical-align:top;">Name:</td><td>${req.contact_name}</td></tr>
        <tr><td style="font-weight:600;padding:4px 16px 4px 0;vertical-align:top;">Email:</td><td><a href="mailto:${req.contact_email}" style="color:#5b8291;">${req.contact_email}</a></td></tr>
        <tr><td style="font-weight:600;padding:4px 16px 4px 0;vertical-align:top;">Phone:</td><td>${req.contact_phone ? `<a href="tel:${req.contact_phone}" style="color:#5b8291;">${req.contact_phone}</a>` : "—"}</td></tr>
        ${req.contact_message ? `<tr><td style="font-weight:600;padding:4px 16px 4px 0;vertical-align:top;">Message:</td><td>${req.contact_message}</td></tr>` : ""}
      </table>

      <h3 style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:700;">Estimate</h3>
      <p style="font-size:22px;font-weight:800;color:#2d3f47;margin:0 0 4px;">${fmt(req.estimate_low)} &ndash; ${fmt(req.estimate_high)}</p>
      <p style="font-size:12px;color:#9ca3af;margin:0 0 20px;">
        ${req.sqft.toLocaleString()} sqft &bull; ${req.bedrooms}bd / ${req.bathrooms}ba &bull; ${req.stories}-story ${req.style}
      </p>

      ${req.room_summaries.length > 0 ? `
      <h3 style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:700;">Room Selections</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;color:#374151;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:6px 10px;text-align:left;font-weight:600;">Room</th>
          <th style="padding:6px 10px;text-align:left;font-weight:600;">Finish</th>
          <th style="padding:6px 10px;text-align:right;font-weight:600;">Range</th>
        </tr></thead>
        <tbody>${roomRows}</tbody>
      </table>
      ` : ""}
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();

    // Check for Resend API key
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY not set — skipping email send");
      return new Response(
        JSON.stringify({ sent: false, reason: "no_api_key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminEmail =
      Deno.env.get("ROSS_BUILT_NOTIFICATION_EMAIL") || "info@rossbuilt.com";

    // On Resend free tier without verified domain, use their onboarding address
    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "Ross Built <onboarding@resend.dev>";

    const userHtml = buildUserEmailHtml(body);
    const adminHtml = buildAdminEmailHtml(body);

    // Send both emails in parallel
    const [userResult, adminResult] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [body.contact_email],
          subject: `Your Dream Home Estimate: ${fmt(body.estimate_low)} – ${fmt(body.estimate_high)}`,
          html: userHtml,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [adminEmail],
          subject: `New Lead: ${body.contact_name} — ${fmt(body.estimate_low)}–${fmt(body.estimate_high)}`,
          html: adminHtml,
        }),
      }),
    ]);

    const userOk = userResult.ok;
    const adminOk = adminResult.ok;

    if (!userOk) {
      console.error("Failed to send user email:", await userResult.text());
    }
    if (!adminOk) {
      console.error("Failed to send admin email:", await adminResult.text());
    }

    return new Response(
      JSON.stringify({
        sent: true,
        user_email_sent: userOk,
        admin_email_sent: adminOk,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-estimate-email error:", message);
    // Return 200 — don't break the lead capture flow
    return new Response(
      JSON.stringify({ sent: false, reason: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
