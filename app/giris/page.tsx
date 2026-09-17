import Link from "next/link";
import { AuthForm } from "@/app/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">Salon paneli</p>
      <h1 className="mt-3 text-4xl font-semibold">Giriş yapın</h1>
      <p className="mt-3 text-[#5a4144]">
        Aboneliğiniz yoksa müşteri sohbeti ve ayar düzenleme kilitlenir.
      </p>
      <div className="mt-8 rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-6">
        <AuthForm mode="login" />
      </div>
      <p className="mt-4 text-sm text-[#5a4144]">
        Yeni salon mu?{" "}
        <Link href="/kayit" className="text-[#8e4b56] underline">
          14 gün ücretsiz deneyin
        </Link>
      </p>
    </main>
  );
}
