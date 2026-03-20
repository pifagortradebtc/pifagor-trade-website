#!/usr/bin/env node
/**
 * Проверка настройки Google Script для рефералов.
 * Запуск: node scripts/check-google-setup.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const GOOGLE_SCRIPT_URL = (process.env.GOOGLE_SCRIPT_URL || '').trim();

console.log('\n=== Проверка настройки Google Script ===\n');

if (!GOOGLE_SCRIPT_URL) {
  console.log('❌ GOOGLE_SCRIPT_URL не задан в .env');
  console.log('\nЧто сделать:');
  console.log('1. Откройте Google Таблицу → Расширения → Apps Script');
  console.log('2. Развернуть → Новое развёртывание → Веб-приложение');
  console.log('3. У кого доступ: Все пользователи → Развернуть');
  console.log('4. Скопируйте URL (заканчивается на /exec)');
  console.log('5. Добавьте в .env: GOOGLE_SCRIPT_URL=ваш_url');
  console.log('6. В Render: Environment → GOOGLE_SCRIPT_URL');
  process.exit(1);
}

if (!GOOGLE_SCRIPT_URL.endsWith('/exec')) {
  console.log('⚠️  URL должен заканчиваться на /exec');
  console.log('   Текущий:', GOOGLE_SCRIPT_URL);
}

console.log('✓ GOOGLE_SCRIPT_URL задан');
console.log('  URL:', GOOGLE_SCRIPT_URL.slice(0, 50) + '...');

console.log('\nТест POST (type: test)...');
fetch(GOOGLE_SCRIPT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'test' }),
})
  .then(r => r.text())
  .then(text => {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log('❌ Скрипт вернул не JSON:', text.slice(0, 100));
      process.exit(1);
    }
    if (data.success) {
      console.log('✓ Google Script принимает POST и отвечает');
    } else {
      console.log('⚠️  Ответ:', data.error || data);
    }
    console.log('\n');
  })
  .catch(err => {
    console.log('❌ Ошибка запроса:', err.message);
    console.log('   Проверьте URL и что развёртывание: "У кого доступ: Все пользователи"');
    process.exit(1);
  });
