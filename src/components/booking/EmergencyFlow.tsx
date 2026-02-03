import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Shield,
  CheckCircle,
  type LucideIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { GuestBookingForm } from "./GuestBookingForm";
import { PriceBreakdownCard } from "./PriceBreakdownCard";
import { usePricing, PRICING, formatPrice, getTimeSurchargeInfo } from "@/hooks/usePricing";

// Emergency service options
const EMERGENCY_SERVICES: { id: string; label: string; icon: LucideIcon; warning?: string }[] = [
  { id: "stroomstoring", label: "Stroomstoring", icon: Power },
  { id: "kortsluiting", label: "Kortsluiting", icon: Zap },
  { id: "brandlucht", label: "Brandlucht / rook", icon: Flame, warning: "Bel direct 112 bij gevaar!" },
  { id: "water-meterkast", label: "Water in meterkast", icon: Droplets },
  { id: "anders", label: "Anders / niet zeker", icon: HelpCircle },
];

interface EmergencyFlowProps {
  onBack: () => void;
  onSuccess: (payload: {
    jobId: string;
    guestName: string;
    guestPhone: string;
    address: string;
    city?: string;
    postalCode?: string;
  }) => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function EmergencyFlow({ onBack, onSuccess }: EmergencyFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  // Determine current date/time for surcharge calculation
  const now = new Date();
  const currentHour = now.getHours();
  
  // Calculate time-based surcharges
  const isEvening = currentHour >= PRICING.eveningStart && currentHour < PRICING.eveningEnd;
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const timeSurchargeInfo = getTimeSurchargeInfo(now, isEvening ? "evening" : "morning");

  // Use centralized pricing hook
  const priceBreakdown = usePricing({
    bookingType: "emergency",
    date: now,
    timeSlot: isEvening ? "evening" : "morning",
  });

  const selectedServiceData = EMERGENCY_SERVICES.find(s => s.id === selectedService);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    // Auto-advance to step 2 after a brief moment
    setTimeout(() => setStep(2), 300);
  };

  return (
    <div className="space-y-4">
      {/* Persistent Phone CTA */}
      <motion.a
        href="tel:+31201234567"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emergency text-emergency-foreground font-bold text-base shadow-md"
      >
        <Phone className="h-5 w-5" />
        <span>Bel direct: 020 – 123 4567</span>
      </motion.a>

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
                  Foto toevoegen (max 5)
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
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPhotos(prev => [...prev, file]);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
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

        {/* STEP 3: Price Info */}
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

              {/* Active surcharges indicator */}
              {(isEvening || isWeekend) && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {isWeekend && "Weekendtarief actief"}
                    {isEvening && !isWeekend && "Avondtarief actief"}
                  </p>
                </div>
              )}
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
                className="flex-1 h-12 rounded-xl bg-emergency hover:bg-emergency/90 font-semibold"
              >
                Volgende stap
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Contact Details */}
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
                Bijna klaar — we regelen de rest
              </h2>
              <p className="text-sm text-muted-foreground">
                Geen account nodig. We nemen direct contact met je op.
              </p>
            </div>

            <GuestBookingForm
              serviceId={selectedService || "spoed"}
              serviceName={selectedServiceData?.label || "Spoedstoring"}
              bookingType="emergency"
              basePrice={PRICING.baseRate}
              finalPrice={priceBreakdown.total}
              priceBreakdown={priceBreakdown}
              onSuccess={onSuccess}
              onBack={() => setStep(3)}
              emergencyDescription={description}
              emergencyPhotos={photos}
            />

            {/* Summary Panel - Desktop sidebar style on mobile */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Samenvatting
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Spoedmonteur ingepland</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Binnen 30 minuten contact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-success" />
                  <span>Gecertificeerd (NEN 3140)</span>
                </div>
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
