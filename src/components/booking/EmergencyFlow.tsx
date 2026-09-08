import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  Phone, 
  ArrowRight, 
  ArrowLeft,
  Power, 
  Zap, 
  Flame, 
  Droplets, 
  HelpCircle,
  Camera,
  X,
  AlertTriangle,
  AlertCircle,
  Shield,
  CheckCircle,
  type LucideIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { GuestBookingForm, validatePhotoFiles, MAX_PHOTOS, type BookingSuccessPayload } from "./GuestBookingForm";
import { PriceBreakdownCard } from "./PriceBreakdownCard";
import { TimeSlotCalendar } from "./TimeSlotCalendar";
import { formatPrice, buildPriceBreakdown, roundMoney } from "@/hooks/usePricing";
import { useSlotAvailability } from "@/hooks/useSlotAvailability";
import { TimeSlotDefinition, getTimeSlotCategory, getTimeSlotWindow } from "@/types/booking";

/** Fallback base price (excl. btw) when no emergency service is matched */
export const EMERGENCY_FALLBACK_BASE_PRICE = 125;

// Emergency service options (display). `match` is used to link to a real service_type by name.
const EMERGENCY_SERVICES: { id: string; label: string; icon: LucideIcon; match: string[]; warning?: string }[] = [
  { id: "stroomstoring", label: "Stroomstoring", icon: Power, match: ["stroomstoring"] },
  { id: "kortsluiting", label: "Kortsluiting", icon: Zap, match: ["kortsluiting"] },
  { id: "brandlucht", label: "Brandlucht / rook", icon: Flame, match: ["brandlucht"], warning: "Bel direct 112 bij gevaar!" },
  { id: "water-meterkast", label: "Water in meterkast", icon: Droplets, match: ["water in meterkast", "water"] },
  { id: "anders", label: "Anders / niet zeker", icon: HelpCircle, match: [] },
];

interface EmergencyServiceType {
  id: string;
  name_nl: string;
  base_price: number;
}

interface EmergencyFlowProps {
  onBack: () => void;
  onSuccess: (payload: BookingSuccessPayload) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function EmergencyFlow({ onBack, onSuccess }: EmergencyFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDefinition | null>(null);
  const [emergencyServices, setEmergencyServices] = useState<EmergencyServiceType[]>([]);

  // Load real emergency services (for service_type_id + base price)
  useEffect(() => {
    supabase
      .from("service_types")
      .select("id, name_nl, base_price")
      .eq("is_emergency_eligible", true)
      .then(({ data }) => {
        if (data) {
          setEmergencyServices(data.map((s) => ({ ...s, base_price: Number(s.base_price) })));
        }
      });
  }, []);

  const selectedServiceData = EMERGENCY_SERVICES.find(s => s.id === selectedService);

  // Match chosen situation to a real service type by Dutch name
  const matchedServiceType = selectedServiceData
    ? emergencyServices.find((s) =>
        selectedServiceData.match.some((m) => s.name_nl.toLowerCase().includes(m))
      )
    : undefined;

  // Lowest emergency base price as fallback, else 125
  const lowestEmergencyBase = emergencyServices.length > 0
    ? Math.min(...emergencyServices.map((s) => s.base_price))
    : EMERGENCY_FALLBACK_BASE_PRICE;
  const baseRate = roundMoney(matchedServiceType?.base_price ?? lowestEmergencyBase);

  const { availability: slotAvailability, loading: availabilityLoading } = useSlotAvailability(date);

  // Build price breakdown based on selected slot or current time
  const priceBreakdown = buildPriceBreakdown({
    bookingType: "emergency",
    date: date || new Date(),
    timeSlot: selectedSlot ? getTimeSlotCategory(selectedSlot) : null,
    baseRate,
  });

  const scheduledTimeWindow = selectedSlot ? getTimeSlotWindow(selectedSlot) : null;

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    // Auto-advance to step 2 after a brief moment
    setTimeout(() => setStep(2), 300);
  };

  const handleSlotChange = (slot: TimeSlotDefinition) => {
    setSelectedSlot(slot);
  };

