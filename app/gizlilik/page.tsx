import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection, Placeholder } from "@/app/components/legal-doc";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Salon AI",
  description:
    "Salon AI kişisel veri işleme aydınlatma metni (6698 sayılı KVKK md. 10).",
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="KVKK Aydınlatma Metni" updated="24 Eylül 2026">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun (“KVKK”) 10.
        maddesi ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve
        Esaslar Hakkında Tebliğ uyarınca ilgili kişileri bilgilendirmek için
        hazırlanmıştır. Bu sayfa hukuki danışmanlık yerine geçmez; ürün aktif
        geliştirme aşamasındadır.
      </p>

      <LegalSection title="1. Veri sorumlusu">
        <p>
          Veri sorumlusu kimliği henüz ticari sicil bilgileriyle tamamlanmamıştır.
          Canlıya çıkmadan önce aşağıdaki alanlar doldurulmalıdır:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Unvan / ad-soyad: <Placeholder>[VERİ SORUMLUSU UNVANI]</Placeholder>
          </li>
          <li>
            Adres: <Placeholder>[AÇIK ADRES]</Placeholder>
          </li>
          <li>
            MERSİS / vergi no: <Placeholder>[MERSİS / VERGİ NO]</Placeholder>
          </li>
          <li>
            KVKK başvuru e-postası:{" "}
            <Placeholder>[KVKK_ILETISIM@ORNEK.COM]</Placeholder>
          </li>
        </ul>
        <p>
          Ürün şu an Ata Cuhan tarafından geliştirilmektedir; bu ifade ticari sicil
          veya vergi kimliği yerine geçmez.
        </p>
      </LegalSection>

      <LegalSection title="2. Roller (salon sahibi / platform)">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-semibold text-[#3b2a2c]">Salon sahibi hesabı</strong>{" "}
            (kayıt, giriş, abonelik, panel ayarları): platform genelde bu veriler
            bakımından veri sorumlusudur.
          </li>
          <li>
            <strong className="font-semibold text-[#3b2a2c]">
              Salon müşterisi verileri
            </strong>{" "}
            (sohbet / WhatsApp / randevu adı-telefonu): ilgili salon genelde veri
            sorumlusudur; platform, hizmeti sunmak için veri işleyen konumunda
            hareket edebilir. Kesin roller sözleşmeye ve fiilî kontrole bağlıdır.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. İşlenen veriler">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Salon hesabı: salon adı, e-posta, şifre özeti (hash), isteğe bağlı telefon
            ve adres, abonelik / deneme durumu.
          </li>
          <li>
            Panel içerikleri: hizmetler, fiyatlar, çalışan adları, çalışma saatleri,
            isteğe bağlı takvim / WhatsApp eşleme alanları.
          </li>
          <li>
            Müşteri etkileşimi: sohbet mesajları, randevu için ad ve telefon, tarih /
            saat / hizmet bilgisi.
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
            Hesap oluşturma, kimlik doğrulama, panel ve abonelik yönetimi — KVKK
            md. 5/2 (c) sözleşmenin kurulması/ifası; md. 5/2 (f) meşru menfaat
            (güvenlik).
          </li>
          <li>
            Randevu müsaitliği ve kayıt — sözleşmenin ifası / salon talimatı
            kapsamında hizmet sunumu.
          </li>
          <li>
            Yapay zekâ asistan yanıtları — aynı amaçlarla; model çıktısı araç
            sonuçlarıyla doğrulanır, fiyat/saat uydurulmaz.
          </li>
          <li>
            Yasal yükümlülükler (ör. faturalama kayıtları eklendiğinde) — md. 5/2
            (ç).
          </li>
        </ul>
        <p>
          Pazarlama veya profilleme için açık rıza istemiyoruz; böyle bir işlem
          başlarsa ayrı bilgilendirme ve (gerekiyorsa) ayrı açık rıza alınır.
        </p>
      </LegalSection>

      <LegalSection title="5. Aktarım ve üçüncü taraflar">
        <p>Hizmetin çalışması için şu kategorilerde aktarım olabilir:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Barındırma / veritabanı (ör. Vercel, Postgres sağlayıcısı)</li>
          <li>Yapay zekâ API sağlayıcısı (ör. OpenAI) — sohbet içeriği işlenebilir</li>
          <li>WhatsApp / Meta — WhatsApp kanalı kullanıldığında</li>
          <li>Google Calendar — salon bağladığında randevu senkronu için</li>
        </ul>
        <p>
          Yurt dışı aktarım söz konusuysa KVKK’nın güncel aktarım kurallarına uyum
          ayrıca değerlendirilmelidir. Bu metin “tam uyumluyuz” iddiası taşımaz.
        </p>
      </LegalSection>

      <LegalSection title="6. Saklama">
        <p>
          Hesap verileri hesap silinene veya hizmet sona erene kadar; randevu ve
          sohbet kayıtları hizmetin sunulması ve uyuşmazlık / güvenlik için gerekli
          süreyle; yasal saklama zorunluluğu doğarsa ilgili süreyle tutulur. Kesin
          saklama takvimi henüz operasyonel olarak sabitlenmemiştir.
        </p>
      </LegalSection>

      <LegalSection title="7. Haklarınız (KVKK md. 11)">
        <p>
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltme, silme /
          yok etme talebi, aktarım bilgisi, itiraz ve zararın giderilmesini talep
          etme haklarınız vardır. Başvurularınızı{" "}
          <Placeholder>[KVKK_ILETISIM@ORNEK.COM]</Placeholder> adresine iletebilirsiniz.
          Yanıtlar kanuni süreler içinde verilir.
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
