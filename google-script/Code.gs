/**
 * Google Apps Script для Pifagor Trade
 * Принимает данные подписчиков и рефералов, записывает в листы таблицы.
 *
 * Листы в таблице:
 * - "Путешествия": колонка A=email (подписчики на мероприятия)
 * - "Рефералы": колонки A=uid, B=tradingview, C=telegram (опционально), D=email
 * - "InviteResent": колонка A=uid (рефералы, использовавшие «Потерял ссылку»)
 * - "Аналитика": аналитика событий
 */

function doPost(e) {
  e = e || {};
  var output;
  try {
    var params = {};
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (_) {}
    }
    if (Object.keys(params).length === 0) {
      params = e.parameter || {};
    }

    var type = (params.type || '').toString().toLowerCase();

    if (type === 'test') {
      output = createResponse({ success: true, message: 'Связь с Google Script работает' });
    } else if (type === 'analytics') {
      output = handleAnalytics(params);
    } else if (type === 'referral') {
      output = handleReferral(params);
    } else if (type === 'referral_profile') {
      output = handleReferralProfile(params);
    } else if (type === 'referral_update') {
      output = handleReferralUpdate(params);
    } else if (type === 'invite_resent') {
      output = handleInviteResent(params);
    } else {
      output = handleSubscribe(params);
    }
  } catch (err) {
    var msg = err.message || 'Ошибка при сохранении. Попробуйте позже.';
    output = createResponse({ success: false, error: msg });
  }
  return output;
}

function handleSubscribe(params) {
  var email = (params.email || params.Email || '').trim().toLowerCase();
  if (!email) {
    return createResponse({ success: false, error: 'Укажите email' });
  }
  var sheet = getOrCreateSheet('Путешествия');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['email']);
  }
  if (emailExistsInSheet(sheet, email)) {
    return createResponse({ success: true, message: 'Вы уже подписаны.' });
  }
  sheet.appendRow([email]);
  return createResponse({
    success: true,
    message: 'Спасибо! Вы подписаны на уведомления о мероприятиях.'
  });
}

function handleReferral(params) {
  params = params || {};
  var uid = (params.uid || '').trim();
  var tradingview = (params.tradingview || params.tradingView || params.TradingView || '').trim();
  var telegram = (params.telegram || '').trim();
  var email = (params.email || '').trim().toLowerCase();

  if (!uid) {
    return createResponse({ success: false, error: 'UID не указан' });
  }
  if (!tradingview) {
    return createResponse({ success: false, error: 'Укажите никнейм в TradingView' });
  }
  if (!email) {
    return createResponse({ success: false, error: 'Укажите email для рассылки писем инвесторам' });
  }

  var sheet = getOrCreateSheet('Рефералы');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['uid', 'tradingview', 'telegram', 'email']);
  }
  var newRow = [uid, tradingview, telegram, email];
  if (rowExistsFull(sheet, newRow)) {
    return createResponse({ success: true, message: 'Эй, не паникуй! Я всё получил. Уже всё есть.' });
  }
  sheet.appendRow(newRow);
  var letterUrl = (params.investorLetterUrl || '').toString().trim();
  if (letterUrl && email) {
    try {
      MailApp.sendEmail(email, 'Письмо инвесторам — Pifagor Trade', '', {
        htmlBody: '<p>Добрый день, большое спасибо, что являетесь рефералом. Как я и сказал, для вас в этом нет никакой платы, никаких дополнительных затрат. Надеюсь, что мой контент и мои разработки будут вам полезны.</p><p>Это ваше первое письмо инвестору: <a href="' + letterUrl + '">Письмо инвестору</a></p><p>Вы можете всегда посмотреть последнюю версию в приложении или на веб-сайте в своем профиле в разделе «Письмо инвестору».</p><p>Спасибо, удачи нам с вами на рынке.</p>'
      });
    } catch (mailErr) {
      Logger.log('Ошибка отправки письма инвестора на ' + email + ': ' + (mailErr.message || String(mailErr)));
    }
  }
  return createResponse({
    success: true,
    message: 'Данные приняты. Индикаторы откроются в течение 3 дней.'
  });
}

