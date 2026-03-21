/**
 * Обновляет шапку: при входе скрывает «Войти»/«Регистрация», показывает кнопку «Мой профиль».
 */
(function () {
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
    userLink.textContent = 'Мой профиль';
    userLink.href = 'profile.html';
    userLink.style.display = '';
    if (loginBtn) loginBtn.style.display = 'none';
    if (regBtn) regBtn.style.display = 'none';
  } else if (userLink) {
    userLink.style.display = 'none';
  }
})();
