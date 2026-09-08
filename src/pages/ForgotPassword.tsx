import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Versturen mislukt. Probeer het later opnieuw.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen surface-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 animate-scale-in">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex justify-center mb-6">
              <Logo size="lg" />
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Wachtwoord vergeten
            </h1>
            <p className="text-muted-foreground mt-2">
              We sturen je een link om een nieuw wachtwoord te kiezen.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Check je inbox op <span className="font-medium text-foreground">{email}</span>.
                De link is 1 uur geldig. Niets ontvangen? Kijk ook in je spam.
              </p>
              <Button asChild variant="outline" className="w-full h-11">
                <Link to="/login">Terug naar inloggen</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@voorbeeld.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Versturen...
                  </>
                ) : (
                  "Herstellink versturen"
                )}
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Terug naar inloggen
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
