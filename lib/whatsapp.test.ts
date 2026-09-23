import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIncomingWhatsApp, verifyWhatsAppSignature } from "@/lib/whatsapp";

test("verifyWhatsAppSignature fails closed when app secret is missing", () => {
  assert.equal(verifyWhatsAppSignature("{}", null), false);
  assert.equal(verifyWhatsAppSignature("{}", "sha256=deadbeef"), false);
});

test("parses a Cloud API text message", () => {
  const incoming = parseIncomingWhatsApp({
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              messages: [
                {
                  from: "905551234567",
                  id: "wamid.abc",
                  timestamp: "1710000000",
                  type: "text",
                  text: { body: "Yarın protez tırnak" },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  assert.deepEqual(incoming, {
    from: "905551234567",
    messageId: "wamid.abc",
    text: "Yarın protez tırnak",
  });
});

test("ignores status-only payloads", () => {
  const incoming = parseIncomingWhatsApp({
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            field: "messages",
            value: {
              statuses: [{ id: "wamid.abc", status: "delivered" }],
            },
          },
        ],
      },
    ],
  });
  assert.equal(incoming, null);
});
