/**
 * Обновляет шапку: при входе скрывает «Войти»/«Регистрация», показывает имя с ссылкой на профиль.
 */
(function () {
  function getLoggedInUser() {
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      var webAppUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (webAppUser) {
        var firstName = (webAppUser.first_name || '').trim();
        var lastName = (webAppUser.last_name || '').trim();
        return [firstName, lastName].filter(Boolean).join(' ') || 'Профиль';
      }
      var stored = localStorage.getItem('pifagor_telegram_user');
      if (stored) {
        var user = JSON.parse(stored);
        var fn = (user.firstName || '').trim();
        var ln = (user.lastName || '').trim();
        return [fn, ln].filter(Boolean).join(' ') || 'Профиль';
      }
    } catch (e) {}
    return null;
  }

  var displayName = getLoggedInUser();
  var loginBtn = document.querySelector('.header-auth-btn-login');
  var regBtn = document.querySelector('.header-auth-btn-reg');
  var userLink = document.getElementById('header-auth-user');

  if (displayName && userLink) {
    userLink.textContent = displayName;
    userLink.href = 'profile.html';
    userLink.style.display = '';
    if (loginBtn) loginBtn.style.display = 'none';
    if (regBtn) regBtn.style.display = 'none';
  } else if (userLink) {
    userLink.style.display = 'none';
  }
})();
