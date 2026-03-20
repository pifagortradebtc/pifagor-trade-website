#!/usr/bin/env node
/**
 * Тест сохранения реферала в Google Script.
 * Запуск: node scripts/test-referral-save.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const GOOGLE_SCRIPT_URL = (process.env.GOOGLE_SCRIPT_URL || '').trim();

if (!GOOGLE_SCRIPT_URL) {
  console.error('GOOGLE_SCRIPT_URL не задан в .env');
  process.exit(1);
}

const testData = {
  type: 'referral',
  uid: '12345678',
  tradingview: 'test_user',
  email: 'test@example.com',
};

console.log('Отправка тестового реферала в Google Script...\n');
console.log('Данные:', JSON.stringify(testData, null, 2));

fetch(GOOGLE_SCRIPT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData),
})
  .then(r => {
    console.log('HTTP статус:', r.status);
    return r.text();
  })
  .then(text => {
    console.log('Ответ:', text);
    try {
      const data = JSON.parse(text);
      if (data.success) {
        console.log('\n✓ Успех! Проверьте таблицу — должен появиться лист «Рефералы» с тестовой записью.');
        console.log('  Удалите тестовую строку (uid 12345678) если нужно.');
      } else {
        console.log('\n❌ Ошибка:', data.error);
      }
    } catch (e) {
      console.log('\nОтвет не JSON:', text.slice(0, 200));
    }
  })
  .catch(err => {
    console.error('\n❌ Ошибка запроса:', err.message);
    process.exit(1);
  });
