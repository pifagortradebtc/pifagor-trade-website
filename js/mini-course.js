/**
 * Мини-курс: 5 модулей по 5 видео.
 * Уроки 1.1–1.3 открыты всегда. С 1.4 — только для рефералов.
 * Можно смотреть уроки в любом порядке.
 */
(function () {
  var STORAGE_KEY = 'pifagor_mini_course_progress';
  var MODULES_STATE_KEY = 'pifagor_mini_course_modules';
  var AUTO_OPENED_KEY = 'pifagor_mini_course_auto_opened';
  var PLACEHOLDER_VIDEO_ID = 'jNQXAC9IVRw';

  var modules = [
    { title: 'Модуль 1: Введение', lessons: [
      { title: 'Урок 1.1', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 1.2', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 1.3', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 1.4', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 1.5', videoId: PLACEHOLDER_VIDEO_ID }
    ]},
    { title: 'Модуль 2: Основы', lessons: [
      { title: 'Урок 2.1', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 2.2', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 2.3', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 2.4', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 2.5', videoId: PLACEHOLDER_VIDEO_ID }
    ]},
    { title: 'Модуль 3: Анализ', lessons: [
      { title: 'Урок 3.1', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 3.2', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 3.3', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 3.4', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 3.5', videoId: PLACEHOLDER_VIDEO_ID }
    ]},
    { title: 'Модуль 4: Стратегии', lessons: [
      { title: 'Урок 4.1', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 4.2', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 4.3', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 4.4', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 4.5', videoId: PLACEHOLDER_VIDEO_ID }
    ]},
    { title: 'Модуль 5: Практика', lessons: [
      { title: 'Урок 5.1', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 5.2', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 5.3', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 5.4', videoId: PLACEHOLDER_VIDEO_ID },
      { title: 'Урок 5.5', videoId: PLACEHOLDER_VIDEO_ID }
    ]}
  ];

  var totalLessons = 25;
  var REFERRAL_LOCK_START = 3;
  var currentLessonIndex = 0;
  var watchedIds = [];
  var pendingLessonAfterVerify = null;

  function isReferralVerified() {
    try {
      return localStorage.getItem('referral_confirmed') === 'true' && localStorage.getItem('referral_uid');
    } catch (e) {
      return false;
    }
  }

  function getWatchedIds() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(function (n) { return typeof n === 'number' && n >= 0 && n < totalLessons; });
      var num = parseInt(raw, 10);
      if (!isNaN(num) && num >= 0) {
        var arr = [];
        for (var i = 0; i < num && i < totalLessons; i++) arr.push(i);
        return arr;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  function setWatchedIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {}
  }

  function getModulesState() {
    try {
      var raw = localStorage.getItem(MODULES_STATE_KEY);
      if (!raw) return null;
      var arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length === 5) return arr;
      return null;
    } catch (e) {
      return null;
    }
  }

  function setModulesState(state) {
    try {
      localStorage.setItem(MODULES_STATE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function lessonIndexToGlobal(moduleIdx, lessonIdx) {
    return moduleIdx * 5 + lessonIdx;
  }

  function globalToLesson(globalIdx) {
    return { moduleIdx: Math.floor(globalIdx / 5), lessonIdx: globalIdx % 5 };
  }

  function isWatched(globalIdx) {
    return watchedIds.indexOf(globalIdx) >= 0;
  }

  function renderModules() {
    watchedIds = getWatchedIds();
    var container = document.getElementById('mini-course-modules');
    if (!container) return;

    var savedState = getModulesState();
    var defaultState = [true, false, false, false, false];
    var moduleState = savedState || defaultState;

    var html = '';
    for (var m = 0; m < modules.length; m++) {
      var mod = modules[m];
      var expanded = m < moduleState.length ? moduleState[m] : (m === 0);
      html += '<div class="mini-course-module' + (expanded ? '' : ' mini-course-module-collapsed') + '">';
      html += '<button type="button" class="mini-course-module-title" aria-expanded="' + expanded + '">';
      html += '<span class="mini-course-module-title-text">' + escapeHtml(mod.title) + '</span>';
      html += '<span class="mini-course-module-chevron" aria-hidden="true">▼</span>';
      html += '</button>';
      html += '<ul class="mini-course-lessons">';
      for (var l = 0; l < mod.lessons.length; l++) {
        var globalIdx = lessonIndexToGlobal(m, l);
        var lesson = mod.lessons[l];
        var watched = isWatched(globalIdx);
        var classes = ['mini-course-lesson'];
        if (watched) classes.push('mini-course-lesson-watched');
        html += '<li class="' + classes.join(' ') + '">';
        html += '<button type="button" class="mini-course-lesson-btn" data-index="' + globalIdx + '">';
        html += watched ? '<span class="mini-course-lesson-check">✓</span>' : '';
        html += '<span class="mini-course-lesson-num">' + (globalIdx + 1) + '</span>';
        html += '<span class="mini-course-lesson-label">' + escapeHtml(lesson.title) + '</span>';
        html += '</button>';
        html += '</li>';
      }
      html += '</ul></div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.mini-course-lesson-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx >= REFERRAL_LOCK_START && !isReferralVerified()) {
          showReferralModal(idx);
        } else {
          openVideo(idx);
        }
      });
    });

    container.querySelectorAll('.mini-course-module-title').forEach(function (btn, idx) {
      btn.addEventListener('click', function () {
        var module = btn.closest('.mini-course-module');
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        module.classList.toggle('mini-course-module-collapsed', expanded);
        var state = getModulesState() || [true, false, false, false, false];
        state[idx] = !expanded;
        setModulesState(state);
      });
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function showReferralModal(globalIdx) {
    pendingLessonAfterVerify = globalIdx;
    var modal = document.getElementById('referral-verify-modal');
    var input = document.getElementById('referral-verify-uid');
    var result = document.getElementById('referral-verify-result');
    if (modal) {
      if (input) input.value = localStorage.getItem('referral_uid') || '';
      if (result) result.textContent = '';
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (input) input.focus();
    }
  }

  function hideReferralModal() {
    var modal = document.getElementById('referral-verify-modal');
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
    pendingLessonAfterVerify = null;
  }

  function openVideo(globalIdx) {
    var g = globalToLesson(globalIdx);
    var lesson = modules[g.moduleIdx].lessons[g.lessonIdx];
    var section = document.getElementById('video-section');
    var iframe = document.getElementById('video-iframe');
    var titleEl = document.getElementById('video-title');
    var linkEl = document.getElementById('video-youtube-link');
    var nextBtn = document.getElementById('btn-next-lesson');

    if (!section || !iframe || !lesson) return;

    titleEl.textContent = lesson.title;
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + lesson.videoId + '?rel=0';
    iframe.title = lesson.title;
    if (linkEl) linkEl.href = 'https://www.youtube.com/watch?v=' + lesson.videoId;

    currentLessonIndex = globalIdx;
    section.hidden = false;
    document.body.style.overflow = 'hidden';

    if (nextBtn) {
      var hasNext = globalIdx + 1 < totalLessons;
      var nextIdx = globalIdx + 1;
      if (hasNext && nextIdx >= REFERRAL_LOCK_START && !isReferralVerified()) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = hasNext ? '' : 'none';
      }
    }

    if (window.pifagorAnalytics && window.pifagorAnalytics.send) {
      window.pifagorAnalytics.send('lesson_opened', { title: lesson.title, lessonIndex: globalIdx });
    }
  }

  function closeVideo() {
    var section = document.getElementById('video-section');
    var iframe = document.getElementById('video-iframe');
    if (iframe) iframe.src = '';
    if (section) section.hidden = true;
    document.body.style.overflow = '';
  }

  function markCurrentWatchedOnly() {
    if (watchedIds.indexOf(currentLessonIndex) < 0) {
      watchedIds.push(currentLessonIndex);
      watchedIds.sort(function (a, b) { return a - b; });
      setWatchedIds(watchedIds);
      updateProgressUI();
      renderModules();
      if (window.pifagorAnalytics && window.pifagorAnalytics.send) {
        var g = globalToLesson(currentLessonIndex);
        var lesson = modules[g.moduleIdx].lessons[g.lessonIdx];
        window.pifagorAnalytics.send('lesson_watched', { title: lesson ? lesson.title : '', lessonIndex: currentLessonIndex, progress: Math.round((watchedIds.length / totalLessons) * 100) });
      }
    }
  }

  function markWatched() {
    markCurrentWatchedOnly();
    closeVideo();
  }

  function updateProgressUI() {
    var count = watchedIds.length;
    var countEl = document.getElementById('progress-count');
    var fillEl = document.getElementById('progress-fill');
    var hintEl = document.getElementById('progress-hint');
    var barEl = document.querySelector('.mini-course-progress-bar');

    if (countEl) {
      var pct = Math.round((count / totalLessons) * 100);
      countEl.textContent = pct + '%';
    }
    if (fillEl) fillEl.style.width = (count / totalLessons * 100) + '%';
    if (barEl) barEl.setAttribute('aria-valuenow', count);

    var hints = [
      'Начни с первого урока',
      'Отлично! Продолжай в том же духе',
      'Ты на верном пути',
      'Ещё немного — и модуль позади',
      'Первый модуль почти готов!',
      'Модуль 1 завершён! Переходи к модулю 2',
      'Двигаемся дальше',
      'Половина модуля 2 уже позади',
      'Отличный темп',
      'Модуль 2 завершён!',
      'Треть курса пройдена',
      'Продолжай учиться',
      'Модуль 3 почти готов',
      'Ещё один урок — и новый модуль',
      'Модуль 3 завершён!',
      'Больше половины курса',
      'Стратегии — важная часть',
      'Осталось совсем немного',
      'Модуль 4 почти завершён',
      'Предпоследний модуль готов!',
      'Финальный рывок',
      'Осталось 5 уроков',
      'Почти у цели',
      'Последний урок модуля',
      'Модуль 5 завершён!',
      'Курс пройден! Ты молодец!'
    ];
    if (hintEl) hintEl.textContent = hints[Math.min(count, hints.length - 1)];
  }

  function init() {
    watchedIds = getWatchedIds();
    renderModules();
    updateProgressUI();

    try {
      if (!localStorage.getItem(AUTO_OPENED_KEY) && watchedIds.length === 0) {
        localStorage.setItem(AUTO_OPENED_KEY, '1');
        var firstBtn = document.querySelector('.mini-course-lesson-btn[data-index="0"]');
        if (firstBtn) {
          firstBtn.classList.add('mini-course-lesson-pulse');
          setTimeout(function () {
            firstBtn.classList.remove('mini-course-lesson-pulse');
            openVideo(0);
          }, 3000);
        } else {
          setTimeout(function () { openVideo(0); }, 3000);
        }
      }
    } catch (e) {}

    var closeBtn = document.getElementById('video-close');
    var markBtn = document.getElementById('btn-mark-watched');
    var nextBtn = document.getElementById('btn-next-lesson');
    var backdrop = document.getElementById('video-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeVideo);
    if (markBtn) markBtn.addEventListener('click', markWatched);
    if (nextBtn) nextBtn.addEventListener('click', function () {
      var nextIdx = currentLessonIndex + 1;
      markCurrentWatchedOnly();
      closeVideo();
      if (nextIdx < totalLessons) {
        if (nextIdx >= REFERRAL_LOCK_START && !isReferralVerified()) {
          showReferralModal(nextIdx);
        } else {
          setTimeout(function () { openVideo(nextIdx); }, 100);
        }
      }
    });
    if (backdrop) backdrop.addEventListener('click', closeVideo);
    var refForm = document.getElementById('referral-verify-form');
    var refClose = document.getElementById('referral-verify-close');
    var refBackdrop = document.getElementById('referral-verify-backdrop');
    var refUidHelp = document.getElementById('referral-uid-help-btn');
    var uidHelpModal = document.getElementById('uid-help-modal');
    var uidHelpClose = document.getElementById('uid-help-modal-close');
    var uidHelpBackdrop = document.getElementById('uid-help-modal-backdrop');
    if (refForm) refForm.addEventListener('submit', handleReferralVerify);
    if (refClose) refClose.addEventListener('click', hideReferralModal);
    if (refBackdrop) refBackdrop.addEventListener('click', hideReferralModal);
    if (refUidHelp && uidHelpModal) refUidHelp.addEventListener('click', function () {
      uidHelpModal.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    if (uidHelpClose && uidHelpModal) uidHelpClose.addEventListener('click', function () {
      uidHelpModal.hidden = true;
    });
    if (uidHelpBackdrop && uidHelpModal) uidHelpBackdrop.addEventListener('click', function () {
      uidHelpModal.hidden = true;
    });
  }

  function handleReferralVerify(e) {
    e.preventDefault();
    var input = document.getElementById('referral-verify-uid');
    var result = document.getElementById('referral-verify-result');
    var btn = document.getElementById('referral-verify-btn');
    if (!input || !result) return;
    var uid = input.value.trim();
    if (!uid) {
      result.textContent = 'Введите UID';
      result.className = 'referral-result referral-result-error';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Проверка...';
    result.textContent = '';
    var apiBase = window.API_BASE || '/api';
    fetch(apiBase + '/check-referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid })
    }).then(function (res) { return res.json(); }).then(function (data) {
      btn.disabled = false;
      btn.textContent = 'Проверить';
      if (data.success && data.isReferral) {
        try {
          localStorage.setItem('referral_confirmed', 'true');
          localStorage.setItem('referral_uid', uid);
        } catch (err) {}
        hideReferralModal();
        if (pendingLessonAfterVerify !== null) {
          openVideo(pendingLessonAfterVerify);
          pendingLessonAfterVerify = null;
        }
      } else {
        result.textContent = data.message || data.error || 'Вы не являетесь рефералом';
        result.className = 'referral-result referral-result-neutral';
      }
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Проверить';
      result.textContent = 'Ошибка подключения. Попробуйте позже.';
      result.className = 'referral-result referral-result-error';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
