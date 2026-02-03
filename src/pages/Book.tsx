import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GuestBookingForm } from "@/components/booking/GuestBookingForm";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { PriceBreakdownCard, type PriceBreakdown, type PriceLine } from "@/components/booking/PriceBreakdownCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData, CustomerSiteStructuredData } from "@/components/seo/StructuredData";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  AlertTriangle, 
  Zap, 
  Clock, 
  CalendarIcon, 
  Phone, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Info,
  Shield,
  Star,
  Users,
  X,
  Camera,
  Power,
  Flame,
  Droplets,
  HelpCircle,
  type LucideIcon
} from "lucide-react";

type BookingType = "emergency" | "planned";
type TimeSlot = "morning" | "afternoon" | "evening";

interface ServiceType {
  id: string;
  name: string;
  name_nl: string;
  description: string | null;
  base_price: number;
  is_emergency_eligible: boolean;
}

// Emergency service options with Lucide icons
const EMERGENCY_SERVICES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "stroomstoring", label: "Stroomstoring", icon: Power },
  { id: "kortsluiting", label: "Kortsluiting", icon: Zap },
  { id: "brandlucht", label: "Brandlucht", icon: Flame },
  { id: "water-meterkast", label: "Water in meterkast", icon: Droplets },
  { id: "anders", label: "Anders", icon: HelpCircle },
];

const EMERGENCY_HOURLY_RATE = 120; // €120 ex BTW per eerste uur

// ========== PRICING CONFIG ==========
const PRICING = {
  vatRate: 0.21,
  plannedDiscountPct: 0.10,
  emergencySurchargePct: 0.50,
  emergencyCalloutFee: 25,
  eveningSurchargePct: 0.25,
  eveningAppliesToPlanned: true,
  eveningAppliesToEmergency: true,
};

