# Sahasrakshi Site (Secure + CAPTCHA)

This package contains a hardened static site and a Cloudflare Worker that verifies **reCAPTCHA v2 (checkbox)** server-side with rate limiting.

## What you must fill in
- `index.html`: put your **reCAPTCHA Site Key** into `data-sitekey="YOUR_RECAPTCHA_SITE_KEY"`.
- Cloudflare Worker secret: set **RECAPTCHA_SECRET** to your **server secret**.
- KV namespace: create a KV and update its ID in `wrangler.toml`.

## Local testing

1. **Allow localhost** in your reCAPTCHA admin for the site key:
   - `localhost`, `127.0.0.1`

2. Start a static server:
   ```bash
   python -m http.server 3000
   # http://127.0.0.1:3000
   ```

3. Cloudflare Worker:
   ```bash
   npm i -g wrangler
   wrangler login
   wrangler secret put RECAPTCHA_SECRET  # paste your secret
   wrangler kv:namespace create CONTACT_RL  # copy id to wrangler.toml
   wrangler dev --local  # http://127.0.0.1:8787
   ```

4. Visit http://127.0.0.1:3000, submit the form. The Worker at http://127.0.0.1:8787 handles `/api/contact`.

## Production deploy

1. Put this site on GitHub Pages (or any static host).

2. Deploy the Worker to Cloudflare and add a **Route**:
   - `https://sahasrakshi.co.in/api/contact` → your Worker

3. Set environment:
   - **RECAPTCHA_SECRET** (Worker secret)
   - **ALLOWED_ORIGIN** = `https://sahasrakshi.co.in`
   - **CONTACT_RL** binding to your KV.

4. **Replace the DEV CSP** in `index.html` with this **PROD CSP** (or better, set it as an HTTP header in Cloudflare):
   ```http
   Content-Security-Policy:
     default-src 'self';
     script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/;
     style-src 'self';
     img-src 'self' data: https://www.gstatic.com/recaptcha/ https://www.google.com/;
     font-src 'self' data:;
     frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/;
     connect-src 'self';
     form-action 'self';
     object-src 'none';
     base-uri 'self';
     frame-ancestors 'none';
     upgrade-insecure-requests;
   ```

5. Optional **extra security headers** at Cloudflare (Transform Rules → Response Headers):
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Content-Type-Options: nosniff`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

## Notes

- No secrets in the browser. The Worker verifies the token server-side.
- Rate limit: 5 submissions per email per hour (KV). You can extend with IP keys if you like.
- If you prefer **Cloudflare Turnstile**, swap the widget and verify endpoint; the Worker structure stays almost identical.
