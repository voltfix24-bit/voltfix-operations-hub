/**
 * TimeSlotCalendar Component
 * 
 * Mobile-first calendar with day selection and time slot cards showing prices.
 * Supports both Emergency and Planned booking flows.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, isSameDay, startOfDay, isAfter, isBefore } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  Phone,
  Info,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DaySlot, 
  TimeSlotDefinition,
  isWeekend,
} from "@/types/booking";
import { 
  useDaySlots, 
  formatSlotTime,
  computeSlotPrice,
} from "@/hooks/useSlotPricing";
import { formatPrice, PRICING } from "@/hooks/usePricing";
import { PriceBreakdownSheet } from "./PriceBreakdownSheet";

interface TimeSlotCalendarProps {
  flowType: "emergency" | "planned";
  selectedDate: Date | undefined;
  selectedSlot: TimeSlotDefinition | null;
  onDateChange: (date: Date) => void;
  onSlotChange: (slot: TimeSlotDefinition, priceInclVat: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Beschikbaar",
  limited: "Laatste plek",
  full: "Vol",
};

const BADGE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  avond: { label: "Avond", variant: "secondary" },
  weekend: { label: "Weekend", variant: "secondary" },
  spoed: { label: "Spoed", variant: "destructive" },
  "laatste-plek": { label: "Laatste plek", variant: "outline" },
};

export function TimeSlotCalendar({
  flowType,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  onContinue,
  onBack,
}: TimeSlotCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [sheetSlot, setSheetSlot] = useState<{ slot: TimeSlotDefinition; date: Date } | null>(null);

  const today = startOfDay(new Date());
  const weekStart = addDays(today, weekOffset * 7);
  
  // Generate 7 days starting from weekStart
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Get slots for selected date
  const daySlots = useDaySlots(selectedDate, flowType);
  
  // Check if any slots available
  const hasAvailableSlots = daySlots.some((s) => s.status !== "full");
  const showNoSlotsWarning = flowType === "emergency" && selectedDate && !hasAvailableSlots;

  const handleDaySelect = useCallback((day: Date) => {
    // Don't allow selecting past days
    if (isBefore(day, today)) return;
    onDateChange(day);
  }, [today, onDateChange]);

  const handleSlotSelect = useCallback((daySlot: DaySlot) => {
    if (daySlot.status === "full") return;
    onSlotChange(daySlot.slot, daySlot.priceInclVat);
  }, [onSlotChange]);

  const handleShowPriceBreakdown = useCallback((slot: TimeSlotDefinition, date: Date) => {
    setSheetSlot({ slot, date });
    setPriceSheetOpen(true);
  }, []);

  return (
    <div className="space-y-5">
      {/* Emergency: Phone CTA */}
      {flowType === "emergency" && (
        <motion.a
          href="tel:+31201234567"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emergency text-emergency-foreground font-bold text-base shadow-md"
        >
          <Phone className="h-5 w-5" />
          <span>Bel direct: 020 – 123 4567</span>
        </motion.a>
      )}

      {flowType === "emergency" && (
        <p className="text-sm text-muted-foreground text-center">
          Of kies een tijdslot (online aanvraag)
        </p>
      )}

      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="font-display text-xl font-bold">
          {selectedDate ? "Kies een tijdslot" : "Kies een dag"}
        </h2>
        {!selectedDate && (
          <p className="text-sm text-muted-foreground">
            Selecteer eerst een datum
          </p>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="h-10 w-10 rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <span className="text-sm font-medium text-muted-foreground">
          {format(weekStart, "d MMM", { locale: nl })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: nl })}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset((w) => w + 1)}
          className="h-10 w-10 rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isPast = isBefore(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const isWeekendDay = isWeekend(day);

          return (
            <motion.button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDaySelect(day)}
              disabled={isPast}
              whileHover={!isPast ? { scale: 1.05 } : undefined}
              whileTap={!isPast ? { scale: 0.95 } : undefined}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-h-[70px]",
                isPast && "opacity-40 cursor-not-allowed",
                isSelected && "bg-primary text-primary-foreground shadow-md",
                !isSelected && !isPast && "hover:bg-muted border border-transparent hover:border-border",
                isToday && !isSelected && "ring-2 ring-primary/30",
                isWeekendDay && !isSelected && "bg-accent/30"
              )}
            >
              <span className="text-xs font-medium uppercase">
                {format(day, "EEE", { locale: nl })}
              </span>
              <span className={cn(
                "text-lg font-bold",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}>
                {format(day, "d")}
              </span>
              {isWeekendDay && !isSelected && (
                <span className="text-[10px] text-muted-foreground">+35%</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Time Slots */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {format(selectedDate, "EEEE d MMMM", { locale: nl })}
              </h3>
              {isWeekend(selectedDate) && (
                <Badge variant="secondary" className="text-xs">
                  Weekendtarief
                </Badge>
              )}
            </div>

            {/* No slots warning for emergency */}
            {showNoSlotsWarning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
              >
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">
                    Geen online tijdsloten beschikbaar
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Bel direct voor spoedhulp: <strong>020 – 123 4567</strong>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Slot Cards */}
            {daySlots.length > 0 ? (
              <div className="space-y-2">
                {daySlots.map((daySlot, idx) => {
                  const isSlotSelected = selectedSlot?.id === daySlot.slot.id;
                  const isFull = daySlot.status === "full";

                  return (
                    <motion.div
                      key={daySlot.slot.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSlotSelect(daySlot)}
                      className={cn(
                        "relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                        isFull && "opacity-50 cursor-not-allowed bg-muted",
                        !isFull && "cursor-pointer hover:shadow-md",
                        isSlotSelected && !isFull && "border-primary bg-primary/5 shadow-md",
                        !isSlotSelected && !isFull && "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          isSlotSelected && !isFull ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatSlotTime(daySlot.slot)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {daySlot.badges.map((badge) => (
                              <Badge
                                key={badge}
                                variant={BADGE_CONFIG[badge]?.variant || "secondary"}
                                className="text-xs py-0"
                              >
                                {BADGE_CONFIG[badge]?.label || badge}
                              </Badge>
                            ))}
                            {isFull && (
                              <span className="text-xs text-muted-foreground font-medium">
                                {STATUS_LABELS.full}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-lg",
                            flowType === "emergency" ? "text-emergency" : "text-primary",
                            isFull && "text-muted-foreground"
                          )}>
                            {formatPrice(daySlot.priceExclVat)}
                          </p>
                          <p className="text-xs text-muted-foreground">excl. btw</p>
                        </div>
                        {!isFull && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowPriceBreakdown(daySlot.slot, selectedDate);
                            }}
                            className="p-2 rounded-full hover:bg-muted transition-colors"
                            aria-label="Prijsopbouw bekijken"
                          >
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Geen beschikbaarheid op deze dag</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (selectedDate && selectedSlot) {
                handleShowPriceBreakdown(selectedSlot, selectedDate);
              }
            }}
            disabled={!selectedSlot}
            className={cn(
              "text-sm font-medium transition-colors",
              selectedSlot ? "text-primary hover:text-primary/80" : "text-muted-foreground"
            )}
          >
            Prijsopbouw
          </button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="h-11 px-4 rounded-xl"
            >
              Terug
            </Button>
            <Button
              onClick={onContinue}
              disabled={!selectedSlot}
              className={cn(
                "h-11 px-6 rounded-xl font-semibold",
                flowType === "emergency" && "bg-emergency hover:bg-emergency/90"
              )}
            >
              Ga verder
            </Button>
          </div>
        </div>
      </div>

      {/* Price Breakdown Sheet */}
      <PriceBreakdownSheet
        open={priceSheetOpen}
        onOpenChange={setPriceSheetOpen}
        slot={sheetSlot?.slot || null}
        date={sheetSlot?.date || null}
        flowType={flowType}
      />
    </div>
  );
}
