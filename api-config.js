/**
 * URL бэкенда для API.
 * - При запуске через npm start: используется origin + /api
 * - Сайт на pifagor.trade / pifagor-trade.com (статический хостинг) → API на Render
 * - Иначе можно задать window.API_BASE_OVERRIDE перед этим скриптом
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  var host = (window.location.hostname || '').toLowerCase();
  var isStaticSite = host === 'pifagor.trade' || host === 'www.pifagor.trade' ||
    host === 'pifagor-trade.com' || host === 'www.pifagor-trade.com';
  window.API_BASE = window.API_BASE_OVERRIDE ||
    (isStaticSite ? 'https://pifagor-trade.onrender.com/api' : (window.location.origin + '/api'));
  window.TELEGRAM_LOGIN_BOT = window.TELEGRAM_LOGIN_BOT_OVERRIDE || window.TELEGRAM_LOGIN_BOT || '';
})();