/**
 * Возвращает последнюю запись реферала по UID или по Telegram (email, tradingview, telegram).
 */
function handleReferralProfile(params) {
  var uid = (params.uid || '').trim();
  var telegram = (params.telegram || '').trim();
  if (!uid && !telegram) return createResponse({ success: false, error: 'UID или Telegram не указан' });
  var sheet = getOrCreateSheet('Рефералы');
  if (sheet.getLastRow() < 2) return createResponse({ success: false, error: 'Данные не найдены' });
  var data = sheet.getDataRange().getValues();
  var last = null;
  var normalizeTg = function(t) {
    var s = String(t || '').trim().toLowerCase();
    return s.replace(/^@/, '');
  };
  var tgSearch = telegram ? normalizeTg(telegram) : '';
  for (var i = data.length - 1; i >= 1; i--) {
    if (uid) {
      var a = String(data[i][0] || '').trim();
      if (a === uid) { last = data[i]; break; }
    } else if (tgSearch) {
      var colTg = normalizeTg(data[i][2]);
      if (colTg === tgSearch || colTg === '@' + tgSearch) { last = data[i]; break; }
    }
  }
  if (!last) return createResponse({ success: false, error: 'Реферал не найден' });
  var lastUid = String(last[0] != null ? last[0] : '').trim();
  var inviteResentUsed = inviteResentUsedForUid(lastUid);
  return createResponse({
    success: true,
    uid: lastUid,
    email: String(last[3] != null ? last[3] : '').trim(),
    tradingview: String(last[1] != null ? last[1] : '').trim(),
    telegram: String(last[2] != null ? last[2] : '').trim(),
    inviteResentUsed: inviteResentUsed
  });
}

/**
 * Обработка «Потерял ссылку»: action 'check' — проверка, 'mark' — пометить использованным.
 */
function handleInviteResent(params) {
  params = params || {};
  var uid = (params.uid || '').trim();
  var action = (params.action || 'check').toString().toLowerCase();
  if (!uid) return createResponse({ success: false, error: 'UID не указан' });
  var sheet = getOrCreateSheet('InviteResent');
  if (sheet.getLastRow() === 0) sheet.appendRow(['uid']);
  var used = uidExistsInColumn(sheet, 1, uid);
  if (action === 'check') return createResponse({ success: true, alreadyUsed: used });
  if (action === 'mark') {
    if (used) return createResponse({ success: true, alreadyUsed: true });
    sheet.appendRow([uid]);
    return createResponse({ success: true });
  }
  return createResponse({ success: false, error: 'Неизвестный action' });
}

function inviteResentUsedForUid(uid) {
  if (!uid) return false;
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('InviteResent');
    if (!sheet || sheet.getLastRow() < 2) return false;
    return uidExistsInColumn(sheet, 1, uid);
  } catch (e) { return false; }
}

function uidExistsInColumn(sheet, col, uid) {
  var data = sheet.getDataRange().getValues();
  var u = String(uid || '').trim();
  if (data.length <= 1) return false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col - 1] || '').trim() === u) return true;
  }
  return false;
}

/**
 * Добавляет новую строку с изменёнными данными. Колонка F = "изменено".
 * Берёт последнюю запись по UID и подставляет новые значения (если переданы).
 */
function handleReferralUpdate(params) {
  var uid = (params.uid || '').trim();
  if (!uid) return createResponse({ success: false, error: 'UID не указан' });
  var sheet = getOrCreateSheet('Рефералы');
  if (sheet.getLastRow() < 2) return createResponse({ success: false, error: 'Данные не найдены' });
  var data = sheet.getDataRange().getValues();
  var u = String(uid).trim();
  var last = null;
  for (var i = data.length - 1; i >= 1; i--) {
    var a = String(data[i][0] || '').trim();
    if (a === u) {
      last = data[i];
      break;
    }
  }
  if (!last) return createResponse({ success: false, error: 'Реферал с таким UID не найден' });
  var tv = (params.tradingview != null && params.tradingview !== '') ? String(params.tradingview).trim() : String(last[1] != null ? last[1] : '').trim();
  var tg = (params.telegram != null && params.telegram !== '') ? String(params.telegram).trim() : String(last[2] != null ? last[2] : '').trim();
  var em = (params.email != null && params.email !== '') ? String(params.email).trim().toLowerCase() : String(last[3] != null ? last[3] : '').trim().toLowerCase();
  if (!tv) return createResponse({ success: false, error: 'Укажите никнейм в TradingView' });
  if (!em) return createResponse({ success: false, error: 'Укажите email' });
  sheet.appendRow([uid, tv, tg, em, '', 'изменено']);
  return createResponse({ success: true, message: 'Данные обновлены.' });
}

