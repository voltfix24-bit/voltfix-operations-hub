import { Logo } from "@/components/ui/Logo";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo variant="light" size="lg" />
            <p className="text-sm text-background/60">
              24/7 elektricien service in heel Nederland. Snel, betrouwbaar en transparant.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="tel:+31201234567" 
                  className="flex items-center gap-2 text-sm hover:text-background transition-colors"
                >
                  <Phone className="h-4 w-4 text-emergency" />
                  020 - 123 4567
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@voltfix.nl" 
                  className="flex items-center gap-2 text-sm hover:text-background transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  info@voltfix.nl
                </a>
              </li>
              <li>
                <span className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  Amsterdam, Nederland
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background mb-4">Diensten</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-background transition-colors">Stroomstoring</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Kortsluiting</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Meterkast keuring</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Laadpaal installatie</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-background mb-4">Openingstijden</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse"></span>
                24/7 Spoeddienst
              </p>
              <p className="text-background/60">
                Ma - Vr: 08:00 - 18:00<br />
                Za - Zo: Op afspraak
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50">
            © 2024 VoltFix. Alle rechten voorbehouden.
          </p>
          <div className="flex gap-6 text-xs text-background/50">
            <a href="#" className="hover:text-background transition-colors">Privacybeleid</a>
            <a href="#" className="hover:text-background transition-colors">Algemene voorwaarden</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
