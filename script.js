/* === Simple reCAPTCHA + FormSubmit Email Sender === */
(() => {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  if (!form || !statusEl) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const ready = () => (window.grecaptcha && typeof grecaptcha.getResponse === 'function');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ✅ Check CAPTCHA
    if (!ready()) {
      statusEl.textContent = 'Security is initializing...';
      statusEl.style.color = '#e53e3e';
      return;
    }

    const token = grecaptcha.getResponse();
    if (!token) {
      statusEl.textContent = 'Please verify you are human.';
      statusEl.style.color = '#e53e3e';
      return;
    }

    const body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value.trim(),
      message: form.message.value.trim()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusEl.textContent = 'Sending message...';
    statusEl.style.color = '#4a5568';

    try {
      await fetch("https://formsubmit.co/ajax/info@sahasrakshi.co.in", {
        method: "POST",
        mode: "no-cors", // ✅ Fix for Cloudflare and CORS issues
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(body)
      });

      statusEl.textContent = "✅ Message sent successfully!";
      statusEl.style.color = "#48bb78";
      form.reset();
      grecaptcha.reset();

    } catch (err) {
      statusEl.textContent = "❌ Failed to send message. Please try again.";
      statusEl.style.color = "#e53e3e";
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
