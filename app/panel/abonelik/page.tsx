import { redirect } from "next/navigation";
import { BillingActions } from "@/app/panel/panel-forms";
import { requireSalon } from "@/lib/auth";
import { getAccessState } from "@/lib/subscription";

export default async function BillingPage() {
  const salon = await requireSalon();
  if (!salon) {
    redirect("/giris");
  }
  const access = getAccessState(salon);
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-semibold">Abonelik</h2>
      <p className="text-[#5a4144]">
        Durum: <strong>{access.label}</strong>
        {access.endsAt
          ? ` · bitiş ${access.endsAt.toLocaleDateString("tr-TR")}`
          : ""}
      </p>
      <BillingActions locked={!access.active} />
    </div>
  );
}
