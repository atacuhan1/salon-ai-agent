import { redirect } from "next/navigation";
import { HoursForm } from "@/app/panel/panel-forms";
import { requireSalon } from "@/lib/auth";
import { getAccessState } from "@/lib/subscription";

export default async function HoursPage() {
  const salon = await requireSalon();
  if (!salon) {
    redirect("/giris");
  }
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-semibold">Çalışma saatleri</h2>
      <p className="text-[#5a4144]">
        Salonun açık olduğu gün ve saatleri seçin. O gün çalışan yoksa asistan
        müsait saat önermez.
      </p>
      <HoursForm hours={salon.hours} locked={!getAccessState(salon).active} />
    </div>
  );
}
