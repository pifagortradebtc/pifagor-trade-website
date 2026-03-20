/**
 * URL бэкенда для API.
 * - При запуске через npm start: используется origin + /api
 * - Для GitHub Pages / статического хостинга: задайте window.API_BASE_OVERRIDE перед этим скриптом:
 *   <script>window.API_BASE_OVERRIDE = 'https://ваш-бэкенд.onrender.com/api';</script>
 */
(function() {
  if (typeof window === 'undefined') return;
  if (window.API_BASE) return;
  window.API_BASE = window.API_BASE_OVERRIDE || (window.location.origin + '/api');
})();
