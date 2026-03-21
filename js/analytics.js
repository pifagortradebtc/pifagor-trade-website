/**
 * Аналитика веб-сайта Pifagor Trade
 * События: просмотры, клики, время, UID, модалки, внешние ссылки, наведение
 * client: website, device: mobile|desktop
 */
(function () {
  var SESSION_KEY = 'pifagor_analytics_session';
  var SESSION_START_KEY = 'pifagor_analytics_session_start';
  var PAGE_ENTER_KEY = 'pifagor_analytics_enter';

  function isMobile() {
    return (typeof window !== 'undefined' && window.innerWidth < 768) || /Android|webOS|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  }

  function getSessionId() {
    try {
      var s = sessionStorage.getItem(SESSION_KEY);
      if (s) return s;
      s = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
      sessionStorage.setItem(SESSION_KEY, s);
      return s;
    } catch (e) {
      return 'unknown';
    }
  }

  function getTelegramUser() {
    try {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
        var u = window.Telegram.WebApp.initDataUnsafe.user;
        if (u) return { id: u.id, username: u.username || '' };
      }
    } catch (e) {}
    return null;
  }

  function getPage() {
    var p = (window.location.pathname || '').replace(/^\//, '') || 'index.html';
    return p;
  }

  function getAnalyticsUrl() {
    var base = (window.ANALYTICS_API_URL || window.API_BASE || '/api').toString().replace(/\/$/, '');
    return base + '/analytics';
  }

  function send(event, data) {
    var hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
    var payload = {
      ts: new Date().toISOString(),
      page: getPage(),
      event: event,
      sessionId: getSessionId(),
      tg: getTelegramUser(),
      client: 'website',
      device: isMobile() ? 'mobile' : 'desktop',
      hostname: hostname
    };
    if (data && typeof data === 'object') {
      for (var k in data) if (data.hasOwnProperty(k)) payload[k] = data[k];
    }
    var url = getAnalyticsUrl();
    try {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } catch (e) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }
  }

  function init() {
    var page = getPage();
    var enterTime = Date.now();
    try {
      sessionStorage.setItem(PAGE_ENTER_KEY, String(enterTime));
    } catch (e) {}

    try {
      if (!sessionStorage.getItem(SESSION_START_KEY)) {
        sessionStorage.setItem(SESSION_START_KEY, String(enterTime));
        send('session_start');
      }
    } catch (e) {}

    send('page_view', { title: document.title || '' });

    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button, [data-track]');
      if (!el) return;
      var href = el.href || '';
      var isExternal = href && href.indexOf('http') === 0 && (el.target === '_blank' || el.hasAttribute('target'));
      if (isExternal) {
        var domain = '';
        try { domain = new URL(href).hostname.replace(/^www\./, ''); } catch (err) {}
        send('external_click', {
          element: (el.getAttribute('data-track') || el.textContent || '').trim().slice(0, 80),
          externalUrl: domain || href.slice(0, 200)
        });
        return;
      }
      var label = el.getAttribute('data-track') ||
        (el.querySelector('.home-nav-label') && el.querySelector('.home-nav-label').textContent) ||
        (el.querySelector('.home-cta-banner-text') && el.querySelector('.home-cta-banner-text').textContent) ||
        (el.querySelector('.home-banner-text') && el.querySelector('.home-banner-text').textContent) ||
        (el.textContent || '').trim().slice(0, 80);
      var id = el.id || '';
      send('click', { element: label || id || el.tagName, href: href ? href.replace(/^https?:\/\/[^/]+/, '') : '' });
    }, true);

    var hoverStart = {};
    document.addEventListener('mouseenter', function (e) {
      var el = e.target.closest('a, button, [data-track]');
      if (!el) return;
      var label = el.getAttribute('data-track') || (el.textContent || '').trim().slice(0, 60);
      if (!label) return;
      hoverStart[label] = Date.now();
    }, true);
    document.addEventListener('mouseleave', function (e) {
      var el = e.target.closest('a, button, [data-track]');
      if (!el) return;
      var label = el.getAttribute('data-track') || (el.textContent || '').trim().slice(0, 60);
      if (!label || !hoverStart[label]) return;
      var dur = Math.round((Date.now() - hoverStart[label]) / 1000);
      delete hoverStart[label];
      if (dur >= 1) send('element_hover', { element: label, durationSec: dur });
    }, true);

    function trackUidInputs() {
      var ids = ['referral-uid', 'referral-verify-uid', 'check-modal-uid', 'uid-input'];
      ids.forEach(function (id) {
        var inp = document.getElementById(id);
        if (!inp) return;
        if (inp.dataset.analyticsTracked) return;
        inp.dataset.analyticsTracked = '1';
        inp.addEventListener('focus', function () { send('uid_focus', { inputId: id }); });
        inp.addEventListener('blur', function () {
          var len = (inp.value || '').trim().length;
          send('uid_blur', { inputId: id, valueLength: len });
        });
      });
    }
    trackUidInputs();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackUidInputs);
    }

    var modalIds = ['automation-modal', 'uid-help-modal', 'account-referral-modal', 'register-modal', 'referral-access-modal', 'check-modal', 'profile-invite-modal', 'profile-change-modal', 'referral-verify-modal'];
    modalIds.forEach(function (modalId) {
      var modal = document.getElementById(modalId);
      if (!modal) return;
      try {
        var obs = new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            if (m.attributeName !== 'hidden') return;
            var isHidden = modal.hasAttribute('hidden');
            send(isHidden ? 'modal_close' : 'modal_open', { modalId: modalId });
          });
        });
        obs.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
      } catch (e) {}
    });

    window.addEventListener('pagehide', function () {
      var enter = 0, sessionStart = 0;
      try {
        enter = parseInt(sessionStorage.getItem(PAGE_ENTER_KEY), 10) || 0;
        sessionStart = parseInt(sessionStorage.getItem(SESSION_START_KEY), 10) || 0;
      } catch (e) {}
      var duration = enter ? Math.round((Date.now() - enter) / 1000) : 0;
      var sessionDuration = sessionStart ? Math.round((Date.now() - sessionStart) / 1000) : 0;
      send('page_leave', { durationSec: duration, sessionDurationSec: sessionDuration });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        var enter = 0;
        try { enter = parseInt(sessionStorage.getItem(PAGE_ENTER_KEY), 10) || 0; } catch (e) {}
        var duration = enter ? Math.round((Date.now() - enter) / 1000) : 0;
        send('visibility_hidden', { durationSec: duration });
      }
    });
  }

  window.pifagorAnalytics = { send: send };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
