import type { SalonCatalog } from "@/lib/salon-catalog";
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

export function findService(text: string, catalog: Service[] = services): Service | null {
  const lower = text.toLocaleLowerCase("tr-TR");
  const ranked = catalog
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

function servicesBlurb(catalog: Service[]): string {
  return catalog
    .map(
      (service) =>
        `- ${service.name}: ${service.durationMinutes} dk, ${service.priceTry} TL`,
    )
    .join("\n");
}

function hoursBlurb(hours: WorkingHours): string {
  const compact = [1, 2, 3, 4, 5, 6, 0]
    .map((weekday) => {
      const slot = hours[weekday];
      const label = weekdayLabels[weekday].slice(0, 3);
      return slot ? `${label} ${slot.open}–${slot.close}` : `${label} kapalı`;
    })
    .join(", ");
  return compact;
}

export function buildSystemPrompt(today: string, catalog?: SalonCatalog): string {
  const name = catalog?.name ?? SALON_NAME;
  const address = catalog?.address || SALON_ADDRESS;
  const list = catalog?.services?.length ? catalog.services : services;
  const hours = catalog?.workingHours ?? workingHours;
  const staff =
    catalog?.staff?.filter((member) => member.active).map((member) => member.name).join(", ") ||
    "";
  const staffLine = staff ? `Çalışanlar: ${staff}.` : "";
  return `WhatsApp randevu asistanı, ${name}, ${address}. TZ=Europe/Istanbul. Bugün ${today}.
Hizmetler:
${servicesBlurb(list)}
Saatler: ${hoursBlurb(hours)}.
${staffLine}
Sadece fiyat, müsaitlik, randevu. Tıp/işlem tavsiyesi yok. Fiyat uydurma.
Gün/saat sorulunca checkAvailability çağır, saat uydurma. Geçmiş günü reddet.
Randevu=createAppointment (ad, tel, hizmet, YYYY-MM-DDTHH:mm). Eksik bilgi sor.
2–4 kısa Türkçe cümle.`;
}
