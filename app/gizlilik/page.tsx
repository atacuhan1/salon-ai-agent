import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/app/components/legal-doc";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Salon AI",
  description:
    "Salon AI kişisel proje demosu için kişisel veri işleme aydınlatma metni (KVKK md. 10).",
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="KVKK Aydınlatma Metni" updated="24 Eylül 2026">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun (“KVKK”) 10.
        maddesi kapsamında sizi bilgilendirmek için hazırlanmıştır. Hukuki
        danışmanlık veya “tam uyumluluk” iddiası değildir.
      </p>
      <p>
        <strong className="font-semibold text-[#3b2a2c]">Salon AI</strong>, Ata
        Cuhan (`atacuhan1`) tarafından geliştirilen kişisel bir demo / portföy
        projesidir. Ücretli bir hizmet, ticari abonelik veya SLA sunulmamaktadır;
        site bir GitHub portföy örneği ve teknik prototiptir.
      </p>

      <LegalSection title="1. Veri sorumlusu">
        <ul className="list-disc space-y-2 pl-5">
          <li>Ad-soyad: Ata Cuhan</li>
          <li>GitHub: atacuhan1</li>
          <li>
            Proje:{" "}
            <a
              href="https://github.com/atacuhan1/salon-ai-agent"
              className="text-[#8e4b56] underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              atacuhan1/salon-ai-agent
            </a>
          </li>
        </ul>
        <p>
          Bu proje bir şirket ürünü değildir; MERSİS, vergi numarası veya ticari
          sicil adresi yayımlanmamıştır çünkü ticari işletme olarak sunulmamaktadır.
          KVKK başvurularını GitHub üzerinden (issue veya profil iletişimi) iletebilirsiniz.
          Bu bireysel proje kimliği, ileride kurulabilecek bir ticari yapı yerine geçmez.
        </p>
      </LegalSection>

      <LegalSection title="2. Roller (hesap sahibi / demo)">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-[#3b2a2c]">Demo hesap verileri</strong>{" "}
            (kayıt, giriş, panel ayarları): demoyu işleten geliştirici genelde bu
            veriler bakımından veri sorumlusudur.
          </li>
          <li>
            <strong className="font-semibold text-[#3b2a2c]">
              Sohbet / randevu için girilen ad-telefon
            </strong>
            : demo senaryosunda bu veriler de aynı geliştirici kontrolündeki ortamda
            işlenebilir. Gerçek bir salona ait müşteri verisi girmeyin; yalnızca test
            / uydurma veriler kullanın.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. İşlenen veriler">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Hesap: salon adı, e-posta, şifre özeti (hash), isteğe bağlı telefon ve
            adres, deneme / erişim durumu alanları (ödeme alınmaz).
          </li>
          <li>
            Panel içerikleri: hizmetler, fiyatlar, çalışan adları, çalışma saatleri,
            isteğe bağlı takvim / WhatsApp eşleme alanları.
          </li>
          <li>
            Etkileşim: sohbet mesajları, randevu için ad ve telefon, tarih / saat /
            hizmet bilgisi.
          </li>
          <li>
            Teknik: oturum çerezi (`salon_session`), güvenlik ve hata logları
            (gizli anahtarlar ve ham webhook gövdeleri loglanmaz).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Amaçlar ve hukuki sebepler">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Demo hesabı oluşturma, kimlik doğrulama ve panel kullanımı — KVKK md.
            5/2 (c) sözleşmenin kurulması/ifası (demo kullanımı); md. 5/2 (f)
            meşru menfaat (güvenlik).
          </li>
          <li>
            Randevu müsaitliği ve kayıt denemesi — demoyu çalıştırmak için.
          </li>
          <li>
            Yapay zekâ asistan yanıtları — aynı amaçlarla; model çıktısı araç
            sonuçlarıyla doğrulanır, fiyat/saat uydurulmaz.
          </li>
        </ul>
        <p>
          Pazarlama, profilleme veya ticari satış için veri işlemi yapılmaz; açık
          rıza bu amaçlarla istenmez.
        </p>
      </LegalSection>

      <LegalSection title="5. Aktarım ve üçüncü taraflar">
        <p>Demonun çalışması için şu kategorilerde aktarım olabilir:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Barındırma / veritabanı (ör. Vercel, Postgres sağlayıcısı)</li>
          <li>Yapay zekâ API sağlayıcısı (ör. OpenAI) — sohbet içeriği işlenebilir</li>
          <li>WhatsApp / Meta — kanal yapılandırıldığında</li>
          <li>Google Calendar — bağlandığında randevu senkronu için</li>
        </ul>
        <p>
          Yurt dışı aktarım söz konusu olabilir. Bu metin “tam uyumluyuz” iddiası
          taşımaz; kişisel bir prototip için dürüst bir bilgilendirmedir.
        </p>
      </LegalSection>

      <LegalSection title="6. Saklama">
        <p>
          Demo verileri, hesabın silinmesine, projenin kapatılmasına veya
          geliştiricinin makul temizlik kararına kadar tutulabilir. Kesin bir
          kurumsal saklama takvimi veya SLA yoktur. Gerçek müşteri verisi
          girmemenizi rica ederiz.
        </p>
      </LegalSection>

      <LegalSection title="7. Haklarınız (KVKK md. 11)">
        <p>
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltme, silme /
          yok etme talebi, aktarım bilgisi, itiraz ve zararın giderilmesini talep
          etme haklarınız vardır. Taleplerinizi GitHub üzerinden
          (`atacuhan1` / proje deposu) iletebilirsiniz. Yanıtlar imkân dahilinde
          verilir; ticari destek taahhüdü yoktur.
        </p>
      </LegalSection>

      <LegalSection title="8. İlgili belgeler">
        <p>
          Ayrıca{" "}
          <Link href="/kullanim-sartlari" className="text-[#8e4b56] underline">
            Kullanım Şartları
          </Link>{" "}
          ve{" "}
          <Link href="/cerez-politikasi" className="text-[#8e4b56] underline">
            Çerez Politikası
          </Link>{" "}
          sayfalarına bakınız.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
