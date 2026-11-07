const MAX_LOGO_BYTES = 200 * 1024;
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeLogo(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!match) throw new Error("Please upload a PNG or JPG logo.");
  const binary = atob(match[2]);
  if (!binary.length || binary.length > MAX_LOGO_BYTES) {
    throw new Error("Logo must be 200 KB or smaller.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const isPng = match[1] === "image/png" &&
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = match[1] === "image/jpeg" &&
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isPng && !isJpeg) throw new Error("The logo file content does not match PNG or JPG format.");
  return { bytes, contentType: match[1] };
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Registration database is not configured for this environment." }, 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Invalid request origin." }, 403);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 350000) return json({ error: "Registration request is too large." }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid registration request." }, 400);
  }

  const brandName = String(body.brandName || "").trim();
  const partnerCode = String(body.partnerCode || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const mobileNumber = String(body.mobileNumber || "").trim();
  const whatsappNumber = String(body.whatsappNumber || "").trim();
  const slug = slugify(brandName);

  if (brandName.length < 2 || brandName.length > 70) return json({ error: "Brand name must be 2 to 70 characters." }, 400);
  if (!slug || slug.length > 60 || /^(register|portal|api|privacy-policy|disclaimer|assets)$/.test(slug)) {
    return json({ error: "Please choose a different brand name for your portal link." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return json({ error: "Enter a valid email address." }, 400);
  if (!/^[0-9]{10}$/.test(mobileNumber)) return json({ error: "Enter a valid 10-digit mobile number." }, 400);
  if (!/^[0-9]{10}$/.test(whatsappNumber)) return json({ error: "Enter a valid 10-digit WhatsApp number." }, 400);
  if (!partnerCode || partnerCode.length > 50) return json({ error: "Enter a valid Partner Code." }, 400);
  if (body.publicProfileConsent !== true) return json({ error: "Consent is required to publish your brand, logo and contact numbers on the DSA portal." }, 400);

  let logo;
  try {
    logo = decodeLogo(body.logoDataUrl);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid logo." }, 400);
  }

  try {
    const result = await env.DB.prepare(
      "INSERT INTO dsa_partners (partner_slug, brand_name, email, mobile_number, whatsapp_number, partner_code, logo_key, status, logo_data, logo_content_type, public_profile_consent) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)"
    ).bind(
      slug,
      brandName,
      email,
      mobileNumber,
      whatsappNumber,
      partnerCode,
      "dsa-logos/" + slug,
      logo.base64,
      logo.contentType,
      1
    ).run();

    const partnerId = Number(result.meta && result.meta.last_row_id || 0);
    return json({
      success: true,
      status: "ACTIVE",
      partnerId,
      partnerCode,
      brandName,
      slug,
      portalPath: "/portal.html?brand=" + encodeURIComponent(slug)
    }, 201);
  } catch (error) {
    const message = String(error && error.message || "");
    if (/UNIQUE constraint failed: dsa_partners\.partner_slug/i.test(message)) {
      return json({ error: "This brand name is already registered. Please use a unique brand name." }, 409);
    }
    return json({ error: "Could not save registration. Please check the details and try again." }, 500);
  }
}