function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) {
    return SpreadsheetApp.openById(id);
  }
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}
  throw new Error('SPREADSHEET_ID не задан. В Apps Script: Файл → Свойства проекта → Script Properties → добавьте SPREADSHEET_ID = ID вашей таблицы (из URL: docs.google.com/spreadsheets/d/ID_ТАБЛИЦЫ/edit)');
}

function getOrCreateSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    message: 'Скрипт работает. Используйте POST для отправки данных.'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Запустите ОДИН РАЗ вручную: выбрать testGmailAuth → Выполнить.
 * Откроет окно авторизации Gmail. После этого письма рефералам будут отправляться.
 */
function testGmailAuth() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Тест Gmail — Pifagor Trade', 'Если вы получили это письмо — авторизация работает.');
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * При открытии таблицы — меню для ручных действий.
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.createMenu('Аналитика')
        .addItem('Форматировать лист Аналитика', 'formatAnalyticsSheet')
        .addItem('Создать сводку и графики', 'createAnalyticsSummary')
        .addSeparator()
        .addItem('Включить автообновление сводки (каждые 15 мин)', 'enableAnalyticsAutoRefresh')
        .addItem('Отключить автообновление', 'disableAnalyticsAutoRefresh')
        .addToUi();
    }
  } catch (e) {}
}

/**
 * Сохраняет события аналитики в лист "Аналитика".
 * Колонки: ts, page, event, sessionId, tgId, tgUsername, element, href, durationSec, title
 */
function handleAnalytics(params) {
  var sheet = getOrCreateSheet('Аналитика');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ts', 'page', 'event', 'sessionId', 'tgId', 'tgUsername', 'element', 'href', 'durationSec', 'title', 'lessonIndex', 'progress']);
  }
  var row = [
    (params.ts || '').toString().slice(0, 50),
    (params.page || '').toString().slice(0, 200),
    (params.event || '').toString().slice(0, 50),
    (params.sessionId || '').toString().slice(0, 100),
    (params.tgId || '').toString().slice(0, 50),
    (params.tgUsername || '').toString().slice(0, 100),
    (params.element || '').toString().slice(0, 500),
    (params.href || '').toString().slice(0, 500),
    (params.durationSec !== undefined ? String(params.durationSec) : ''),
    (params.title || '').toString().slice(0, 200),
    (params.lessonIndex !== undefined ? String(params.lessonIndex) : ''),
    (params.progress !== undefined ? String(params.progress) : '')
  ];
  sheet.appendRow(row);
  return createResponse({ success: true });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Проверяет, есть ли email в листе (для Путешествия — только колонка A).
 */
function emailExistsInSheet(sheet, email) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  var e = String(email || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || '').trim().toLowerCase() === e) return true;
  }
  return false;
}

/**
 * Проверяет, есть ли строка с такими же A и B. Используется в removeDuplicatesInSheet.
 */
function rowExistsAB(sheet, values) {
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  var a = String(values[0] || '').trim();
  var b = String(values[1] || '').trim();
  for (var i = 1; i < data.length; i++) {
    var rowA = String(data[i][0] || '').trim();
    var rowB = String(data[i][1] || '').trim();
    if (rowA === a && rowB === b) return true;
  }
  return false;
}

/**
 * Проверяет, есть ли полностью идентичная строка (A, B, C, D).
 * Полные дубликаты не добавляем.
 */
