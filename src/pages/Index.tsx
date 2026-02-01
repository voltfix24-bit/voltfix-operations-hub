import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Clock, 
  Shield, 
  Phone, 
  CheckCircle, 
  ArrowRight,
  Star,
  Users,
  Award
} from "lucide-react";

const services = [
  { name: "Stroomstoring", icon: Zap, emergency: true },
  { name: "Kortsluiting", icon: Zap, emergency: true },
  { name: "Meterkast keuring", icon: Shield, emergency: false },
  { name: "Laadpaal installatie", icon: Zap, emergency: false },
  { name: "Verlichting", icon: Zap, emergency: false },
  { name: "Stopcontacten", icon: Zap, emergency: false },
];

const features = [
  {
    icon: Clock,
    title: "Binnen 30 minuten",
    description: "Bij spoed zijn we er razendsnel. Dag en nacht, 7 dagen per week.",
  },
  {
    icon: Shield,
    title: "Transparante prijzen",
    description: "Geen verborgen kosten. Je weet vooraf precies wat je betaalt.",
  },
  {
    icon: Award,
    title: "Gecertificeerde monteurs",
    description: "Al onze elektriciens zijn NEN-gecertificeerd en verzekerd.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="hero-gradient text-primary-foreground py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6">
              <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
              24/7 Storingsdienst beschikbaar
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Professionele elektricien
              <br />
              <span className="text-primary-foreground/90">wanneer u het nodig heeft</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Snel, betrouwbaar en transparant. VoltFix staat 24/7 voor u klaar 
              bij elektrische storingen en installaties door heel Nederland.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-emergency hover:bg-emergency/90 text-emergency-foreground font-semibold text-lg h-14 px-8 shadow-emergency"
                asChild
              >
                <a href="tel:+31201234567">
                  <Phone className="mr-2 h-5 w-5" />
                  Bel direct: 020 - 123 4567
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="secondary"
                className="font-semibold text-lg h-14 px-8"
                asChild
              >
                <Link to="/book">
                  Online boeken
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-10 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Geen voorrijkosten
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Transparante prijzen
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Gecertificeerd
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-card border-b border-border py-6">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-warning fill-warning" />
                ))}
              </div>
              <span className="font-semibold">4.9/5</span>
              <span className="text-muted-foreground">op Google</span>
            </div>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">2.500+</span>
              <span className="text-muted-foreground">tevreden klanten</span>
            </div>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">NEN 3140 gecertificeerd</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Waarom VoltFix?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Wij combineren vakmanschap met snelle service en eerlijke prijzen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 md:py-24 surface-gradient">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Onze diensten
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Van noodgevallen tot installaties - wij helpen u met alle elektrische werkzaamheden
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service, index) => (
              <Link
                key={index}
                to="/book"
                className="group flex items-center gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  service.emergency ? "bg-emergency/10" : "bg-primary/10"
                }`}>
                  <service.icon className={`h-6 w-6 ${
                    service.emergency ? "text-emergency" : "text-primary"
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  {service.emergency && (
                    <span className="text-xs text-emergency font-medium">
                      24/7 Spoeddienst
                    </span>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link to="/book">
                Bekijk alle diensten
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Elektrisch probleem?
            </h2>
            <p className="text-lg text-background/70 mb-8">
              Neem direct contact met ons op. We staan 24/7 voor u klaar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-emergency hover:bg-emergency/90 font-semibold text-lg h-14 px-8"
                asChild
              >
                <a href="tel:+31201234567">
                  <Phone className="mr-2 h-5 w-5" />
                  020 - 123 4567
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-background/30 text-background hover:bg-background/10 font-semibold text-lg h-14 px-8"
                asChild
              >
                <Link to="/book">
                  Plan een afspraak
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
