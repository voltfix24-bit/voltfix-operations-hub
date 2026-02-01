import { Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const formatPrice = (amount: number) => {
    const prefix = amount >= 0 ? "" : "";
    return `€${amount.toFixed(2)}`;
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border",
        compact ? "p-4" : "p-6",
        "space-y-4"
      )}
    >
      <h3 className="font-display font-bold text-lg flex items-center gap-2">
        Prijsopbouw
        <Info className="h-4 w-4 text-muted-foreground" />
      </h3>

      {/* Price Lines */}
      <div className="space-y-2">
        {breakdown.lines.map((line, idx) => (
          <div key={idx} className="flex justify-between items-start text-sm">
            <div className="flex-1">
              <span className="text-foreground">{line.label}</span>
              {line.hint && (
                <p className="text-xs text-muted-foreground">{line.hint}</p>
              )}
            </div>
            <span
              className={cn(
                "font-medium tabular-nums",
                line.amount < 0 ? "text-success" : "text-foreground"
              )}
            >
              {line.amount < 0 ? "-" : "+"} {formatPrice(Math.abs(line.amount))}
            </span>
          </div>
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
      <div className="border-t border-border pt-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Totaal (incl. BTW)</span>
          <span
            className={cn(
              "text-2xl font-bold",
              bookingType === "emergency" ? "text-emergency" : "text-primary"
            )}
          >
            {formatPrice(breakdown.total)}
          </span>
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
  );
}