function rowExistsFull(sheet, values) {
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  var newVals = [
    String(values[0] != null ? values[0] : '').trim(),
    String(values[1] != null ? values[1] : '').trim(),
    String(values[2] != null ? values[2] : '').trim(),
    String(values[3] != null ? values[3] : '').trim().toLowerCase()
  ];
  if (newVals[0] === '') return false;
  for (var i = 1; i < data.length; i++) {
    var match = true;
    for (var c = 0; c < 4 && c < data[i].length; c++) {
      var cell = String(data[i][c] != null ? data[i][c] : '').trim();
      if (c === 3) cell = cell.toLowerCase();
      if (cell !== newVals[c]) { match = false; break; }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Подсвечивает красным строки, где A (uid) одинаков, а B/C/D различаются.
 * Колонка E не учитывается. Только строки 413, 414, 415 и подобные.
 * Запустить: Расширения → Apps Script → highlightDuplicateA → Выполнить.
 */
function highlightDuplicateA(sheet) {
  if (!sheet) {
    var ss;
    try { ss = getSpreadsheet(); } catch (e) { ss = SpreadsheetApp.getActiveSpreadsheet(); }
    if (!ss) return;
    var s2 = ss.getSheetByName('Рефералы');
    if (s2) highlightSheet(s2);
    return;
  }
  highlightSheet(sheet);
}

function highlightSheet(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return;
  // Сначала полностью очищаем форматирование листа и колонку E
  var lastR = sheet.getLastRow();
  var lastC = Math.max(sheet.getLastColumn(), 5);
  if (lastR >= 1 && lastC >= 1) {
    sheet.getRange(1, 1, lastR, lastC).clearFormat();
  }
  if (lastR >= 2) {
    sheet.getRange(2, 5, lastR - 1, 1).clearContent();
  }
  var range = sheet.getDataRange();
  var data = range.getValues();
  var startRow = range.getRow();
  var numRows = data.length;
  var numCols = data[0] ? data[0].length : 0;
  if (numRows < 2 || numCols < 2) return;

  // Группируем ТОЛЬКО по UID (колонка A). UID — число, пропускаем заголовки и пустые
  var map = {};
  for (var i = 1; i < numRows; i++) {
    var raw = data[i][0];
    var a = (raw != null && raw !== '') ? String(raw).trim() : '';
    if (!a) continue;
    // Пропускаем заголовок, если он попал в данные
    if (a.toLowerCase() === 'uid') continue;
    if (!map[a]) map[a] = [];
    map[a].push({ row: startRow + i, idx: i });
  }

  var colors = [
    '#6B9FFF', // синий
    '#FFB86B', // оранжевый
    '#6BFF9F', // зелёный
    '#D66BFF', // фиолетовый
    '#FFE66B', // жёлтый
    '#6BFFF0', // бирюзовый
    '#FF6BC4', // розовый
    '#A0FF6B'  // салатовый
  ];
  var colorIdx = 0;
  for (var key in map) {
    if (!key || map[key].length < 2) continue; // Только дубликаты UID
    var rows = map[key];
    var sigs = {};
    for (var j = 0; j < rows.length; j++) {
      var r = data[rows[j].idx] || [];
      var b = String(r[1] != null ? r[1] : '').trim();
      var c = String(r[2] != null ? r[2] : '').trim();
      var d = String(r[3] != null ? r[3] : '').trim().toLowerCase();
      sigs[b + '|' + c + '|' + d] = true;
    }
    if (Object.keys(sigs).length > 1) {
      var color = colors[colorIdx % colors.length];
      colorIdx++;
      var ss = sheet.getParent();
      var baseUrl = ss.getUrl();
      var gid = sheet.getSheetId();
      var allRowNums = rows.map(function(x) { return x.row; }).join(', ');
      var firstRow = rows[0].row;
      var linkUrl = baseUrl + '#gid=' + gid + '&range=A' + firstRow;
      var linkText = 'Внимание! UID номер уже использован. См.: ' + allRowNums;
      var formula = '=HYPERLINK("' + linkUrl + '";"' + linkText.replace(/"/g, '""') + '")';
      for (var k = 0; k < rows.length; k++) {
        sheet.getRange(rows[k].row, 1, 1, Math.max(numCols, 5)).setBackground(color);
        sheet.getRange(rows[k].row, 5).setFormula(formula);
      }
    }
  }
}

/**
 * Форматирует лист "Аналитика" для удобного просмотра:
 * - колонка A (ts): преобразует ISO-строку в дату и форматирует как "ДД.ММ.ГГГГ ЧЧ:ММ"
 * - чередование цвета строк (полосы)
 * - фиксация заголовка
 * - ширина колонок
 * Запустить: Расширения → Apps Script → formatAnalyticsSheet → Выполнить.
 */
function formatAnalyticsSheet() {
  var sheet = getOrCreateSheet('Аналитика');
  if (sheet.getLastRow() < 2) return;
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 12);

  // Преобразуем ts (колонка A) в дату и форматируем
  var rangeA = sheet.getRange(2, 1, lastRow, 1);
  var values = rangeA.getValues();
  for (var i = 0; i < values.length; i++) {
    var s = String(values[i][0] || '').trim();
    if (s) {
      try {
        var d = new Date(s);
        if (!isNaN(d.getTime())) values[i][0] = d;
      } catch (e) {}
    }
  }
  rangeA.setValues(values);
  rangeA.setNumberFormat('dd.mm.yyyy HH:mm');

  // Чередование цвета строк (светло-серый)
  for (var r = 2; r <= lastRow; r++) {
    if ((r - 1) % 2 === 0) {
      sheet.getRange(r, 1, r, lastCol).setBackground('#f8f9fa');
    }
  }

  // Заголовок — жирный, серый фон
  sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold').setBackground('#e9ecef');
  sheet.setFrozenRows(1);

  // Ширина колонок
  sheet.setColumnWidth(1, 140);   // ts
  sheet.setColumnWidth(2, 120);   // page
  sheet.setColumnWidth(3, 100);   // event
  sheet.setColumnWidth(4, 120);   // sessionId
  sheet.setColumnWidth(5, 90);    // tgId
  sheet.setColumnWidth(6, 100);   // tgUsername
  sheet.setColumnWidth(7, 150);   // element
  sheet.setColumnWidth(8, 150);   // href
  sheet.setColumnWidth(9, 90);    // durationSec
  sheet.setColumnWidth(10, 150); // title
  sheet.setColumnWidth(11, 90);  // lessonIndex
  sheet.setColumnWidth(12, 80);  // progress
}

/**
 * Создаёт лист "Сводка" с агрегированными данными и графиками.
 * Таблицы: события по типу, просмотры по странице, топ кликов.
 * Запустить: Аналитика → Создать сводку и графики.
 */
function createAnalyticsSummary() {
  var ss = getSpreadsheet();
  var src = ss.getSheetByName('Аналитика');
  if (!src || src.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('Лист "Аналитика" пуст или не найден.');
    return;
  }
  var data = src.getDataRange().getValues();
  var headers = data[0] || [];
  var col = { ts: 0, page: 1, event: 2, sessionId: 3, tgId: 4, tgUsername: 5, element: 6, href: 7, durationSec: 8, title: 9 };
  var eventCount = {};
  var pageCount = {};
  var elementCount = {};
  var sessions = {};
  var totalDuration = 0;
  var durationCount = 0;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var ev = String(row[col.event] || '').trim() || '(пусто)';
    var pg = String(row[col.page] || '').trim() || '(пусто)';
    var el = String(row[col.element] || '').trim() || '(пусто)';
    var sid = String(row[col.sessionId] || '').trim();
    var dur = parseInt(row[col.durationSec], 10);

    eventCount[ev] = (eventCount[ev] || 0) + 1;
    pageCount[pg] = (pageCount[pg] || 0) + 1;
    if (ev === 'click' && el !== '(пусто)') elementCount[el] = (elementCount[el] || 0) + 1;
    if (sid) sessions[sid] = true;
    if (!isNaN(dur) && dur > 0) { totalDuration += dur; durationCount++; }
  }

  var sheet = ss.getSheetByName('Сводка');
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet('Сводка');

  var r = 1;
  sheet.getRange(r, 1).setValue('Сводка аналитики').setFontSize(14).setFontWeight('bold');
  r += 2;

  sheet.getRange(r, 1).setValue('События по типу');
  sheet.getRange(r, 1).setFontWeight('bold');
  r++;
  sheet.getRange(r, 1, r, 2).setValues([['Тип события', 'Кол-во']]);
  sheet.getRange(r, 1, r, 2).setFontWeight('bold').setBackground('#e9ecef');
  r++;
  var eventsSorted = Object.keys(eventCount).sort(function(a, b) { return eventCount[b] - eventCount[a]; });
  for (var k = 0; k < eventsSorted.length; k++) {
    sheet.getRange(r, 1).setValue(eventsSorted[k]);
    sheet.getRange(r, 2).setValue(eventCount[eventsSorted[k]]);
    r++;
  }
  r += 2;

  sheet.getRange(r, 1).setValue('Просмотры по странице');
  sheet.getRange(r, 1).setFontWeight('bold');
  r++;
  sheet.getRange(r, 1, r, 2).setValues([['Страница', 'Кол-во']]);
  sheet.getRange(r, 1, r, 2).setFontWeight('bold').setBackground('#e9ecef');
  r++;
  var pagesSorted = Object.keys(pageCount).sort(function(a, b) { return pageCount[b] - pageCount[a]; });
  for (var k = 0; k < pagesSorted.length; k++) {
    sheet.getRange(r, 1).setValue(pagesSorted[k]);
    sheet.getRange(r, 2).setValue(pageCount[pagesSorted[k]]);
    r++;
  }
  r += 2;

  sheet.getRange(r, 1).setValue('Топ кликов (элемент)');
  sheet.getRange(r, 1).setFontWeight('bold');
  r++;
  sheet.getRange(r, 1, r, 2).setValues([['Элемент', 'Кликов']]);
  sheet.getRange(r, 1, r, 2).setFontWeight('bold').setBackground('#e9ecef');
  r++;
  var elementsSorted = Object.keys(elementCount).sort(function(a, b) { return elementCount[b] - elementCount[a]; });
  for (var k = 0; k < Math.min(15, elementsSorted.length); k++) {
    sheet.getRange(r, 1).setValue(elementsSorted[k]);
    sheet.getRange(r, 2).setValue(elementCount[elementsSorted[k]]);
    r++;
  }
  r += 2;

  sheet.getRange(r, 1).setValue('Общая статистика');
  sheet.getRange(r, 1).setFontWeight('bold');
  r++;
  sheet.getRange(r, 1).setValue('Уникальных сессий:');
  sheet.getRange(r, 2).setValue(Object.keys(sessions).length);
  r++;
  sheet.getRange(r, 1).setValue('Всего событий:');
  sheet.getRange(r, 2).setValue(data.length - 1);
  r++;
  var avgDur = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
  sheet.getRange(r, 1).setValue('Среднее время на странице (сек):');
  sheet.getRange(r, 2).setValue(avgDur);
  r++;

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 80);
  sheet.getRange(1, 1, r - 1, 2).setVerticalAlignment('top');

  // График «События по типу»
  var eventDataStart = 5;
  var eventDataEnd = 4 + eventsSorted.length;
  if (eventDataEnd >= eventDataStart) {
    try {
      var chart = sheet.newChart()
        .asBarChart()
        .addRange(sheet.getRange(eventDataStart, 1, eventDataEnd, 2))
        .setPosition(2, 4, 0, 0)
        .setOption('title', 'События по типу')
        .setOption('legend', { position: 'none' })
        .setOption('hAxis', { title: 'Количество' })
        .build();
      sheet.insertChart(chart);
    } catch (e) {}
  }

  SpreadsheetApp.getUi().alert('Сводка и график созданы. Для дополнительных графиков: выделите данные → Вставка → График.');
}

