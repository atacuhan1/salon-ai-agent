import Link from "next/link";
import { redirect } from "next/navigation";
import { SalonProfileForm } from "@/app/panel/panel-forms";
import { requireSalon } from "@/lib/auth";
import { getAccessState } from "@/lib/subscription";

export default async function PanelHomePage() {
  const salon = await requireSalon();
  if (!salon) {
    redirect("/giris");
  }
  const access = getAccessState(salon);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold">Özet</h2>
      <p className="text-[#5a4144]">
        Müşterileriniz bu adresten yazar:{" "}
        <Link href={`/s/${salon.slug}`} className="text-[#8e4b56] underline">
          /s/{salon.slug}
        </Link>
      </p>
      <ul className="grid gap-3 md:grid-cols-3">
        <li className="rounded-2xl border border-[#eadfd6] bg-[#fffaf6] p-4">
          {salon.services.length} hizmet
        </li>
        <li className="rounded-2xl border border-[#eadfd6] bg-[#fffaf6] p-4">
          {salon.staff.length} çalışan
        </li>
        <li className="rounded-2xl border border-[#eadfd6] bg-[#fffaf6] p-4">
          {access.label}
        </li>
      </ul>
      <SalonProfileForm
        name={salon.name}
        phone={salon.phone}
        address={salon.address}
        locked={!access.active}
      />
    </div>
  );
}
