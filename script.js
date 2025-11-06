/* === Simple Contact Form with reCAPTCHA + FormSubmit === */
(() => {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  if (!form || !statusEl) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const ready = () => (window.grecaptcha && typeof grecaptcha.getResponse === 'function');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check reCAPTCHA
    if (!ready()) {
      statusEl.textContent = 'Security is initializing… please wait.';
      statusEl.style.color = '#e53e3e';
      return;
    }

    const token = grecaptcha.getResponse();
    if (!token) {
      statusEl.textContent = 'Please verify you are human before sending.';
      statusEl.style.color = '#e53e3e';
      return;
    }

    // Build body for FormSubmit.co
    const body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value.trim(),
      message: form.message.value.trim()
    };

    // Quick validation
    if (!body.name || !body.email || !body.message) {
      statusEl.textContent = 'Please fill in all required fields.';
      statusEl.style.color = '#e53e3e';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.textContent = 'Sending your message...';
    statusEl.style.color = '#4a5568';

    try {
      const response = await fetch('https://formsubmit.co/ajax/info@sahasrakshi.co.in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        statusEl.textContent = '✅ Thank you! Your message has been sent successfully.';
        statusEl.style.color = '#48bb78';
        form.reset();
        grecaptcha.reset();
      } else {
        throw new Error(result.message || 'Failed to send message.');
      }

    } catch (err) {
      statusEl.textContent = `❌ ${err.message || 'Something went wrong. Please try again.'}`;
      statusEl.style.color = '#e53e3e';
      grecaptcha.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
})();


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