/**
 * Включает автообновление сводки каждые 15 минут.
 */
function enableAnalyticsAutoRefresh() {
  disableAnalyticsAutoRefresh();
  ScriptApp.newTrigger('createAnalyticsSummary')
    .timeBased()
    .everyMinutes(15)
    .create();
  SpreadsheetApp.getUi().alert('Автообновление включено. Сводка будет пересоздаваться каждые 15 минут.');
}

/**
 * Отключает автообновление сводки.
 */
function disableAnalyticsAutoRefresh() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'createAnalyticsSummary') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  SpreadsheetApp.getUi().alert('Автообновление отключено.');
}

/**
 * Очищает всё форматирование (заливку) в листах Путешествия и Рефералы.
 * Запустить: Apps Script → выбрать clearAllFormatting → Выполнить.
 */
function clearAllFormatting() {
  var ss;
  try {
    ss = getSpreadsheet();
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) return;
  var s1 = ss.getSheetByName('Путешествия');
  var s2 = ss.getSheetByName('Рефералы');
  if (s1) s1.getRange(1, 1, s1.getMaxRows(), s1.getMaxColumns()).clearFormat();
  if (s2) s2.getRange(1, 1, s2.getMaxRows(), s2.getMaxColumns()).clearFormat();
}

/**
 * Очистка листов Путешествия:
 * 1) Удаляет лист "путешествие" (с маленькой буквы), оставляет только "Путешествия"
 * 2) Удаляет третью колонку (C) в листе Путешествия
 * Запустить: Apps Script → выбрать cleanupTravelSheets → Выполнить.
 */
