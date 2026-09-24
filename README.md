# salon-ai-agent

AI booking assistant for boutique nail and beauty salons — WhatsApp and web chat.

Salon owners manage services, prices, staff, and hours in a panel. When the trial or subscription ends, customer chat locks and the assistant stops taking bookings.

**Status:** in active development — not production-complete.

**Demo:** [https://salon-ai-agent-sens6.vercel.app](https://salon-ai-agent-sens6.vercel.app)

## What works now

- Salon register / login (`/kayit`, `/giris`) with a 14-day trial
- Owner panel: services, staff, hours, profile, today’s appointments
- Web chat (`/s/<slug>`, `/demo`) with availability checks and booking
- Subscription lock when access expires (web `402`; WhatsApp lock message)
- WhatsApp webhook verify + signature checks (fail-closed); `phone_number_id` → salon mapping
- Appointments stored in Postgres; optional Google Calendar when credentials + Calendar ID are set
- OpenAI function calling (`gpt-4o-mini`) or a rule-based fallback that uses the same tools

Timezone everywhere: `Europe/Istanbul` (UTC+3).

## Honest gaps

- **WhatsApp end-to-end:** code and production callback URL are ready; real-line testing needs Meta credentials (`WHATSAPP_*`) configured by the owner
- **Payments:** no Stripe/iyzico yet — panel “simulate payment” only in development (or `BILLING_SIMULATION=1`); production returns 403
- Book by specific staff, cancel/reschedule, WhatsApp reminders, and a super-admin view are not built yet

More detail: [TODO.md](TODO.md).

## Stack

Next.js 15 (App Router) · TypeScript · React 19 · OpenAI · Postgres + Prisma · Google Calendar (optional) · Meta WhatsApp Cloud API · Supabase (optional chat history) · Vercel

## Local setup

```bash
cp .env.example .env.local
npm ci
npm run db:up
npx prisma migrate deploy
npm run dev
```

App: http://localhost:3000 · Register: `/kayit` · Panel: `/panel` · Demo chat: `/demo`

```bash
npm test && npm run lint && npm run build
```

Environment variables are listed in [`.env.example`](.env.example). Do not commit secrets.

## License

Proprietary — All Rights Reserved. See [LICENSE](LICENSE).

Copyright (c) 2026 Ata Cuhan ([atacuhan1](https://github.com/atacuhan1)).
No permission is granted to copy, modify, distribute, or commercialize this software without explicit written permission from the copyright holder.
