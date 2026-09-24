import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, LegalSection, Placeholder } from "@/app/components/legal-doc";

export const metadata: Metadata = {
  title: "Çerez Politikası — Salon AI",
  description:
    "Salon AI çerez aydınlatması: oturum çerezi ve zorunlu teknik çerezler.",
};

export default function CookiePolicyPage() {
  return (
    <LegalDoc title="Çerez Politikası" updated="24 Eylül 2026">
      <p>
        Bu metin, Kişisel Verileri Koruma Kurumu’nun Çerez Uygulamaları Hakkında
        Rehberi çerçevesinde site ziyaretçilerini bilgilendirir. Aydınlatma,
        çerezlerin rıza gerektirip gerektirmediğinden bağımsız olarak sunulur.
      </p>

      <LegalSection title="1. Veri sorumlusu">
        <p>
          <Placeholder>[VERİ SORUMLUSU UNVANI]</Placeholder> — iletişim:{" "}
          <Placeholder>[KVKK_ILETISIM@ORNEK.COM]</Placeholder>. Ayrıntılar için{" "}
          <Link href="/gizlilik" className="text-[#8e4b56] underline">
            KVKK Aydınlatma Metni
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Kullandığımız çerezler">
        <div className="overflow-x-auto rounded-2xl border border-[#eadfd6] bg-[#fffaf6]">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-[#eadfd6] text-[#3b2a2c]">
              <tr>
                <th className="px-4 py-3 font-semibold">Ad</th>
                <th className="px-4 py-3 font-semibold">Amaç</th>
                <th className="px-4 py-3 font-semibold">Süre</th>
                <th className="px-4 py-3 font-semibold">Tür</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">salon_session</td>
                <td className="px-4 py-3">
                  Salon paneli oturumu (giriş sonrası kimlik doğrulama). HttpOnly;
                  JavaScript okuyamaz.
                </td>
                <td className="px-4 py-3">7 gün</td>
                <td className="px-4 py-3">Birinci taraf, zorunlu</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Reklam, yeniden pazarlama veya isteğe bağlı analitik çerezi şu an
          kullanılmamaktadır. Bunlar eklenirse bu sayfa güncellenir ve gerektiğinde
          açık rıza (opt-in) alınır.
        </p>
      </LegalSection>

      <LegalSection title="3. Hukuki sebep">
        <p>
          `salon_session`, talep ettiğiniz bilgi toplumu hizmetinin (güvenli panel
          girişi) sunulması için kesinlikle gerekli kabul edilir. Bu nedenle çerez
          banner’ı ile ayrı açık rıza istenmez; yine de aydınlatma sunulur (KVKK md.
          5 ve Kurum çerez rehberi).
        </p>
      </LegalSection>

      <LegalSection title="4. Yönetim">
        <p>
          Tarayıcı ayarlarından çerezleri silebilirsiniz; oturum çerezini silmek
          panelden çıkış yaptırır. Çıkış için paneldeki çıkış düğmesini de
          kullanabilirsiniz.
        </p>
      </LegalSection>

      <LegalSection title="5. Haklar">
        <p>
          KVKK md. 11 kapsamındaki haklarınız ve başvuru yolu için{" "}
          <Link href="/gizlilik" className="text-[#8e4b56] underline">
            Aydınlatma Metni
          </Link>
          ’ne bakınız.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
