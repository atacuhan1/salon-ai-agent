"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { weekdayLabels } from "@/prompts/salon-rules";

const fieldClass =
  "mt-1 w-full rounded-2xl border border-[#eadfd6] bg-white px-3 py-2 text-sm";
const buttonClass =
  "rounded-full bg-[#8e4b56] px-4 py-2 text-sm tracking-wide text-white uppercase disabled:opacity-50";

async function submitJson(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "İşlem başarısız");
  }
  return data;
}

export function LogoutButton() {
  return (
    <button
      type="button"
      className="px-4 py-2 text-left text-sm text-[#5a4144]"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Çıkış
    </button>
  );
}

export function SalonProfileForm({
  name,
  phone,
  address,
  whatsappPhoneNumberId,
  googleCalendarId,
  locked,
}: {
  name: string;
  phone: string;
  address: string;
  whatsappPhoneNumberId: string;
  googleCalendarId: string;
  locked: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3 rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setPending(true);
        const form = new FormData(event.currentTarget);
        try {
          await submitJson("/api/salon", "PUT", Object.fromEntries(form.entries()));
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Kaydedilemedi");
        } finally {
          setPending(false);
        }
      }}
    >
      <h2 className="text-xl font-semibold">Salon bilgisi</h2>
      <label className="block text-sm">
        Ad
        <input name="name" defaultValue={name} disabled={locked} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Telefon
        <input name="phone" defaultValue={phone} disabled={locked} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Adres
        <input name="address" defaultValue={address} disabled={locked} className={fieldClass} />
      </label>
      <label className="block text-sm">
        WhatsApp phone_number_id
        <input
          name="whatsappPhoneNumberId"
          defaultValue={whatsappPhoneNumberId}
          disabled={locked}
          placeholder="Meta → WhatsApp → API Setup"
          className={fieldClass}
          inputMode="numeric"
          autoComplete="off"
        />
      </label>
      <p className="text-xs text-[#5a4144]">
        Gelen mesajlar bu Meta <code>phone_number_id</code> ile bu salona yönlendirilir. Her salon
        için ayrı hat bağlayın.
      </p>
      <label className="block text-sm">
        Google Calendar ID
        <input
          name="googleCalendarId"
          defaultValue={googleCalendarId}
          disabled={locked}
          placeholder="xxx@group.calendar.google.com"
          className={fieldClass}
          autoComplete="off"
        />
      </label>
      <p className="text-xs text-[#5a4144]">
        Service account e-postasını bu takvimde &quot;Make changes to events&quot; ile paylaşın.
        Ortak env: <code>GOOGLE_CLIENT_EMAIL</code>, <code>GOOGLE_PRIVATE_KEY</code>.
      </p>
      {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
      <button type="submit" disabled={pending || locked} className={buttonClass}>
        Kaydet
      </button>
    </form>
  );
}

