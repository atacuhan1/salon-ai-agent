import type { Service, WorkingHours } from "@/lib/types";

export const SALON_NAME = "Bloom Tırnak Atölyesi";

export const SALON_PHONE = "0212 555 01 45";
export const SALON_ADDRESS = "Cihangir, İstanbul";

export const SLOT_STEP_MINUTES = 30;

export const services: Service[] = [
  {
    id: "protez",
    name: "Protez Tırnak",
    durationMinutes: 120,
    priceTry: 1800,
    keywords: ["protez", "protez tırnak", "takma tırnak", "uzatma"],
  },
  {
    id: "kalici-oje",
    name: "Kalıcı Oje",
    durationMinutes: 60,
    priceTry: 750,
    keywords: ["kalıcı oje", "kalici oje", "kalıcı", "oje", "jel oje", "gel"],
  },
  {
    id: "manikur",
    name: "Manikür",
    durationMinutes: 45,
    priceTry: 500,
    keywords: ["manikür", "manikur", "eli", "el bakımı"],
  },
  {
    id: "pedikur",
    name: "Pedikür",
    durationMinutes: 60,
    priceTry: 650,
    keywords: ["pedikür", "pedikur", "ayak"],
  },
  {
    id: "protez-kalici",
    name: "Protez Tırnak + Kalıcı Oje",
    durationMinutes: 150,
    priceTry: 2300,
    keywords: ["protez ve kalıcı", "protez + kalıcı", "ikisi", "combo"],
  },
  {
    id: "nail-art",
    name: "Nail Art",
    durationMinutes: 30,
    priceTry: 350,
    keywords: ["nail art", "süsleme", "desen", "taş"],
  },
];

export const workingHours: WorkingHours = {
  0: null,
  1: { open: "10:00", close: "19:00" },
  2: { open: "10:00", close: "19:00" },
  3: { open: "10:00", close: "19:00" },
  4: { open: "10:00", close: "19:00" },
  5: { open: "10:00", close: "20:00" },
  6: { open: "10:00", close: "18:00" },
};

export const weekdayLabels = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

export function findService(text: string): Service | null {
  const lower = text.toLocaleLowerCase("tr-TR");
  const ranked = services
    .map((service) => {
      const hit = service.keywords
        .filter((keyword) => lower.includes(keyword))
        .sort((a, b) => b.length - a.length)[0];
      return { service, score: hit ? hit.length : 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.service ?? null;
}

function hoursBlurb(): string {
  return weekdayLabels
    .map((label, index) => {
      const hours = workingHours[index];
      if (!hours) {
        return `${label}: Kapalı`;
      }
      return `${label}: ${hours.open}–${hours.close}`;
    })
    .join("\n");
}

function servicesBlurb(): string {
  return services
    .map(
      (service) =>
        `- ${service.name}: ${service.durationMinutes} dk, ${service.priceTry} TL`,
    )
    .join("\n");
}

export const SYSTEM_PROMPT = `Sen ${SALON_NAME} için WhatsApp randevu asistanısın.
Adres: ${SALON_ADDRESS}. Telefon: ${SALON_PHONE}.
Zaman dilimi her zaman Europe/Istanbul (UTC+3). Başka bir saat dilimi kullanma.

Hizmetler:
${servicesBlurb()}

Çalışma saatleri:
${hoursBlurb()}

Görevin yalnızca şunlardır:
1. Hizmet adı, süre ve fiyatı söylemek.
2. checkAvailability aracıyla müsait saatleri kontrol etmek.
3. createAppointment aracıyla randevuyu onaylamak.

Kurallar:
- Tıbbi, dermatolojik veya işlem tavsiyesi verme. "Bu oje cildime uygun mu?", alerji, tırnak hastalığı, hamilelikte işlem gibi soruları nazikçe reddet ve randevu / fiyat / müsaitliğe yönlendir.
- Fiyat uydurma. Yalnızca listedeki fiyatları kullan.
- Müsaitlik için her zaman checkAvailability aracını çağır. Takvimi ezberleme.
- Randevu yazmadan önce müşteri adı, telefon, hizmet ve başlangıç saatini netleştir. Eksikse sor.
- createAppointment için startDateTime değerini Europe/Istanbul saatiyle YYYY-MM-DDTHH:mm formatında gönder.
- Kısa, sıcak ve Türkçe yaz. Abartılı satış yapma.
- Onaydan sonra tarihi, saati, hizmeti ve süreyi tekrar et.
`;
