/**
 * URL бэкенда для API.
 * Когда сайт на pifagor.trade (кастомный домен Render) — используем тот же origin, без редиректа.
 * Для другого хостинга задайте window.API_BASE_OVERRIDE перед этим скриптом.
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  window.API_BASE = window.API_BASE_OVERRIDE || (window.location.origin + '/api');
  window.TELEGRAM_LOGIN_BOT = window.TELEGRAM_LOGIN_BOT_OVERRIDE || window.TELEGRAM_LOGIN_BOT || '';
})();
