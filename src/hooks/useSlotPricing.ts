/**
 * VoltFix Slot Pricing Hook
 *
 * Calculates prices for specific time slots based on:
 * - Booking type (emergency vs planned)
 * - Service-specific base rate
 * - Day of week (weekend surcharge)
 * - Time of day (evening surcharge)
 *
 * Rules:
 * - Planned: -10% on base rate
 * - Emergency: +50% on base rate
 * - Weekend + Evening: weekend wins
 */

import { useMemo } from "react";
import { PRICING, roundMoney } from "@/hooks/usePricing";
import {
  TimeSlotDefinition,
  DaySlot,
  TimeSlotStatus,
  SlotBadge,
  TimeSlotCategory,
  getSlotsForDay,
  getTimeSlotCategory,
  isWeekend as checkIsWeekend,
  DayOfWeek,
} from "@/types/booking";

export type SlotAvailability = Partial<Record<TimeSlotCategory, TimeSlotStatus>>;

export interface SlotPriceResult {
  priceExclVat: number;
  priceInclVat: number;
  breakdown: {
    baseRate: number;
    plannedDiscount: number;
    emergencySurcharge: number;
    eveningSurcharge: number;
    weekendSurcharge: number;
    subtotal: number;
    vat: number;
    total: number;
  };
  activeSurcharges: SlotBadge[];
}

/**
 * Calculate price for a specific time slot
 */
export function computeSlotPrice(
  flowType: "emergency" | "planned",
  date: Date,
  slot: TimeSlotDefinition,
  baseRate: number = PRICING.baseRate
): SlotPriceResult {
  const base = roundMoney(baseRate);
  let runningTotal = base;
  const activeSurcharges: SlotBadge[] = [];

  const isWeekendDay = checkIsWeekend(date);
  const isEveningSlot = slot.isEvening;

  let plannedDiscount = 0;
  let emergencySurcharge = 0;
  let weekendSurcharge = 0;
  let eveningSurcharge = 0;

  // 1. Planned discount or emergency surcharge
  if (flowType === "emergency") {
    emergencySurcharge = roundMoney(base * PRICING.emergencySurchargePct);
    runningTotal = roundMoney(runningTotal + emergencySurcharge);
    activeSurcharges.push("spoed");
  } else {
    plannedDiscount = roundMoney(base * PRICING.plannedDiscountPct);
    runningTotal = roundMoney(runningTotal - plannedDiscount);
    activeSurcharges.push("korting");
  }

  // 2. Time surcharge - only ONE applies, weekend wins
  if (isWeekendDay) {
    weekendSurcharge = roundMoney(runningTotal * PRICING.weekendSurchargePct);
    runningTotal = roundMoney(runningTotal + weekendSurcharge);
    activeSurcharges.push("weekend");
  } else if (isEveningSlot) {
    eveningSurcharge = roundMoney(runningTotal * PRICING.eveningSurchargePct);
    runningTotal = roundMoney(runningTotal + eveningSurcharge);
    activeSurcharges.push("avond");
  }

  const subtotal = roundMoney(runningTotal);
  const vat = roundMoney(subtotal * PRICING.vatRate);
  const total = roundMoney(subtotal + vat);

  return {
    priceExclVat: subtotal,
    priceInclVat: total,
    breakdown: {
      baseRate: base,
      plannedDiscount,
      emergencySurcharge,
      eveningSurcharge,
      weekendSurcharge,
      subtotal,
      vat,
      total,
    },
    activeSurcharges,
  };
}

/**
 * Get all slots for a given date with prices and availability.
 * Availability comes from the backend (per time slot category); defaults to "available".
 */
export function useDaySlots(
  date: Date | undefined,
  flowType: "emergency" | "planned",
  baseRate: number = PRICING.baseRate,
  availability?: SlotAvailability
): DaySlot[] {
  return useMemo(() => {
    if (!date) return [];

    const dayOfWeek = date.getDay() as DayOfWeek;
    const slotDefs = getSlotsForDay(dayOfWeek);

    return slotDefs.map((slot) => {
      const priceResult = computeSlotPrice(flowType, date, slot, baseRate);
      const category = getTimeSlotCategory(slot);
      const status: TimeSlotStatus = availability?.[category] ?? "available";

      const badges: SlotBadge[] = [...priceResult.activeSurcharges];
      if (status === "limited") {
        badges.push("laatste-plek");
      }

      return {
        slot,
        status,
        priceExclVat: priceResult.priceExclVat,
        priceInclVat: priceResult.priceInclVat,
        badges,
      };
    });
  }, [date?.getTime(), flowType, baseRate, availability]);
}

/**
 * Check if there are any available slots
 */
export function hasEmergencySlotsAvailable(slots: DaySlot[]): boolean {
  return slots.some((slot) => slot.status !== "full");
}

/**
 * Format slot time range for display, e.g. "08:00 - 10:00"
 */
export function formatSlotTime(slot: TimeSlotDefinition): string {
  return `${slot.startTime} - ${slot.endTime}`;
}
