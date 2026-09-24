import { notFound } from "next/navigation";
import { ChatPanel } from "@/app/chat-panel";
import { loadSalonBySlug } from "@/lib/salon-store";

export const dynamic = "force-dynamic";

export default async function TenantChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loaded = await loadSalonBySlug(slug);
  if (!loaded) {
    notFound();
  }

  const locked = !loaded.accessActive;
  const { catalog } = loaded;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:px-8">
      <section className="md:w-5/12">
        <p className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">
          Randevu asistanı
        </p>
        <h1 className="mt-3 text-5xl leading-tight font-semibold md:text-6xl">
          {catalog.name}
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-[#5a4144]">
          {catalog.address || "Adres henüz eklenmedi. Salona telefonla ulaşabilirsiniz."}
        </p>
        {locked ? (
          <p className="mt-6 rounded-2xl bg-[#f6ebe4] p-4 text-[#8e4b56]">
            Bu salon şu an randevu asistanını kullanmıyor. Lütfen salonu arayın
            veya daha sonra tekrar deneyin.
          </p>
        ) : catalog.services.length === 0 ? (
          <p className="mt-8 text-sm text-[#5a4144]">
            Hizmet listesi henüz hazır değil. Sohbetten sormayı deneyebilirsiniz.
          </p>
        ) : (
          <ul className="mt-8 space-y-2 text-sm text-[#5a4144]">
            {catalog.services.map((service) => (
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
        )}
      </section>
      <ChatPanel
        salonName={catalog.name}
        salonSlug={catalog.slug}
        locked={locked}
        lockMessage="Bu salon şu an randevu asistanını kullanmıyor. Lütfen salonu arayın."
        suggestions={
          catalog.services[0]
            ? [
                "Hizmetler ve fiyatlar neler?",
                `Yarın ${catalog.services[0].name} için müsait misiniz?`,
              ]
            : undefined
        }
      />
    </main>
  );
}
