# salon-ai-agent

WhatsApp üzerinden butik tırnak / güzellik salonları için randevu alan AI asistanı.

- Next.js 15 App Router + TypeScript
- OpenAI `gpt-4o-mini` function calling (`checkAvailability`, `createAppointment`)
- Google Calendar (service account)
- Supabase sohbet geçmişi
- Meta WhatsApp Cloud API webhook
- Anahtar yokken in-memory mock’lar; yerel test sohbeti `/` üzerinden çalışır

Zaman dilimi her yerde **Europe/Istanbul (UTC+3)**.

## Geliştirme

```bash
cp .env.example .env.local
npm ci
npm run dev
```

- Uygulama: http://localhost:3000
- Sağlık: `GET /api/health`
- Sabit mesajlı tool testi: `GET /api/test-chat`
- Sohbet: `POST /api/chat` `{ "sessionId": "90555…", "message": "…" }`
- WhatsApp doğrulama: `GET /api/webhook?hub.mode=subscribe&hub.verify_token=salon-dev-verify&hub.challenge=123`

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
| `GOOGLE_CALENDAR_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Yoksa bellek içi takvim |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Yoksa bellek içi sohbet geçmişi |
| `WHATSAPP_VERIFY_TOKEN` | GET webhook handshake |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Yanıt gönderme |
| `WHATSAPP_APP_SECRET` | `X-Hub-Signature-256` doğrulama |
| `SALON_TIMEZONE` | `Europe/Istanbul` |

`GOOGLE_PRIVATE_KEY` değerindeki `\n` karakterleri env içinde escaped olabilir; kod bunları çözer. JSON key dosyasını repo’ya koymayın.

## Google Calendar

1. Google Cloud’da Calendar API’yi açın.
2. Service account oluşturup key alın.
3. Salon takvimini service account e-postasını **Make changes to events** ile paylaşın.
4. Takvim ID’sini `GOOGLE_CALENDAR_ID` olarak yazın.

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

Meta App Dashboard → WhatsApp → Configuration:

- Callback URL: `https://<domain>/api/webhook`
- Verify token: `WHATSAPP_VERIFY_TOKEN`
- `messages` alanına abone olun

## Vercel

Env’leri Vercel projesine ekleyin. Webhook URL’si production domain olmalıdır. Gereksiz debug log’u yoktur; `LOG_LEVEL=info|warn|error`.

## Klasörler

```
app/api/webhook/route.ts
app/api/chat/route.ts
app/api/test-chat/route.ts
lib/calendar.ts
lib/openai.ts
lib/supabase.ts
lib/whatsapp.ts
prompts/salon-rules.ts
```