  const handlePhotoAdd = (files: FileList | null) => {
    if (!files) return;
    const { accepted, error } = validatePhotoFiles(Array.from(files), photos.length);
    setPhotoError(error);
    if (accepted.length > 0) {
      setPhotos(prev => [...prev, ...accepted]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Persistent Phone CTA - Only show when NOT on calendar step */}
      {step !== 3 && (
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

      <AnimatePresence mode="wait">
        {/* STEP 1: Situation Selection */}
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
                Wat is er aan de hand?
              </h2>
              <p className="text-sm text-muted-foreground">
                (optioneel - je kunt ook doorgaan zonder te kiezen)
              </p>
            </div>

            {/* Service Options - Large tap targets */}
            <div className="grid grid-cols-2 gap-3">
              {EMERGENCY_SERVICES.map((service) => {
                const IconComponent = service.icon;
                return (
                  <motion.button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceSelect(service.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-center transition-all min-h-[100px] flex flex-col items-center justify-center gap-2",
                      selectedService === service.id
                        ? "border-emergency bg-emergency/10 shadow-md"
                        : "border-border hover:border-emergency/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      selectedService === service.id
                        ? "bg-emergency text-emergency-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <p className="font-medium text-sm">{service.label}</p>
                  </motion.button>
                );
              })}
            </div>

            {/* Warning for dangerous situations */}
            {selectedService === "brandlucht" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
              >
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm font-medium text-destructive">
                  Bij direct gevaar: bel eerst 112!
                </p>
              </motion.div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Geen zorgen — onze elektricien stelt ter plekke de juiste diagnose.
            </p>

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
                className="flex-1 h-12 rounded-xl bg-emergency hover:bg-emergency/90 font-semibold"
              >
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Extra Info (optional) */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-bold">
                Extra informatie
              </h2>
              <p className="text-sm text-muted-foreground">(optioneel)</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Wat is er gebeurd?
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bijvoorbeeld: alles viel uit na gebruik van de oven…"
                  rows={3}
                  className="rounded-xl border-2 resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Foto toevoegen (optioneel, max {MAX_PHOTOS})
                </Label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Foto ${idx + 1}`}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotos(prev => prev.filter((_, i) => i !== idx));
                          setPhotoError(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-md"
                        aria-label="Foto verwijderen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handlePhotoAdd(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
                {photoError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {photoError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Alleen afbeeldingen, max 10 MB per foto
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-xl bg-emergency hover:bg-emergency/90 font-semibold"
              >
                Volgende
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Time Slot Calendar */}
        {step === 3 && (
          <motion.div
            key="step3"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <TimeSlotCalendar
              flowType="emergency"
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
              onContinue={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}

        {/* STEP 4: Price Info */}
        {step === 4 && (
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
                Tariefinformatie
              </h2>
            </div>

            {/* Full Price Breakdown Card */}
            <PriceBreakdownCard
              breakdown={priceBreakdown}
              bookingType="emergency"
            />

            {/* Additional info */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">90% van de storingen</strong> wordt binnen het eerste uur opgelost.
                </p>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Gecertificeerd (NEN 3140)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Betaling pas na uitvoering</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Vooraf akkoord bij extra kosten</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Button>
              <Button
                onClick={() => setStep(5)}
                className="flex-1 h-12 rounded-xl bg-emergency hover:bg-emergency/90 font-semibold"
              >
                Volgende stap
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Contact Details */}
        {step === 5 && (
          <motion.div
            key="step5"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-bold">
                Bijna klaar — we regelen de rest
              </h2>
              <p className="text-sm text-muted-foreground">
                Geen account nodig. We nemen direct contact met je op.
              </p>
            </div>

            <GuestBookingForm
              serviceId={matchedServiceType?.id || ""}
              serviceName={selectedServiceData?.label || "Spoedstoring"}
              bookingType="emergency"
              scheduledDate={date ? format(date, "yyyy-MM-dd") : null}
              timeSlot={selectedSlot ? getTimeSlotCategory(selectedSlot) : null}
              scheduledTimeWindow={scheduledTimeWindow}
              basePrice={baseRate}
              finalPrice={priceBreakdown.total}
              priceBreakdown={priceBreakdown}
              onSuccess={onSuccess}
              onBack={() => setStep(4)}
              emergencyDescription={description}
              emergencyPhotos={photos}
            />

            {/* Summary Panel */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Samenvatting
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Prioriteit voor beoordeling en snelle inzet</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>We nemen zo snel mogelijk contact met je op</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  <span>Gecertificeerd (NEN 3140)</span>
                </div>
                {date && selectedSlot && (
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Gekozen tijdslot</span>
                    <span className="font-medium">
                      {format(date, "d MMM", { locale: nl })} • {scheduledTimeWindow}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-muted-foreground">Totaal (incl. btw):</span>
                <span className="font-bold text-lg text-emergency">{formatPrice(priceBreakdown.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Betaling pas na uitvoering
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
