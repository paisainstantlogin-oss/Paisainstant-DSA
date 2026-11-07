export async function onRequestGet({ request, env }) {
  if (!env.DB) return new Response("Not found", { status: 404 });
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response("Not found", { status: 404 });

  const row = await env.DB.prepare(
    "SELECT logo_data, logo_content_type FROM dsa_partners WHERE partner_slug = ? AND status = 'ACTIVE' AND public_profile_consent = 1 LIMIT 1"
  ).bind(slug).first();

  if (!row || !row.logo_data) return new Response("Logo not found", { status: 404 });
  const contentType = row.logo_content_type === "image/png" ? "image/png" : "image/jpeg";
  const binary = atob(String(row.logo_data));
  const imageBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) imageBytes[i] = binary.charCodeAt(i);
  return new Response(imageBytes, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox"
    }
  });
}