export function ServiceManager({
  services,
  locked,
}: {
  services: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    priceTry: number;
  }>;
  locked: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function run(task: () => Promise<unknown>) {
    setError("");
    try {
      await task();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-5 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          void run(() =>
            submitJson("/api/salon/services", "POST", {
              name: data.get("name"),
              durationMinutes: Number(data.get("durationMinutes")),
              priceTry: Number(data.get("priceTry")),
              keywords: data.get("keywords"),
            }).then(() => form.reset()),
          );
        }}
      >
        <input name="name" required placeholder="Hizmet adı" disabled={locked} className={fieldClass} />
        <input
          name="durationMinutes"
          type="number"
          required
          min={10}
          placeholder="Süre (dk)"
          disabled={locked}
          className={fieldClass}
        />
        <input
          name="priceTry"
          type="number"
          required
          min={0}
          placeholder="Ücret (TL)"
          disabled={locked}
          className={fieldClass}
        />
        <button type="submit" disabled={locked} className={buttonClass}>
          Ekle
        </button>
        <input
          name="keywords"
          placeholder="Ek kelimeler, virgülle"
          disabled={locked}
          className={`${fieldClass} md:col-span-4`}
        />
      </form>
      {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
      <ul className="space-y-3">
        {services.map((service) => (
          <li
            key={service.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadfd6] bg-[#fffaf6] px-4 py-3"
          >
            <span>
              {service.name} · {service.durationMinutes} dk · {service.priceTry} TL
            </span>
            <button
              type="button"
              disabled={locked}
              className="text-sm text-[#8e4b56] underline disabled:opacity-40"
              onClick={() => run(() => submitJson(`/api/salon/services/${service.id}`, "DELETE"))}
            >
              Sil
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StaffManager({
  staff,
  locked,
}: {
  staff: Array<{
    id: string;
    name: string;
    weekdays: string;
    openTime: string;
    closeTime: string;
    active: boolean;
  }>;
  locked: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  async function run(task: () => Promise<unknown>) {
    setError("");
    try {
      await task();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          void run(() =>
            submitJson("/api/salon/staff", "POST", {
              name: data.get("name"),
              weekdays,
              openTime: data.get("openTime"),
              closeTime: data.get("closeTime"),
            }).then(() => form.reset()),
          );
        }}
      >
        <h2 className="text-xl font-semibold">Yeni çalışan</h2>
        <input name="name" required placeholder="İsim" disabled={locked} className={fieldClass} />
        <div className="flex flex-wrap gap-2">
          {weekdayLabels.map((label, weekday) => (
            <label key={label} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                disabled={locked}
                checked={weekdays.includes(weekday)}
                onChange={(event) => {
                  setWeekdays((current) =>
                    event.target.checked
                      ? [...current, weekday]
                      : current.filter((day) => day !== weekday),
                  );
                }}
              />
              {label.slice(0, 3)}
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <input name="openTime" type="time" defaultValue="10:00" disabled={locked} className={fieldClass} />
          <input name="closeTime" type="time" defaultValue="19:00" disabled={locked} className={fieldClass} />
        </div>
        <button type="submit" disabled={locked} className={buttonClass}>
          Çalışan ekle
        </button>
      </form>
      {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
      <ul className="space-y-3">
        {staff.map((member) => {
          const days = JSON.parse(member.weekdays) as number[];
          return (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#eadfd6] bg-[#fffaf6] px-4 py-3"
            >
              <span>
                {member.name} · {days.map((day) => weekdayLabels[day].slice(0, 3)).join(", ")} ·{" "}
                {member.openTime}–{member.closeTime}
              </span>
              <button
                type="button"
                disabled={locked}
                className="text-sm text-[#8e4b56] underline disabled:opacity-40"
                onClick={() => run(() => submitJson(`/api/salon/staff/${member.id}`, "DELETE"))}
              >
                Sil
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HoursForm({
  hours,
  locked,
}: {
  hours: Array<{ weekday: number; openTime: string | null; closeTime: string | null }>;
  locked: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const byDay = new Map(hours.map((row) => [row.weekday, row]));

  return (
    <form
      className="space-y-3 rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        setPending(true);
        const form = new FormData(event.currentTarget);
        const payload = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
          const closed = form.get(`closed-${weekday}`) === "on";
          return {
            weekday,
            closed,
            openTime: String(form.get(`open-${weekday}`) || "10:00"),
            closeTime: String(form.get(`close-${weekday}`) || "19:00"),
          };
        });
        try {
          await submitJson("/api/salon/hours", "PUT", { hours: payload });
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Kaydedilemedi");
        } finally {
          setPending(false);
        }
      }}
    >
      {weekdayLabels.map((label, weekday) => {
        const row = byDay.get(weekday);
        const closed = !row?.openTime;
        return (
          <div key={label} className="grid items-center gap-2 md:grid-cols-[8rem_auto_1fr_1fr]">
            <span>{label}</span>
            <label className="text-sm">
              <input
                type="checkbox"
                name={`closed-${weekday}`}
                defaultChecked={closed}
                disabled={locked}
                className="mr-1"
              />
              Kapalı
            </label>
            <input
              type="time"
              name={`open-${weekday}`}
              defaultValue={row?.openTime ?? "10:00"}
              disabled={locked}
              className={fieldClass}
            />
            <input
              type="time"
              name={`close-${weekday}`}
              defaultValue={row?.closeTime ?? "19:00"}
              disabled={locked}
              className={fieldClass}
            />
          </div>
        );
      })}
      {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
      <button type="submit" disabled={pending || locked} className={buttonClass}>
        Saatleri kaydet
      </button>
    </form>
  );
}

export function BillingActions({ locked }: { locked: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function run(action: "activate" | "cancel") {
    setError("");
    try {
      await submitJson("/api/salon/billing", "POST", { action });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" className={buttonClass} onClick={() => run("activate")}>
        {locked ? "Aboneliği etkinleştir" : "Aboneliği 30 gün uzat"}
      </button>
      {!locked ? (
        <button
          type="button"
          className="ml-3 rounded-full border border-[#eadfd6] px-4 py-2 text-sm"
          onClick={() => run("cancel")}
        >
          Aboneliği iptal et
        </button>
      ) : null}
      {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
      <p className="text-sm text-[#5a4144]">
        Production’da simüle ödeme kapalıdır (gerçek ödeme sağlayıcısı bekleniyor). Geliştirme
        ortamında veya BILLING_SIMULATION=1 ile deneme etkinleştirmesi yapılabilir. İptal
        edilince müşteri sohbeti kapanır.
      </p>
    </div>
  );
}
