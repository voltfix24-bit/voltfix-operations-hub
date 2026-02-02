import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { getSiteMode, isBackofficeRoute, isCustomerRoute } from "@/lib/subdomain";

// Customer pages
import Index from "./pages/Index";
import Book from "./pages/Book";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Backoffice pages
import CustomerDashboard from "./pages/CustomerDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Shared
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "technician") return <Navigate to="/technician" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirect authenticated users away from auth pages
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "technician") return <Navigate to="/technician" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Customer site routes (public, SEO-optimized)
function CustomerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/book" element={<Book />} />
      <Route path="/book/*" element={<Book />} />
      {/* Track booking status (future) */}
      <Route path="/track/:id" element={<Book />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Backoffice routes (authenticated, not indexed)
function BackofficeRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

      {/* Customer dashboard */}
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/dashboard/*" 
        element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>} 
      />

      {/* Technician dashboard */}
      <Route 
        path="/technician" 
        element={<ProtectedRoute allowedRoles={["technician"]}><TechnicianDashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/technician/*" 
        element={<ProtectedRoute allowedRoles={["technician"]}><TechnicianDashboard /></ProtectedRoute>} 
      />

      {/* Admin dashboard */}
      <Route 
        path="/admin" 
        element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/admin/*" 
        element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} 
      />

      {/* Redirect root to login on backoffice subdomain */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Development mode: all routes available
function DevelopmentRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/book" element={<Book />} />
      <Route path="/book/*" element={<Book />} />
      
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

      {/* Customer routes */}
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/dashboard/*" 
        element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>} 
      />

      {/* Technician routes */}
      <Route 
        path="/technician" 
        element={<ProtectedRoute allowedRoles={["technician"]}><TechnicianDashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/technician/*" 
        element={<ProtectedRoute allowedRoles={["technician"]}><TechnicianDashboard /></ProtectedRoute>} 
      />

      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/admin/*" 
        element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} 
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppRoutes() {
  const siteMode = getSiteMode();
  
  switch (siteMode) {
    case "customer":
      return <CustomerRoutes />;
    case "backoffice":
      return <BackofficeRoutes />;
    default:
      return <DevelopmentRoutes />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
