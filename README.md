# salon-ai-agent

AI booking assistant for boutique nail and beauty salons — WhatsApp and web chat.

Salon owners manage services, prices, staff, and hours in a panel. When the trial or subscription ends, customer chat locks and the assistant stops taking bookings.

**Status:** in active development — not production-complete.

**Demo:** [https://salon-ai-agent-sens6.vercel.app](https://salon-ai-agent-sens6.vercel.app)

## What works now

- Salon register / login (`/kayit`, `/giris`) with email one-time code + 14-day trial
- Owner panel: services, staff, hours, profile, today’s appointments
- Web chat (`/s/<slug>`, `/demo`) with availability checks and booking
- Subscription lock when access expires (web `402`; WhatsApp lock message)
- WhatsApp webhook verify + signature checks (fail-closed); `phone_number_id` → salon mapping
- Appointments stored in Postgres; optional Google Calendar when credentials + Calendar ID are set
- OpenAI function calling (`gpt-4o-mini`) or a rule-based fallback that uses the same tools

Timezone everywhere: `Europe/Istanbul` (UTC+3).

## Honest gaps

- **Email OTP:** code path uses Resend (`RESEND_API_KEY`, `EMAIL_FROM`). Without those env vars on Vercel, register/login return a clear error and no session is issued
- **WhatsApp end-to-end:** code and production callback URL are ready; real-line testing needs Meta credentials (`WHATSAPP_*`) configured by the owner
- **Payments:** no Stripe/iyzico yet — panel “simulate payment” only in development (or `BILLING_SIMULATION=1`); production returns 403
- Book by specific staff, cancel/reschedule, WhatsApp reminders, and a super-admin view are not built yet

More detail: [TODO.md](TODO.md).

## Stack

Next.js 15 (App Router) · TypeScript · React 19 · OpenAI · Postgres + Prisma · Resend (email OTP) · Google Calendar (optional) · Meta WhatsApp Cloud API · Supabase (optional chat history) · Vercel

## Local setup

```bash
cp .env.example .env.local
npm ci
npm run db:up
npx prisma migrate deploy
npm run dev
```

App: http://localhost:3000 · Register: `/kayit` · Panel: `/panel` · Demo chat: `/demo`

For register/login OTP locally, set `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local`. Without them the API fails closed with a Turkish error (no fake success).

```bash
npm test && npm run lint && npm run build
```

Environment variables are listed in [`.env.example`](.env.example). Do not commit secrets.

### Vercel env for email codes (Ata)

Set on the Vercel project (Production + Preview if you test previews):

| Variable | Notes |
|----------|--------|
| `RESEND_API_KEY` | From [Resend](https://resend.com) → API Keys |
| `EMAIL_FROM` | Verified sender, e.g. `Salon Demo <onboarding@resend.dev>` or your domain |

Also required as before: `DATABASE_URL`, `AUTH_SECRET`, and other app secrets.

## License

Proprietary — All Rights Reserved. See [LICENSE](LICENSE).

Copyright (c) 2026 Ata Cuhan ([atacuhan1](https://github.com/atacuhan1)).
No permission is granted to copy, modify, distribute, or commercialize this software without explicit written permission from the copyright holder.
