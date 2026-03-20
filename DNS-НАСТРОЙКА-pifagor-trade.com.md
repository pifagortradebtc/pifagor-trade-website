# Настройка DNS для pifagor-trade.com (Render)

## Записи для добавления

Добавьте эти записи в панели управления доменом (у регистратора, где куплен pifagor-trade.com).

---

### Запись 1 — www (поддомен)

| Поле | Значение |
|------|----------|
| **Тип** | CNAME |
| **Имя / Host** | `www` |
| **Значение / Target / Points to** | `pifagor-trade-website.onrender.com` |
| **TTL** | 3600 (или Auto) |

---

### Запись 2 — корень домена (pifagor-trade.com)

**Вариант A** — если провайдер поддерживает CNAME для корня:

| Поле | Значение |
|------|----------|
| **Тип** | CNAME |
| **Имя / Host** | `@` |
| **Значение / Target** | `pifagor-trade-website.onrender.com` |

**Вариант B** — если CNAME для @ недоступен (используйте A-запись):

| Поле | Значение |
|------|----------|
| **Тип** | A |
| **Имя / Host** | `@` (или оставить пустым) |
| **Значение / IP** | `216.24.57.1` |

---

## После добавления записей

1. Подождите 15–30 минут (иногда до 24 часов)
2. В Render → Settings → Custom Domains нажмите **Retry Verification**
3. Добавьте в Environment переменную: `API_PUBLIC_URL=https://pifagor-trade.com`

---

## Где настраивать

- **Reg.ru** → Домены → Управление → DNS-серверы / Зона DNS
- **Namecheap** → Domain List → Manage → Advanced DNS
- **Cloudflare** → DNS → Records
- **GoDaddy** → My Products → DNS
- **Timeweb, Beget** → Панель → Домены → DNS-записи
