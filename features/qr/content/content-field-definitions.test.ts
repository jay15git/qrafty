import { describe, expect, it } from "vitest";

import { getContentFieldDefinitions } from "@/features/qr/content/content-field-definitions";
import {
  getDefaultStaticQrValues,
  validateStaticQrContent,
} from "@/features/qr/content/static-payload";

const STRUCTURED_TYPES = [
  "link",
  "text",
  "phone",
  "email",
  "sms",
  "wifi",
  "vcard",
  "event",
  "coupon",
  "upi",
  "crypto",
] as const;

describe("content-field-definitions", () => {
  it.each(STRUCTURED_TYPES)("uses labels for every text field in %s", (type) => {
    const values = getDefaultStaticQrValues(type);
    const validation = validateStaticQrContent(type, values);
    const fields = getContentFieldDefinitions(type, values, validation);

    for (const field of fields) {
      if (field.type === "text" || field.type === "textarea") {
        expect(field.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("maps structured essentials to expected labels", () => {
    const values = getDefaultStaticQrValues("link");
    const validation = validateStaticQrContent("link", values);
    const fields = getContentFieldDefinitions("link", values, validation);

    expect(fields).toEqual([
      expect.objectContaining({ id: "url", label: "URL", type: "text", inputKind: "url" }),
    ]);
  });

  it("maps whatsapp chat intent to labeled fields", () => {
    const values = getDefaultStaticQrValues("whatsapp");
    const validation = validateStaticQrContent("whatsapp", values);
    const fields = getContentFieldDefinitions("whatsapp", values, validation);

    expect(fields).toEqual([
      expect.objectContaining({ id: "intent", type: "segmented" }),
      expect.objectContaining({ id: "phone", label: "Phone number" }),
      expect.objectContaining({ id: "message", type: "textarea" }),
    ]);
  });
});
