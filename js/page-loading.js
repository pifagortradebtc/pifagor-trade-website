/**
 * Показывает индикатор загрузки при клике на внутренние ссылки
 * (переход на другую страницу сайта)
 */
(function () {
  var overlay = document.createElement('div');
  overlay.className = 'page-loading-overlay';
  overlay.innerHTML = '<div class="page-loading-spinner"></div>';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.display = 'none';
  document.body.appendChild(overlay);

  function hideOverlay() {
    overlay.style.display = 'none';
  }

  window.addEventListener('pageshow', hideOverlay);
  window.addEventListener('pagehide', hideOverlay);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') hideOverlay();
  });

  document.addEventListener('click', function (e) {
    var backBtn = e.target.closest('#bottom-nav-back, .bottom-nav-back');
    if (backBtn) {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'indicators.html';
      }
      return;
    }
    var a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.classList.contains('no-loading')) return;
    var href = (a.getAttribute('href') || '').trim();
    if (!href || href.charAt(0) === '#' || href.startsWith('javascript:')) return;
    if (href.indexOf('.html') > -1 || (href.indexOf('/') === 0 && href.length > 1)) {
      overlay.style.display = 'flex';
    }
  });
})();
