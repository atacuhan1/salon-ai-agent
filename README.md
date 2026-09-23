# salon-ai-agent

WhatsApp üzerinden butik tırnak / güzellik salonları için randevu alan AI asistanı. Salon sahipleri hizmet, fiyat, personel ve çalışma saatlerini panelden girer. Abonelik yoksa asistan kapanır.

- Next.js 15 App Router + TypeScript
- OpenAI `gpt-4o-mini` function calling (`checkAvailability`, `createAppointment`)
- Salon paneli: `/kayit`, `/giris`, `/panel`
- Müşteri sohbeti: `/s/<salon-slug>` (abonelik kilitliyse 402)
- Google Calendar, Supabase, Meta WhatsApp (anahtar yoksa mock)
- Postgres + Prisma (salon kaydı yayında kalır; SQLite yok)

Zaman dilimi her yerde **Europe/Istanbul (UTC+3)**. Yol haritası: [TODO.md](TODO.md).

## Geliştirme

```bash
cp .env.example .env.local
npm ci
npm run db:up
npx prisma migrate deploy
npm run dev
```

- Uygulama: http://localhost:3000
- Salon kaydı: `/kayit` (14 gün deneme)
- Panel: `/panel` (hizmet, çalışan, saat, abonelik)
- Örnek sohbet: `/demo`
- Müşteri sohbeti: `/s/<slug>`
- Sağlık: `GET /api/health` (detay için `HEALTH_DETAILS=1`)
- Sabit mesajlı tool testi: `GET /api/test-chat` (yalnızca development)
- Sohbet: `POST /api/chat` `{ "sessionId": "opsiyonel", "message": "…", "salonSlug": "opsiyonel" }`
- WhatsApp doğrulama: `GET /api/webhook?hub.mode=subscribe&hub.verify_token=<WHATSAPP_VERIFY_TOKEN>&hub.challenge=123`

```bash
npm test
npm run lint
npm run build
```

## Ortam değişkenleri

[`.env.example`](.env.example) dosyasına bakın. Sırlar koda gömülmez.

| Değişken | Kullanım |
| --- | --- |
| `OPENAI_API_KEY` | Yoksa kural tabanlı fallback aynı tool’ları çağırır |
| `OPENAI_MODEL` | Varsayılan `gpt-4o-mini` (en ucuz uygun model) |
| `OPENAI_MAX_TOKENS` | Cevap tavanı, varsayılan `220` |
| `OPENAI_HISTORY_LIMIT` | Modele giden son mesaj sayısı, varsayılan `4` |
| `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Service account; salon calendar ID panelden |
| `GOOGLE_CALENDAR_ID` | Yalnızca demo / tek salon fallback |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Yoksa bellek içi sohbet geçmişi |
| `WHATSAPP_VERIFY_TOKEN` | GET webhook handshake (≥16 char, production) |
| `WHATSAPP_ACCESS_TOKEN` | Graph API gönderim |
| `WHATSAPP_PHONE_NUMBER_ID` | Gönderim fallback (salon eşlemesi panelden) |
| `WHATSAPP_APP_SECRET` | `X-Hub-Signature-256` (yoksa webhook reddedilir) |
| `SALON_TIMEZONE` | `Europe/Istanbul` |
| `DATABASE_URL` | Postgres bağlantısı (`postgresql://...`). SQLite desteklenmez |
| `AUTH_SECRET` | Panel oturum çerezi |

Ödeme henüz Stripe değil; panelde **ödemeyi simüle et** 30 gün açar, **iptal** müşteri sohbetini kilitler.

`GOOGLE_PRIVATE_KEY` değerindeki `\n` karakterleri env içinde escaped olabilir; kod bunları çözer. JSON key dosyasını repo’ya koymayın.

## Google Calendar

1. Google Cloud’da Calendar API’yi açın.
2. Service account oluşturup key alın; `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY` (Vercel env).
3. Her salon kendi takvimini service account e-postasına **Make changes to events** ile paylaşır.
4. Salon paneli → Özet → **Google Calendar ID** alanına takvim ID’sini yazın.
5. Randevular her zaman Postgres’te kalır (panel listesi); Google bağlıysa ayrıca takvime yazılır.

`GOOGLE_CALENDAR_ID` env yalnızca demo / tek-kiracı fallback içindir. Çok salon için panel alanını kullanın.

## Supabase

```sql
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_session_created_idx
  on conversations (session_id, created_at desc);
```

Row Level Security kullanıyorsanız service role backend’den yazar. `session_id` WhatsApp telefon numarasıdır.

## WhatsApp

Production callback URL:

`https://salon-ai-agent-sens6.vercel.app/api/webhook`

Meta App Dashboard → WhatsApp → Configuration:

- Callback URL: yukarıdaki production URL
- Verify token: `WHATSAPP_VERIFY_TOKEN` (güçlü rastgele; production’da zayıf/placeholder reddedilir)
- `messages` alanına abone olun
- App Secret → `WHATSAPP_APP_SECRET` (imzasız POST reddedilir)
- Access token + (isteğe bağlı varsayılan) Phone number ID → `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

**Salon eşlemesi:** webhook `metadata.phone_number_id` okur ve panelde kayıtlı `whatsappPhoneNumberId` ile salonu bulur. Tek env satırı yetmez — her salon kendi Meta `phone_number_id` değerini panele yazar. Eşleşmeyen hatta uyarı mesajı gider.

## Vercel

1. Neon, Supabase veya Vercel Postgres’te bir veritabanı açın.
2. `DATABASE_URL` (gerekirse pooler) ve `AUTH_SECRET` env’lerini ekleyin. Pooler kullanıyorsanız migrate için unpooled URL’yi build’de `DATABASE_URL` yapın veya `prisma migrate deploy`’u doğrudan bağlantı ile çalıştırın.
3. Deploy. `vercel.json` build sırasında `prisma migrate deploy` çalıştırır; tablolar oluşur, salon kayıtları diskte değil Postgres’te kalır.

Yerel Docker:

```bash
docker compose up -d
npx prisma migrate deploy
```

Env’leri Vercel projesine ekleyin. Webhook URL’si production domain olmalıdır. Gereksiz debug log’u yoktur; `LOG_LEVEL=info|warn|error`.

## Klasörler

```
app/panel/
app/s/[slug]/page.tsx
app/api/webhook/route.ts
app/api/chat/route.ts
app/api/test-chat/route.ts
lib/calendar.ts
lib/openai.ts
lib/salon-store.ts
lib/subscription.ts
prompts/salon-rules.ts
prisma/migrations/
```
