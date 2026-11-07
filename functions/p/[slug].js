function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, function (char) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
  });
}

export async function onRequestGet({ request, env, params }) {
  if (!env.DB) return new Response("Portal is not configured.", { status: 503 });
  const slug = String((params && params.slug) || "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response("Invalid portal link.", { status: 400 });

  const row = await env.DB.prepare(
    "SELECT partner_slug, brand_name FROM dsa_partners WHERE partner_slug = ? AND status = 'ACTIVE' AND public_profile_consent = 1 LIMIT 1"
  ).bind(slug).first();

  if (!row) return new Response("This DSA portal link was not found or is not active.", { status: 404 });

  const requestUrl = new URL(request.url);
  const portalUrl = new URL("/portal.html?brand=" + encodeURIComponent(row.partner_slug), requestUrl.origin);
  const logoUrl = new URL("/api/partner-logo?slug=" + encodeURIComponent(row.partner_slug), requestUrl.origin);
  const title = escapeHtml(row.brand_name + " | DSA Loan Partner Portal");
  const description = escapeHtml("Visit " + row.brand_name + " for quick access to loan partner offers.");
  const canonical = escapeHtml(requestUrl.href);
  const image = escapeHtml(logoUrl.href);
  const redirect = escapeHtml(portalUrl.href);

  const html = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>" + title + "</title>" +
    "<meta name=\"description\" content=\"" + description + "\">" +
    "<link rel=\"canonical\" href=\"" + canonical + "\">" +
    "<meta property=\"og:type\" content=\"website\">" +
    "<meta property=\"og:title\" content=\"" + title + "\">" +
    "<meta property=\"og:description\" content=\"" + description + "\">" +
    "<meta property=\"og:url\" content=\"" + canonical + "\">" +
    "<meta property=\"og:image\" content=\"" + image + "\">" +
    "<meta property=\"og:image:alt\" content=\"" + title + " logo\">" +
    "<meta name=\"twitter:card\" content=\"summary\">" +
    "<meta name=\"twitter:title\" content=\"" + title + "\">" +
    "<meta name=\"twitter:description\" content=\"" + description + "\">" +
    "<meta name=\"twitter:image\" content=\"" + image + "\">" +
    "<meta http-equiv=\"refresh\" content=\"1;url=" + redirect + "\"></head>" +
    "<body><p>Opening <a href=\"" + redirect + "\">" + title + "</a>…</p>" +
    "<script>window.location.replace(" + JSON.stringify(portalUrl.href) + ");</script></body></html>";

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff"
    }
  });
}
