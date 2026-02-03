/**
 * PriceBreakdownSheet Component
 * 
 * Bottom sheet showing detailed price breakdown for a selected time slot.
 */

import { motion } from "framer-motion";
import { Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeSlotDefinition } from "@/types/booking";
import { computeSlotPrice, formatSlotTime } from "@/hooks/useSlotPricing";
import { formatPrice } from "@/hooks/usePricing";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PriceBreakdownSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: TimeSlotDefinition | null;
  date: Date | null;
  flowType: "emergency" | "planned";
}

export function PriceBreakdownSheet({
  open,
  onOpenChange,
  slot,
  date,
  flowType,
}: PriceBreakdownSheetProps) {
  if (!slot || !date) return null;

  const priceResult = computeSlotPrice(flowType, date, slot);
  const { breakdown } = priceResult;

  const lines = [
    {
      label: "Basistarief eerste uur",
      amount: breakdown.baseRate,
      hint: "Incl. diagnose, voorrijkosten en eerste werkzaamheden",
    },
  ];

  if (breakdown.emergencySurcharge > 0) {
    lines.push({
      label: "Spoedtoeslag (+50%)",
      amount: breakdown.emergencySurcharge,
      hint: "Directe inzet binnen 30 minuten",
    });
  }

  if (breakdown.weekendSurcharge > 0) {
    lines.push({
      label: "Weekendtoeslag (+35%)",
      amount: breakdown.weekendSurcharge,
      hint: "Werkzaamheden op zaterdag of zondag",
    });
  }

  if (breakdown.eveningSurcharge > 0) {
    lines.push({
      label: "Avondtoeslag (+25%)",
      amount: breakdown.eveningSurcharge,
      hint: "Werkzaamheden tussen 18:00 en 22:00",
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-lg text-left">
            Prijsopbouw
          </SheetTitle>
          <p className="text-sm text-muted-foreground text-left">
            {format(date, "EEEE d MMMM", { locale: nl })} • {formatSlotTime(slot)}
          </p>
        </SheetHeader>

        <div className="space-y-4">
          {/* Price Lines */}
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-between items-start"
              >
                <div className="flex-1 pr-4">
                  <span className="text-sm text-foreground">{line.label}</span>
                  {line.hint && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {line.hint}
                    </p>
                  )}
                </div>
                <span className="font-medium tabular-nums text-sm">
                  {formatPrice(line.amount)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Subtotal & VAT */}
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotaal (excl. BTW)</span>
              <span className="font-medium tabular-nums">
                {formatPrice(breakdown.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">BTW (21%)</span>
              <span className="font-medium tabular-nums">
                {formatPrice(breakdown.vat)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Totaal (incl. BTW)</span>
              <motion.span
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn(
                  "text-2xl font-bold",
                  flowType === "emergency" ? "text-emergency" : "text-primary"
                )}
              >
                {formatPrice(breakdown.total)}
              </motion.span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 pt-3 text-xs text-muted-foreground border-t border-border">
            <Shield className="h-4 w-4 mt-0.5 text-success shrink-0" />
            <span>
              Materiaal en extra werkzaamheden worden alleen uitgevoerd na overleg.
              Betaling na afronding.
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
