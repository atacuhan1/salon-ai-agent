import Link from "next/link";
import { AuthForm } from "@/app/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm tracking-[0.28em] uppercase text-[#8e4b56]">Salon paneli</p>
      <h1 className="mt-3 text-4xl font-semibold">Salonunuzu kaydedin</h1>
      <p className="mt-3 text-[#5a4144]">
        Adınızı, iletişim bilgilerinizi ve şifrenizi girin. Sonra hizmet, fiyat,
        çalışan ve saatleri panelden ekleyebilirsiniz. İlk 14 gün ücretsiz.
      </p>
      <div className="mt-8 rounded-3xl border border-[#eadfd6] bg-[#fffaf6] p-6">
        <AuthForm mode="register" />
      </div>
      <p className="mt-4 text-sm text-[#5a4144]">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="text-[#8e4b56] underline">
          Giriş yapın
        </Link>
      </p>
    </main>
  );
}
