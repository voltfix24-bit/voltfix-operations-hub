import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Settings, LogOut, LayoutDashboard, Phone } from "lucide-react";

export function Header() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardPath = () => {
    switch (role) {
      case "admin":
        return "/admin";
      case "technician":
        return "/technician";
      default:
        return "/dashboard";
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/book" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Boeken
          </Link>
          <a 
            href="tel:+31201234567" 
            className="flex items-center gap-2 text-sm font-semibold text-emergency hover:text-emergency/80 transition-colors"
          >
            <Phone className="h-4 w-4" />
            020 - 123 4567
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Gebruiker"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getDashboardPath())}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profiel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Instellingen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Inloggen</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Registreren</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
