import { motion } from "framer-motion";
import { CheckCircle, Phone, Clock, MapPin, ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BookingConfirmationProps {
  jobId: string;
  bookingType: "emergency" | "planned";
  serviceName: string;
  address: string;
  guestName: string;
  guestPhone: string;
  scheduledDate?: string | null;
  timeSlot?: string | null;
}

export function BookingConfirmation({
  jobId,
  bookingType,
  serviceName,
  address,
  guestName,
  guestPhone,
  scheduledDate,
  timeSlot,
}: BookingConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const getTimeSlotLabel = (slot: string | null) => {
    switch (slot) {
      case "morning": return "Ochtend (08:00 - 12:00)";
      case "afternoon": return "Middag (12:00 - 17:00)";
      case "evening": return "Avond (17:00 - 21:00)";
      default: return "";
    }
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(jobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-6 py-4"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
        >
          <CheckCircle className="h-10 w-10 text-success" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-display text-2xl font-bold mb-2">
          Aanvraag ontvangen!
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
          {bookingType === "emergency" 
            ? "Onze dispatcher bekijkt je aanvraag direct en stuurt een elektricien naar je toe."
            : "We nemen zo snel mogelijk contact met je op om de afspraak te bevestigen."
          }
        </p>
      </motion.div>

      {/* Booking Reference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted"
      >
        <span className="text-sm text-muted-foreground">Referentie:</span>
        <code className="text-sm font-mono font-medium">{jobId.slice(0, 8).toUpperCase()}</code>
        <button
          onClick={handleCopyId}
          className="p-1 hover:bg-muted-foreground/10 rounded transition-colors"
          aria-label="Kopieer referentie"
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </motion.div>

      {/* Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border-2 border-border rounded-2xl p-6 max-w-md mx-auto text-left space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-xl",
            bookingType === "emergency" ? "bg-emergency/10" : "bg-primary/10"
          )}>
            <CheckCircle className={cn(
              "h-5 w-5",
              bookingType === "emergency" ? "text-emergency" : "text-primary"
            )} />
          </div>
          <div>
            <p className="font-semibold">{serviceName}</p>
            <p className={cn(
              "text-sm font-medium",
              bookingType === "emergency" ? "text-emergency" : "text-primary"
            )}>
              {bookingType === "emergency" ? "Spoedaanvraag" : "Geplande afspraak"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-muted">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{address}</p>
            <p className="text-sm text-muted-foreground">{guestName}</p>
          </div>
        </div>

        {bookingType === "emergency" ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-emergency/10 border border-emergency/20"
          >
            <div className="p-2 rounded-lg bg-emergency/20">
              <Clock className="h-5 w-5 text-emergency" />
            </div>
            <div>
              <p className="font-bold text-emergency">Binnen 30 minuten</p>
              <p className="text-sm text-muted-foreground">Een elektricien komt zo snel mogelijk</p>
            </div>
          </motion.div>
        ) : scheduledDate && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{scheduledDate}</p>
              {timeSlot && (
                <p className="text-sm text-muted-foreground">{getTimeSlotLabel(timeSlot)}</p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Phone CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-muted/50 rounded-2xl p-5 max-w-md mx-auto"
      >
        <p className="text-sm text-muted-foreground mb-3">
          Heb je vragen? Bel ons direct:
        </p>
        <a
          href="tel:+31201234567"
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          <Phone className="h-5 w-5" />
          020 - 123 4567
        </a>
      </motion.div>

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="pt-4"
      >
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/">
            Nieuwe aanvraag
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
