import Link from "next/link";
import { redirect } from "next/navigation";
import { SalonProfileForm } from "@/app/panel/panel-forms";
import { requireSalon } from "@/lib/auth";
import { listAppointmentsForDay } from "@/lib/calendar";
import { getAccessState } from "@/lib/subscription";
import { formatSalonTime, todayInSalon } from "@/lib/timezone";

export default async function PanelHomePage() {
  const salon = await requireSalon();
  if (!salon) {
    redirect("/giris");
  }
  const access = getAccessState(salon);
  const today = todayInSalon();
  const appointments = await listAppointmentsForDay(salon.id, today);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold">Özet</h2>
      <p className="text-[#5a4144]">
        Müşterilerinizin randevu sayfası:{" "}
        <Link href={`/s/${salon.slug}`} className="text-[#8e4b56] underline">
          {salon.name} sohbeti
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

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Bugünün randevuları</h3>
        <p className="text-sm text-[#5a4144]">{today}</p>
        {appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#eadfd6] bg-[#fffaf6] p-4 text-sm text-[#5a4144]">
            Bugün henüz randevu yok. Müşteriler sohbet sayfanızdan randevu alınca
            burada görünür.
          </p>
        ) : (
          <ul className="divide-y divide-[#eadfd6] overflow-hidden rounded-2xl border border-[#eadfd6] bg-[#fffaf6]">
            {appointments.map((row) => (
              <li
                key={row.id}
                className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[5rem_1fr_1fr_10rem] md:items-center"
              >
                <span className="font-medium tabular-nums">{formatSalonTime(row.startAt)}</span>
                <span>{row.serviceName}</span>
                <span>{row.customerName}</span>
                <span className="text-[#5a4144]">{row.customerPhone}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SalonProfileForm
        name={salon.name}
        phone={salon.phone}
        address={salon.address}
        whatsappPhoneNumberId={salon.whatsappPhoneNumberId ?? ""}
        googleCalendarId={salon.googleCalendarId ?? ""}
        locked={!access.active}
      />
    </div>
  );
}
