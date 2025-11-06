// functions/api/contact.js
export async function onRequestPost(context) {
  const { request, env } = context;

  // ----- CORS -----
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : (allowed[0] || "*");

  const headers = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // Parse JSON safely
    let body = {};
    try { body = await request.json(); } catch { /* leave {} */ }

    const { name = "", email = "", service = "", message = "", recaptchaToken } = body;

    if (!recaptchaToken) {
      return new Response(JSON.stringify({ error: "Missing captcha token" }), { status: 400, headers });
    }

    // ----- Verify reCAPTCHA (v2 checkbox) -----
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.RECAPTCHA_SECRET,
        response: recaptchaToken,
        remoteip: request.headers.get("CF-Connecting-IP") || ""
      })
    });

    const verify = await verifyRes.json().catch(() => ({}));

    if (!verify.success) {
      return new Response(JSON.stringify({
        error: "Captcha verification failed",
        details: verify
      }), { status: 400, headers });
    }

    // ✅ SUCCESS (put your email/CRM code here if needed)
    return new Response(JSON.stringify({
      success: true,
      message: "CAPTCHA verified successfully"
    }), { status: 200, headers });

  } catch (err) {
    // Never send HTML—always JSON
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      details: String(err?.message || err)
    }), { status: 500, headers });
  }
}
