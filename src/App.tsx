import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Book from "./pages/Book";
import CustomerDashboard from "./pages/CustomerDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
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
    // Redirect to appropriate dashboard based on role
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

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/book" element={<Book />} />
      
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

      {/* Customer routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Technician routes */}
      <Route 
        path="/technician" 
        element={
          <ProtectedRoute allowedRoles={["technician"]}>
            <TechnicianDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/technician/*" 
        element={
          <ProtectedRoute allowedRoles={["technician"]}>
            <TechnicianDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
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
