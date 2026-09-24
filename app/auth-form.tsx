"use client";

import Link from "next/link";
import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "İşlem başarısız");
      }
      window.location.href = "/panel";
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
            <Link href="/kullanim-sartlari" className="text-[#8e4b56] underline" target="_blank">
              Kullanım Şartları
            </Link>
            ’nı kabul ediyorum;{" "}
            <Link href="/gizlilik" className="text-[#8e4b56] underline" target="_blank">
              KVKK Aydınlatma Metni
            </Link>
            ’ni okudum. (Bu kutu pazarlama izni değildir.)
          </span>
        </label>
      ) : null}
      {error ? <p className="text-sm text-[#8e4b56]">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#8e4b56] px-5 py-3 text-sm tracking-wide text-white uppercase disabled:opacity-50"
      >
        {pending
          ? isRegister
            ? "Kaydediliyor…"
            : "Giriş yapılıyor…"
          : isRegister
            ? "14 gün ücretsiz dene"
            : "Panele gir"}
      </button>
    </form>
  );
}
