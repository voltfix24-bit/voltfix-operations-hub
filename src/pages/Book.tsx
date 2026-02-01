import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle,
  Info
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

// ========== PRICING CONFIG ==========
const PRICING = {
  vatRate: 0.21,
  plannedDiscountPct: 0.10,        // -10%
  emergencySurchargePct: 0.50,     // +50%
  emergencyCalloutFee: 25,         // vaste voorrijkosten
  eveningSurchargePct: 0.25,       // +25%
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

  // Line 1: Base price
  lines.push({
    label: "Basistarief (dienst)",
    amount: basePrice,
  });

  if (bookingType === "planned") {
    // Planned discount
    const discount = -(basePrice * PRICING.plannedDiscountPct);
    lines.push({
      label: "Korting gepland (-10%)",
      amount: discount,
      hint: "Bespaar door vooruit te plannen",
    });
    runningTotal += discount;
  } else {
    // Emergency surcharge
    const surcharge = basePrice * PRICING.emergencySurchargePct;
    lines.push({
      label: "Spoedtoeslag (+50%)",
      amount: surcharge,
      hint: "Directe inzet binnen 30 minuten",
    });
    runningTotal += surcharge;

    // Callout fee
    lines.push({
      label: "Starttarief (incl. voorrijkosten)",
      amount: PRICING.emergencyCalloutFee,
    });
    runningTotal += PRICING.emergencyCalloutFee;
  }

  // Evening surcharge
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

  // Calculate VAT and totals
  const subtotal = Math.round(runningTotal * 100) / 100;
  const vat = Math.round(subtotal * PRICING.vatRate * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  return { lines, subtotal, vat, total };
}

const timeSlots = [
  { value: "morning" as TimeSlot, label: "Ochtend", time: "08:00 - 12:00" },
  { value: "afternoon" as TimeSlot, label: "Middag", time: "12:00 - 17:00" },
  { value: "evening" as TimeSlot, label: "Avond", time: "17:00 - 21:00" },
];

const emergencyServices = [
  "Stroomstoring",
  "Kortsluiting",
  "Brandlucht",
  "Water in meterkast",
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

  const filteredServices = services.filter(s => 
    bookingType === "emergency" ? s.is_emergency_eligible : true
  );

  const selectedServiceData = services.find(s => s.id === selectedService);

  // Build price breakdown
  const priceBreakdown = selectedServiceData && bookingType
    ? buildPriceBreakdown({
        basePrice: Number(selectedServiceData.base_price),
        bookingType,
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
          <section className="hero-gradient text-primary-foreground py-12 md:py-16">
            <div className="container text-center">
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Bedankt voor je aanvraag!
              </h1>
            </div>
          </section>
          <div className="container py-8 md:py-12">
            <div className="max-w-xl mx-auto">
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
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="hero-gradient text-primary-foreground py-12 md:py-16">
          <div className="container text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Elektricien Aanvragen
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Snel, betrouwbaar en transparant. Geen account nodig.
            </p>
          </div>
        </section>

        {/* Progress */}
        <div className="border-b border-border bg-card">
          <div className="container py-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                    step >= s 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={cn(
                      "w-12 md:w-24 h-0.5 mx-2",
                      step > s ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="container py-8 md:py-12">
          <div className="max-w-3xl mx-auto">

            {/* Step 1: Type Selection */}
            {step === 1 && (
              <div className="animate-fade-in space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Wat is je situatie?
                  </h2>
                  <p className="text-muted-foreground">
                    Kies het type afspraak dat je nodig hebt
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Emergency */}
                  <button
                    onClick={() => {
                      setBookingType("emergency");
                      setStep(2);
                    }}
                    className={cn(
                      "group p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg",
                      "border-emergency/30 bg-emergency-light hover:border-emergency"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-emergency text-emergency-foreground">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-foreground mb-1">
                          SPOED
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Directe hulp nodig? Wij zijn er binnen 30 minuten.
                        </p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {emergencyServices.map((s) => (
                            <li key={s} className="flex items-center gap-2">
                              <Zap className="h-3 w-3 text-emergency" />
                              {s}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 text-emergency font-semibold">
                          Vanaf €125
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Planned */}
                  <button
                    onClick={() => {
                      setBookingType("planned");
                      setStep(2);
                    }}
                    className={cn(
                      "group p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg",
                      "border-border bg-card hover:border-primary"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                        <CalendarIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-foreground mb-1">
                          Gepland
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Plan een afspraak op een moment dat jou uitkomt.
                        </p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-success" />
                            Kies je eigen datum
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-success" />
                            Ochtend, middag of avond
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-success" />
                            Lagere tarieven
                          </li>
                        </ul>
                        <p className="mt-4 text-primary font-semibold">
                          Vanaf €68
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Emergency CTA */}
                <div className="mt-8 p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Liever direct bellen?
                  </p>
                  <a
                    href="tel:+31201234567"
                    className="inline-flex items-center gap-2 text-emergency font-semibold hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    020 - 123 4567
                  </a>
                </div>
              </div>
            )}

            {/* Step 2: Service & Schedule */}
            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold mb-2">
                    {bookingType === "emergency" ? "Wat is het probleem?" : "Wat wil je laten doen?"}
                  </h2>
                  <p className="text-muted-foreground">
                    Selecteer de dienst {bookingType === "planned" && "en kies een datum"}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Service Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Dienst selecteren</Label>
                    <RadioGroup value={selectedService || ""} onValueChange={setSelectedService}>
                      <div className="grid gap-3">
                        {filteredServices.map((service) => (
                          <label
                            key={service.id}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                              selectedService === service.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={service.id} />
                              <div>
                                <p className="font-medium">{service.name_nl}</p>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-semibold text-primary">
                              €{Number(service.base_price).toFixed(0)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                    
                    {/* Pricing hint */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                      <Info className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Getoonde prijzen zijn basistarieven. Je ziet hieronder altijd de volledige prijsopbouw met toeslagen en korting.
                      </span>
                    </div>
                  </div>

                  {/* Date & Time (Planned only) */}
                  {bookingType === "planned" && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Datum kiezen</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-12",
                                !date && "text-muted-foreground"
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
                        <div className="grid grid-cols-3 gap-3">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => setTimeSlot(slot.value)}
                              className={cn(
                                "p-4 rounded-lg border-2 text-center transition-all",
                                timeSlot === slot.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <p className="font-medium">{slot.label}</p>
                              <p className="text-sm text-muted-foreground">{slot.time}</p>
                              {slot.value === "evening" && (
                                <p className="text-xs text-muted-foreground mt-1">+25%</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Emergency notice */}
                  {bookingType === "emergency" && (
                    <div className="p-4 rounded-xl bg-emergency-light border border-emergency/30">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-emergency mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">
                            ASAP – Binnen 30 minuten
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Een monteur wordt direct naar je toe gestuurd
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Price Breakdown */}
                  {priceBreakdown && (
                    <PriceBreakdownCard
                      breakdown={priceBreakdown}
                      bookingType={bookingType!}
                      compact
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Terug
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!selectedService || (bookingType === "planned" && (!date || !timeSlot))}
                    className="flex-1"
                  >
                    Volgende
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Guest Details & Confirm */}
            {step === 3 && selectedServiceData && priceBreakdown && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Vul je gegevens in
                  </h2>
                  <p className="text-muted-foreground">
                    Geen account nodig – we nemen direct contact met je op
                  </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Form */}
                  <div className="lg:col-span-2">
                    <GuestBookingForm
                      serviceId={selectedService!}
                      serviceName={selectedServiceData.name_nl}
                      bookingType={bookingType!}
                      scheduledDate={date ? format(date, "yyyy-MM-dd") : null}
                      timeSlot={timeSlot}
                      basePrice={Number(selectedServiceData.base_price)}
                      finalPrice={priceBreakdown.total}
                      priceBreakdown={priceBreakdown}
                      onSuccess={handleBookingSuccess}
                      onBack={() => setStep(2)}
                    />
                  </div>

                  {/* Summary Sidebar */}
                  <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border p-6 space-y-4 sticky top-4">
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
                          <span className="text-muted-foreground">Dienst</span>
                          <span className="font-medium">{selectedServiceData.name_nl}</span>
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
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
