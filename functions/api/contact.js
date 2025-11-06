// /api/contact (POST)
// Bindings are configured in Cloudflare Pages → Settings → Functions → Bindings
export async function onRequestPost(context) {
    const { request, env } = context;
  
    const origin = request.headers.get('Origin') || '';
    const allowOrigin = [env.ALLOWED_ORIGIN].includes(origin) ? origin : env.ALLOWED_ORIGIN;
    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type'
    };
  
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  
    let body;
    try { body = await request.json(); } catch { return j(400, 'Bad JSON'); }
    const { name = '', email = '', service = '', message = '', recaptchaToken = '' } = body;
  
    if (!recaptchaToken) return j(400, 'Missing captcha token');
  
    // Verify reCAPTCHA v2 checkbox
    const v = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.RECAPTCHA_SECRET,
        response: recaptchaToken,
        remoteip: request.headers.get('CF-Connecting-IP') || ''
      })
    }).then(r => r.json());
  
    if (!v.success) return j(400, 'Captcha failed');
  
    // Optional hostname pin
    const validHosts = new Set(['sahasrakshi.co.in', 'www.sahasrakshi.co.in']);
    if (v.hostname && !validHosts.has(v.hostname)) return j(400, 'Captcha host mismatch');
  
    // Validate
    if (name.length < 2 || name.length > 60) return j(400, 'Invalid name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return j(400, 'Invalid email');
    if (!service || service.length > 120) return j(400, 'Invalid service');
    if (message.length < 10 || message.length > 4000) return j(400, 'Invalid message');
  
    // Rate limit per email (5 / hour) via KV
    const key = `rl:${email.toLowerCase()}`;
    const count = parseInt((await env.CONTACT_RL.get(key)) || '0', 10);
    if (count >= 5) return j(429, 'Too many submissions, try later');
    await env.CONTACT_RL.put(key, String(count + 1), { expirationTtl: 3600 });
  
    // Relay to FormSubmit (or swap to your mail/webhook)
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
      const rj = await relay.json();
      ok = ok && (rj.success === 'true');
    } catch { /* some responses may be empty; rely on status */ }
  
    if (!ok) return j(502, 'Upstream send failed');
  
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    });
  
    function j(status, error) {
      return new Response(JSON.stringify({ ok: false, error }), {
        status, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
  