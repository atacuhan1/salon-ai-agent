import Link from "next/link";
import { ChatPanel } from "@/app/chat-panel";
import { SALON_ADDRESS, SALON_NAME, SALON_PHONE, services } from "@/prompts/salon-rules";

export default function DemoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:px-8">
      <section className="md:w-5/12">
        <p className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">
          Örnek salon
        </p>
        <h1 className="mt-3 text-5xl leading-tight font-semibold md:text-6xl">
          {SALON_NAME}
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-[#5a4144]">
          Bu sayfa örnek bir salondur. Sağdaki sohbetle fiyat veya müsaitlik
          sorabilirsiniz. Kendi salonunuz için kayıt olup panelden ayarlarınızı
          girin.
        </p>
        <p className="mt-4 text-sm text-[#5a4144]">
          <Link href="/kayit" className="text-[#8e4b56] underline">
            Salonumu kaydet
          </Link>
        </p>
        <dl className="mt-8 space-y-2 text-[#5a4144]">
          <div>
            <dt className="text-xs tracking-widest uppercase">Adres</dt>
            <dd>{SALON_ADDRESS}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-widest uppercase">Telefon</dt>
            <dd>{SALON_PHONE}</dd>
          </div>
        </dl>
        <ul className="mt-8 space-y-2 text-sm text-[#5a4144]">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex items-baseline justify-between border-b border-[#e4d0c6] py-2"
            >
              <span>{service.name}</span>
              <span>
                {service.durationMinutes} dk · {service.priceTry} TL
              </span>
            </li>
          ))}
        </ul>
      </section>
      <ChatPanel />
    </main>
  );
}
