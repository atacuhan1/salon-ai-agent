import Link from "next/link";

const links = [
  { href: "/gizlilik", label: "KVKK Aydınlatma" },
  { href: "/kullanim-sartlari", label: "Kullanım Şartları" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#eadfd6] bg-[#fffaf6]/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[#5a4144] md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          Salon AI · kişisel demo / portföy projesi · ticari hizmet değil ·{" "}
          <span className="whitespace-nowrap">© {new Date().getFullYear()} Ata Cuhan</span>
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Yasal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#8e4b56] underline-offset-2 hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
