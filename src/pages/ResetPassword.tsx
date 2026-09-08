import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/Logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // The recovery link creates a temporary session; wait for it.
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }
    if (password !== confirm) {
      setError("De wachtwoorden zijn niet gelijk.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("Opslaan mislukt. Vraag een nieuwe herstellink aan.");
    } else {
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
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
              Nieuw wachtwoord
            </h1>
            <p className="text-muted-foreground mt-2">
              Kies een nieuw wachtwoord voor je account.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Je wachtwoord is gewijzigd. Je wordt doorgestuurd naar het inlogscherm.
              </p>
              <Button asChild className="w-full h-11">
                <Link to="/login">Nu inloggen</Link>
              </Button>
            </div>
          ) : !ready ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Deze link is verlopen of al gebruikt. Vraag een nieuwe herstellink aan.
              </p>
              <Button asChild variant="outline" className="w-full h-11">
                <Link to="/forgot-password">Nieuwe link aanvragen</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">Nieuw wachtwoord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Bevestig wachtwoord</Label>
                <Input
                  id="confirm"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  "Wachtwoord opslaan"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
