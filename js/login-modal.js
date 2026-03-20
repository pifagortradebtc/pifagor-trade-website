/**
 * Модальное окно входа с кнопкой «Войти с помощью Telegram»
 */
(function () {
  var loginModal = document.getElementById('login-modal');
  var loginBackdrop = document.getElementById('login-modal-backdrop');
  var loginClose = document.getElementById('login-modal-close');
  var tgWidgetContainer = document.getElementById('login-telegram-widget');

  function openLoginModal() {
    if (loginModal) {
      loginModal.hidden = false;
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLoginModal() {
    if (loginModal) {
      loginModal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('.header-auth-btn-login').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openLoginModal();
    });
  });

  if (loginClose) loginClose.addEventListener('click', closeLoginModal);
  if (loginBackdrop) loginBackdrop.addEventListener('click', closeLoginModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && loginModal && !loginModal.hidden) closeLoginModal();
  });

  window.onTelegramAuth = function (user) {
    try {
      localStorage.setItem('pifagor_telegram_user', JSON.stringify({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name || '',
        username: user.username || '',
        photoUrl: user.photo_url || '',
      }));
    } catch (err) {}
    closeLoginModal();
    window.location.href = 'profile.html';
  };

  var bot = (window.TELEGRAM_LOGIN_BOT || '').trim();
  if (tgWidgetContainer && bot) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', bot);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    tgWidgetContainer.appendChild(script);
  } else if (tgWidgetContainer) {
    tgWidgetContainer.innerHTML = '<p class="login-modal-hint">Для входа через Telegram настройте TELEGRAM_LOGIN_BOT в .env и укажите домен бота в @BotFather</p><a href="https://t.me/pifagor_admin" target="_blank" rel="noopener noreferrer" class="btn btn-telegram-fallback">Написать в поддержку</a>';
  }
})();
