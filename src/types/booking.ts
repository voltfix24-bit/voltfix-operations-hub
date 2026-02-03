/**
 * VoltFix Booking Types
 * 
 * Type definitions for time slots, availability, and booking calendar.
 */

export type TimeSlotStatus = "available" | "limited" | "full";

export interface TimeSlotDefinition {
  id: string;
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  isEvening: boolean;
}

export interface DaySlot {
  slot: TimeSlotDefinition;
  status: TimeSlotStatus;
  priceExclVat: number;
  priceInclVat: number;
  badges: SlotBadge[];
}

export type SlotBadge = "avond" | "weekend" | "spoed" | "laatste-plek";

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

// Slot definitions per day type
export const WEEKDAY_SLOTS: TimeSlotDefinition[] = [
  { id: "08-10", startTime: "08:00", endTime: "10:00", isEvening: false },
  { id: "10-12", startTime: "10:00", endTime: "12:00", isEvening: false },
  { id: "12-14", startTime: "12:00", endTime: "14:00", isEvening: false },
  { id: "14-16", startTime: "14:00", endTime: "16:00", isEvening: false },
  { id: "16-18", startTime: "16:00", endTime: "18:00", isEvening: false },
  { id: "18-20", startTime: "18:00", endTime: "20:00", isEvening: true },
  { id: "20-22", startTime: "20:00", endTime: "22:00", isEvening: true },
];

export const SATURDAY_SLOTS: TimeSlotDefinition[] = [
  { id: "09-11", startTime: "09:00", endTime: "11:00", isEvening: false },
  { id: "11-13", startTime: "11:00", endTime: "13:00", isEvening: false },
  { id: "13-15", startTime: "13:00", endTime: "15:00", isEvening: false },
  { id: "15-17", startTime: "15:00", endTime: "17:00", isEvening: false },
  { id: "17-19", startTime: "17:00", endTime: "19:00", isEvening: true },
];

export const SUNDAY_SLOTS: TimeSlotDefinition[] = [
  { id: "10-12", startTime: "10:00", endTime: "12:00", isEvening: false },
  { id: "12-14", startTime: "12:00", endTime: "14:00", isEvening: false },
  { id: "14-16", startTime: "14:00", endTime: "16:00", isEvening: false },
  { id: "16-18", startTime: "16:00", endTime: "18:00", isEvening: false },
];

/**
 * Get time slot definitions for a given day of week
 */
export function getSlotsForDay(dayOfWeek: DayOfWeek): TimeSlotDefinition[] {
  if (dayOfWeek === 0) return SUNDAY_SLOTS;
  if (dayOfWeek === 6) return SATURDAY_SLOTS;
  return WEEKDAY_SLOTS;
}

/**
 * Check if a day is a weekend day
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Convert time slot to general category for pricing
 */
export function getTimeSlotCategory(slot: TimeSlotDefinition): "morning" | "afternoon" | "evening" | "night" {
  const hour = parseInt(slot.startTime.split(":")[0], 10);
  if (hour >= 20) return "night";
  if (hour >= 18) return "evening";
  if (hour >= 12) return "afternoon";
  return "morning";
}
