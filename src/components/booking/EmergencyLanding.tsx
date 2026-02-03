import { motion } from "framer-motion";
import { Phone, ArrowRight, Shield, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyLandingProps {
  onStartOnline: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function EmergencyLanding({ onStartOnline }: EmergencyLandingProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Hero Title */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emergency/10 text-emergency text-sm font-semibold"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emergency opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emergency" />
          </span>
          24/7 Bereikbaar
        </motion.div>
        
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
          🚨 Spoedstoring?
          <br />
          <span className="text-emergency">Wij helpen direct.</span>
        </h1>
        
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
          Binnen 30 minuten nemen we contact met je op.
          <br />
          <span className="text-foreground font-medium">Geen account nodig. Geen verrassingen.</span>
        </p>
      </div>

      {/* Primary Phone CTA */}
      <motion.a
        href="tel:+31201234567"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl bg-emergency text-emergency-foreground font-bold text-lg sm:text-xl shadow-lg shadow-emergency/30"
      >
        <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
        <span>📞 Bel direct 020 – 123 4567</span>
      </motion.a>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground font-medium">of</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Secondary Online CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onStartOnline}
          variant="outline"
          size="lg"
          className="w-full h-14 sm:h-16 rounded-2xl border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-base sm:text-lg"
        >
          Online aanvragen (30 sec)
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-4 grid grid-cols-3 gap-2 text-center"
      >
        {[
          { icon: Clock, label: "30 min", sublabel: "reactietijd" },
          { icon: Shield, label: "NEN 3140", sublabel: "gecertificeerd" },
          { icon: Star, label: "4.9/5", sublabel: "beoordeling" },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50">
            <item.icon className="h-5 w-5 text-primary" />
            <p className="font-semibold text-sm text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.sublabel}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
