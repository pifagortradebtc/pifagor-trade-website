/**
 * URL бэкенда для API.
 * Используем same-origin (текущий хост + /api) для избежания CORS и ERR_INVALID_REDIRECT
 * при редиректах между www и non-www.
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  if (window.API_BASE_OVERRIDE) {
    window.API_BASE = window.API_BASE_OVERRIDE;
  } else {
    window.API_BASE = (window.location.origin || '').replace(/\/$/, '') + '/api';
  }
  window.TELEGRAM_LOGIN_BOT = window.TELEGRAM_LOGIN_BOT_OVERRIDE || window.TELEGRAM_LOGIN_BOT || '';
})();
