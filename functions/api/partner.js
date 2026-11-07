const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "Portal database is not configured." }, 503);
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json({ error: "Invalid DSA portal link." }, 400);

  const row = await env.DB.prepare(
    "SELECT id, partner_slug, brand_name, mobile_number, whatsapp_number, partner_code FROM dsa_partners WHERE partner_slug = ? AND status = 'ACTIVE' AND public_profile_consent = 1 LIMIT 1"
  ).bind(slug).first();

  if (!row) return json({ error: "This DSA portal link was not found or is not active." }, 404);

  return json({
    partnerId: row.id,
    slug: row.partner_slug,
    brandName: row.brand_name,
    mobileNumber: row.mobile_number,
    whatsappNumber: row.whatsapp_number,
    partnerCode: row.partner_code,
    logoUrl: "/api/partner-logo?slug=" + encodeURIComponent(row.partner_slug)
  });
}
