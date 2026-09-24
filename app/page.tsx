import Link from "next/link";

const features = [
  {
    title: "Hizmet ve ücret",
    body: "Protez, kalıcı oje, bakımlar… verdiğiniz hizmetleri ve fiyatları panelden yazın. Asistan yalnızca bunları söyler.",
  },
  {
    title: "Çalışan ve günler",
    body: "Kim hangi gün çalışıyor, salon kaça kadar açık? Saatleri ve personeli panelden güncelleyin.",
  },
  {
    title: "Abonelik ile açık kalır",
    body: "14 gün ücretsiz deneyin. Deneme veya abonelik bitince müşteri asistanı kapanır; siz panelden yenilersiniz.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-4 py-10 md:px-8">
      <header className="flex items-center justify-between gap-4">
        <p className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">Salon AI</p>
        <nav className="flex gap-3 text-sm">
          <Link href="/giris" className="rounded-full border border-[#eadfd6] px-4 py-2">
            Giriş
          </Link>
          <Link
            href="/kayit"
            className="rounded-full bg-[#8e4b56] px-4 py-2 text-white"
          >
            14 gün dene
          </Link>
        </nav>
      </header>

      <section className="max-w-3xl">
        <h1 className="text-5xl leading-tight font-semibold md:text-6xl">
          Müşterileriniz sohbetle randevu alsın.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#5a4144]">
          Salon AI, hizmetlerinizi, saatlerinizi ve çalışanlarınızı panelden
          yönetmenizi sağlar. Müşteriler salon sayfanızdaki asistanla fiyat
          sorar ve müsait saat alır.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/kayit"
            className="rounded-full bg-[#8e4b56] px-6 py-3 text-sm tracking-wide text-white uppercase"
          >
            Salonumu kaydet
          </Link>
          <Link
            href="/demo"
            className="rounded-full border border-[#eadfd6] px-6 py-3 text-sm"
          >
            Örnek sohbeti dene
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-6"
          >
            <h2 className="text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-3 leading-relaxed text-[#5a4144]">{feature.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
