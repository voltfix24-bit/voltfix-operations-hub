import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge, UrgencyBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  Users, 
  Wrench, 
  AlertTriangle, 
  Euro,
  ArrowRight,
  CalendarDays,
  Clock,
  CheckCircle
} from "lucide-react";

interface Job {
  id: string;
  status: "requested" | "confirmed" | "on_the_way" | "in_progress" | "completed" | "cancelled";
  urgency: "emergency" | "planned";
  scheduled_date: string | null;
  address: string;
  city: string | null;
  final_price: number | null;
  created_at: string;
  technician_id: string | null;
  service_types: {
    name_nl: string;
  } | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

interface Technician {
  id: string;
  is_available: boolean;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTechnicians: 0,
    todayJobs: 0,
    emergencyJobs: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch jobs
    const { data: jobsData } = await supabase
      .from("jobs")
      .select(`
        id,
        status,
        urgency,
        scheduled_date,
        address,
        city,
        final_price,
        created_at,
        technician_id,
        service_types (name_nl),
        profiles!jobs_customer_id_fkey (full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (jobsData) {
      setJobs(jobsData as unknown as Job[]);
    }

    // Fetch technicians
    const { data: techData } = await supabase
      .from("technicians")
      .select(`
        id,
        is_available,
        profiles!technicians_profile_id_fkey (full_name)
      `);

    if (techData) {
      setTechnicians(techData as unknown as Technician[]);
    }

    // Calculate stats
    const today = new Date().toISOString().split("T")[0];
    const { count: customerCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: techCount } = await supabase
      .from("technicians")
      .select("*", { count: "exact", head: true });

    const todayJobsCount = jobsData?.filter(j => 
      j.scheduled_date === today || 
      (j.urgency === "emergency" && j.created_at.startsWith(today))
    ).length || 0;

    const emergencyCount = jobsData?.filter(j => 
      j.urgency === "emergency" && 
      !["completed", "cancelled"].includes(j.status)
    ).length || 0;

    const revenue = jobsData?.filter(j => 
      j.status === "completed" && j.created_at.startsWith(today)
    ).reduce((sum, j) => sum + (Number(j.final_price) || 0), 0) || 0;

    setStats({
      totalCustomers: customerCount || 0,
      totalTechnicians: techCount || 0,
      todayJobs: todayJobsCount,
      emergencyJobs: emergencyCount,
      todayRevenue: revenue,
    });

    setLoading(false);
  };

  const assignTechnician = async (jobId: string, technicianId: string) => {
    await supabase
      .from("jobs")
      .update({ 
        technician_id: technicianId,
        status: "confirmed"
      })
      .eq("id", jobId);

    fetchData();
  };

  const updateJobStatus = async (jobId: string, newStatus: "confirmed" | "on_the_way" | "in_progress" | "completed" | "cancelled") => {
    await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId);

    fetchData();
  };

  const pendingJobs = jobs.filter(j => j.status === "requested");
  const activeJobs = jobs.filter(j => 
    ["confirmed", "on_the_way", "in_progress"].includes(j.status)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overzicht van alle activiteiten
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Klanten</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Wrench className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTechnicians}</p>
                  <p className="text-xs text-muted-foreground">Monteurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todayJobs}</p>
                  <p className="text-xs text-muted-foreground">Vandaag</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={stats.emergencyJobs > 0 ? "bg-emergency-light border-emergency/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.emergencyJobs > 0 ? "bg-emergency" : "bg-muted"}`}>
                  <AlertTriangle className={`h-5 w-5 ${stats.emergencyJobs > 0 ? "text-emergency-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.emergencyJobs}</p>
                  <p className="text-xs text-muted-foreground">Spoed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success-light border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success">
                  <Euro className="h-5 w-5 text-success-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€{stats.todayRevenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Vandaag</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Jobs */}
        {pendingJobs.length > 0 && (
          <Card className="border-warning/30">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Wachtend op Toewijzing ({pendingJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingJobs.map((job) => (
                <div 
                  key={job.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg border border-border bg-card gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{job.service_types?.name_nl}</span>
                      <UrgencyBadge urgency={job.urgency} />
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.profiles?.full_name || job.profiles?.email} • {job.address}
                      {job.city && `, ${job.city}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(job.created_at), "d MMM HH:mm", { locale: nl })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select onValueChange={(value) => assignTechnician(job.id, value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Wijs monteur toe" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.filter(t => t.is_available).map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.profiles?.full_name || "Monteur"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {job.final_price && (
                      <span className="font-bold text-primary">
                        €{Number(job.final_price).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Actieve Opdrachten</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/jobs">
                Alle opdrachten
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
                <CheckCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Geen actieve opdrachten op dit moment
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeJobs.slice(0, 5).map((job) => (
                  <div 
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{job.service_types?.name_nl}</span>
                          <UrgencyBadge urgency={job.urgency} />
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.profiles?.full_name} • {job.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {technicians.find(t => t.id === job.technician_id)?.profiles?.full_name || "Niet toegewezen"}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/jobs/${job.id}`}>Details</Link>
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
