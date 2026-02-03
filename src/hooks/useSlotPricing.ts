/**
 * VoltFix Slot Pricing Hook
 * 
 * Calculates prices for specific time slots based on:
 * - Booking type (emergency vs planned)
 * - Day of week (weekend surcharge)
 * - Time of day (evening surcharge)
 * 
 * Price stacking rules:
 * - Emergency + one time surcharge: ✓ allowed
 * - Weekend + Evening: ✗ NOT allowed (weekend wins)
 */

import { useMemo } from "react";
import { PRICING } from "@/hooks/usePricing";
import { 
  TimeSlotDefinition, 
  DaySlot, 
  TimeSlotStatus, 
  SlotBadge,
  getSlotsForDay,
  isWeekend as checkIsWeekend,
  DayOfWeek,
} from "@/types/booking";

export interface SlotPriceResult {
  priceExclVat: number;
  priceInclVat: number;
  breakdown: {
    baseRate: number;
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
  let runningTotal = baseRate;
  const activeSurcharges: SlotBadge[] = [];
  
  const isWeekendDay = checkIsWeekend(date);
  const isEveningSlot = slot.isEvening;
  
  // Track individual surcharges
  let emergencySurcharge = 0;
  let weekendSurcharge = 0;
  let eveningSurcharge = 0;

  // 1. Emergency surcharge (can stack with time surcharge)
  if (flowType === "emergency") {
    emergencySurcharge = baseRate * PRICING.emergencySurchargePct;
    runningTotal += emergencySurcharge;
    activeSurcharges.push("spoed");
  }

  // 2. Time surcharge - only ONE applies, highest wins
  // Weekend (35%) trumps Evening (25%)
  if (isWeekendDay) {
    weekendSurcharge = runningTotal * PRICING.weekendSurchargePct;
    runningTotal += weekendSurcharge;
    activeSurcharges.push("weekend");
  } else if (isEveningSlot) {
    eveningSurcharge = runningTotal * PRICING.eveningSurchargePct;
    runningTotal += eveningSurcharge;
    activeSurcharges.push("avond");
  }

  const subtotal = Math.round(runningTotal * 100) / 100;
  const vat = Math.round(subtotal * PRICING.vatRate * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  return {
    priceExclVat: subtotal,
    priceInclVat: total,
    breakdown: {
      baseRate,
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
 * Generate mock availability statuses
 * In production, this would fetch from database
 */
function getMockAvailability(date: Date, slotId: string): TimeSlotStatus {
  // Create deterministic "random" based on date + slot
  const seed = date.getTime() + slotId.charCodeAt(0);
  const rand = (seed % 100);
  
  // 70% available, 20% limited, 10% full
  if (rand < 70) return "available";
  if (rand < 90) return "limited";
  return "full";
}

/**
 * Get all slots for a given date with prices and availability
 */
export function useDaySlots(
  date: Date | undefined,
  flowType: "emergency" | "planned"
): DaySlot[] {
  return useMemo(() => {
    if (!date) return [];

    const dayOfWeek = date.getDay() as DayOfWeek;
    const slotDefs = getSlotsForDay(dayOfWeek);

    return slotDefs.map((slot) => {
      const priceResult = computeSlotPrice(flowType, date, slot);
      const status = getMockAvailability(date, slot.id);
      
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
  }, [date?.getTime(), flowType]);
}

/**
 * Check if there are any available slots within 24 hours
 */
export function hasEmergencySlotsAvailable(slots: DaySlot[]): boolean {
  return slots.some((slot) => slot.status !== "full");
}

/**
 * Format slot time range for display
 */
export function formatSlotTime(slot: TimeSlotDefinition): string {
  return `${slot.startTime} – ${slot.endTime}`;
}
