import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection, Placeholder } from "@/app/components/legal-doc";

export const metadata: Metadata = {
  title: "Kullanım Şartları — Salon AI",
  description: "Salon AI hizmet kullanım şartları.",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Kullanım Şartları" updated="24 Eylül 2026">
      <p>
        Bu şartlar, Salon AI web sitesi, salon paneli ve müşteri sohbet / randevu
        asistanı (“Hizmet”) için geçerlidir. Hizmeti kaydolarak veya kullanarak bu
        şartları kabul etmiş sayılırsınız. Metin muhafazakâr ve bilgilendirici
        amaçlıdır; avukat onaylı sözleşme değildir.
      </p>

      <LegalSection title="1. Hizmet sağlayıcı">
        <p>
          Ticari kimlik bilgileri tamamlanana kadar:{" "}
          <Placeholder>[VERİ SORUMLUSU UNVANI]</Placeholder>, adres{" "}
          <Placeholder>[AÇIK ADRES]</Placeholder>, iletişim{" "}
          <Placeholder>[DESTEK@ORNEK.COM]</Placeholder>.
        </p>
        <p>
          Yazılım mülkiyeti Ata Cuhan’a aittir (All Rights Reserved). Depoyu
          görüntülemek kullanım lisansı vermez.
        </p>
      </LegalSection>

      <LegalSection title="2. Hizmetin kapsamı ve geliştirme durumu">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Salon sahipleri hizmet, fiyat, personel ve saatlerini panelden yönetir;
            müşteriler web sohbeti (ve yapılandırıldığında WhatsApp) üzerinden
            randevu talebinde bulunabilir.
          </li>
          <li>
            Ürün aktif geliştirme aşamasındadır. Özellikler değişebilir; kesintisiz
            veya hatasız çalışma garanti edilmez.
          </li>
          <li>
            WhatsApp uçtan uca çalışması Meta hesap / ortam değişkenlerine; takvim
            senkronu Google kimlik bilgilerine bağlıdır. Bunlar yoksa ilgili kanal
            kapalı kalır.
          </li>
          <li>
            Ödeme altyapısı (iyzico / Stripe vb.) henüz üretimde yoktur; paneldeki
            abonelik simülasyonu yalnızca geliştirme / açıkça etkinleştirilmiş ortam
            içindir.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Hesaplar ve sorumluluklar">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Salon hesabı bilgilerinin doğruluğu ve şifrenin gizliliği salon
            sahibine aittir.
          </li>
          <li>
            Panele girilen hizmet / fiyat / saat bilgileri asistanın kaynak
            gerçeğidir; yanlış girişlerden doğan müşteri iletişimi salonun
            sorumluluğundadır.
          </li>
          <li>
            Müşteri kişisel verilerini (ad, telefon, sohbet) işlerken salon sahibi
            kendi KVKK yükümlülüklerini yerine getirmelidir.
          </li>
          <li>
            Hizmeti yasadışı, spam, dolandırıcılık veya başkalarının haklarını ihlal
            eden şekilde kullanmak yasaktır.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Yapay zekâ asistanı">
        <p>
          Asistan büyük dil modeli ve kural tabanlı araçlar kullanır. Yanıtlar hata
          içerebilir. Müsaitlik ve randevu sonucu yalnızca sistem araç çıktısıyla
          doğrulanmalıdır; modelin uydurduğu fiyat veya saat bağlayıcı değildir.
          İnsan denetimi ve salon onayı önerilir.
        </p>
      </LegalSection>

      <LegalSection title="5. Abonelik ve erişim">
        <p>
          Yeni salonlar için 14 günlük deneme sunulabilir. Deneme veya abonelik
          bitince müşteri asistanı kilitlenir. Ücretli abonelik koşulları ödeme
          entegrasyonu eklendiğinde ayrıca açıklanacaktır.
        </p>
      </LegalSection>

      <LegalSection title="6. Fikri mülkiyet">
        <p>
          Arayüz, kod, marka ve metinler izin olmadan kopyalanamaz, tersine
          mühendislik yapılamaz veya yeniden satılamaz.
        </p>
      </LegalSection>

      <LegalSection title="7. Sorumluluğun sınırlanması">
        <p>
          Hizmet “olduğu gibi” sunulur. Dolaylı zarar, kâr kaybı, veri kaybı veya
          iş kesintisinden doğan talepler mümkün olan en geniş ölçüde
          reddedilir; zorunlu tüketici / emredici hukuk hükümleri saklıdır.
        </p>
      </LegalSection>

      <LegalSection title="8. Kişisel veriler">
        <p>
          Kişisel veri işleme hakkında bkz.{" "}
          <Link href="/gizlilik" className="text-[#8e4b56] underline">
            KVKK Aydınlatma Metni
          </Link>{" "}
          ve{" "}
          <Link href="/cerez-politikasi" className="text-[#8e4b56] underline">
            Çerez Politikası
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Değişiklikler ve iletişim">
        <p>
          Şartlar güncellenebilir; önemli değişiklikler sitede yayımlanır. Sorular
          için: <Placeholder>[DESTEK@ORNEK.COM]</Placeholder>.
        </p>
      </LegalSection>

      <LegalSection title="10. Uygulanacak hukuk">
        <p>
          Anlaşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır; yetkili mahkemeler
          (zorunlu tüketici kuralları saklı kalmak kaydıyla){" "}
          <Placeholder>[YETKİLİ MAHKEME / İSTANBUL]</Placeholder> mahkemeleridir.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
