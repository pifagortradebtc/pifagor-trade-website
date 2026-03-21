/**
 * Сортирует индикаторы по алфавиту.
 * Русские и латинские буквы считаются равными (Д = D, А = A и т.д.)
 */
(function () {
  var cyrillicToLatin = {
    '\u0410': 'A', '\u0430': 'a', '\u0411': 'B', '\u0431': 'b',
    '\u0412': 'V', '\u0432': 'v', '\u0413': 'G', '\u0433': 'g',
    '\u0414': 'D', '\u0434': 'd', '\u0415': 'E', '\u0435': 'e',
    '\u0401': 'E', '\u0451': 'e', '\u0416': 'Zh', '\u0436': 'zh',
    '\u0417': 'Z', '\u0437': 'z', '\u0418': 'I', '\u0438': 'i',
    '\u0419': 'J', '\u0439': 'j', '\u041a': 'K', '\u043a': 'k',
    '\u041b': 'L', '\u043b': 'l', '\u041c': 'M', '\u043c': 'm',
    '\u041d': 'N', '\u043d': 'n', '\u041e': 'O', '\u043e': 'o',
    '\u041f': 'P', '\u043f': 'p', '\u0420': 'R', '\u0440': 'r',
    '\u0421': 'S', '\u0441': 's', '\u0422': 'T', '\u0442': 't',
    '\u0423': 'U', '\u0443': 'u', '\u0424': 'F', '\u0444': 'f',
    '\u0425': 'H', '\u0445': 'h', '\u0426': 'C', '\u0446': 'c',
    '\u0427': 'Ch', '\u0447': 'ch', '\u0428': 'Sh', '\u0448': 'sh',
    '\u0429': 'Sch', '\u0449': 'sch', '\u042a': '', '\u044a': '',
    '\u042b': 'Y', '\u044b': 'y', '\u042c': '', '\u044c': '',
    '\u042d': 'E', '\u044d': 'e', '\u042e': 'Yu', '\u044e': 'yu',
    '\u042f': 'Ya', '\u044f': 'ya'
  };

  function toSortKey(str) {
    if (!str) return '';
    var result = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      result += cyrillicToLatin[ch] !== undefined ? cyrillicToLatin[ch] : ch;
    }
    return result.toLowerCase();
  }

  function sortIndicators() {
    var grid = document.querySelector('.indicators-grid');
    if (!grid) return;

    var pills = Array.prototype.slice.call(grid.querySelectorAll('.indicator-pill'));
    if (pills.length === 0) return;

    pills.sort(function (a, b) {
      var keyA = toSortKey(a.textContent || '');
      var keyB = toSortKey(b.textContent || '');
      return keyA.localeCompare(keyB);
    });

    pills.forEach(function (pill) {
      grid.appendChild(pill);
    });
  }

  window.sortIndicatorsGrid = sortIndicators;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sortIndicators);
  } else {
    sortIndicators();
  }

  window.addEventListener('pifagor:pagechange', function (e) {
    if (e.detail && e.detail.page === 'indicators') {
      sortIndicators();
    }
  });
})();
