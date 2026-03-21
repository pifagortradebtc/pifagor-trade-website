/**
 * SPA-навигация: переход между страницами без перезагрузки.
 * Баннер и шапка остаются неподвижными.
 */
(function () {
  var nav = document.querySelector('.section-nav');
  var contentWrap = document.querySelector('.page-content-wrap');
  if (!nav || !contentWrap) return;

  var pageMap = {
    'indicators.html': 'indicators',
    'signals.html': 'signals',
    'training.html': 'training',
    'investors-letters.html': 'investors',
    'travel.html': 'travel',
    'get-free.html': 'get-free',
    'profile.html': 'profile',
    'mini-course.html': 'mini-course',
    'support.html': 'support'
  };

  function getPageFromHref(href) {
    var path = href.split('?')[0];
    var name = path.split('/').pop() || path;
    return pageMap[name] || null;
  }

  var pageDiv = document.querySelector('.page-with-sidebar, .page');

  function updateNavActive(href) {
    var page = getPageFromHref(href);
    if (!page) return;
    nav.querySelectorAll('.section-nav-item.section-nav-active').forEach(function (el) {
      el.classList.remove('section-nav-active');
    });
    nav.querySelectorAll('a.section-nav-item').forEach(function (el) {
      var linkHref = (el.getAttribute('href') || '').split('?')[0];
      if (linkHref === href || linkHref.endsWith('/' + href)) {
        el.classList.add('section-nav-active');
      }
    });
  }

  function updatePageClass(newPage) {
    if (!pageDiv) return;
    pageDiv.className = pageDiv.className.replace(/\bpage-\w+/g, '').trim();
    pageDiv.classList.add('page-' + newPage);
    if (newPage === 'profile') {
      document.body.classList.add('page-profile');
    } else {
      document.body.classList.remove('page-profile');
    }
  }

  function removeIndicatorModals() {
    document.querySelectorAll('.indicator-modal').forEach(function (el) {
      el.remove();
    });
  }

  function runIndicatorScript() {
    var pills = document.querySelectorAll('[data-indicator]');
    if (pills.length === 0) return;
    var modals = {};
    document.querySelectorAll('.indicator-modal').forEach(function (m) {
      var id = m.id && m.id.replace('indicator-modal-', '');
      if (id) modals[id] = m;
    });
    var closeBtns = document.querySelectorAll('[data-close-modal]');

    function stopVideos(modal) {
      if (!modal) return;
      modal.querySelectorAll('iframe').forEach(function (f) {
        if (f.src && f.src !== 'about:blank') f.dataset.videoSrc = f.src;
        f.src = 'about:blank';
      });
    }
    function restoreVideos(modal) {
      if (!modal) return;
      modal.querySelectorAll('iframe').forEach(function (f) {
        if (f.dataset.videoSrc) f.src = f.dataset.videoSrc;
      });
    }

    pills.forEach(function (btn) {
      var id = btn.getAttribute('data-indicator');
      var modal = modals[id];
      if (modal) {
        btn.addEventListener('click', function () {
          restoreVideos(modal);
          modal.hidden = false;
          document.body.style.overflow = 'hidden';
        });
      }
    });

    function closeAll() {
      Object.values(modals).forEach(function (m) {
        if (m) {
          stopVideos(m);
          m.hidden = true;
        }
      });
      document.body.style.overflow = '';
    }
    closeBtns.forEach(function (btn) {
      btn.onclick = closeAll;
    });
    Object.values(modals).forEach(function (modal) {
      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target === modal) closeAll();
        });
      }
    });
  }

  function navigate(href, pushState) {
    var fullUrl = href.indexOf('/') === 0 || href.indexOf('http') === 0 ? href : new URL(href, window.location.href).pathname;
    var targetPage = getPageFromHref(href);
    if (!targetPage) return false;

    fetch(fullUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newWrap = doc.querySelector('.page-content-wrap');
        if (!newWrap) return;

        removeIndicatorModals();

        contentWrap.innerHTML = newWrap.innerHTML;

        var indicatorModals = doc.querySelectorAll('.indicator-modal');
        indicatorModals.forEach(function (modal) {
          var automationModal = document.getElementById('automation-modal');
          if (automationModal && automationModal.parentNode) {
            automationModal.parentNode.insertBefore(modal.cloneNode(true), automationModal);
          } else {
            document.body.appendChild(modal.cloneNode(true));
          }
        });

        if (targetPage === 'indicators') {
          if (window.sortIndicatorsGrid) window.sortIndicatorsGrid();
          runIndicatorScript();
        }

        updatePageClass(targetPage);
        updateNavActive(href);
        if (pushState) {
          history.pushState({ page: targetPage, href: href }, '', fullUrl);
        }
        window.scrollTo(0, 0);

        var overlay = document.querySelector('.page-loading-overlay');
        if (overlay) overlay.style.display = 'none';

        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';

        window.dispatchEvent(new CustomEvent('pifagor:pagechange', { detail: { page: targetPage } }));
      })
      .catch(function () {
        window.location.href = href;
      });

    return true;
  }

  nav.addEventListener('click', function (e) {
    var link = e.target.closest('a.section-nav-item[href]');
    if (!link) return;
    var href = (link.getAttribute('href') || '').trim();
    if (!href || href.charAt(0) === '#' || href.startsWith('javascript:')) return;
    if (link.target === '_blank') return;
    if (link.classList.contains('header-auth-btn-login')) return;
    if (link.classList.contains('section-nav-auth-user')) return;
    var pageFile = href.split('/').pop().split('?')[0];
    if (!pageMap[pageFile]) return;
    if (pageFile === 'mini-course.html' || pageFile === 'get-free.html' || pageFile === 'profile.html') return;

    e.preventDefault();
    e.stopPropagation();
    navigate(href, true);
  });

  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.href) {
      navigate(e.state.href, false);
    }
  });
})();
