import { describe, it, expect } from "vitest";
import { getUnifiedAppRedirectUrl } from "./redirect";

describe("getUnifiedAppRedirectUrl", () => {
  it("preserves hash and strips trailing slash on base", () => {
    expect(getUnifiedAppRedirectUrl("http://localhost:5173/", "#/leads")).toBe(
      "http://localhost:5173#/leads"
    );
  });

  it("defaults to contacts when hash is empty", () => {
    expect(getUnifiedAppRedirectUrl("http://localhost:5173", "")).toBe(
      "http://localhost:5173#/contacts"
    );
    expect(getUnifiedAppRedirectUrl("http://localhost:5173", "#")).toBe(
      "http://localhost:5173#/contacts"
    );
  });
});
