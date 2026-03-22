/**
 * URL бэкенда для API.
 * Сайт на www.pifagor.trade (Render), API на pifagor.trade (другой Render-сервис).
 * При www — вызываем pifagor.trade/api. При pifagor.trade — /api (тот же хост).
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  var h = (window.location.hostname || '').toLowerCase();
  if (window.API_BASE_OVERRIDE) {
    window.API_BASE = window.API_BASE_OVERRIDE;
  } else if (h === 'www.pifagor.trade' || h === 'www.pifagor-trade.com') {
    window.API_BASE = 'https://pifagor-trade.onrender.com/api';
  } else {
    window.API_BASE = window.location.origin + '/api';
  }
  window.TELEGRAM_LOGIN_BOT = window.TELEGRAM_LOGIN_BOT_OVERRIDE || window.TELEGRAM_LOGIN_BOT || '';
})();
