// ===== PERFORMANCE OPTIMIZATIONS =====
// Request Animation Frame utility
const raf = (fn) => {
  let ticking = false;
  return () => {
      if (!ticking) {
          requestAnimationFrame(() => {
              fn();
              ticking = false;
          });
          ticking = true;
      }
  };
};

// Throttle utility
const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
          lastCall = now;
          fn(...args);
      }
  };
};

// ===== MOBILE NAVIGATION =====
(() => {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('desktop-menu');
  const menuText = toggle?.querySelector('.menu-text');
  
  if (!toggle || !menu) return;

  const toggleMenu = (isOpen) => {
      const wasOpen = menu.classList.contains('active');
      
      // Update ARIA attributes
      toggle.setAttribute('aria-expanded', String(isOpen));
      menu.classList.toggle('active', isOpen);
      
      // Update button text
      if (menuText) {
          menuText.textContent = isOpen ? 'Close' : 'Menu';
      }
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
      
      // Announce state change to screen readers
      const announcement = document.getElementById('menu-announcement') || 
          (() => {
              const div = document.createElement('div');
              div.id = 'menu-announcement';
              div.setAttribute('aria-live', 'polite');
              div.setAttribute('aria-atomic', 'true');
              div.className = 'sr-only';
              document.body.appendChild(div);
              return div;
          })();
          
      announcement.textContent = `Navigation menu ${isOpen ? 'opened' : 'closed'}`;
  };

  // Toggle menu on button click
  toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('active');
      toggleMenu(!isOpen);
  });

  // Close menu when clicking on links
  menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
          toggleMenu(false);
      }
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
          toggleMenu(false);
          toggle.focus();
      }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
      if (menu.classList.contains('active') && 
          !menu.contains(e.target) && 
          !toggle.contains(e.target)) {
          toggleMenu(false);
      }
  });

  // Handle window resize
  window.addEventListener('resize', throttle(() => {
      if (window.innerWidth > 768 && menu.classList.contains('active')) {
          toggleMenu(false);
      }
  }, 250));
})();

