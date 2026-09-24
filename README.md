# salon-ai-agent

Butik tırnak / güzellik salonları için WhatsApp ve web üzerinden randevu alan AI asistanı.

Salon sahibi paneldan hizmet, fiyat, personel ve çalışma saatlerini girer. Deneme veya abonelik bitince müşteri sohbeti kilitlenir — asistan kapanır.

**Demo:** [https://salon-ai-agent-sens6.vercel.app](https://salon-ai-agent-sens6.vercel.app)

---

## Problem

Küçük salonlar randevuyu WhatsApp’ta elle yönetiyor. Mesai dışında gelen “yarın manikür var mı?” mesajları kaçıyor; takvim ve sohbet ayrı duruyor. Bu proje, salon sahibi kendi kataloğunu panelden tanımlasın, müşteri de WhatsApp veya web sohbetinden müsaitlik sorup randevu alsın diye yazıldı.

## Mimari

```
WhatsApp Cloud API ──► POST /api/webhook ──┐
                                           ├─► abonelik kontrolü ─► agent
Web /s/<slug> | /demo ─► POST /api/chat ───┘         │
                                                     ├─ checkAvailability
                                                     └─ createAppointment
                                                           │
                                              Postgres (kaynak) ± Google Calendar
```

- **Giriş:** Meta webhook (`phone_number_id` → salon) veya tarayıcı sohbeti.
- **Kapı:** Salon Postgres’ten yüklenir; abonelik / deneme bitmişse web `402`, WhatsApp kilit mesajı.
- **Agent:** OpenAI function calling (`gpt-4o-mini`) veya anahtar yoksa aynı tool’ları kullanan kural tabanlı fallback.
- **Takvim:** Gerçek salon randevuları Postgres’te kalır; Google service account + salon Calendar ID varsa takvime de yazılır.
- **Panel:** Oturum çerezi + CSRF/origin kontrollü `/api/salon/*` ve `/api/auth/*`.
- **Zaman dilimi:** her yerde `Europe/Istanbul` (UTC+3).

## Ne çalışıyor

| Alan | Durum |
| --- | --- |
| Salon kaydı / giriş (`/kayit`, `/giris`) | ✅ 14 gün deneme |
| Panel: hizmet, çalışan, saat, özet | ✅ |
| Bugünün randevu listesi (panel) | ✅ Postgres |
| Web sohbet (`/s/<slug>`, `/demo`) | ✅ |
| Müsaitlik + randevu oluşturma (tool’lar) | ✅ |
| Abonelik kilidi (süresi dolunca sohbet kapalı) | ✅ |
| WhatsApp webhook imza + verify (fail-closed) | ✅ kod hazır |
| `phone_number_id` → salon eşlemesi | ✅ panel alanı |
| Google Calendar (salon bazlı) | ✅ anahtar + Calendar ID varsa |
| OpenAI yoksa fallback agent | ✅ |
| Supabase yoksa bellek içi sohbet geçmişi | ✅ |
| `GET /api/health` | ✅ |

## Bilerek eksik / yol haritası

Dürüstçe henüz yok veya dış bağımlılık bekliyor:

- **WhatsApp E2E:** Meta `WHATSAPP_*` secret’ları + production callback gerekir; kod ve URL hazır, gerçek hat testi Ata’nın Meta env’iyle.
- **Ödeme:** Stripe / iyzico yok. Panelde “ödemeyi simüle et” yalnızca development veya `BILLING_SIMULATION=1`; production’da 403.
- Belirli ustadan randevu (personel müsaitliğiyle slot süzme).
- İptal / erteleme (slot’u geri açma).
- WhatsApp hatırlatma (1 gün / ~2 saat önce).
- Süper-admin paneli, salon bazlı OpenAI maliyet metrikleri.
- Kalıcı sohbet geçmişi için Supabase tablosu (kod yolu var; varsayılan bellek).

Ürün listesi: [TODO.md](TODO.md).

## Tech stack

| Katman | Seçim |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript + React 19 |
| AI | OpenAI SDK (`gpt-4o-mini`, function calling) |
| DB | Postgres + Prisma |
| Takvim | Google Calendar API (service account) |
| Mesajlaşma | Meta WhatsApp Cloud API |
| Opsiyonel geçmiş | Supabase |
| Auth | JWT çerez (`jose`) + `bcryptjs` |
| Deploy | Vercel (`vercel.json` → migrate + build) |

## Hızlı başlangıç

```bash
cp .env.example .env.local
npm ci
npm run db:up
npx prisma migrate deploy
npm run dev
```

- Uygulama: http://localhost:3000
- Salon kaydı: `/kayit` · Panel: `/panel` · Demo sohbet: `/demo`
- Müşteri sohbeti: `/s/<slug>`
- Sağlık: `GET /api/health` (detay için `HEALTH_DETAILS=1`)
- Sabit mesajlı tool testi: `GET /api/test-chat` (yalnızca development)
- WhatsApp verify: `GET /api/webhook?hub.mode=subscribe&hub.verify_token=<WHATSAPP_VERIFY_TOKEN>&hub.challenge=123`

```bash
npm test
npm run lint
npm run build
```

Sırlar koda gömülmez. Yerel Docker Postgres: kullanıcı/şifre `salon` / `salon` (`docker-compose.yml`) — yalnızca geliştirme.

## Ortam değişkenleri

Ayrıntılar: [`.env.example`](.env.example).

| Değişken | Kullanım |
| --- | --- |
| `OPENAI_API_KEY` | Yoksa kural tabanlı fallback |
| `OPENAI_MODEL` | Varsayılan `gpt-4o-mini` |
| `OPENAI_MAX_TOKENS` / `OPENAI_HISTORY_LIMIT` | Cevap tavanı / geçmiş penceresi |
| `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Service account; salon Calendar ID panelden |
| `GOOGLE_CALENDAR_ID` | Yalnızca demo / tek salon fallback |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Yoksa bellek içi geçmiş |
| `WHATSAPP_VERIFY_TOKEN` | GET handshake (≥16 char, production) |
| `WHATSAPP_ACCESS_TOKEN` | Graph API gönderim |
| `WHATSAPP_PHONE_NUMBER_ID` | Gönderim fallback (asıl eşleme panelden) |
| `WHATSAPP_APP_SECRET` | `X-Hub-Signature-256` (yoksa POST reddedilir) |
| `DATABASE_URL` | Postgres (`postgresql://…`) |
| `AUTH_SECRET` | Panel oturumu (production’da güçlü rastgele) |
| `SALON_TIMEZONE` | `Europe/Istanbul` |

`GOOGLE_PRIVATE_KEY` içindeki `\n` escape’leri kodda çözülür. JSON key dosyasını repo’ya koymayın.

## Google Calendar

1. Google Cloud’da Calendar API’yi açın.
2. Service account + key → `GOOGLE_CLIENT_EMAIL` / `GOOGLE_PRIVATE_KEY` (Vercel env).
3. Her salon kendi takvimini service account e-postasına **Make changes to events** ile paylaşır.
4. Panel → Özet → **Google Calendar ID**.
5. Randevular her zaman Postgres’te kalır; Google bağlıysa takvime de yazılır.

## WhatsApp

Production callback:

`https://salon-ai-agent-sens6.vercel.app/api/webhook`

Meta App → WhatsApp → Configuration:

- Callback URL + verify token (`WHATSAPP_VERIFY_TOKEN`)
- `messages` aboneliği
- App Secret → `WHATSAPP_APP_SECRET`
- Access token (+ isteğe bağlı varsayılan phone number ID)

Webhook `metadata.phone_number_id` ile paneldeki `whatsappPhoneNumberId` alanını eşler. Tek env satırı yetmez; her salon kendi Meta `phone_number_id` değerini panele yazar.

## Vercel

1. Neon / Supabase / Vercel Postgres → `DATABASE_URL` (+ gerekirse unpooled migrate URL).
2. `AUTH_SECRET`, isteğe bağlı OpenAI / Google / WhatsApp / Supabase.
3. Deploy. `vercel.json` build’de `prisma migrate deploy` çalıştırır.

Yerel:

```bash
docker compose up -d
npx prisma migrate deploy
```

## Klasörler

```
app/panel/                 # salon sahibi paneli
app/s/[slug]/              # kiracı web sohbeti
app/api/webhook/           # Meta WhatsApp
app/api/chat/              # web agent
lib/calendar.ts            # müsaitlik + Google
lib/openai.ts / agent.ts   # tool calling + fallback
lib/subscription.ts        # deneme / kilit
prompts/salon-rules.ts     # sistem kuralları
prisma/migrations/
```

## Lisans

[MIT](LICENSE) © 2026 Ata Cuhan (atacuhan1)
