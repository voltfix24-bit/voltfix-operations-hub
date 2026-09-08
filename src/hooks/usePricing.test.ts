import { describe, it, expect } from "vitest";
import { buildPriceBreakdown, formatPrice, roundMoney, PRICING } from "@/hooks/usePricing";
import { computeSlotPrice } from "@/hooks/useSlotPricing";
import { WEEKDAY_SLOTS, SATURDAY_SLOTS } from "@/types/booking";

// Fixed dates: Monday 2026-09-07, Saturday 2026-09-12
const monday = new Date(2026, 8, 7, 10, 0, 0);
const saturday = new Date(2026, 8, 12, 10, 0, 0);

describe("formatPrice (Dutch formatting)", () => {
  it("formats with euro sign, comma decimal and two decimals", () => {
    expect(formatPrice(123.45)).toBe("€123,45");
    expect(formatPrice(120)).toBe("€120,00");
    expect(formatPrice(0.5)).toBe("€0,50");
  });

  it("uses a dot as thousands separator", () => {
    expect(formatPrice(1234.5)).toBe("€1.234,50");
  });
});

describe("buildPriceBreakdown - planned", () => {
  it("applies -10% planned discount on the service base rate", () => {
    const b = buildPriceBreakdown({ bookingType: "planned", date: monday, timeSlot: "morning", baseRate: 125 });
    const discount = b.lines.find((l) => l.label.includes("-10%"));
    expect(discount).toBeDefined();
    expect(discount!.amount).toBe(-12.5);
    expect(b.subtotal).toBe(112.5);
    expect(b.vat).toBe(roundMoney(112.5 * PRICING.vatRate)); // 23.63
    expect(b.total).toBe(136.13);
  });

  it("falls back to the default base rate when none is given", () => {
    const b = buildPriceBreakdown({ bookingType: "planned", date: monday, timeSlot: "morning" });
    expect(b.lines[0].amount).toBe(PRICING.baseRate);
    expect(b.subtotal).toBe(108);
  });

  it("never mentions '30 minuten'", () => {
    const b = buildPriceBreakdown({ bookingType: "emergency", date: monday, baseRate: 125 });
    const text = JSON.stringify(b);
    expect(text).not.toContain("30 minuten");
  });
});

describe("buildPriceBreakdown - emergency + weekend", () => {
  it("stacks emergency (+50%) and weekend (+35%), rounding each line", () => {
    const b = buildPriceBreakdown({ bookingType: "emergency", date: saturday, timeSlot: "morning", baseRate: 120 });
    const emergency = b.lines.find((l) => l.label.startsWith("Spoedtoeslag"));
    const weekend = b.lines.find((l) => l.label.startsWith("Weekendtoeslag"));
    expect(emergency!.amount).toBe(60);
    expect(weekend!.amount).toBe(63); // (120 + 60) * 0.35
    expect(b.lines.some((l) => l.label.startsWith("Avondtoeslag"))).toBe(false);
    expect(b.subtotal).toBe(243);
    expect(b.vat).toBe(51.03);
    expect(b.total).toBe(294.03);
  });

  it("weekend wins over evening (no double time surcharge)", () => {
    const b = buildPriceBreakdown({ bookingType: "emergency", date: saturday, timeSlot: "evening", baseRate: 120 });
    expect(b.lines.some((l) => l.label.startsWith("Weekendtoeslag"))).toBe(true);
    expect(b.lines.some((l) => l.label.startsWith("Avondtoeslag"))).toBe(false);
  });

  it("applies evening surcharge on weekdays", () => {
    const b = buildPriceBreakdown({ bookingType: "emergency", date: monday, timeSlot: "evening", baseRate: 120 });
    const evening = b.lines.find((l) => l.label.startsWith("Avondtoeslag"));
    expect(evening!.amount).toBe(45); // 180 * 0.25
    expect(b.total).toBe(272.25);
  });
});

describe("computeSlotPrice", () => {
  it("matches buildPriceBreakdown for a planned weekday morning slot", () => {
    const slot = WEEKDAY_SLOTS[0];
    const r = computeSlotPrice("planned", monday, slot, 125);
    expect(r.breakdown.plannedDiscount).toBe(12.5);
    expect(r.priceExclVat).toBe(112.5);
    expect(r.priceInclVat).toBe(136.13);
    expect(r.activeSurcharges).toContain("korting");
  });

  it("emergency on a saturday evening slot gets spoed + weekend badges only", () => {
    const eveningSlot = SATURDAY_SLOTS.find((s) => s.isEvening)!;
    const r = computeSlotPrice("emergency", saturday, eveningSlot, 120);
    expect(r.activeSurcharges).toEqual(["spoed", "weekend"]);
    expect(r.breakdown.eveningSurcharge).toBe(0);
    expect(r.priceInclVat).toBe(294.03);
  });
});