// ===== CONTACT FORM HANDLER =====
(() => {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  
  if (!form || !statusEl) return;

  const submitBtn = form.querySelector('.submit-btn');
  const inputs = form.querySelectorAll('input, select, textarea');

  // Validation patterns
  const patterns = {
      name: /^[A-Za-z\s.'-]{2,60}$/,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: /^.{20,4000}$/
  };

  // Validation messages
  const messages = {
      name: 'Please enter a valid name (2-60 characters, letters and spaces only)',
      email: 'Please enter a valid email address',
      service: 'Please select a service',
      message: 'Please enter a message with at least 20 characters',
      recaptcha: 'Please complete the reCAPTCHA verification'
  };

  // Real-time validation
  inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => clearFieldError(input));
  });

  function validateField(field) {
      const value = field.value.trim();
      const fieldName = field.name;
      
      clearFieldError(field);

      if (field.required && !value) {
          setFieldError(field, `${fieldName} is required`);
          return false;
      }

      if (fieldName === 'name' && !patterns.name.test(value)) {
          setFieldError(field, messages.name);
          return false;
      }

      if (fieldName === 'email' && !patterns.email.test(value)) {
          setFieldError(field, messages.email);
          return false;
      }

      if (fieldName === 'message' && !patterns.message.test(value)) {
          setFieldError(field, messages.message);
          return false;
      }

      setFieldSuccess(field);
      return true;
  }

  function setFieldError(field, message) {
      field.style.borderColor = 'var(--danger)';
      field.setAttribute('aria-invalid', 'true');
      
      // Create or update error message
      let errorEl = field.parentNode.querySelector('.field-error');
      if (!errorEl) {
          errorEl = document.createElement('div');
          errorEl.className = 'field-error';
          errorEl.style.cssText = 'color: var(--danger); font-size: 0.875rem; margin-top: 0.25rem;';
          field.parentNode.appendChild(errorEl);
      }
      errorEl.textContent = message;
  }

  function setFieldSuccess(field) {
      field.style.borderColor = 'var(--success)';
      field.setAttribute('aria-invalid', 'false');
      
      const errorEl = field.parentNode.querySelector('.field-error');
      if (errorEl) {
          errorEl.remove();
      }
  }

  function clearFieldError(field) {
      field.style.borderColor = '';
      field.setAttribute('aria-invalid', 'false');
      
      const errorEl = field.parentNode.querySelector('.field-error');
      if (errorEl) {
          errorEl.remove();
      }
  }

  function validateForm() {
      let isValid = true;
      
      inputs.forEach(input => {
          if (!validateField(input)) {
              isValid = false;
          }
      });

      // Validate reCAPTCHA
      const recaptchaResponse = grecaptcha.getResponse();
      if (!recaptchaResponse) {
          isValid = false;
          setFormStatus(messages.recaptcha, 'error');
      }

      return isValid;
  }

  function setFormStatus(message, type = 'info') {
      statusEl.textContent = message;
      statusEl.className = `form-status ${type}`;
      
      if (type === 'success') {
          statusEl.setAttribute('aria-live', 'polite');
      } else {
          statusEl.setAttribute('aria-live', 'assertive');
      }
  }

  function setLoadingState(loading) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Sending...' : 'Send Message';
      
      if (loading) {
          submitBtn.setAttribute('aria-busy', 'true');
      } else {
          submitBtn.removeAttribute('aria-busy');
      }
  }

  // Form submission handler
  form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
          return;
      }

      setLoadingState(true);
      setFormStatus('Sending your message...', 'info');

      try {
          const formData = new FormData(form);
          const data = {
              name: formData.get('name'),
              email: formData.get('email'),
              service: formData.get('service'),
              message: formData.get('message'),
              'g-recaptcha-response': grecaptcha.getResponse(),
              '_captcha': 'false',
              '_template': 'table',
              '_subject': 'New message from Sahasrakshi Contact Form'
          };

          const response = await fetch('https://formsubmit.co/ajax/info@sahasrakshi.co.in', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
              },
              body: JSON.stringify(data)
          });

          if (response.ok) {
              setFormStatus('✅ Message sent successfully! We\'ll get back to you within 24 hours.', 'success');
              form.reset();
              grecaptcha.reset();
          } else {
              throw new Error('Server responded with an error');
          }
      } catch (error) {
          console.error('Form submission error:', error);
          setFormStatus('❌ Failed to send message. Please try again or email us directly at info@sahasrakshi.co.in', 'error');
          grecaptcha.reset();
      } finally {
          setLoadingState(false);
      }
  });
})();

// ===== BACK TO TOP BUTTON =====
(() => {
  const backToTop = document.getElementById('backToTop');
  if (!backToTop) return;

  const scrollHandler = raf(() => {
      const isVisible = window.scrollY > 400;
      backToTop.classList.toggle('visible', isVisible);
      backToTop.setAttribute('aria-hidden', String(!isVisible));
  });

  backToTop.addEventListener('click', () => {
      window.scrollTo({
          top: 0,
          behavior: 'smooth'
      });
      backToTop.blur(); // Remove focus after click
  });

  window.addEventListener('scroll', scrollHandler, { passive: true });
})();

// ===== FOOTER YEAR =====
(() => {
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
  }
})();

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
(() => {
  document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link && link.getAttribute('href') !== '#') {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
              const headerHeight = document.querySelector('header')?.offsetHeight || 0;
              const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
              
              window.scrollTo({
                  top: targetPosition,
                  behavior: 'smooth'
              });
              
              // Update URL without jumping
              history.pushState(null, null, `#${targetId}`);
          }
      }
  });
})();

// ===== PERFORMANCE OBSERVER =====
(() => {
  if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
              console.log(`${entry.name}: ${entry.duration}ms`);
          });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
  }
})();

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Preload critical images
  const criticalImages = [
      'assets/logo.png',
      'assets/images/pentest.jpg',
      'assets/images/soc.jpg',
      'assets/images/ir.jpg'
  ];
  
  criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
  });

  // Initialize any third-party scripts
  if (typeof grecaptcha !== 'undefined') {
      grecaptcha.ready(() => {
          console.log('reCAPTCHA loaded successfully');
      });
  }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

// Security console message
console.log('%c🔒 Sahasrakshi Global Services - Protected by advanced security measures', 
  'color: #4fd1c5; font-size: 14px; font-weight: bold; background: #041312; padding: 10px; border-radius: 4px;');
