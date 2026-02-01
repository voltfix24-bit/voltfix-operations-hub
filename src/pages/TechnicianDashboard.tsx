import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge, UrgencyBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  MapPin,
  Navigation,
  Phone,
  AlertTriangle,
  Wrench
} from "lucide-react";

interface Job {
  id: string;
  status: "requested" | "confirmed" | "on_the_way" | "in_progress" | "completed" | "cancelled";
  urgency: "emergency" | "planned";
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  address: string;
  city: string | null;
  postal_code: string | null;
  description: string | null;
  final_price: number | null;
  created_at: string;
  service_types: {
    name_nl: string;
  } | null;
  profiles: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

export default function TechnicianDashboard() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTechnicianData();
    }
  }, [user]);

  const fetchTechnicianData = async () => {
    // Get technician record
    const { data: techData } = await supabase
      .from("technicians")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (techData) {
      setTechnicianId(techData.id);
      fetchJobs(techData.id);
    } else {
      setLoading(false);
    }
  };

  const fetchJobs = async (techId: string) => {
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
        city,
        postal_code,
        description,
        final_price,
        created_at,
        service_types (name_nl),
        profiles!jobs_customer_id_fkey (full_name, phone)
      `)
      .eq("technician_id", techId)
      .in("status", ["confirmed", "on_the_way", "in_progress"])
      .order("urgency", { ascending: false })
      .order("scheduled_date", { ascending: true });

    if (data) {
      setJobs(data as unknown as Job[]);
    }
    setLoading(false);
  };

  const updateJobStatus = async (jobId: string, newStatus: "confirmed" | "on_the_way" | "in_progress" | "completed") => {
    await supabase
      .from("jobs")
      .update({ 
        status: newStatus,
        ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {})
      })
      .eq("id", jobId);

    if (technicianId) {
      fetchJobs(technicianId);
    }
  };

  const todayJobs = jobs.filter(j => {
    if (!j.scheduled_date) return j.urgency === "emergency";
    const today = new Date().toISOString().split("T")[0];
    return j.scheduled_date === today;
  });

  const emergencyJobs = jobs.filter(j => j.urgency === "emergency");

  const getTimeSlotLabel = (slot: string | null) => {
    switch (slot) {
      case "morning": return "Ochtend";
      case "afternoon": return "Middag";
      case "evening": return "Avond";
      default: return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Welkom{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Je hebt vandaag {todayJobs.length} opdracht{todayJobs.length !== 1 ? "en" : ""}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayJobs.length}</p>
                <p className="text-sm text-muted-foreground">Vandaag</p>
              </div>
            </CardContent>
          </Card>
          <Card className={emergencyJobs.length > 0 ? "bg-emergency-light border-emergency/20" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${emergencyJobs.length > 0 ? "bg-emergency" : "bg-muted"}`}>
                <AlertTriangle className={`h-5 w-5 ${emergencyJobs.length > 0 ? "text-emergency-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{emergencyJobs.length}</p>
                <p className="text-sm text-muted-foreground">Spoedopdrachten</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{jobs.filter(j => j.status === "in_progress").length}</p>
                <p className="text-sm text-muted-foreground">Bezig</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Jobs First */}
        {emergencyJobs.length > 0 && (
          <Card className="border-emergency/30 bg-emergency-light">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-emergency">
                <AlertTriangle className="h-5 w-5" />
                Spoedopdrachten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {emergencyJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onUpdateStatus={updateJobStatus}
                  getTimeSlotLabel={getTimeSlotLabel}
                  isEmergency
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Mijn Opdrachten</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : jobs.filter(j => j.urgency !== "emergency").length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Geen geplande opdrachten op dit moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.filter(j => j.urgency !== "emergency").map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onUpdateStatus={updateJobStatus}
                    getTimeSlotLabel={getTimeSlotLabel}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function JobCard({ 
  job, 
  onUpdateStatus,
  getTimeSlotLabel,
  isEmergency = false 
}: { 
  job: Job; 
  onUpdateStatus: (id: string, status: string) => void;
  getTimeSlotLabel: (slot: string | null) => string;
  isEmergency?: boolean;
}) {
  const getNextStatus = (current: string) => {
    switch (current) {
      case "confirmed": return "on_the_way";
      case "on_the_way": return "in_progress";
      case "in_progress": return "completed";
      default: return null;
    }
  };

  const getNextStatusLabel = (current: string) => {
    switch (current) {
      case "confirmed": return "Onderweg";
      case "on_the_way": return "Begonnen";
      case "in_progress": return "Afronden";
      default: return null;
    }
  };

  const nextStatus = getNextStatus(job.status);
  const nextLabel = getNextStatusLabel(job.status);

  return (
    <div className={`p-4 rounded-lg border ${isEmergency ? "bg-card border-emergency/30" : "border-border"}`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{job.service_types?.name_nl}</span>
            <UrgencyBadge urgency={job.urgency} />
            <StatusBadge status={job.status} />
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{job.profiles?.full_name || "Klant"}</span>
            {job.profiles?.phone && (
              <a 
                href={`tel:${job.profiles.phone}`}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                {job.profiles.phone}
              </a>
            )}
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {job.address}
              {job.postal_code && `, ${job.postal_code}`}
              {job.city && ` ${job.city}`}
            </span>
          </div>

          {/* Schedule */}
          {job.scheduled_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(job.scheduled_date), "EEEE d MMMM", { locale: nl })}
              {job.scheduled_time_slot && ` • ${getTimeSlotLabel(job.scheduled_time_slot)}`}
            </div>
          )}

          {/* Description */}
          {job.description && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {job.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(job.address + (job.city ? ` ${job.city}` : ""))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigeren
            </a>
          </Button>
          {nextStatus && nextLabel && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(job.id, nextStatus)}
              className={nextStatus === "completed" ? "bg-success hover:bg-success/90" : ""}
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
