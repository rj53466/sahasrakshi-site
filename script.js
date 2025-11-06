/* === Contact Form (reCAPTCHA v2 checkbox) === */
(() => {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  if (!form || !statusEl) return;

  // Stop native submission
  form.method = 'post';
  form.action = '#';

  // Avoid double binding
  if (form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  const submitBtn = form.querySelector('button[type="submit"]');
  const ready = () => (window.grecaptcha && typeof grecaptcha.getResponse === 'function');

  // Use local Worker in dev, same-origin in prod
  const API_BASE =
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:8787'
      : '';

  // Optional: block Enter from submitting (except textarea)
  form.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.tagName !== 'TEXTAREA') {
      ev.preventDefault();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ready()) {
      statusEl.textContent = 'Security is initializing… please try again.';
      statusEl.style.color = '#e53e3e';
      return;
    }

    const token = grecaptcha.getResponse();
    if (!token) {
      statusEl.textContent = 'Please complete the CAPTCHA.';
      statusEl.style.color = '#e53e3e';
      return;
    }

    const body = {
      name: form.name.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      service: form.service.value.trim(),
      message: form.message.value.trim(),
      recaptchaToken: token
    };

    // Basic client validation
    if (body.name.length < 2 || body.name.length > 60) {
      statusEl.textContent = 'Please enter a valid name.';
      statusEl.style.color = '#e53e3e';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254) {
      statusEl.textContent = 'Please enter a valid email.';
      statusEl.style.color = '#e53e3e';
      return;
    }
    if (!body.service) {
      statusEl.textContent = 'Please select a service.';
      statusEl.style.color = '#e53e3e';
      return;
    }
    if (body.message.length < 10 || body.message.length > 4000) {
      statusEl.textContent = 'Please enter a detailed message.';
      statusEl.style.color = '#e53e3e';
      return;
    }

    submitBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = 'Verifying…';
    statusEl.textContent = 'Verifying…';
    statusEl.style.color = '#4a5568';

    try {
      const resp = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      // Read as text first to avoid JSON parse errors on HTML responses
      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { error: text }; }

      // Worker returns { success: true, message: '...' }
      if (!resp.ok || !json.success) {
        throw new Error(json.error || 'Failed to send message');
      }

      statusEl.textContent = 'Thank you! Your message has been sent. We’ll get back to you within 24 hours.';
      statusEl.style.color = '#48bb78';
      form.reset();
      grecaptcha.reset();

    } catch (err) {
      statusEl.textContent = err.message || 'Something went wrong. Please try again or email us directly.';
      statusEl.style.color = '#e53e3e';
      grecaptcha.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });
})(); // <-- close the contact IIFE correctly


/* === Mobile Menu Toggle === */
(() => {
  const toggle = document.getElementById('mobileToggle');
  const desktopMenu = document.getElementById('desktop-menu');
  if (!toggle || !desktopMenu) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    desktopMenu.style.display = isOpen ? 'none' : 'flex';
    desktopMenu.style.flexDirection = 'column';
    desktopMenu.style.gap = '12px';
  });
})();


/* === Footer - Year & Back to Top === */
(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const backToTop = document.getElementById('backToTop');
  if (!backToTop) return;

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const toggleBtt = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 400);
  };
  toggleBtt();
  window.addEventListener('scroll', toggleBtt);
})();

console.log('%c🔒 Sahasrakshi Contact Form protected by server-side CAPTCHA verification',
  'color: #4fd1c5; font-size: 14px; font-weight: bold;');
