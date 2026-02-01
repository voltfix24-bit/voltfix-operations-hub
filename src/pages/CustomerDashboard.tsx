import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge, UrgencyBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Phone
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Job {
  id: string;
  status: "requested" | "confirmed" | "on_the_way" | "in_progress" | "completed" | "cancelled";
  urgency: "emergency" | "planned";
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  address: string;
  final_price: number | null;
  created_at: string;
  service_types: {
    name_nl: string;
  } | null;
}

export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const justBooked = searchParams.get("booked") === "true";

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        status,
        urgency,
        scheduled_date,
        scheduled_time_slot,
        address,
        final_price,
        created_at,
        service_types (name_nl)
      `)
      .eq("customer_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setJobs(data as unknown as Job[]);
    }
    setLoading(false);
  };

  const activeJobs = jobs.filter(j => 
    !["completed", "cancelled"].includes(j.status)
  );

  const completedCount = jobs.filter(j => j.status === "completed").length;

  const getTimeSlotLabel = (slot: string | null) => {
    switch (slot) {
      case "morning": return "Ochtend (08:00-12:00)";
      case "afternoon": return "Middag (12:00-17:00)";
      case "evening": return "Avond (17:00-21:00)";
      default: return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Welkom{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Beheer je boekingen en bekijk je historie
            </p>
          </div>
          <Button asChild>
            <Link to="/book">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe boeking
            </Link>
          </Button>
        </div>

        {/* Success Alert */}
        {justBooked && (
          <Alert className="border-success bg-success-light">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              Je boeking is succesvol geplaatst! We nemen zo snel mogelijk contact met je op.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeJobs.length}</p>
                <p className="text-sm text-muted-foreground">Actieve boekingen</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Voltooide opdrachten</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emergency-light border-emergency/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emergency">
                  <Phone className="h-5 w-5 text-emergency-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Spoed?</p>
                  <a 
                    href="tel:+31201234567" 
                    className="text-lg font-bold text-emergency hover:underline"
                  >
                    020 - 123 4567
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Actieve Boekingen</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/bookings">
                Alles bekijken
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Je hebt nog geen actieve boekingen
                </p>
                <Button asChild>
                  <Link to="/book">Boek nu</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div 
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {job.service_types?.name_nl || "Dienst"}
                        </span>
                        <UrgencyBadge urgency={job.urgency} />
                        <StatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {job.scheduled_date ? (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {format(new Date(job.scheduled_date), "d MMMM yyyy", { locale: nl })}
                            {job.scheduled_time_slot && ` • ${getTimeSlotLabel(job.scheduled_time_slot)}`}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emergency">
                            <AlertCircle className="h-4 w-4" />
                            ASAP - Spoedopdracht
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{job.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {job.final_price && (
                        <span className="text-lg font-bold text-primary">
                          €{Number(job.final_price).toFixed(2)}
                        </span>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/bookings/${job.id}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
