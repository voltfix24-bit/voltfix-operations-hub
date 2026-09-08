/**
 * VoltFix Pricing Engine
 *
 * Transparante prijslogica met automatische berekening van toeslagen.
 *
 * BASISTARIEF: dienstspecifiek, excl. BTW (eerste uur). Standaard €120.
 *
 * GEPLANDE KORTING: -10% op het basistarief (alleen bij geplande afspraken)
 * SPOEDTOESLAG: +50% op het basistarief
 * AVONDTOESLAG: +25% (18:00 - 22:00)
 * WEEKENDTOESLAG: +35% (zaterdag en zondag)
 *
 * COMBINATIELOGICA:
 * - Spoed + Avond: ✓ toegestaan (stapelen)
 * - Spoed + Weekend: ✓ toegestaan (stapelen)
 * - Avond + Weekend: ✗ NIET toegestaan (weekend wint)
 *
 * REKENVOLGORDE: Basistarief → Korting/Spoedtoeslag → Tijdstoeslag → BTW
 * Elke geldlijn wordt afgerond op 2 decimalen.
 */

import { useMemo } from "react";
import { type PriceBreakdown, type PriceLine } from "@/components/booking/PriceBreakdownCard";

// Core pricing constants
export const PRICING = {
  baseRate: 120, // Standaard basistarief excl. BTW per eerste uur
  vatRate: 0.21, // 21% BTW

  // Discounts
  plannedDiscountPct: 0.10, // -10% bij geplande afspraak

  // Surcharges
  emergencySurchargePct: 0.50, // +50%
  eveningSurchargePct: 0.25,   // +25%
  weekendSurchargePct: 0.35,   // +35%

  // Time windows
  eveningStart: 18, // 18:00
  eveningEnd: 22,   // 22:00
} as const;

export type TimeSlotCategory = "morning" | "afternoon" | "evening" | "night";

export interface PricingInput {
  bookingType: "emergency" | "planned";
  date?: Date;
  timeSlot?: TimeSlotCategory | null;
  selectedHour?: number;
  /** Dienstspecifiek basistarief excl. BTW. Default: PRICING.baseRate */
  baseRate?: number;
}

export interface TimeSurchargeInfo {
  isEvening: boolean;
  isWeekend: boolean;
  applicableSurcharge: "evening" | "weekend" | null;
  surchargePercent: number;
}

/** Round to 2 decimals (money) */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Determines the applicable time surcharge based on date and time slot
 * Only ONE time surcharge applies - weekend takes precedence over evening
 */
export function getTimeSurchargeInfo(date?: Date, timeSlot?: string | null): TimeSurchargeInfo {
  const isWeekend = date ? (date.getDay() === 0 || date.getDay() === 6) : false;
  const isEvening = timeSlot === "evening" || timeSlot === "night";

  if (isWeekend) {
    return {
      isEvening,
      isWeekend: true,
      applicableSurcharge: "weekend",
      surchargePercent: PRICING.weekendSurchargePct,
    };
  }

  if (isEvening) {
    return {
      isEvening: true,
      isWeekend: false,
      applicableSurcharge: "evening",
      surchargePercent: PRICING.eveningSurchargePct,
    };
  }

  return {
    isEvening: false,
    isWeekend: false,
    applicableSurcharge: null,
    surchargePercent: 0,
  };
}

/**
 * Builds a complete price breakdown based on booking parameters
 */
export function buildPriceBreakdown(input: PricingInput): PriceBreakdown {
  const { bookingType, date, timeSlot } = input;
  const baseRate = roundMoney(input.baseRate ?? PRICING.baseRate);
  const lines: PriceLine[] = [];
  let runningTotal = baseRate;

  // 1. Base rate
  lines.push({
    label: "Basistarief eerste uur",
    amount: baseRate,
    hint: "Incl. diagnose, voorrijkosten en eerste werkzaamheden",
  });

  // 2. Planned discount OR emergency surcharge
  if (bookingType === "planned") {
    const discount = roundMoney(baseRate * PRICING.plannedDiscountPct);
    lines.push({
      label: "Geplande afspraak (-10%)",
      amount: -discount,
      hint: "Korting omdat we de afspraak vooraf kunnen inplannen",
    });
    runningTotal = roundMoney(runningTotal - discount);
  } else {
    const emergencySurcharge = roundMoney(baseRate * PRICING.emergencySurchargePct);
    lines.push({
      label: "Spoedtoeslag (+50%)",
      amount: emergencySurcharge,
      hint: "Prioriteit voor beoordeling en snelle inzet",
    });
    runningTotal = roundMoney(runningTotal + emergencySurcharge);
  }

  // 3. Time surcharge (weekend trumps evening)
  const timeSurchargeInfo = getTimeSurchargeInfo(date, timeSlot);

  if (timeSurchargeInfo.applicableSurcharge === "weekend") {
    const weekendSurcharge = roundMoney(runningTotal * PRICING.weekendSurchargePct);
    lines.push({
      label: "Weekendtoeslag (+35%)",
      amount: weekendSurcharge,
      hint: "Werkzaamheden op zaterdag of zondag",
    });
    runningTotal = roundMoney(runningTotal + weekendSurcharge);
  } else if (timeSurchargeInfo.applicableSurcharge === "evening") {
    const eveningSurcharge = roundMoney(runningTotal * PRICING.eveningSurchargePct);
    lines.push({
      label: "Avondtoeslag (+25%)",
      amount: eveningSurcharge,
      hint: "Werkzaamheden tussen 18:00 en 22:00",
    });
    runningTotal = roundMoney(runningTotal + eveningSurcharge);
  }

  const subtotal = roundMoney(runningTotal);
  const vat = roundMoney(subtotal * PRICING.vatRate);
  const total = roundMoney(subtotal + vat);

  return { lines, subtotal, vat, total };
}

/**
 * React hook for reactive price calculations
 */
export function usePricing(input: PricingInput): PriceBreakdown {
  return useMemo(() => buildPriceBreakdown(input), [
    input.bookingType,
    input.date?.getTime(),
    input.timeSlot,
    input.selectedHour,
    input.baseRate,
  ]);
}

const nlCurrency = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Shared Dutch price formatter: €123,45
 */
export function formatPrice(amount: number): string {
  // Intl renders "€ 123,45" (with a non-breaking space); normalise to "€123,45"
  return nlCurrency.format(roundMoney(amount)).replace(/\s/g, "");
}

/**
 * Get a human-readable summary of active surcharges/discounts
 */
export function getSurchargeSummary(input: PricingInput): string[] {
  const summary: string[] = [];

  if (input.bookingType === "emergency") {
    summary.push("Spoedtoeslag (+50%)");
  } else {
    summary.push("Geplande afspraak (-10%)");
  }

  const timeSurchargeInfo = getTimeSurchargeInfo(input.date, input.timeSlot);

  if (timeSurchargeInfo.applicableSurcharge === "weekend") {
    summary.push("Weekendtoeslag (+35%)");
  } else if (timeSurchargeInfo.applicableSurcharge === "evening") {
    summary.push("Avondtoeslag (+25%)");
  }

  return summary;
}
