/**
 * Левое меню: при входе — кнопка [аватар + имя] → профиль; на странице профиля — «Выйти».
 */
function runAuthSidebar() {
  try {
    var s = localStorage.getItem('pifagor_telegram_user');
    var hasUser = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) || !!s;
    if (!hasUser) return;

    document.body.classList.add('user-logged-in');

    var j = null;
    if (s) try { j = JSON.parse(s); } catch (e) {}
    if (!j && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
      var tw = window.Telegram.WebApp.initDataUnsafe.user;
      if (tw) j = { first_name: tw.first_name, last_name: tw.last_name, username: tw.username, photo_url: tw.photo_url };
    }

    var fn = '', ln = '', un = '', photo = '';
    if (j) {
      fn = (j.first_name || j.firstName || '').trim();
      ln = (j.last_name || j.lastName || '').trim();
      un = (j.username || '').trim();
      photo = j.photo_url || j.photoUrl || '';
    }
    var name = (fn + (ln ? ' ' + ln : '')).trim() || (un ? '@' + un : '') || 'Мой профиль';

    var isProfilePage = /profile\.html$/i.test(window.location.pathname) || document.querySelector('.page-profile');
    if (isProfilePage) document.body.classList.add('page-profile');

    document.querySelectorAll('.header-auth-btn-login').forEach(function (btn) { btn.style.display = 'none'; });

    var profileLinks = document.querySelectorAll('.section-nav-auth-user');
    var exitBtn = document.getElementById('section-nav-exit');

    if (isProfilePage) {
      profileLinks.forEach(function (el) { el.style.display = 'none'; });
      if (exitBtn) {
        exitBtn.style.display = '';
        exitBtn.style.width = '100%';
      }
    } else {
      profileLinks.forEach(function (el) {
        el.href = 'profile.html';
        el.title = 'Мой профиль';
        el.style.display = '';
        el.style.width = '100%';
        el.innerHTML = '<span class="section-nav-auth-avatar-wrap">' +
          (photo ? '<img src="' + photo + '" alt="" class="section-nav-auth-avatar">' : '<span class="section-nav-auth-avatar-placeholder">' + (fn ? fn.charAt(0) : '👤') + '</span>') +
          '</span><span class="section-nav-auth-name">' + name + '</span>';
      });
      if (exitBtn) exitBtn.style.display = 'none';
    }

    var h = document.getElementById('header-auth-user');
    if (h) {
      h.href = 'profile.html';
      h.title = name;
      h.textContent = name;
      h.style.display = '';
    }
  } catch (e) {}
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAuthSidebar);
} else {
  runAuthSidebar();
}
