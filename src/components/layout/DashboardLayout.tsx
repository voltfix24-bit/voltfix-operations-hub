import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  User,
  Settings,
  LogOut,
  Users,
  Wrench,
  DollarSign,
  ClipboardList,
  Menu,
  X,
  Phone,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mijn Boekingen", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "Facturen", href: "/dashboard/invoices", icon: FileText },
  { label: "Profiel", href: "/dashboard/profile", icon: User },
];

const technicianNav: NavItem[] = [
  { label: "Dashboard", href: "/technician", icon: LayoutDashboard },
  { label: "Mijn Opdrachten", href: "/technician/jobs", icon: ClipboardList },
  { label: "Beschikbaarheid", href: "/technician/availability", icon: CalendarDays },
  { label: "Profiel", href: "/technician/profile", icon: User },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Opdrachten", href: "/admin/jobs", icon: ClipboardList },
  { label: "Klanten", href: "/admin/customers", icon: Users },
  { label: "Monteurs", href: "/admin/technicians", icon: Wrench },
  { label: "Prijzen", href: "/admin/pricing", icon: DollarSign },
  { label: "Instellingen", href: "/admin/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = role === "admin" 
    ? adminNav 
    : role === "technician" 
      ? technicianNav 
      : customerNav;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="light" size="md" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Emergency CTA */}
          <div className="p-4 border-t border-sidebar-border">
            <a
              href="tel:+31201234567"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emergency text-emergency-foreground text-sm font-semibold hover:bg-emergency/90 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Spoed: 020 - 123 4567
            </a>
          </div>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-primary-foreground">
                  {profile?.full_name?.slice(0, 2).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "Gebruiker"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {role === "customer" ? "Klant" : role === "technician" ? "Monteur" : "Admin"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 lg:hidden flex items-center justify-between p-4 bg-background border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Logo size="sm" />
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
