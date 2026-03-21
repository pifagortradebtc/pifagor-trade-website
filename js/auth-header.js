/**
 * Обновляет шапку: при входе скрывает «Войти»/«Регистрация», показывает имя пользователя.
 * Обрабатывает кнопку «Полный сброс» в auth-bar.
 */
(function () {
  var resetAll = document.getElementById('reset-all');
  if (resetAll) {
    resetAll.addEventListener('click', function () {
      try {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && (k.indexOf('pifagor') === 0 || k === 'referral_confirmed' || k === 'referral_uid')) keys.push(k);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
        sessionStorage.clear();
        window.location.reload();
      } catch (e) {}
    });
  }

  function isLoggedIn() {
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      var webAppUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (webAppUser) return true;
      var stored = localStorage.getItem('pifagor_telegram_user');
      if (stored) return true;
    } catch (e) {}
    return false;
  }

  var loggedIn = isLoggedIn();
  var loginBtn = document.querySelector('.header-auth-btn-login');
  var regBtn = document.querySelector('.header-auth-btn-reg');
  var userLink = document.getElementById('header-auth-user');

  if (loggedIn && userLink) {
    var displayName = '';
    try {
      var j = null;
      var stored = localStorage.getItem('pifagor_telegram_user');
      if (stored) j = JSON.parse(stored);
      if (!j) {
        var tw = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user;
        if (tw) j = { first_name: tw.first_name, last_name: tw.last_name, username: tw.username };
      }
      if (j) {
        var fn = (j.first_name || '').trim(), ln = (j.last_name || '').trim(), un = (j.username || '').trim();
        displayName = (fn + (ln ? ' ' + ln : '')).trim() || (un ? '@' + un : '');
      }
    } catch (e) {}
    userLink.textContent = displayName || 'Профиль';
    userLink.title = displayName || 'Профиль';
    userLink.href = 'profile.html';
    userLink.style.display = '';
    if (loginBtn) loginBtn.style.display = 'none';
    if (regBtn) regBtn.style.display = 'none';
  } else if (userLink) {
    userLink.style.display = 'none';
  }
})();
