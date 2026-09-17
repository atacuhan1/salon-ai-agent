# Yapılacaklar

Sıra: önce yayın, sonra gerçek randevu kanalı, sonra para.

## Şimdi

- [ ] Vercel’e `main` bağla (Deploy’dan önce env)
- [ ] Vercel Postgres (veya Neon) → `DATABASE_URL`
- [ ] `AUTH_SECRET` + `OPENAI_API_KEY` + `OPENAI_MODEL=gpt-4o-mini` + `SALON_TIMEZONE=Europe/Istanbul`
- [ ] Deploy; `/api/health` içinde `"database": true`
- [ ] `/kayit` ile salon aç, çıkış-giriş, kaydın durduğunu doğrula

## Randevu gerçeğe çıksın

- [ ] Google Calendar’ı **salon bazlı** bağla (bellek randevu restart’ta gider)
- [ ] Meta WhatsApp Cloud API + webhook production URL
- [ ] WhatsApp numarası ↔ salon eşlemesi (tek hat yetmez)
- [ ] Panelde bugünün randevu listesi (saat, hizmet, ad, telefon)

## Para ve kilit

- [ ] iyzico veya Stripe abonelik (simüle düğmesini production’dan çıkar)
- [ ] Deneme bitmeden uyarı; ödenmezse sohbet kapalı kalsın (kilit kodu duruyor)

## Salon sahibinin istediği

- [ ] “Şu ustadan randevu” — personel o gün yoksa slot sunma
- [ ] İptal / erteleme (slot açılsın)
- [ ] Hatırlatma: 1 gün önce ve ~2 saat önce WhatsApp
- [ ] İptal kuralı metni (ör. 2 saat kala iptal yok)

## Ata’nın işletmesi

- [ ] Süper-admin: hangi salon deneme / ödedi / kilitli
- [ ] OpenAI maliyeti ve mesaj sayısı (salon bazlı)
- [ ] Kayıt ve sohbet için rate limit

## Bilerek sonra

- [ ] Supabase sohbet geçmişi (şimdilik bellek)
- [ ] SMS / e-posta (WhatsApp yeter)
- [ ] Mobil uygulama

## Bitti

- [x] Next.js asistan, tarih anlama, ucuz OpenAI
- [x] Salon paneli: hizmet, ücret, çalışan, saat, 14 gün deneme
- [x] Abonelik yoksa müşteri sohbeti kilit
- [x] Postgres (SQLite yok)
- [x] `backup` dalı; kullanılmayan dallar silinir
