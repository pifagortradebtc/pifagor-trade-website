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

  var infoHtml = '<div class="login-modal-info-wrap">' +
    '<button type="button" class="login-modal-info-btn" aria-label="Как войти под другим аккаунтом" aria-expanded="false" id="login-info-btn">i</button>' +
    '<div class="login-modal-info-content" id="login-info-content" hidden role="region" aria-labelledby="login-info-btn">' +
    '<p class="login-modal-info-title">Войти под другим аккаунтом Telegram</p>' +
    '<p>Виджет использует аккаунт, под которым вы сейчас открыли Telegram. Чтобы войти с другим аккаунтом:</p>' +
    '<ol class="login-modal-info-steps">' +
    '<li><strong>В приложении Telegram:</strong> Настройки → нажмите на номер телефона → «Добавить аккаунт» или «Выйти».</li>' +
    '<li><strong>В Telegram Web:</strong> Настройки (иконка шестерёнки) → Выйти. Затем войдите под нужным аккаунтом.</li>' +
    '<li>Вернитесь на сайт и нажмите «Войти» снова.</li>' +
    '</ol>' +
    '</div></div>';
  var contentEl = loginModal && loginModal.querySelector('.login-modal-content');
  if (contentEl) {
    var tgEl = document.getElementById('login-telegram-widget');
    if (tgEl) {
      tgEl.insertAdjacentHTML('beforebegin', infoHtml);
    } else {
      contentEl.insertAdjacentHTML('beforeend', infoHtml);
    }
  }
  var infoBtn = document.getElementById('login-info-btn');
  var infoContent = document.getElementById('login-info-content');
  if (infoBtn && infoContent) {
    infoBtn.addEventListener('click', function () {
      var isOpen = !infoContent.hidden;
      infoContent.hidden = isOpen;
      infoBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && loginModal && !loginModal.hidden) closeLoginModal();
  });

  window.onTelegramAuth = function (user) {
    try {
      var photo = user.photo_url || '';
      localStorage.setItem('pifagor_telegram_user', JSON.stringify({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name || '',
        username: user.username || '',
        photoUrl: photo,
        first_name: user.first_name,
        last_name: user.last_name || '',
        photo_url: photo,
      }));
    } catch (err) {}
    closeLoginModal();
    window.location.href = 'profile.html';
  };

  var bot = (window.TELEGRAM_LOGIN_BOT || '').trim();
  var hostname = (window.location && window.location.hostname) || '';
  if (!bot && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    bot = 'testminiappifbot';
  }
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
