/**
 * Аналитика мини-приложения Pifagor Trade
 * Отправляет события на сервер: просмотры страниц, клики, время на странице
 */
(function () {
  var SESSION_KEY = 'pifagor_analytics_session';
  var PAGE_ENTER_KEY = 'pifagor_analytics_enter';

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

  function send(event, data) {
    var payload = {
      ts: new Date().toISOString(),
      page: getPage(),
      event: event,
      sessionId: getSessionId(),
      tg: getTelegramUser()
    };
    if (data && typeof data === 'object') {
      for (var k in data) if (data.hasOwnProperty(k)) payload[k] = data[k];
    }
    var apiBase = window.API_BASE || '/api';
    var url = apiBase.replace(/\/$/, '') + '/analytics';
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

    send('page_view', { title: document.title || '' });

    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button, [data-track]');
      if (!el) return;
      var label = el.getAttribute('data-track') ||
        (el.querySelector('.home-card-text') && el.querySelector('.home-card-text').textContent) ||
        (el.querySelector('.home-banner-text') && el.querySelector('.home-banner-text').textContent) ||
        (el.textContent || '').trim().slice(0, 80);
      var href = el.href || '';
      var id = el.id || '';
      send('click', { element: label || id || el.tagName, href: href ? href.replace(/^https?:\/\/[^/]+/, '') : '' });
    }, true);

    window.addEventListener('pagehide', function () {
      var enter = 0;
      try {
        enter = parseInt(sessionStorage.getItem(PAGE_ENTER_KEY), 10) || 0;
      } catch (e) {}
      var duration = enter ? Math.round((Date.now() - enter) / 1000) : 0;
      send('page_leave', { durationSec: duration });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        var enter = 0;
        try {
          enter = parseInt(sessionStorage.getItem(PAGE_ENTER_KEY), 10) || 0;
        } catch (e) {}
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
