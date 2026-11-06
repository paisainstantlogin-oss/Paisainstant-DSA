export async function onRequestGet({ request, env }) {
  if (!env.DB) return new Response("Not found", { status: 404 });
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response("Not found", { status: 404 });

  const row = await env.DB.prepare(
    "SELECT logo_data, logo_content_type FROM dsa_partners WHERE partner_slug = ? AND status = 'ACTIVE' LIMIT 1"
  ).bind(slug).first();

  if (!row || !row.logo_data) return new Response("Logo not found", { status: 404 });
  const contentType = row.logo_content_type === "image/png" ? "image/png" : "image/jpeg";
  return new Response(row.logo_data, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox"
    }
  });
}
