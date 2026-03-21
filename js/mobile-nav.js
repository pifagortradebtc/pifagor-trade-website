/**
 * Мобильное hamburger-меню и выдвижная навигация
 */
(function () {
  var menuBtn = document.querySelector('.mobile-menu-btn');
  var nav = document.querySelector('.section-nav');
  var backdrop = document.querySelector('.mobile-nav-backdrop');

  if (!menuBtn || !nav) return;

  function isOpen() {
    return document.body.classList.contains('nav-open');
  }

  function openNav() {
    document.body.classList.add('nav-open');
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    if (isOpen()) closeNav();
    else openNav();
  }

  menuBtn.addEventListener('click', toggleNav);

  if (backdrop) {
    backdrop.addEventListener('click', closeNav);
  }

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  nav.querySelectorAll('button').forEach(function (btn) {
    btn.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closeNav();
  });
})();
