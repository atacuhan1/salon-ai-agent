import { redirect } from "next/navigation";
import { ServiceManager } from "@/app/panel/panel-forms";
import { requireSalon } from "@/lib/auth";
import { getAccessState } from "@/lib/subscription";

export default async function ServicesPage() {
  const salon = await requireSalon();
  if (!salon) {
    redirect("/giris");
  }
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-semibold">Hizmetler ve ücretler</h2>
      <p className="text-[#5a4144]">
        Müşteri sorduğunda asistan yalnızca burada yazdığınız hizmet adı, süre
        ve fiyatı söyler.
      </p>
      <ServiceManager services={salon.services} locked={!getAccessState(salon).active} />
    </div>
  );
}
