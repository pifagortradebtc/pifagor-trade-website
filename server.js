require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

function toAsciiSafe(s) {
  if (typeof s !== 'string') return '';
  return Buffer.from(s, 'utf8')
    .filter(b => b >= 32 && b <= 126)
    .toString('ascii');
}

const BYBIT_API_KEY = toAsciiSafe(process.env.BYBIT_API_KEY || '');
const ADMIN_KEY = (process.env.ADMIN_KEY || '').trim();

const TELEGRAM_SIGNAL_LINK = (process.env.TELEGRAM_SIGNAL_LINK || '').trim();
const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_CHAT_ID || '').trim();
const GOOGLE_SCRIPT_URL = (process.env.GOOGLE_SCRIPT_URL || '').trim();
const GOOGLE_SHEET_URL = (process.env.GOOGLE_SHEET_URL || '').trim();

async function createTelegramInviteLink() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { link: null, error: 'TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы в Render' };
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createChatInviteLink`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        member_limit: 1,
      }),
    });
    const data = await res.json();
    if (!data.ok || !data.result?.invite_link) {
      const err = data.description || 'Неизвестная ошибка Telegram';
      console.error('Telegram createChatInviteLink:', err);
      return { link: null, error: err };
    }
    return { link: data.result.invite_link, error: null };
  } catch (err) {
    return { link: null, error: err.message || 'Ошибка запроса к Telegram' };
  }
}

async function postToGoogleScript(payload) {
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error('GOOGLE_SCRIPT_URL не настроен. Добавьте URL веб-приложения в .env');
  }
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const preview = text.slice(0, 150).replace(/\s+/g, ' ');
    console.error('Google Script raw response:', preview);
    throw new Error('Некорректный ответ от Google. Проверьте URL скрипта и что он развёрнут как веб-приложение.');
  }
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка Google Script');
  }
  return data;
}
const BYBIT_API_SECRET = toAsciiSafe(process.env.BYBIT_API_SECRET || '');
const BYBIT_BASE_URL = process.env.BYBIT_BASE_URL || 'https://api.bybit.com';

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Динамический конфиг API — страницы получают правильный URL бэкенда
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || '').trim();
app.get('/api-config.js', (req, res) => {
  const base = API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const apiBase = base.replace(/\/$/, '') + '/api';
  res.type('application/javascript').send(`window.API_BASE = ${JSON.stringify(apiBase)};`);
});

// Аналитика: приём событий от мини-приложения
const ANALYTICS_FILE = path.join(__dirname, 'analytics.jsonl');

app.post('/api/analytics', (req, res) => {
  res.status(204).end();
  const body = req.body || {};
  const ts = body.ts || new Date().toISOString();
  const page = (body.page || '').toString().slice(0, 200);
  const event = (body.event || '').toString().slice(0, 50);
  const sessionId = (body.sessionId || '').toString().slice(0, 100);
  const tgId = body.tg && body.tg.id ? String(body.tg.id) : '';
  const tgUsername = body.tg && body.tg.username ? String(body.tg.username).slice(0, 100) : '';
  const extra = {};
  ['element', 'href', 'durationSec', 'title', 'lessonIndex', 'progress'].forEach((k) => {
    if (body[k] !== undefined) extra[k] = String(body[k]).slice(0, 500);
  });
  const line = JSON.stringify({
    ts,
    page,
    event,
    sessionId,
    tgId,
    tgUsername,
    ...extra,
  }) + '\n';
  try {
    fs.appendFileSync(ANALYTICS_FILE, line);
  } catch (err) {
    console.error('[analytics] write error:', err.message);
  }
  if (GOOGLE_SCRIPT_URL) {
    postToGoogleScript({
      type: 'analytics',
      ts,
      page,
      event,
      sessionId,
      tgId,
      tgUsername,
      ...extra,
    }).catch((err) => console.error('[analytics] Google:', err.message));
  }
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin-subscribers.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-subscribers.html'));
});

function createBybitSignature(queryString, timestamp) {
  const recvWindow = '5000';
  const signPayload = timestamp + BYBIT_API_KEY + recvWindow + queryString;
  return crypto
    .createHmac('sha256', BYBIT_API_SECRET)
    .update(signPayload)
    .digest('hex');
}

function bybitGet(path, queryParams = {}) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(queryParams).toString();
    const timestamp = Date.now().toString();
    const signature = createBybitSignature(queryString, timestamp);

    const url = new URL(path, BYBIT_BASE_URL);
    url.search = queryString;

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000',
        'X-BAPI-SIGN': signature,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          if (res.statusCode === 403) {
            reject(new Error('Bybit блокирует запросы с этого региона. Используйте VPS в другой стране.'));
          } else if (res.statusCode >= 400) {
            reject(new Error(`Bybit API ошибка ${res.statusCode}. Проверьте API ключ и разрешения.`));
          } else {
            reject(new Error('Неверный ответ от Bybit.'));
          }
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/** Быстрая проверка: один запрос по UID. Если не сработает — fallback на перебор страниц. */
async function bybitAffCustomerInfo(uid) {
  return bybitGet('/v5/user/aff-customer-info', { uid });
}

function bybitAffUserList(queryParams = {}) {
  return bybitGet('/v5/affiliate/aff-user-list', queryParams);
}

const REFERRAL_CACHE_TTL_MS = 4 * 60 * 1000;
let referralCache = new Map();
let referralCacheTime = 0;
let referralCacheLoading = false;

async function loadReferralCache() {
  if (!BYBIT_API_KEY || !BYBIT_API_SECRET) return;
  if (referralCacheLoading) return;
  referralCacheLoading = true;
  const newCache = new Map();
  try {
    let cursor = '';
    do {
      const params = { size: '500' };
      if (cursor) params.cursor = cursor;
      const result = await bybitAffUserList(params);
      if (result.retCode !== 0) break;
      const list = result.result?.list || [];
      for (const u of list) {
        newCache.set(String(u.userId), {
          userId: u.userId,
          registerTime: u.registerTime,
          source: u.source,
          isKyc: u.isKyc,
          tradeVol30Day: u.tradeVol30Day,
          tradeVol365Day: u.tradeVol365Day,
        });
      }
      cursor = result.result?.nextPageCursor || '';
    } while (cursor);
    referralCache = newCache;
    referralCacheTime = Date.now();
  } catch (err) {
    console.error('Referral cache load error:', err.message);
  } finally {
    referralCacheLoading = false;
  }
}

function getFromCache(uid) {
  if (Date.now() - referralCacheTime > REFERRAL_CACHE_TTL_MS) return null;
  return referralCache.get(uid) || null;
}

app.post('/api/check-referral', async (req, res) => {
  const { uid } = req.body || {};

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Укажите UID (номер пользователя Bybit)',
    });
  }

  const trimmedUid = String(uid).trim();
  if (!trimmedUid) {
    return res.status(400).json({
      success: false,
      error: 'UID не может быть пустым',
    });
  }

  if (!BYBIT_API_KEY || !BYBIT_API_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'Скопируйте BYBIT_API_KEY и BYBIT_API_SECRET из Render (Environment) в .env',
    });
  }

  const context = (req.body?.context || 'self');
  const isAdminCheck = context === 'admin';

  try {
    let found = false;
    let userInfo = null;

    const cached = getFromCache(trimmedUid);
    if (cached !== null) {
      found = true;
      userInfo = cached;
    } else if (referralCache.size > 0) {
      userInfo = null;
      found = false;
    } else {
      let cursor = '';
      do {
        const params = { size: '500' };
        if (cursor) params.cursor = cursor;
        const result = await bybitAffUserList(params);
        if (result.retCode !== 0) {
          return res.status(400).json({
            success: false,
            error: result.retMsg || 'Ошибка API Bybit',
          });
        }
        const list = result.result?.list || [];
        for (const u of list) {
          const info = {
            userId: u.userId,
            registerTime: u.registerTime,
            source: u.source,
            isKyc: u.isKyc,
            tradeVol30Day: u.tradeVol30Day,
            tradeVol365Day: u.tradeVol365Day,
          };
          referralCache.set(String(u.userId), info);
          if (String(u.userId) === trimmedUid) {
            found = true;
            userInfo = info;
          }
        }
        if (referralCacheTime === 0) referralCacheTime = Date.now();
        if (found) break;
        cursor = result.result?.nextPageCursor || '';
      } while (cursor);
    }

    if (Date.now() - referralCacheTime > REFERRAL_CACHE_TTL_MS && !referralCacheLoading) {
      loadReferralCache();
    }

    const notReferralMsg = isAdminCheck
      ? 'Нет, этот пользователь не ваш реферал'
      : 'Нет, к сожалению, вы пока не мой реферал. Но это легко исправить.';

    res.json({
      success: true,
      isReferral: found,
      userInfo: found ? userInfo : null,
      message: found ? 'Да, это ваш реферал!' : notReferralMsg,
    });
  } catch (err) {
    console.error('Bybit API error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Ошибка при проверке. Попробуйте позже.',
    });
  }
});

app.post('/api/subscribe', async (req, res) => {
  const email = (req.body?.email || req.body?.Email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Укажите email',
    });
  }

  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Некорректный email',
    });
  }

  try {
    const data = await postToGoogleScript({ email });
    res.json(data);
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Ошибка при подписке. Попробуйте позже.',
    });
  }
});

app.get('/api/subscribers', (req, res) => {
  const key = (req.query.key || '').trim();
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  res.json({
    subscribers: [],
    useGoogleSheet: !!GOOGLE_SCRIPT_URL,
    googleSheetUrl: GOOGLE_SHEET_URL || null,
  });
});

app.post('/api/referral-access', async (req, res) => {
  const body = req.body || {};
  const uid = (body.uid || '').trim();
  const tradingview = (body.tradingview || body.tradingView || body.TradingView || '').trim();
  const telegram = (body.telegram || '').trim();
  const email = (body.email || '').trim().toLowerCase();

  console.log('[referral-access] received:', { uid, tradingview: tradingview || '(empty)', telegram: telegram || '(empty)', email: email ? '***' : '(empty)' });

  if (!uid) {
    return res.status(400).json({ success: false, error: 'UID не указан' });
  }
  if (!tradingview) {
    return res.status(400).json({ success: false, error: 'Укажите никнейм в TradingView' });
  }
  if (!email) {
    return res.status(400).json({ success: false, error: 'Укажите email для рассылки писем инвесторам' });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ success: false, error: 'Некорректный email' });
  }

  try {
    if (!GOOGLE_SCRIPT_URL) {
      return res.status(500).json({
        success: false,
        error: 'GOOGLE_SCRIPT_URL не настроен. Добавьте в .env (или в переменные Render).',
      });
    }
    const payload = { type: 'referral', uid, tradingview, telegram: telegram || '', email };
    console.log('[referral-access] sending to Google:', { uid, tradingview: tradingview || '(empty)', hasEmail: !!email });
    const data = await postToGoogleScript(payload);
    console.log('[referral-access] Google response:', data.success ? 'OK' : data.error);
    let inviteLink = null;
    let telegramError = null;
    const tg = await createTelegramInviteLink();
    if (tg.link) {
      inviteLink = tg.link;
    } else if (tg.error) {
      telegramError = tg.error;
    }
    if (!inviteLink) {
      inviteLink = TELEGRAM_SIGNAL_LINK || null;
    }
    res.json({
      ...data,
      inviteLink,
      telegramError: inviteLink ? null : telegramError,
    });
  } catch (err) {
    console.error('Referral access error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Ошибка при сохранении',
    });
  }
});

app.get('/api/referral-access', (req, res) => {
  const key = (req.query.key || '').trim();
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  res.json({
    list: [],
    useGoogleSheet: !!GOOGLE_SCRIPT_URL,
    googleSheetUrl: GOOGLE_SHEET_URL || null,
  });
});

app.get('/api/referral-profile', async (req, res) => {
  const uid = (req.query.uid || '').trim();
  const telegram = (req.query.telegram || '').trim();
  if (!uid && !telegram) {
    return res.status(400).json({ success: false, error: 'UID или Telegram не указан' });
  }
  try {
    if (!GOOGLE_SCRIPT_URL) {
      return res.status(500).json({ success: false, error: 'GOOGLE_SCRIPT_URL не настроен' });
    }
    const payload = { type: 'referral_profile' };
    if (uid) payload.uid = uid;
    if (telegram) payload.telegram = telegram;
    const data = await postToGoogleScript(payload);
    res.json(data);
  } catch (err) {
    console.error('Referral profile error:', err);
    res.status(500).json({ success: false, error: err.message || 'Ошибка при загрузке' });
  }
});

app.post('/api/referral-update', async (req, res) => {
  const body = req.body || {};
  const uid = (body.uid || '').trim();
  const tradingview = (body.tradingview || body.tradingView || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!uid) {
    return res.status(400).json({ success: false, error: 'UID не указан' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Некорректный email' });
  }
  try {
    if (!GOOGLE_SCRIPT_URL) {
      return res.status(500).json({ success: false, error: 'GOOGLE_SCRIPT_URL не настроен' });
    }
    const payload = { type: 'referral_update', uid };
    if (tradingview) payload.tradingview = tradingview;
    if (email) payload.email = email;
    const data = await postToGoogleScript(payload);
    res.json(data);
  } catch (err) {
    console.error('Referral update error:', err);
    res.status(500).json({ success: false, error: err.message || 'Ошибка при обновлении' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    configured: !!(BYBIT_API_KEY && BYBIT_API_SECRET),
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Сервер: http://localhost:${PORT}`);
    if (!BYBIT_API_KEY || !BYBIT_API_SECRET) {
      console.warn('Задайте BYBIT_API_KEY и BYBIT_API_SECRET в .env');
    } else {
      loadReferralCache();
      setInterval(loadReferralCache, REFERRAL_CACHE_TTL_MS);
    }
  });
}
