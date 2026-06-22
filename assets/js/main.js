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

  /* Prefill tariff select when a plan CTA is clicked */
  document.querySelectorAll('[data-plan]').forEach(function (el) {
    el.addEventListener('click', function () {
      var plan = el.getAttribute('data-plan');
      var sel = document.querySelector('select[name="tariff"]');
      if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].text === plan) { sel.selectedIndex = i; break; }
        }
      }
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

/* ==========================================================================
   Team carousel
   ========================================================================== */
(function () {
  'use strict';
  var carousel = document.querySelector('.team-carousel');
  if (!carousel) return;

  var track = carousel.querySelector('.team-track');
  var prev = carousel.querySelector('.team-prev');
  var next = carousel.querySelector('.team-next');
  var dotsWrap = carousel.querySelector('.team-dots');
  var cards = Array.prototype.slice.call(track.children);
  if (!cards.length) return;

  function gap() {
    var g = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '24');
    return isNaN(g) ? 24 : g;
  }
  function step() { return cards[0].offsetWidth + gap(); }
  function perView() { return Math.max(1, Math.round(track.clientWidth / step())); }

  /* Build dots — one per "page" */
  var dots = [];
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    dots = [];
    var pages = Math.max(1, cards.length - perView() + 1);
    for (var i = 0; i < pages; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Перейти к сотруднику ' + (i + 1));
      (function (idx) {
        b.addEventListener('click', function () {
          track.scrollTo({ left: idx * step(), behavior: 'smooth' });
        });
      })(i);
      dotsWrap.appendChild(b);
      dots.push(b);
    }
  }

  function activeIndex() { return Math.round(track.scrollLeft / step()); }

  function update() {
    var idx = activeIndex();
    var maxScroll = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= maxScroll;
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
  }

  if (next) next.addEventListener('click', function () {
    track.scrollBy({ left: step() * Math.max(1, perView() - 0), behavior: 'smooth' });
  });
  if (prev) prev.addEventListener('click', function () {
    track.scrollBy({ left: -step() * Math.max(1, perView() - 0), behavior: 'smooth' });
  });

  var ticking = false;
  track.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  /* Pointer drag (desktop) — touch works natively via overflow scroll */
  var down = false, startX = 0, startLeft = 0;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;
    down = true; startX = e.clientX; startLeft = track.scrollLeft;
    track.style.cursor = 'grabbing';
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    track.scrollLeft = startLeft - (e.clientX - startX);
  });
  window.addEventListener('pointerup', function () {
    down = false; track.style.cursor = '';
  });

  /* Analytics: first interaction with the team carousel */
  var fired = false;
  function fireGoal() {
    if (fired) return; fired = true;
    if (typeof window.ymGoal === 'function') window.ymGoal('team_scroll');
  }
  track.addEventListener('scroll', fireGoal, { passive: true, once: true });
  if (next) next.addEventListener('click', fireGoal);
  if (prev) prev.addEventListener('click', fireGoal);

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { buildDots(); update(); }, 150);
  });

  buildDots();
  update();
})();
