"use client";

import Link from "next/link";
import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
}

type VerificationState = {
  challengeId: string;
  maskedEmail: string;
  purpose: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [info, setInfo] = useState("");
  const isRegister = mode === "register";

  async function onSubmitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    if (isRegister) {
      payload.acceptedTerms = form.get("acceptedTerms") === "true";
    } else {
      delete payload.acceptedTerms;
    }
    try {
      const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        needsVerification?: boolean;
        challengeId?: string;
        maskedEmail?: string;
        purpose?: "login" | "register";
      };
      if (!response.ok) {
        throw new Error(data.error || "İşlem başarısız");
      }
      if (
        data.needsVerification &&
        data.challengeId &&
        data.maskedEmail &&
        data.purpose
      ) {
        setVerification({
          challengeId: data.challengeId,
          maskedEmail: data.maskedEmail,
          purpose: data.purpose,
        });
        setInfo(
          `E-postanıza (${data.maskedEmail}) 6 haneli bir kod gönderdik. Kod yaklaşık 10 dakika geçerlidir.`,
        );
        return;
      }
      window.location.href = "/panel";
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setPending(false);
    }
  }

  async function onSubmitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verification) return;
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: verification.challengeId,
          code,
          purpose: verification.purpose,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Doğrulama başarısız");
      }
      window.location.href = "/panel";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Doğrulama başarısız");
    } finally {
      setPending(false);
    }
  }

  if (verification) {
    return (
      <form onSubmit={onSubmitCode} className="space-y-4">
        <p className="text-sm text-[#5a4144]">
          {info ||
            `E-postanıza (${verification.maskedEmail}) gelen 6 haneli kodu girin.`}
        </p>
        <label className="block text-sm">
          Doğrulama kodu
          <input
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            className="mt-1 w-full rounded-2xl border border-[#eadfd6] bg-white px-4 py-3 tracking-[0.35em]"
          />
        </label>
        {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#8e4b56] px-5 py-3 text-sm tracking-wide text-white uppercase disabled:opacity-50"
        >
          {pending ? "Kontrol ediliyor…" : "Kodu doğrula"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setVerification(null);
            setError("");
            setInfo("");
          }}
          className="w-full text-sm text-[#5a4144] underline disabled:opacity-50"
        >
          Geri dön / yeni kod iste
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitCredentials} className="space-y-4">
      {isRegister ? (
        <>
          <label className="block text-sm">
            Salon adı
            <input
              name="name"
              required
              placeholder="Lale Nail Studio"
              className="mt-1 w-full rounded-2xl border border-[#eadfd6] bg-white px-4 py-3"
            />
          </label>
          <label className="block text-sm">
            Telefon
            <input
              name="phone"
              placeholder="0212 555 00 00"
              className="mt-1 w-full rounded-2xl border border-[#eadfd6] bg-white px-4 py-3"
            />
          </label>
          <label className="block text-sm">
            Adres
            <input
              name="address"
              placeholder="Cihangir, İstanbul"
              className="mt-1 w-full rounded-2xl border border-[#eadfd6] bg-white px-4 py-3"
            />
          </label>
        </>
      ) : null}
      <label className="block text-sm">
        E-posta
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-2xl border border-[#eadfd6] bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm">
        Şifre
        <input
          name="password"
          type="password"
          required
          minLength={isRegister ? 8 : 1}
          className="mt-1 w-full rounded-2xl border border-[#eadfd6] bg-white px-4 py-3"
        />
      </label>
      {isRegister ? (
        <label className="flex items-start gap-3 text-sm leading-relaxed text-[#5a4144]">
          <input
            name="acceptedTerms"
            type="checkbox"
            value="true"
            required
            className="mt-1 size-4 shrink-0 accent-[#8e4b56]"
          />
          <span>
            Bu kişisel demo / portföy projesinin{" "}
            <Link href="/kullanim-sartlari" className="text-[#8e4b56] underline" target="_blank">
              Kullanım Şartları
            </Link>
            ’nı kabul ediyorum;{" "}
            <Link href="/gizlilik" className="text-[#8e4b56] underline" target="_blank">
              KVKK Aydınlatma Metni
            </Link>
            ’ni okudum. Ücretli hizmet veya pazarlama izni değildir.
          </span>
        </label>
      ) : null}
      <p className="text-sm text-[#5a4144]">
        Devam etmek için e-postanıza kısa bir doğrulama kodu gönderilir.
      </p>
      {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#8e4b56] px-5 py-3 text-sm tracking-wide text-white uppercase disabled:opacity-50"
      >
        {pending
          ? isRegister
            ? "Kod gönderiliyor…"
            : "Kod gönderiliyor…"
          : isRegister
            ? "Kod gönder ve devam et"
            : "Kod gönder ve giriş yap"}
      </button>
    </form>
  );
}
