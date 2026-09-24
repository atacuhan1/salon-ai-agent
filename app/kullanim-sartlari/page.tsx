import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection } from "@/app/components/legal-doc";

export const metadata: Metadata = {
  title: "Kullanım Şartları — Salon AI",
  description:
    "Salon AI kişisel demo / portföy projesi kullanım şartları.",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Kullanım Şartları" updated="24 Eylül 2026">
      <p>
        Bu şartlar, Salon AI web sitesi, panel ve sohbet / randevu demosu
        (“Demo”) için geçerlidir. Demoyu kaydolarak veya kullanarak bu metni
        okuduğunuzu kabul etmiş sayılırsınız. Metin bilgilendirme amaçlıdır;
        avukat onaylı ticari sözleşme veya SLA değildir.
      </p>
      <p>
        Salon AI ücretli bir ürün veya ticari hizmet olarak sunulmamaktadır.
        Amaç: GitHub portföyünde görünen kişisel bir teknik prototiptir.
      </p>

      <LegalSection title="1. Geliştirici">
        <p>
          Demo, Ata Cuhan (`atacuhan1`) tarafından kişisel proje olarak
          geliştirilir. Yazılım mülkiyeti Ata Cuhan’a aittir (All Rights
          Reserved). Depoyu görüntülemek kullanım lisansı vermez. Şirket unvanı,
          MERSİS veya vergi kimliği yoktur; ticari işletme olarak faaliyet
          iddiası yoktur.
        </p>
      </LegalSection>

      <LegalSection title="2. Kapsam ve durum">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Panelde hizmet, fiyat, personel ve saat tanımlanabilir; web sohbeti
            (ve yapılandırıldığında WhatsApp) üzerinden randevu denemesi
            yapılabilir.
          </li>
          <li>
            Özellikler değişebilir, bozulabilir veya kaldırılabilir. Kesintisiz,
            hatasız veya üretim kalitesinde çalışma garanti edilmez.
          </li>
          <li>
            WhatsApp uçtan uca çalışması Meta hesap / ortam değişkenlerine; takvim
            senkronu Google kimlik bilgilerine bağlıdır. Bunlar yoksa ilgili kanal
            kapalı kalır.
          </li>
          <li>
            Gerçek ödeme altyapısı yoktur. Paneldeki “abonelik / deneme”
            alanları teknik demo davranışıdır; ücret tahsil edilmez, fatura
            kesilmez.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Hesaplar ve sorumluluklar">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Hesap bilgilerinin doğruluğu ve şifrenin gizliliği size aittir.
          </li>
          <li>
            Panele girilen hizmet / fiyat / saat bilgileri asistanın kaynak
            gerçeğidir; yanlış girişlerden doğan sonuçlardan geliştirici sorumlu
            tutulamaz.
          </li>
          <li>
            Gerçek müşteri kişisel verisi girmeyin. Demo için yalnızca test /
            uydurma veriler kullanın.
          </li>
          <li>
            Demoyu yasadışı, spam, dolandırıcılık veya başkalarının haklarını
            ihlal eden şekilde kullanmak yasaktır.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Yapay zekâ asistanı">
        <p>
          Asistan büyük dil modeli ve kural tabanlı araçlar kullanır. Yanıtlar
          hata içerebilir. Müsaitlik ve randevu sonucu yalnızca sistem araç
          çıktısıyla doğrulanmalıdır; modelin uydurduğu fiyat veya saat
          bağlayıcı değildir.
        </p>
      </LegalSection>

      <LegalSection title="5. Erişim (ticari abonelik yok)">
        <p>
          Yeni hesaplarda teknik olarak 14 günlük “deneme” alanı görünebilir;
          bu bir satış teklifi veya ücretli abonelik vaadi değildir. Erişim
          kilitlenebilir veya proje kapatılabilir. Ücretli hizmet, destek
          taahhüdü veya uptime / SLA yoktur.
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
          Demo “olduğu gibi” sunulur. Dolaylı zarar, kâr kaybı, veri kaybı veya
          iş kesintisinden doğan talepler mümkün olan en geniş ölçüde
          reddedilir; emredici hukuk hükümleri saklıdır. Ticari tüketici hizmeti
          olarak pazarlanmamaktadır.
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
          Bu metin güncellenebilir; güncel sürüm sitede yayımlanır. Sorular için
          GitHub:{" "}
          <a
            href="https://github.com/atacuhan1/salon-ai-agent"
            className="text-[#8e4b56] underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            atacuhan1/salon-ai-agent
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Uygulanacak hukuk">
        <p>
          Anlaşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Yetkili merci
          konusunda emredici kurallar saklıdır; bu kişisel proje için ayrı bir
          “yetkili mahkeme” ticari taahhüdü verilmez.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
