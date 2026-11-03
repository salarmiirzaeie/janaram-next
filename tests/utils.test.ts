import { describe, it, expect } from "vitest";
import { createSlug } from "@/lib/createSlug";
import { calculateCommission, rialToToman } from "@/lib/financial";

describe("createSlug", () => {
  it("handles Persian titles, ZWNJ and punctuation", () => {
    expect(createSlug("  راهنمای خواب  آرام!  ")).toBe("راهنمای-خواب-آرام");
    expect(createSlug("می‌خواهم")).toBe("می-خواهم");
  });

  it("handles English titles and collapses dashes", () => {
    expect(createSlug("Hello,   World -- 2024")).toBe("hello-world-2024");
  });

  it("trims leading and trailing dashes", () => {
    expect(createSlug("--abc--")).toBe("abc");
  });
});

describe("calculateCommission", () => {
  it("splits an amount by the commission rate", () => {
    expect(calculateCommission(100000, 0.2)).toEqual({
      commission: 20000,
      net: 80000,
      platformShare: 20000,
      doctorShare: 80000,
    });
  });

  it("floors the commission so the shares always add up to the amount", () => {
    const r = calculateCommission(999, 0.15);
    expect(r.commission).toBe(149);
    expect(r.commission + r.net).toBe(999);
  });

  it("clamps the rate to the 0..1 range", () => {
    expect(calculateCommission(1000, -1).commission).toBe(0);
    expect(calculateCommission(1000, 5)).toMatchObject({ commission: 1000, net: 0 });
  });
});

describe("rialToToman", () => {
  it("divides by ten and floors", () => {
    expect(rialToToman(12345)).toBe(1234);
  });
});