function buildPriceBreakdown({
  basePrice,
  bookingType,
  timeSlot,
}: {
  basePrice: number;
  bookingType: BookingType;
  timeSlot: TimeSlot | null;
}): PriceBreakdown {
  const lines: PriceLine[] = [];
  let runningTotal = basePrice;

  lines.push({
    label: "Basistarief (dienst)",
    amount: basePrice,
  });

  if (bookingType === "planned") {
    const discount = -(basePrice * PRICING.plannedDiscountPct);
    lines.push({
      label: "Korting gepland (-10%)",
      amount: discount,
      hint: "Bespaar door vooruit te plannen",
    });
    runningTotal += discount;
  } else {
    const surcharge = basePrice * PRICING.emergencySurchargePct;
    lines.push({
      label: "Spoedtoeslag (+50%)",
      amount: surcharge,
      hint: "Directe inzet binnen 30 minuten",
    });
    runningTotal += surcharge;

    lines.push({
      label: "Starttarief (incl. voorrijkosten)",
      amount: PRICING.emergencyCalloutFee,
    });
    runningTotal += PRICING.emergencyCalloutFee;
  }

  if (timeSlot === "evening") {
    const applyEvening =
      (bookingType === "planned" && PRICING.eveningAppliesToPlanned) ||
      (bookingType === "emergency" && PRICING.eveningAppliesToEmergency);

    if (applyEvening) {
      const eveningSurcharge = runningTotal * PRICING.eveningSurchargePct;
      lines.push({
        label: "Avondtoeslag (+25%)",
        amount: eveningSurcharge,
        hint: "Werkzaamheden na 17:00",
      });
      runningTotal += eveningSurcharge;
    }
  }

  const subtotal = Math.round(runningTotal * 100) / 100;
  const vat = Math.round(subtotal * PRICING.vatRate * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  return { lines, subtotal, vat, total };
}

const timeSlots = [
  { value: "morning" as TimeSlot, label: "Ochtend", time: "08:00 - 12:00", icon: "☀️" },
  { value: "afternoon" as TimeSlot, label: "Middag", time: "12:00 - 17:00", icon: "🌤️" },
  { value: "evening" as TimeSlot, label: "Avond", time: "17:00 - 21:00", icon: "🌙" },
];

// Old list removed - now using EMERGENCY_SERVICES with icons

const trustIndicators = [
  { icon: Shield, label: "Gecertificeerd", sublabel: "NEN 3140" },
  { icon: Star, label: "4.9/5 sterren", sublabel: "500+ reviews" },
  { icon: Users, label: "10.000+", sublabel: "tevreden klanten" },
];

interface BookingData {
  jobId: string;
  serviceName: string;
  address: string;
  guestName: string;
  guestPhone: string;
  city?: string;
  postalCode?: string;
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Book() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  
  // Emergency specific state
  const [selectedEmergencyService, setSelectedEmergencyService] = useState<string | null>(null);
  const [emergencyDescription, setEmergencyDescription] = useState("");
  const [emergencyPhotos, setEmergencyPhotos] = useState<File[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_types")
      .select("*")
      .order("base_price", { ascending: true });

    if (data) {
      setServices(data as ServiceType[]);
    }
    setLoading(false);
  };

  // For planned bookings, show only non-emergency services
  // For emergency bookings, the EMERGENCY_SERVICES array is used instead (not filteredServices)
  const filteredServices = services.filter(s => !s.is_emergency_eligible);

  const selectedServiceData = services.find(s => s.id === selectedService);
  
  // Get the selected emergency service label
  const selectedEmergencyServiceData = EMERGENCY_SERVICES.find(s => s.id === selectedEmergencyService);

  // Build price breakdown - different logic for emergency vs planned
  const priceBreakdown = bookingType === "emergency" && selectedEmergencyService
    ? buildPriceBreakdown({
        basePrice: EMERGENCY_HOURLY_RATE,
        bookingType: "emergency",
        timeSlot: null,
      })
    : selectedServiceData && bookingType === "planned"
    ? buildPriceBreakdown({
        basePrice: Number(selectedServiceData.base_price),
        bookingType: "planned",
        timeSlot,
      })
    : null;

  const handleBookingSuccess = (payload: {
    jobId: string;
    guestName: string;
    guestPhone: string;
    address: string;
    city?: string;
    postalCode?: string;
  }) => {
    setBookingData({
      jobId: payload.jobId,
      serviceName: selectedServiceData?.name_nl || "",
      address: payload.address,
      guestName: payload.guestName,
      guestPhone: payload.guestPhone,
      city: payload.city,
      postalCode: payload.postalCode,
    });
    setBookingComplete(true);
  };

  // Show confirmation page
  if (bookingComplete && bookingData) {
    const fullAddress = [
      bookingData.address,
      bookingData.postalCode,
      bookingData.city,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hero-gradient text-primary-foreground py-12 md:py-16"
          >
            <div className="container text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-3xl md:text-4xl font-bold mb-4"
              >
                Bedankt voor je aanvraag!
              </motion.h1>
            </div>
          </motion.section>
          <div className="container py-8 md:py-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto"
            >
              <BookingConfirmation
                jobId={bookingData.jobId}
                bookingType={bookingType!}
                serviceName={bookingData.serviceName}
                address={fullAddress}
                guestName={bookingData.guestName}
                guestPhone={bookingData.guestPhone}
                scheduledDate={date ? format(date, "d MMMM yyyy", { locale: nl }) : null}
                timeSlot={timeSlot}
              />
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="VoltFix - 24/7 Elektricien Service | Direct Online Boeken"
        description="Professionele elektricien 24/7 beschikbaar. Stroomstoring, kortsluiting, meterkast keuring, laadpaal installatie. Boek direct online, geen account nodig. Transparante prijzen vooraf zichtbaar."
        canonical="https://voltfix.nl"
      />
      <CustomerSiteStructuredData />
      <StructuredData type="Service" data={{
        name: "VoltFix Elektricien Service",
        description: "Professionele elektricien service in Nederland. 24/7 storingsdienst, meterkast keuringen, laadpaal installatie. Direct online boeken.",
      }} />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="hero-gradient text-primary-foreground py-10 md:py-14 lg:py-16">
          <div className="container">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-4"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                24/7 Storingsdienst beschikbaar
              </motion.div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-tight">
                Professionele Elektricien
                <br className="hidden sm:block" />
                <span className="text-primary-foreground/90"> Direct Boeken</span>
              </h1>
              <p className="text-primary-foreground/80 text-base md:text-lg max-w-2xl mx-auto">
                Snel, betrouwbaar en transparant. Geen account nodig.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Trust Indicators - Mobile visible */}
        <div className="border-b border-border bg-card py-4">
          <div className="container">
            <div className="flex items-center justify-center gap-4 md:gap-8 overflow-x-auto pb-1">
              {trustIndicators.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center gap-2 shrink-0"
                >
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xs md:text-sm">
                    <p className="font-semibold text-foreground leading-tight">{item.label}</p>
                    <p className="text-muted-foreground leading-tight">{item.sublabel}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="border-b border-border bg-background sticky top-16 z-40">
          <div className="container py-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {[
                { num: 1, label: "Type" },
                { num: 2, label: "Details" },
                { num: 3, label: "Gegevens" },
              ].map((s, idx) => {
                // Can only navigate back to completed steps
                const canNavigate = step > s.num;
                
                return (
                  <div key={s.num} className="flex items-center">
                    <motion.button
                      type="button"
                      onClick={() => canNavigate && setStep(s.num)}
                      className={cn(
                        "flex items-center gap-1.5 sm:gap-2",
                        canNavigate && "cursor-pointer"
                      )}
                      animate={{
                        scale: step === s.num ? 1.05 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                      disabled={!canNavigate}
                      aria-label={canNavigate ? `Terug naar stap ${s.num}: ${s.label}` : undefined}
                    >
                      <div className={cn(
                        "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-300",
                        step >= s.num 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "bg-muted text-muted-foreground",
                        canNavigate && "hover:ring-2 hover:ring-primary/30 hover:ring-offset-2"
                      )}>
                        {step > s.num ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : s.num}
                      </div>
                      <span className={cn(
                        "text-xs sm:text-sm font-medium hidden sm:block",
                        step >= s.num ? "text-foreground" : "text-muted-foreground",
                        canNavigate && "hover:underline"
                      )}>
                        {s.label}
                      </span>
                    </motion.button>
                    {idx < 2 && (
                      <div className={cn(
                        "w-8 sm:w-12 md:w-20 h-0.5 mx-1 sm:mx-2 transition-colors duration-300",
                        step > s.num ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="container py-6 md:py-10 lg:py-12">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Step 1: Type Selection */}
              {step === 1 && !bookingType && (
                <motion.div
                  key="step1-choice"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6 md:mb-8">
                    <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
                      Wat is je situatie?
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Kies het type afspraak dat je nodig hebt
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
                      onClick={() => setBookingType("emergency")}
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
                              SPOED
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-emergency/20 text-emergency text-xs font-semibold">
                              30 min
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Directe hulp nodig? Wij zijn er binnen 30 minuten.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {EMERGENCY_SERVICES.slice(0, 4).map((s) => (
                              <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emergency/10 text-xs text-foreground">
                                <Zap className="h-3 w-3 text-emergency" />
                                {s.label}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-emergency font-bold text-lg">
                              €{EMERGENCY_HOURLY_RATE} <span className="text-sm font-normal text-muted-foreground">excl. BTW / eerste uur</span>
                            </p>
                            <ArrowRight className="h-5 w-5 text-emergency opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    {/* Planned */}
                    <motion.button
                      variants={fadeInUp}
                      onClick={() => {
                        setBookingType("planned");
                        setStep(2);
                      }}
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
                              Vanaf €68
                            </p>
                            <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </motion.div>

                  {/* Emergency CTA */}
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
                      020 - 123 4567
                    </a>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 1: Emergency Service Selection */}
              {step === 1 && bookingType === "emergency" && (
                <motion.div
                  key="step1-emergency"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Phone CTA at top */}
                  <motion.a
                    href="tel:+31201234567"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-emergency text-emergency-foreground font-bold text-lg shadow-lg shadow-emergency/20"
                  >
                    <Phone className="h-6 w-6" />
                    <span>Bel direct: 020 - 123 4567</span>
                  </motion.a>

                  <div className="text-center mb-2">
                    <h2 className="font-display text-xl sm:text-2xl font-bold mb-1">
                      Selecteer je storing
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Of boek online via onderstaande opties
                    </p>
                  </div>

                  {/* Emergency Services Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EMERGENCY_SERVICES.map((service) => {
                      const IconComponent = service.icon;
                      return (
                        <motion.button
                          key={service.id}
                          type="button"
                          onClick={() => setSelectedEmergencyService(service.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "p-4 rounded-xl border-2 text-center transition-all",
                            selectedEmergencyService === service.id
                              ? "border-emergency bg-emergency/10 shadow-md"
                              : "border-border hover:border-emergency/50"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center",
                            selectedEmergencyService === service.id
                              ? "bg-emergency text-emergency-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <p className="font-medium text-sm">{service.label}</p>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Optional description - shown for all services */}
                  {selectedEmergencyService && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Beschrijf je storing{" "}
                          <span className="text-muted-foreground font-normal">(optioneel)</span>
                        </Label>
                        <textarea
                          value={emergencyDescription}
                          onChange={(e) => setEmergencyDescription(e.target.value)}
                          placeholder={selectedEmergencyService === "anders" 
                            ? "Beschrijf hier wat er aan de hand is..."
                            : "Extra informatie die kan helpen (optioneel)..."}
                          className="flex min-h-[100px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>

                      {/* Optional photo upload */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Foto toevoegen{" "}
                          <span className="text-muted-foreground font-normal">(optioneel, max 3)</span>
                        </Label>
                        <div className="flex flex-wrap gap-3">
                          {emergencyPhotos.map((photo, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Foto ${idx + 1}`}
                                className="w-20 h-20 rounded-lg object-cover border-2 border-border"
                              />
                              <button
                                type="button"
                                onClick={() => setEmergencyPhotos(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-md"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {emergencyPhotos.length < 3 && (
                            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors">
                              <Camera className="h-6 w-6 text-muted-foreground" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setEmergencyPhotos(prev => [...prev, file]);
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Pricing info */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Tarief eerste uur</span>
                      <span className="font-bold text-emergency text-lg">
                        €{EMERGENCY_HOURLY_RATE} <span className="text-sm font-normal text-muted-foreground">excl. BTW</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      90% van de storingen wordt binnen dit eerste uur gediagnosticeerd én opgelost. Mocht er meer tijd of materiaal nodig zijn, dan laat de elektricien dit altijd vooraf weten.
                    </p>
                  </motion.div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setBookingType(null);
                        setSelectedEmergencyService(null);
                        setEmergencyDescription("");
                        setEmergencyPhotos([]);
                      }}
                      className="flex-1 h-12 rounded-xl"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Terug
                    </Button>
                    <Button 
                      onClick={() => setStep(3)}
                      disabled={!selectedEmergencyService}
                      className="flex-1 h-12 rounded-xl font-semibold bg-emergency hover:bg-emergency/90"
                    >
                      Volgende
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Service & Schedule (Planned bookings only) */}
              {step === 2 && bookingType === "planned" && (
                <motion.div
                  key="step2"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6 md:mb-8">
                    <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
                      Wat wil je laten doen?
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Selecteer de dienst en kies een datum
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Service Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Dienst selecteren</Label>
                      <RadioGroup value={selectedService || ""} onValueChange={setSelectedService}>
                        <div className="grid gap-3">
                          {filteredServices.map((service) => (
                            <motion.label
                              key={service.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
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
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="font-bold text-primary shrink-0 ml-2">
                                €{Number(service.base_price).toFixed(0)}
                              </span>
                            </motion.label>
                          ))}
                        </div>
                      </RadioGroup>
                      
                      {/* Pricing hint */}
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <span>
                          Getoonde prijzen zijn basistarieven. Je ziet hieronder altijd de volledige prijsopbouw met toeslagen en korting.
                        </span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Datum kiezen</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12 rounded-xl border-2",
                              !date && "text-muted-foreground",
                              date && "border-primary bg-primary/5"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "EEEE d MMMM yyyy", { locale: nl }) : "Selecteer een datum"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Tijdslot kiezen</Label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {timeSlots.map((slot) => (
                          <motion.button
                            key={slot.value}
                            type="button"
                            onClick={() => setTimeSlot(slot.value)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "p-3 sm:p-4 rounded-xl border-2 text-center transition-all",
                              timeSlot === slot.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="text-xl mb-1">{slot.icon}</div>
                            <p className="font-medium text-sm sm:text-base">{slot.label}</p>
                            <p className="text-xs text-muted-foreground">{slot.time}</p>
                            {slot.value === "evening" && (
                              <p className="text-xs text-emergency font-medium mt-1">+25%</p>
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Live Price Breakdown */}
                    {priceBreakdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <PriceBreakdownCard
                          breakdown={priceBreakdown}
                          bookingType="planned"
                          compact
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
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
                      disabled={!selectedService || !date || !timeSlot}
                      className="flex-1 h-12 rounded-xl font-semibold"
                    >
                      Volgende
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Guest Details & Confirm */}
              {step === 3 && priceBreakdown && (bookingType === "emergency" ? selectedEmergencyService : selectedServiceData) && (
                <motion.div
                  key="step3"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6 md:mb-8">
                    <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
                      Vul je gegevens in
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Geen account nodig – we nemen direct contact met je op
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2">
                      <GuestBookingForm
                        serviceId={bookingType === "emergency" ? selectedEmergencyService! : selectedService!}
                        serviceName={bookingType === "emergency" 
                          ? selectedEmergencyServiceData?.label || "Spoed storing" 
                          : selectedServiceData?.name_nl || ""}
                        bookingType={bookingType!}
                        scheduledDate={date ? format(date, "yyyy-MM-dd") : null}
                        timeSlot={timeSlot}
                        basePrice={bookingType === "emergency" ? EMERGENCY_HOURLY_RATE : Number(selectedServiceData?.base_price || 0)}
                        finalPrice={priceBreakdown.total}
                        priceBreakdown={priceBreakdown}
                        onSuccess={handleBookingSuccess}
                        onBack={() => setStep(bookingType === "emergency" ? 1 : 2)}
                        emergencyDescription={emergencyDescription}
                        emergencyPhotos={emergencyPhotos}
                      />
                    </div>

                    {/* Summary Sidebar - Hidden on mobile, shown at bottom */}
                    <div className="hidden lg:block space-y-4">
                      <div className="bg-card rounded-2xl border border-border p-6 space-y-4 sticky top-32">
                        <h3 className="font-display font-bold text-lg">Samenvatting</h3>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className={cn(
                              "font-medium",
                              bookingType === "emergency" && "text-emergency"
                            )}>
                              {bookingType === "emergency" ? "SPOED" : "Gepland"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Storing</span>
                            <span className="font-medium text-right">
                              {bookingType === "emergency" 
                                ? selectedEmergencyServiceData?.label || "Spoed storing"
                                : selectedServiceData?.name_nl || ""}
                            </span>
                          </div>
                          {bookingType === "planned" && date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Datum</span>
                              <span className="font-medium">
                                {format(date, "d MMMM", { locale: nl })}
                              </span>
                            </div>
                          )}
                          {bookingType === "planned" && timeSlot && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tijd</span>
                              <span className="font-medium">
                                {timeSlots.find(t => t.value === timeSlot)?.label}
                              </span>
                            </div>
                          )}
                          {bookingType === "emergency" && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Wanneer</span>
                              <span className="font-medium text-emergency">
                                Binnen 30 min
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price Breakdown in Sidebar */}
                      <PriceBreakdownCard
                        breakdown={priceBreakdown}
                        bookingType={bookingType!}
                      />
                    </div>
                  </div>

                  {/* Mobile Price Summary - Sticky at bottom */}
                  <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-50">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                      <div>
                        <p className="text-xs text-muted-foreground">Totaal (incl. BTW)</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          bookingType === "emergency" ? "text-emergency" : "text-primary"
                        )}>
                          €{priceBreakdown.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-4 w-4 text-success" />
                        Geen verborgen kosten
                      </div>
                    </div>
                  </div>
                  {/* Spacer for fixed bottom bar on mobile */}
                  <div className="h-24 lg:hidden" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
