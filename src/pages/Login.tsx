import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, role } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Ongeldige inloggegevens. Controleer je e-mail en wachtwoord.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Je e-mail is nog niet bevestigd. Controleer je inbox.");
        } else {
          setError(error.message);
        }
      } else {
        // Redirect based on role (will be set after login)
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
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
              Welkom terug
            </h1>
            <p className="text-muted-foreground mt-2">
              Log in op je VoltFix account
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Wachtwoord</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met inloggen...
                </>
              ) : (
                "Inloggen"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Nog geen account?{" "}
            <Link to="/register" className="text-primary font-medium hover:text-primary/80">
              Registreren
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Door in te loggen ga je akkoord met onze{" "}
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
