/**
 * URL бэкенда для API.
 * www.pifagor.trade и pifagor.trade — разные origins (CORS). Приводим к одному.
 * Для cross-origin задайте window.API_BASE_OVERRIDE перед этим скриптом.
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  var h = (window.location.hostname || '').toLowerCase();
  if (window.API_BASE_OVERRIDE) {
    window.API_BASE = window.API_BASE_OVERRIDE;
  } else if (h === 'www.pifagor.trade' || h === 'www.pifagor-trade.com') {
    window.API_BASE = 'https://pifagor.trade/api';
  } else {
    window.API_BASE = '/api';
  }
  window.TELEGRAM_LOGIN_BOT = window.TELEGRAM_LOGIN_BOT_OVERRIDE || window.TELEGRAM_LOGIN_BOT || '';
})();
