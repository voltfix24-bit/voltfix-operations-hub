import { CheckCircle, Phone, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
  const getTimeSlotLabel = (slot: string | null) => {
    switch (slot) {
      case "morning": return "Ochtend (08:00 - 12:00)";
      case "afternoon": return "Middag (12:00 - 17:00)";
      case "evening": return "Avond (17:00 - 21:00)";
      default: return "";
    }
  };

  return (
    <div className="text-center space-y-6 py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success">
        <CheckCircle className="h-10 w-10" />
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Aanvraag ontvangen!
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {bookingType === "emergency" 
            ? "Onze dispatcher bekijkt je aanvraag direct en stuurt een elektricien naar je toe."
            : "We nemen zo snel mogelijk contact met je op om de afspraak te bevestigen."
          }
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto text-left space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{serviceName}</p>
            <p className="text-sm text-muted-foreground">
              {bookingType === "emergency" ? "Spoedaanvraag" : "Geplande afspraak"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{address}</p>
            <p className="text-sm text-muted-foreground">{guestName}</p>
          </div>
        </div>

        {bookingType === "emergency" ? (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emergency/10">
              <Clock className="h-5 w-5 text-emergency" />
            </div>
            <div>
              <p className="font-medium text-emergency">Binnen 30 minuten</p>
              <p className="text-sm text-muted-foreground">Een elektricien komt zo snel mogelijk</p>
            </div>
          </div>
        ) : scheduledDate && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
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
      </div>

      <div className="bg-muted/50 rounded-xl p-4 max-w-md mx-auto">
        <p className="text-sm text-muted-foreground mb-2">
          Heb je vragen? Bel ons direct:
        </p>
        <a
          href="tel:+31201234567"
          className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
        >
          <Phone className="h-5 w-5" />
          020 - 123 4567
        </a>
      </div>

      <div className="pt-4">
        <Button asChild>
          <Link to="/">
            Terug naar home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
