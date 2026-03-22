/**
 * URL бэкенда для API.
 * Сайт на www.pifagor.trade (Render), API на pifagor.trade (другой Render-сервис).
 * При www — вызываем pifagor.trade/api. При pifagor.trade — /api (тот же хост).
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  var h = (window.location.hostname || '').toLowerCase();
  var apiHost = 'https://pifagor-trade.onrender.com/api';
  var needApi = h === 'pifagor.trade' || h === 'www.pifagor.trade' ||
    h === 'pifagor-trade.com' || h === 'www.pifagor-trade.com';
  if (window.API_BASE_OVERRIDE) {
    window.API_BASE = window.API_BASE_OVERRIDE;
  } else if (needApi) {
    window.API_BASE = apiHost;
  } else {
    window.API_BASE = window.location.origin + '/api';
  }
  window.TELEGRAM_LOGIN_BOT = window.TELEGRAM_LOGIN_BOT_OVERRIDE || window.TELEGRAM_LOGIN_BOT || '';
})();
