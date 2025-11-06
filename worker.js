/**
 * Cloudflare Worker for /api/contact
 *
 * ENV VARS (Cloudflare Dashboard -> Worker -> Settings -> Variables):
 *  - RECAPTCHA_SECRET: your Google reCAPTCHA secret key (server-side only)
 *  - ALLOWED_ORIGIN: https://sahasrakshi.co.in (or your dev host)
 *
 * KV NAMESPACE (binding):
 *  - CONTACT_RL: KV for rate limit per email (1h TTL)
 */
export default {
  async fetch(req, env, ctx) {
    // CORS allowlist (supports localhost in dev)
    const origin = req.headers.get('Origin') || '';
    const isLocal =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');
    const allowedProd = env.ALLOWED_ORIGIN || 'https://sahasrakshi.co.in';
    const allowOrigin = isLocal ? origin : allowedProd;

    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });

    let payload;
    try {
      payload = await req.json(); // { name,email,service,message, recaptchaToken }
    } catch {
      return j(400, 'Bad JSON');
    }

    const { name = '', email = '', service = '', message = '', recaptchaToken = '' } = payload;

    if (!recaptchaToken) return j(400, 'Missing captcha token');

    // 1) Verify reCAPTCHA v2 checkbox at Google
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.RECAPTCHA_SECRET,
        response: recaptchaToken,
        remoteip: req.headers.get('CF-Connecting-IP') || ''
      })
    });
    const verify = await verifyRes.json();
    if (!verify.success) return j(400, 'Captcha failed');

    // Optional hostname lock (adjust to your domains)
    const validHosts = new Set(['sahasrakshi.co.in', 'www.sahasrakshi.co.in', 'localhost', '127.0.0.1']);
    if (verify.hostname && !validHosts.has(verify.hostname)) return j(400, 'Captcha host mismatch');

    // 2) Server-side validation
    if (typeof name !== 'string' || name.length < 2 || name.length > 60) return j(400, 'Invalid name');
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return j(400, 'Invalid email');
    if (typeof service !== 'string' || service.length < 1 || service.length > 120) return j(400, 'Invalid service');
    if (typeof message !== 'string' || message.length < 10 || message.length > 4000) return j(400, 'Invalid message');

    // 3) Rate limit per email (5 per hour)
    const key = `rl:${email.toLowerCase()}`;
    const current = await env.CONTACT_RL.get(key);
    const count = current ? parseInt(current, 10) : 0;
    if (count >= 5) return j(429, 'Too many submissions, try later');
    await env.CONTACT_RL.put(key, String(count + 1), { expirationTtl: 3600 });

    // 4) Relay to FormSubmit (or replace with your email/webhook)
    const relay = await fetch('https://formsubmit.co/ajax/info@sahasrakshi.co.in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name, email, service, message,
        _subject: 'New Contact Form Submission - Sahasrakshi',
        _template: 'table'
      })
    });

    let ok = relay.ok;
    try {
      const relayJson = await relay.json();
      ok = ok && (relayJson.success === 'true');
    } catch {
      // Some responses may be empty; rely on status
    }
    if (!ok) return j(502, 'Upstream send failed');

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    });

    function j(status, error) {
      return new Response(JSON.stringify({ ok: false, error }), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};
