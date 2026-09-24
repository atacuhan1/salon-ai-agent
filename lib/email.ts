import { Resend } from "resend";
import { HttpError } from "@/lib/api-guard";
import { getEnv, hasEmailSendConfig } from "@/lib/env";
import type { EmailAuthPurpose } from "@/lib/email-code";
import { logger } from "@/lib/logger";

export { hasEmailSendConfig };

function purposeLabel(purpose: EmailAuthPurpose): string {
  return purpose === "register" ? "kayıt" : "giriş";
}

export async function sendVerificationEmail(input: {
  to: string;
  code: string;
  purpose: EmailAuthPurpose;
}): Promise<void> {
  const env = getEnv();
  if (!hasEmailSendConfig()) {
    throw new HttpError(
      503,
      "E-posta doğrulama şu an kapalı. RESEND_API_KEY ve EMAIL_FROM ayarlanmalı.",
    );
  }

  const resend = new Resend(env.RESEND_API_KEY!);
  const label = purposeLabel(input.purpose);
  const subject = `Salon paneli ${label} kodu`;
  const text = [
    `Salon paneli ${label} için doğrulama kodunuz: ${input.code}`,
    "",
    "Kod yaklaşık 10 dakika geçerlidir ve tek kullanımlıktır.",
    "Bu isteği siz yapmadıysanız bu iletiyi yok sayabilirsiniz.",
  ].join("\n");

  const result = await resend.emails.send({
    from: env.EMAIL_FROM!,
    to: input.to,
    subject,
    text,
  });

  if (result.error) {
    logger.error("Resend send failed", {
      message: result.error.message,
      purpose: input.purpose,
    });
    throw new HttpError(
      503,
      "Doğrulama e-postası gönderilemedi. Lütfen biraz sonra tekrar deneyin.",
    );
  }

  logger.info("Verification email sent", {
    purpose: input.purpose,
    hasId: Boolean(result.data?.id),
  });
}
