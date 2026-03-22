/**
 * URL бэкенда для API.
 * Относительный путь /api — тот же хост, что и страница (избегает редиректов www/non-www).
 * Для cross-origin задайте window.API_BASE_OVERRIDE перед этим скриптом.
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  window.API_BASE = window.API_BASE_OVERRIDE || '/api';
  window.TELEGRAM_LOGIN_BOT = window.TELEGRAM_LOGIN_BOT_OVERRIDE || window.TELEGRAM_LOGIN_BOT || '';
})();
