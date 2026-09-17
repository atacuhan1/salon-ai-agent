import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSalon } from "@/lib/auth";
import { getAccessState } from "@/lib/subscription";
import { LogoutButton } from "@/app/panel/panel-forms";

export const dynamic = "force-dynamic";

const links = [
  { href: "/panel", label: "Özet" },
  { href: "/panel/hizmetler", label: "Hizmetler" },
  { href: "/panel/calisanlar", label: "Çalışanlar" },
  { href: "/panel/saatler", label: "Saatler" },
  { href: "/panel/abonelik", label: "Abonelik" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const salon = await requireSalon();
  if (!salon) {
    redirect("/giris");
  }
  const access = getAccessState(salon);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:px-8">
      <aside className="md:w-56">
        <p className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">Salon paneli</p>
        <h1 className="mt-2 text-2xl font-semibold">{salon.name}</h1>
        <p className="mt-1 text-sm text-[#5a4144]">
          {access.label}
          {access.active ? ` · ${access.daysLeft} gün` : ""}
        </p>
        <nav className="mt-6 flex flex-col gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-[#eadfd6] bg-[#fffaf6] px-4 py-2"
            >
              {link.label}
            </Link>
          ))}
          <Link href={`/s/${salon.slug}`} className="px-4 py-2 text-[#8e4b56] underline">
            Müşteri sohbeti
          </Link>
          <LogoutButton />
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        {!access.active ? (
          <p className="mb-4 rounded-2xl bg-[#f6ebe4] p-4 text-[#8e4b56]">
            Abonelik yok: müşteriler asistanı kullanamaz, ayar değiştirilemez.{" "}
            <Link href="/panel/abonelik" className="underline">
              Ödemeyi tamamlayın
            </Link>
            .
          </p>
        ) : null}
        {children}
      </section>
    </div>
  );
}
