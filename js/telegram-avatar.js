/**
 * Показывает аватар пользователя Telegram справа при открытии мини-приложения из бота.
 * Использует initDataUnsafe.user.photo_url (доступно, если пользователь разрешил в настройках).
 */
(function() {
  if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) return;

  var tg = window.Telegram.WebApp;
  var user = tg.initDataUnsafe && tg.initDataUnsafe.user;
  var photoUrl = user && user.photo_url;

  if (!photoUrl) return;

  tg.ready();

  var avatar = document.createElement('div');
  avatar.className = 'tg-user-avatar';
  avatar.setAttribute('aria-hidden', 'true');

  var img = document.createElement('img');
  img.src = photoUrl;
  img.alt = user.first_name || 'Вы';
  img.loading = 'eager';

  avatar.appendChild(img);
  document.body.appendChild(avatar);
})();