function cleanupTravelSheets() {
  var ss;
  try {
    ss = getSpreadsheet();
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) return;
  var toDelete = ss.getSheetByName('путешествие');
  if (toDelete) {
    ss.deleteSheet(toDelete);
  }
  var travel = ss.getSheetByName('Путешествия');
  if (travel && travel.getLastRow() > 0) {
    var data = travel.getDataRange().getValues();
    if (data[0] && data[0].length >= 3) {
      var trimmed = [];
      for (var i = 0; i < data.length; i++) {
        trimmed.push([data[i][0], data[i][1] || '']);
      }
      travel.clear();
      travel.getRange(1, 1, trimmed.length, 2).setValues(trimmed);
    }
  }
}

/**
 * Удаляет дубликаты: оставляет только первую строку для каждой пары (A, B).
 * Запустить: Apps Script → выбрать removeDuplicateRows → Выполнить.
 */
function removeDuplicateRows() {
  var ss;
  try {
    ss = getSpreadsheet();
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) return;
  var ref = ss.getSheetByName('Рефералы');
  var sub = ss.getSheetByName('Путешествия');
  if (ref) removeDuplicatesInSheet(ref);
  if (sub) removeDuplicatesInSheet(sub);
}

function removeDuplicatesInSheet(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return;
  var data = sheet.getDataRange().getValues();
  var seen = {};
  var unique = [data[0]];
  for (var i = 1; i < data.length; i++) {
    var a = String(data[i][0] || '').trim();
    var b = String(data[i][1] || '').trim();
    var key = a + '|' + b;
    if (seen[key]) continue;
    seen[key] = true;
    unique.push(data[i]);
  }
  if (unique.length === data.length) return;
  sheet.clear();
  if (unique.length > 0) {
    sheet.getRange(1, 1, unique.length, unique[0].length).setValues(unique);
  }
}

/**
 * Удаляет пустые строки — таблица поднимается вверх, без пустых промежутков.
 * Запустить: Apps Script → выбрать removeEmptyRows → Выполнить.
 */
function removeEmptyRows() {
  var ss;
  try {
    ss = getSpreadsheet();
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!ss) return;
  var ref = ss.getSheetByName('Рефералы');
  var sub = ss.getSheetByName('Путешествия');
  if (ref) removeEmptyRowsInSheet(ref);
  if (sub) removeEmptyRowsInSheet(sub);
}

function removeEmptyRowsInSheet(sheet) {
  if (!sheet || sheet.getLastRow() < 1) return;
  var data = sheet.getDataRange().getValues();
  var nonEmpty = [];
  for (var i = 0; i < data.length; i++) {
    var empty = true;
    for (var c = 0; c < data[i].length; c++) {
      if (String(data[i][c] != null ? data[i][c] : '').trim() !== '') {
        empty = false;
        break;
      }
    }
    if (!empty) nonEmpty.push(data[i]);
  }
  if (nonEmpty.length === data.length) return;
  sheet.clear();
  if (nonEmpty.length > 0) {
    sheet.getRange(1, 1, nonEmpty.length, nonEmpty[0].length).setValues(nonEmpty);
  }
}
