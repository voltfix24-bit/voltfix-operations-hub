import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { GuestBookingForm, type BookingSuccessPayload } from "./GuestBookingForm";
import { PriceBreakdownCard } from "./PriceBreakdownCard";
import { TimeSlotCalendar } from "./TimeSlotCalendar";
import { formatPrice, buildPriceBreakdown, roundMoney, PRICING } from "@/hooks/usePricing";
import { useSlotAvailability } from "@/hooks/useSlotAvailability";
import { TimeSlotDefinition, getTimeSlotCategory, getTimeSlotWindow } from "@/types/booking";

interface ServiceType {
  id: string;
  name: string;
  name_nl: string;
  description: string | null;
  base_price: number;
  is_emergency_eligible: boolean;
}

interface PlannedFlowProps {
  onBack: () => void;
  onSuccess: (payload: BookingSuccessPayload) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function PlannedFlow({ onBack, onSuccess }: PlannedFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("service_types")
      .select("*")
      .eq("is_emergency_eligible", false)
      .order("base_price", { ascending: true });

    if (error || !data) {
      setLoadError("De diensten konden niet worden geladen. Probeer het opnieuw.");
    } else {
      setServices(data.map((s) => ({ ...s, base_price: Number(s.base_price) })) as ServiceType[]);
    }
    setLoading(false);
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const baseRate = selectedServiceData ? roundMoney(Number(selectedServiceData.base_price)) : PRICING.baseRate;

  const { availability: slotAvailability, loading: availabilityLoading } = useSlotAvailability(date);

  // Build price breakdown based on selected service + slot
  const priceBreakdown = buildPriceBreakdown({
    bookingType: "planned",
    date,
    timeSlot: selectedSlot ? getTimeSlotCategory(selectedSlot) : null,
    baseRate,
  });

  const scheduledTimeWindow = selectedSlot ? getTimeSlotWindow(selectedSlot) : null;

  const handleSlotChange = (slot: TimeSlotDefinition) => {
    setSelectedSlot(slot);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* STEP 1: Service Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-bold">
                Wat wil je laten doen?
              </h2>
              <p className="text-sm text-muted-foreground">
                Selecteer een dienst
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Diensten laden...</span>
              </div>
            )}

            {!loading && loadError && (
              <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-destructive font-medium">{loadError}</p>
                <Button variant="outline" size="sm" onClick={fetchServices} className="rounded-xl">
                  Opnieuw proberen
                </Button>
              </div>
            )}

            {!loading && !loadError && services.length === 0 && (
              <div className="p-5 rounded-2xl bg-muted/50 border border-border text-center text-sm text-muted-foreground">
                Er zijn momenteel geen geplande diensten beschikbaar. Neem telefonisch contact met ons op.
              </div>
            )}

            {!loading && !loadError && services.length > 0 && (
              <RadioGroup value={selectedService || ""} onValueChange={setSelectedService}>
                <div className="space-y-3">
                  {services.map((service) => (
                    <motion.label
                      key={service.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        selectedService === service.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={service.id} className="shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">{service.name_nl}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold text-primary">
                          vanaf {formatPrice(service.base_price)}
                        </span>
                        <p className="text-[11px] text-muted-foreground">excl. btw</p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </RadioGroup>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1 h-12 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedServiceData}
                className="flex-1 h-12 rounded-xl font-semibold"
              >
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Date & Time Slot Calendar */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <TimeSlotCalendar
              flowType="planned"
              selectedDate={date}
              selectedSlot={selectedSlot}
              baseRate={baseRate}
              slotAvailability={slotAvailability}
              availabilityLoading={availabilityLoading}
              onDateChange={(newDate) => {
                setDate(newDate);
                setSelectedSlot(null); // Reset slot when date changes
              }}
              onSlotChange={handleSlotChange}
              onContinue={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          </motion.div>
        )}

        {/* STEP 3: Price Confirmation */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-bold">
                Prijsoverzicht
              </h2>
              {selectedServiceData && (
                <p className="text-sm text-muted-foreground">{selectedServiceData.name_nl}</p>
              )}
            </div>

            <PriceBreakdownCard
              breakdown={priceBreakdown}
              bookingType="planned"
            />

            {/* Trust indicators */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Geen verborgen kosten</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Voorrijkosten inbegrepen</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Betaling na uitvoering</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="flex-1 h-12 rounded-xl font-semibold"
              >
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Contact Details */}
        {step === 4 && selectedServiceData && (
          <motion.div
            key="step4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-bold">
                Vul je gegevens in
              </h2>
              <p className="text-sm text-muted-foreground">
                Geen account nodig
              </p>
            </div>

            <GuestBookingForm
              serviceId={selectedServiceData.id}
              serviceName={selectedServiceData.name_nl}
              bookingType="planned"
              scheduledDate={date ? format(date, "yyyy-MM-dd") : null}
              timeSlot={selectedSlot ? getTimeSlotCategory(selectedSlot) : null}
              scheduledTimeWindow={scheduledTimeWindow}
              basePrice={baseRate}
              finalPrice={priceBreakdown.total}
              priceBreakdown={priceBreakdown}
              onSuccess={onSuccess}
              onBack={() => setStep(3)}
            />

            {/* Summary Panel */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Samenvatting
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dienst</span>
                  <span className="font-medium">{selectedServiceData.name_nl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Datum</span>
                  <span className="font-medium">
                    {date ? format(date, "d MMMM", { locale: nl }) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tijd</span>
                  <span className="font-medium">{scheduledTimeWindow || "-"}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-muted-foreground">Totaal (incl. btw):</span>
                <span className="font-bold text-lg text-primary">{formatPrice(priceBreakdown.total)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Betaling pas na uitvoering</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
