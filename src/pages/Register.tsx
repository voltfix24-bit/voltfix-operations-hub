import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens bevatten.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes("already registered")) {
          setError("Dit e-mailadres is al geregistreerd. Probeer in te loggen.");
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen surface-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Controleer je inbox
            </h1>
            <p className="text-muted-foreground mb-6">
              We hebben een bevestigingslink gestuurd naar <strong>{email}</strong>. 
              Klik op de link om je account te activeren.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Naar inloggen</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 animate-scale-in">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex justify-center mb-6">
              <Logo size="lg" />
            </Link>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Account aanmaken
            </h1>
            <p className="text-muted-foreground mt-2">
              Registreer voor toegang tot alle VoltFix diensten
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimaal 6 tekens"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Wachtwoord bevestigen</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Herhaal je wachtwoord"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met registreren...
                </>
              ) : (
                "Account aanmaken"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Heb je al een account?{" "}
            <Link to="/login" className="text-primary font-medium hover:text-primary/80">
              Inloggen
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Door te registreren ga je akkoord met onze{" "}
          <a href="#" className="underline hover:text-foreground">
            voorwaarden
          </a>{" "}
          en{" "}
          <a href="#" className="underline hover:text-foreground">
            privacybeleid
          </a>
          .
        </p>
      </div>
    </div>
  );
}
