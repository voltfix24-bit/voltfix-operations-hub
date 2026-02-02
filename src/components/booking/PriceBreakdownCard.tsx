import { motion } from "framer-motion";
import { Shield, Info, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface PriceLine {
  label: string;
  amount: number;
  hint?: string;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  subtotal: number;
  vat: number;
  total: number;
}

interface PriceBreakdownCardProps {
  breakdown: PriceBreakdown;
  bookingType: "emergency" | "planned";
  compact?: boolean;
}

export function PriceBreakdownCard({
  breakdown,
  bookingType,
  compact = false,
}: PriceBreakdownCardProps) {
  const [expanded, setExpanded] = useState(!compact);

  const formatPrice = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-2xl border-2 border-border overflow-hidden",
        compact ? "p-4" : "p-5 md:p-6"
      )}
    >
      {/* Header */}
      <button
        onClick={() => compact && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between",
          compact && "cursor-pointer"
        )}
      >
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          Prijsopbouw
          <Info className="h-4 w-4 text-muted-foreground" />
        </h3>
        {compact && (
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-bold text-lg",
              bookingType === "emergency" ? "text-emergency" : "text-primary"
            )}>
              {formatPrice(breakdown.total)}
            </span>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )} />
          </div>
        )}
      </button>

      {/* Expandable Content */}
      <motion.div
        initial={compact ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
        animate={{ 
          height: expanded ? "auto" : 0, 
          opacity: expanded ? 1 : 0 
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pt-4 space-y-4">
          {/* Price Lines */}
          <div className="space-y-2">
            {breakdown.lines.map((line, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-between items-start text-sm"
              >
                <div className="flex-1 pr-4">
                  <span className="text-foreground">{line.label}</span>
                  {line.hint && (
                    <p className="text-xs text-muted-foreground mt-0.5">{line.hint}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "font-medium tabular-nums shrink-0",
                    line.amount < 0 ? "text-success" : "text-foreground"
                  )}
                >
                  {line.amount < 0 ? "-" : "+"} {formatPrice(Math.abs(line.amount))}
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
                key={breakdown.total}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn(
                  "text-2xl font-bold",
                  bookingType === "emergency" ? "text-emergency" : "text-primary"
                )}
              >
                {formatPrice(breakdown.total)}
              </motion.span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground border-t border-border">
            <Shield className="h-4 w-4 mt-0.5 text-success shrink-0" />
            <span>
              Materiaal en extra werkzaamheden alleen na overleg. Betaling na
              afronding.
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
