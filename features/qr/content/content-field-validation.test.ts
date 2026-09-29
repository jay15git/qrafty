import { describe, expect, it } from "vitest";

import {
  isPositiveAmount,
  isValidEmail,
  isValidPhone,
  isValidUrl,
} from "@/features/qr/content/content-field-validation";

describe("content field validation helpers", () => {
  it("accepts URL stubs and normalized URLs", () => {
    expect(isValidUrl("https://")).toBe(true);
    expect(isValidUrl("https://instagram.com/")).toBe(true);
    expect(isValidUrl("instagram.com/qrafty")).toBe(true);
    expect(isValidUrl("skype:")).toBe(true);
  });

  it("rejects malformed or bare-word URLs", () => {
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("://bad")).toBe(false);
    expect(isValidUrl("asdf")).toBe(false);
    expect(isValidUrl("hello world")).toBe(false);
  });

  it("validates email and phone formats", () => {
    expect(isValidEmail("hello@example.com")).toBe(true);
    expect(isValidEmail("bad-email")).toBe(false);
    expect(isValidPhone("+1 (555) 010-2000")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
  });

  it("validates positive amounts", () => {
    expect(isPositiveAmount("199.00")).toBe(true);
    expect(isPositiveAmount("0")).toBe(false);
    expect(isPositiveAmount("-1")).toBe(false);
  });
});
