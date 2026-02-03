import { motion } from "framer-motion";
import { Calendar, CheckCircle, Shield, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlannedLandingProps {
  onStart: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function PlannedLanding({ onStart }: PlannedLandingProps) {
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-semibold"
        >
          <CheckCircle className="h-4 w-4" />
          10% korting op gepland
        </motion.div>
        
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
          Plan een afspraak
          <br />
          <span className="text-primary">wanneer het jou uitkomt</span>
        </h1>
        
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
          Lagere tarieven. Volledige transparantie.
          <br />
          <span className="text-foreground font-medium">Geen spoeddruk.</span>
        </p>
      </div>

      {/* Benefits List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 bg-muted/30 rounded-2xl p-5"
      >
        {[
          { icon: Calendar, text: "Kies je eigen datum en tijd" },
          { icon: CheckCircle, text: "Geen verborgen kosten" },
          { icon: CheckCircle, text: "Geen voorrijkosten achteraf" },
          { icon: CheckCircle, text: "Betaling na uitvoering" },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-success/10">
              <item.icon className="h-4 w-4 text-success" />
            </div>
            <span className="text-foreground font-medium">{item.text}</span>
          </div>
        ))}
      </motion.div>

      {/* Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onStart}
          size="lg"
          className="w-full h-14 sm:h-16 rounded-2xl font-bold text-base sm:text-lg"
        >
          <Calendar className="mr-2 h-5 w-5" />
          Plan een afspraak
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
          { icon: Clock, label: "Flexibel", sublabel: "plannen" },
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
