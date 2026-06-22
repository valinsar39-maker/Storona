/* ==========================================================================
   Сторона Покупателя — main.js
   Mobile menu, scroll reveal, form validation, analytics hooks
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Analytics helper (Yandex Metrika ready) ----------
     Replace YM_COUNTER_ID and uncomment the counter snippet in HTML.
     reachGoal calls below are safe no-ops until Metrika is connected. */
  var YM_COUNTER_ID = window.YM_COUNTER_ID || null;

  function ymGoal(goal) {
    try {
      if (YM_COUNTER_ID && typeof window.ym === 'function') {
        window.ym(YM_COUNTER_ID, 'reachGoal', goal);
      }
    } catch (e) { /* no-op */ }
  }
  window.ymGoal = ymGoal;

  /* Goal: clicks on primary hero CTA, phone, messengers, plan CTA */
  document.querySelectorAll('[data-goal]').forEach(function (el) {
    el.addEventListener('click', function () {
      ymGoal(el.getAttribute('data-goal'));
    });
  });

  /* Goal: pricing block viewed */
  var pricingBlock = document.querySelector('[data-goal-view="pricing_view"]');
  if (pricingBlock && 'IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          ymGoal('pricing_view');
          pio.disconnect();
        }
      });
    }, { threshold: 0.4 });
    pio.observe(pricingBlock);
  }

  /* ---------- Forms ---------- */
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var consent = form.querySelector('input[name="consent"]');
    var submitBtn = form.querySelector('button[type="submit"]');

    /* Disable submit until consent checked */
    function syncSubmit() {
      if (consent && submitBtn) {
        submitBtn.disabled = !consent.checked;
      }
    }
    if (consent) {
      consent.addEventListener('change', syncSubmit);
      syncSubmit();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      /* Required fields validation */
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field') || input.closest('.consent');
        var ok = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';

        /* basic phone check */
        if (ok && input.type === 'tel') {
          var digits = input.value.replace(/\D/g, '');
          ok = digits.length >= 10;
        }

        if (field) field.classList.toggle('field--error', !ok);
        if (!ok) valid = false;
      });

      if (!valid) return;

      /* Submit handling.
         Backend not connected yet — simulate success and redirect to thanks.
         To connect a backend (Formspree / Telegram bot / CRM), POST form data here. */
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем…';
      }

      ymGoal('form_submit');

      window.setTimeout(function () {
        window.location.href = 'thanks.html';
      }, 500);
    });

    /* Clear error state on input */
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field) field.classList.remove('field--error');
      });
    });
  });

  /* ---------- Year in footer ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
