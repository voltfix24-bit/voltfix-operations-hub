import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  CalendarIcon, 
  ArrowRight,
  CheckCircle,
  Phone,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BookingType = "emergency" | "planned";

interface BookingTypeSelectorProps {
  onSelect: (type: BookingType) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const EMERGENCY_RATE = 120;

export function BookingTypeSelector({ onSelect }: BookingTypeSelectorProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
          Wat is je situatie?
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Kies het type hulp dat je nodig hebt
        </p>
      </div>

      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4"
      >
        {/* Emergency */}
        <motion.button
          variants={fadeInUp}
          onClick={() => onSelect("emergency")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "group p-5 md:p-6 rounded-2xl border-2 text-left transition-all",
            "border-emergency/30 bg-gradient-to-br from-emergency-light to-emergency-light/50 hover:border-emergency hover:shadow-lg hover:shadow-emergency/10"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emergency text-emergency-foreground shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-lg text-foreground">
                  🚨 SPOED
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emergency/20 text-emergency text-xs font-semibold">
                  30 min
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Directe hulp nodig? Wij zijn er snel.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["Stroomstoring", "Kortsluiting", "Brandlucht", "Water"].map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emergency/10 text-xs text-foreground">
                    <Zap className="h-3 w-3 text-emergency" />
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-emergency font-bold text-lg">
                  €{EMERGENCY_RATE} <span className="text-sm font-normal text-muted-foreground">excl. BTW / eerste uur</span>
                </p>
                <ArrowRight className="h-5 w-5 text-emergency opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </motion.button>

        {/* Planned */}
        <motion.button
          variants={fadeInUp}
          onClick={() => onSelect("planned")}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "group p-5 md:p-6 rounded-2xl border-2 text-left transition-all",
            "border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/10"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground shrink-0">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-lg text-foreground">
                  Gepland
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-semibold">
                  -10% korting
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Plan een afspraak op een moment dat jou uitkomt.
              </p>
              <div className="space-y-1.5 mb-4">
                {[
                  "Kies je eigen datum",
                  "Ochtend, middag of avond",
                  "Lagere tarieven",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-primary font-bold text-lg">
                  Vanaf €125
                </p>
                <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Emergency Phone CTA */}
      <motion.div 
        variants={fadeInUp}
        className="p-4 rounded-xl bg-muted/50 text-center"
      >
        <p className="text-sm text-muted-foreground mb-2">
          Liever direct bellen?
        </p>
        <a
          href="tel:+31201234567"
          className="inline-flex items-center gap-2 text-emergency font-semibold hover:underline text-lg"
        >
          <Phone className="h-5 w-5" />
          020 – 123 4567
        </a>
      </motion.div>
    </motion.div>
  );
}
