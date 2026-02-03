/**
 * VoltFix Pricing Engine
 * 
 * Transparante prijslogica met automatische berekening van toeslagen.
 * 
 * BASISTARIEF: €120 excl. BTW (eerste uur)
 * 
 * SPOEDTOESLAG: +50% (wanneer spoed gekozen OF binnen 24u buiten reguliere tijden)
 * AVONDTOESLAG: +25% (18:00 - 22:00)
 * WEEKENDTOESLAG: +35% (zaterdag en zondag)
 * 
 * COMBINATIELOGICA:
 * - Spoed + Avond: ✓ toegestaan (stapelen)
 * - Spoed + Weekend: ✓ toegestaan (stapelen)
 * - Avond + Weekend: ✗ NIET toegestaan (hoogste wint)
 * 
 * REKENVOLGORDE: Basistarief → Spoedtoeslag → Tijdstoeslag → BTW
 */

import { useMemo } from "react";
import { type PriceBreakdown, type PriceLine } from "@/components/booking/PriceBreakdownCard";

// Core pricing constants
export const PRICING = {
  baseRate: 120, // €120 excl. BTW per eerste uur
  vatRate: 0.21, // 21% BTW
  
  // Surcharges
  emergencySurchargePct: 0.50, // +50%
  eveningSurchargePct: 0.25,   // +25%
  weekendSurchargePct: 0.35,   // +35%
  
  // Time windows
  eveningStart: 18, // 18:00
  eveningEnd: 22,   // 22:00
} as const;

export interface PricingInput {
  bookingType: "emergency" | "planned";
  date?: Date;
  timeSlot?: "morning" | "afternoon" | "evening" | "night" | null;
  selectedHour?: number; // Optional specific hour for more precise calculations
}

export interface TimeSurchargeInfo {
  isEvening: boolean;
  isWeekend: boolean;
  applicableSurcharge: "evening" | "weekend" | null;
  surchargePercent: number;
}

/**
 * Determines the applicable time surcharge based on date and time slot
 * Only ONE time surcharge applies - the highest one takes precedence
 */
export function getTimeSurchargeInfo(date?: Date, timeSlot?: string | null): TimeSurchargeInfo {
  const isWeekend = date ? (date.getDay() === 0 || date.getDay() === 6) : false;
  const isEvening = timeSlot === "evening" || timeSlot === "night";
  
  // Weekend surcharge (35%) is higher than evening (25%), so it takes precedence
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
  const lines: PriceLine[] = [];
  let runningTotal = PRICING.baseRate;
  
  // 1. Base rate
  lines.push({
    label: "Basistarief eerste uur",
    amount: PRICING.baseRate,
    hint: "Incl. diagnose, voorrijkosten en eerste werkzaamheden",
  });
  
  // 2. Emergency surcharge (if applicable)
  if (bookingType === "emergency") {
    const emergencySurcharge = PRICING.baseRate * PRICING.emergencySurchargePct;
    lines.push({
      label: "Spoedtoeslag (+50%)",
      amount: emergencySurcharge,
      hint: "Directe inzet binnen 30 minuten",
    });
    runningTotal += emergencySurcharge;
  }
  
  // 3. Time surcharge (highest one only - weekend trumps evening)
  const timeSurchargeInfo = getTimeSurchargeInfo(date, timeSlot);
  
  if (timeSurchargeInfo.applicableSurcharge === "weekend") {
    // Weekend surcharge is calculated on running total (base + emergency if applicable)
    const weekendSurcharge = runningTotal * PRICING.weekendSurchargePct;
    lines.push({
      label: "Weekendtoeslag (+35%)",
      amount: weekendSurcharge,
      hint: "Werkzaamheden op zaterdag of zondag",
    });
    runningTotal += weekendSurcharge;
  } else if (timeSurchargeInfo.applicableSurcharge === "evening") {
    // Evening surcharge is calculated on running total
    const eveningSurcharge = runningTotal * PRICING.eveningSurchargePct;
    lines.push({
      label: "Avondtoeslag (+25%)",
      amount: eveningSurcharge,
      hint: "Werkzaamheden tussen 18:00 en 22:00",
    });
    runningTotal += eveningSurcharge;
  }
  
  // Calculate totals
  const subtotal = Math.round(runningTotal * 100) / 100;
  const vat = Math.round(subtotal * PRICING.vatRate * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;
  
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
  ]);
}

/**
 * Format price in Dutch Euro format
 */
export function formatPrice(amount: number): string {
  return `€${amount.toFixed(2).replace(".", ",")}`;
}

/**
 * Get a human-readable summary of active surcharges
 */
export function getSurchargeSummary(input: PricingInput): string[] {
  const summary: string[] = [];
  
  if (input.bookingType === "emergency") {
    summary.push("Spoedtoeslag (+50%)");
  }
  
  const timeSurchargeInfo = getTimeSurchargeInfo(input.date, input.timeSlot);
  
  if (timeSurchargeInfo.applicableSurcharge === "weekend") {
    summary.push("Weekendtoeslag (+35%)");
  } else if (timeSurchargeInfo.applicableSurcharge === "evening") {
    summary.push("Avondtoeslag (+25%)");
  }
  
  return summary;
}
