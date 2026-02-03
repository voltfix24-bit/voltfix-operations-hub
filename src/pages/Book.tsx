import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData, CustomerSiteStructuredData } from "@/components/seo/StructuredData";
import { BookingTypeSelector } from "@/components/booking/BookingTypeSelector";
import { EmergencyLanding } from "@/components/booking/EmergencyLanding";
import { EmergencyFlow } from "@/components/booking/EmergencyFlow";
import { PlannedLanding } from "@/components/booking/PlannedLanding";
import { PlannedFlow } from "@/components/booking/PlannedFlow";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { Shield, Star, Users, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingType = "emergency" | "planned";
type FlowState = "selector" | "emergency-landing" | "emergency-flow" | "planned-landing" | "planned-flow" | "complete";

interface BookingData {
  jobId: string;
  serviceName: string;
  address: string;
  guestName: string;
  guestPhone: string;
  city?: string;
  postalCode?: string;
  bookingType: BookingType;
  scheduledDate?: Date;
  timeSlot?: string;
}

const trustIndicators = [
  { icon: Shield, label: "Gecertificeerd", sublabel: "NEN 3140" },
  { icon: Star, label: "4.9/5 sterren", sublabel: "500+ reviews" },
  { icon: Users, label: "10.000+", sublabel: "tevreden klanten" },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function Book() {
  const [flowState, setFlowState] = useState<FlowState>("selector");
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const handleTypeSelect = (type: BookingType) => {
    setBookingType(type);
    if (type === "emergency") {
      setFlowState("emergency-landing");
    } else {
      setFlowState("planned-landing");
    }
  };

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
      serviceName: bookingType === "emergency" ? "Spoedstoring" : "Geplande werkzaamheden",
      address: payload.address,
      guestName: payload.guestName,
      guestPhone: payload.guestPhone,
      city: payload.city,
      postalCode: payload.postalCode,
      bookingType: bookingType!,
    });
    setFlowState("complete");
  };

  const handleBackToSelector = () => {
    setFlowState("selector");
    setBookingType(null);
  };

  // Show confirmation page
  if (flowState === "complete" && bookingData) {
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
                bookingType={bookingData.bookingType}
                serviceName={bookingData.serviceName}
                address={fullAddress}
                guestName={bookingData.guestName}
                guestPhone={bookingData.guestPhone}
                scheduledDate={bookingData.scheduledDate 
                  ? format(bookingData.scheduledDate, "d MMMM yyyy", { locale: nl }) 
                  : null}
                timeSlot={bookingData.timeSlot || null}
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
        {/* Hero - Only show on selector */}
        {flowState === "selector" && (
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
        )}

        {/* Trust Indicators - Always visible on selector */}
        {flowState === "selector" && (
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
        )}

        {/* Main Content Area */}
        <div className="container py-6 md:py-10 lg:py-12">
          <div className="max-w-lg mx-auto">
            <AnimatePresence mode="wait">
              {/* Type Selector */}
              {flowState === "selector" && (
                <motion.div
                  key="selector"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <BookingTypeSelector onSelect={handleTypeSelect} />
                </motion.div>
              )}

              {/* Emergency Landing */}
              {flowState === "emergency-landing" && (
                <motion.div
                  key="emergency-landing"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <EmergencyLanding 
                    onStartOnline={() => setFlowState("emergency-flow")} 
                  />
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleBackToSelector}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      ← Terug naar keuze
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Emergency Flow */}
              {flowState === "emergency-flow" && (
                <motion.div
                  key="emergency-flow"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <EmergencyFlow 
                    onBack={() => setFlowState("emergency-landing")}
                    onSuccess={handleBookingSuccess}
                  />
                </motion.div>
              )}

              {/* Planned Landing */}
              {flowState === "planned-landing" && (
                <motion.div
                  key="planned-landing"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <PlannedLanding 
                    onStart={() => setFlowState("planned-flow")} 
                  />
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleBackToSelector}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      ← Terug naar keuze
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Planned Flow */}
              {flowState === "planned-flow" && (
                <motion.div
                  key="planned-flow"
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <PlannedFlow 
                    onBack={() => setFlowState("planned-landing")}
                    onSuccess={handleBookingSuccess}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky Mobile Phone Bar - Only during emergency flow */}
        {(flowState === "emergency-flow") && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-emergency/95 backdrop-blur-sm border-t border-emergency z-50">
            <a
              href="tel:+31201234567"
              className="flex items-center justify-center gap-2 text-emergency-foreground font-bold text-lg"
            >
              <Phone className="h-5 w-5" />
              <span>Bel direct: 020 – 123 4567</span>
            </a>
          </div>
        )}

        {/* Spacer for sticky bar */}
        {flowState === "emergency-flow" && (
          <div className="h-16 lg:hidden" />
        )}
      </main>

      <Footer />
    </div>
  );
}
