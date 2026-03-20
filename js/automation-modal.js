/**
 * Модальное окно «Автоматизация торговли» — открывается без перехода на другую страницу
 */
(function () {
  var modal = document.getElementById('automation-modal');
  if (!modal) return;

  var closeBtn = modal.querySelector('#automation-modal-close');
  var backdrop = modal.querySelector('#automation-modal-backdrop');

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.open-automation-modal').forEach(function (btn) {
    btn.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  if (window.location.hash === '#automation') openModal();
})();
