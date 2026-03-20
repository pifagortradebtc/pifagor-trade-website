# Pifagor Trade — Веб-сайт

Веб-версия приложения Pifagor Trade с той же функциональностью: аналитика, индикаторы, торговые сигналы, обучение, реферальная программа.

## Публикация на GitHub

1. Создайте новый репозиторий на GitHub (например, `pifagor-trade-website`)
2. Выполните:

```bash
cd pifagor-trade-website
git remote add origin https://github.com/ВАШ_АККАУНТ/pifagor-trade-website.git
git branch -M main
git push -u origin main
```

## Возможности

- **Индикаторы** — доступ к индикаторам TradingView
- **Торговые сигналы** — канал с реальными сделками
- **Письма инвесторам** — еженедельная рассылка
- **Обучение торговле** — материалы и мини-курс
- **Получить всё** — реферальная программа Bybit
- **Профиль** — данные реферала, Email, TradingView
- **Поддержка** — связь с администратором

## Развёртывание

### Вариант 1: Render (с бэкендом)

1. Создайте сервис на [Render](https://render.com)
2. Подключите этот репозиторий
3. Добавьте переменные окружения (см. `.env.example`)
4. Деплой — `npm install` и `npm start`

### Вариант 2: GitHub Pages (только статика)

Для хостинга на GitHub Pages нужен отдельный бэкенд (например, тот же проект на Render).

1. В `index.html` и других страницах перед `api-config.js` добавьте:
   ```html
   <script>window.API_BASE_OVERRIDE = 'https://ваш-бэкенд.onrender.com/api';</script>
   ```
2. Включите GitHub Pages в настройках репозитория
3. Укажите папку `root` или ветку с файлами

## Локальный запуск

```bash
npm install
npm start
```

Сайт будет доступен на `http://localhost:3000`.

## Telegram

Скрипт `telegram-web-app.js` подключается опционально: в обычном браузере он не используется, в Telegram Mini App — подставляет аватар и данные пользователя.

### Вход через Telegram

Кнопка «Войти» открывает модальное окно с «Войти с помощью Telegram». Для работы нужен бот:
1. Создайте бота через @BotFather
2. В настройках бота укажите домен сайта (Bot Settings → Domain)
3. Добавьте `TELEGRAM_LOGIN_BOT` в .env (имя бота без @)

## Структура

- `index.html` — главная
- `profile.html` — профиль
- `get-free.html` — реферальная форма
- `signals.html`, `indicators.html`, `training.html` и др. — разделы
- `js/analytics.js` — аналитика
- `js/telegram-avatar.js` — аватар (только в Telegram)
- `server.js` — API и статика
