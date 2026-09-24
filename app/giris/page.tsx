import Link from "next/link";
import { AuthForm } from "@/app/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">Salon paneli</p>
      <h1 className="mt-3 text-4xl font-semibold">Panele giriş</h1>
      <p className="mt-3 text-[#5a4144]">
        Hizmetlerinizi, saatlerinizi ve bugünkü randevularınızı yönetmek için
        e-posta ve şifrenizle giriş yapın.
      </p>
      <div className="mt-8 rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-6">
        <AuthForm mode="login" />
      </div>
      <p className="mt-4 text-sm text-[#5a4144]">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="text-[#8e4b56] underline">
          Demo hesabı oluşturun
        </Link>
      </p>
    </main>
  );
}
