import { redirect } from "next/navigation";
import { StaffManager } from "@/app/panel/panel-forms";
import { requireSalon } from "@/lib/auth";
import { getAccessState } from "@/lib/subscription";

export default async function StaffPage() {
  const salon = await requireSalon();
  if (!salon) {
    redirect("/giris");
  }
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-semibold">Çalışanlar</h2>
      <p className="text-[#5a4144]">
        Kim hangi gün çalışıyorsa işaretleyin. O gün kimse yoksa asistan
        “bugün kapalıyız” der.
      </p>
      <StaffManager staff={salon.staff} locked={!getAccessState(salon).active} />
    </div>
  );
}
