import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge, UrgencyBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, startOfToday } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  Users, 
  Wrench, 
  AlertTriangle, 
  Euro,
  ArrowRight,
  CalendarDays,
  Clock,
  CheckCircle,
  Phone,
  MapPin,
  User,
  Image,
  Bell,
  Send,
  UserPlus
} from "lucide-react";
import { InviteTechnicianForm } from "@/components/admin/InviteTechnicianForm";

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
  technician_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  photos: string[] | null;
  is_open_for_claim: boolean | null;
  service_types: {
    name_nl: string;
  } | null;
  profiles: {
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

interface Technician {
  id: string;
  is_available: boolean;
  user_id: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

interface TechnicianAvailability {
  technician_id: string;
  date: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [availability, setAvailability] = useState<TechnicianAvailability[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTechnicians: 0,
    todayJobs: 0,
    emergencyJobs: 0,
    todayRevenue: 0,
    pendingJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("aanvragen");

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime job updates
    const channel = supabase
      .channel('admin-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        scheduled_time_slot,
        address,
        city,
        postal_code,
        description,
        final_price,
        created_at,
        technician_id,
        guest_name,
        guest_email,
        guest_phone,
        photos,
        is_open_for_claim,
        service_types (name_nl),
        profiles!jobs_customer_id_fkey (full_name, email, phone)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (jobsData) {
      setJobs(jobsData as unknown as Job[]);
    }

    // Fetch technicians with profile info
    const { data: techData } = await supabase
      .from("technicians")
      .select(`
        id,
        is_available,
        user_id,
        profiles!technicians_profile_id_fkey (full_name, phone)
      `);

    if (techData) {
      setTechnicians(techData as unknown as Technician[]);
    }

    // Fetch today's availability
    const today = format(startOfToday(), "yyyy-MM-dd");
    const tomorrow = format(addDays(startOfToday(), 1), "yyyy-MM-dd");
    
    const { data: availData } = await supabase
      .from("technician_availability")
      .select("*")
      .gte("date", today)
      .lte("date", tomorrow);

    if (availData) {
      setAvailability(availData as TechnicianAvailability[]);
    }

    // Calculate stats
    const todayStr = new Date().toISOString().split("T")[0];
    const { count: customerCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: techCount } = await supabase
      .from("technicians")
      .select("*", { count: "exact", head: true });

    const todayJobsCount = jobsData?.filter(j => 
      j.scheduled_date === todayStr || 
      (j.urgency === "emergency" && j.created_at.startsWith(todayStr))
    ).length || 0;

    const emergencyCount = jobsData?.filter(j => 
      j.urgency === "emergency" && 
      !["completed", "cancelled"].includes(j.status)
    ).length || 0;

    const pendingCount = jobsData?.filter(j => j.status === "requested").length || 0;

    const revenue = jobsData?.filter(j => 
      j.status === "completed" && j.created_at.startsWith(todayStr)
    ).reduce((sum, j) => sum + (Number(j.final_price) || 0), 0) || 0;

    setStats({
      totalCustomers: customerCount || 0,
      totalTechnicians: techCount || 0,
      todayJobs: todayJobsCount,
      emergencyJobs: emergencyCount,
      todayRevenue: revenue,
      pendingJobs: pendingCount,
    });

    setLoading(false);
  };

  const assignTechnician = async (jobId: string, technicianId: string) => {
    await supabase
      .from("jobs")
      .update({ 
        technician_id: technicianId,
        status: "confirmed" as const,
        is_open_for_claim: false,
        confirmed_at: new Date().toISOString()
      })
      .eq("id", jobId);

    fetchData();
  };

  const toggleClaimable = async (jobId: string, isOpen: boolean) => {
    await supabase
      .from("jobs")
      .update({ is_open_for_claim: isOpen })
      .eq("id", jobId);

    fetchData();
  };

  const getTimeSlotLabel = (slot: string | null) => {
    switch (slot) {
      case "morning": return "Ochtend";
      case "afternoon": return "Middag";
      case "evening": return "Avond";
      case "night": return "Nacht";
      default: return "";
    }
  };

  const getTechnicianAvailability = (techId: string, date: string) => {
    return availability.find(a => a.technician_id === techId && a.date === date);
  };

  const pendingJobs = jobs.filter(j => j.status === "requested");
  const activeJobs = jobs.filter(j => 
    ["confirmed", "on_the_way", "in_progress"].includes(j.status)
  );
  const completedJobs = jobs.filter(j => j.status === "completed");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Dispatcher Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Beheer aanvragen en wijs elektriciens toe
            </p>
          </div>
          {stats.pendingJobs > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30">
              <Bell className="h-5 w-5 text-warning animate-pulse" />
              <span className="font-medium text-warning">
                {stats.pendingJobs} nieuwe aanvra{stats.pendingJobs === 1 ? "ag" : "gen"}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className={stats.pendingJobs > 0 ? "bg-warning/5 border-warning/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stats.pendingJobs > 0 ? "bg-warning" : "bg-muted"}`}>
                  <Clock className={`h-5 w-5 ${stats.pendingJobs > 0 ? "text-warning-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingJobs}</p>
                  <p className="text-xs text-muted-foreground">Wachtend</p>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="aanvragen" className="relative">
              Aanvragen
              {stats.pendingJobs > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {stats.pendingJobs}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="actief">Actief ({activeJobs.length})</TabsTrigger>
            <TabsTrigger value="monteurs">Monteurs</TabsTrigger>
            <TabsTrigger value="afgerond">Afgerond</TabsTrigger>
          </TabsList>

          {/* Pending Jobs Tab */}
          <TabsContent value="aanvragen" className="space-y-4">
            {pendingJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-success/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Geen wachtende aanvragen
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingJobs.map((job) => (
                <JobRequestCard
                  key={job.id}
                  job={job}
                  technicians={technicians}
                  availability={availability}
                  onAssign={assignTechnician}
                  onToggleClaimable={toggleClaimable}
                  getTimeSlotLabel={getTimeSlotLabel}
                />
              ))
            )}
          </TabsContent>

          {/* Active Jobs Tab */}
          <TabsContent value="actief" className="space-y-4">
            {activeJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Geen actieve opdrachten
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{job.service_types?.name_nl}</span>
                          <UrgencyBadge urgency={job.urgency} />
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.guest_name || job.profiles?.full_name} • {job.address}
                          {job.city && `, ${job.city}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Monteur: {technicians.find(t => t.id === job.technician_id)?.profiles?.full_name || "Niet toegewezen"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.final_price && (
                          <span className="font-bold text-primary">
                            €{Number(job.final_price).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Technicians Tab */}
          <TabsContent value="monteurs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Elektriciens beheren</h2>
              <InviteTechnicianForm onSuccess={fetchData} />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicians.map((tech) => {
                const todayAvail = getTechnicianAvailability(tech.id, format(startOfToday(), "yyyy-MM-dd"));
                const activeJobCount = jobs.filter(j => 
                  j.technician_id === tech.id && 
                  ["confirmed", "on_the_way", "in_progress"].includes(j.status)
                ).length;

                return (
                  <Card key={tech.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{tech.profiles?.full_name || "Monteur"}</h3>
                          {tech.profiles?.phone && (
                            <a 
                              href={`tel:${tech.profiles.phone}`}
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" />
                              {tech.profiles.phone}
                            </a>
                          )}
                        </div>
                        <Badge variant={tech.is_available ? "default" : "secondary"}>
                          {tech.is_available ? "Beschikbaar" : "Niet beschikbaar"}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Actieve opdrachten</span>
                          <span className="font-medium">{activeJobCount}</span>
                        </div>
                        
                        {todayAvail && (
                          <div className="flex gap-1">
                            {todayAvail.morning && (
                              <Badge variant="outline" className="text-xs">Ochtend</Badge>
                            )}
                            {todayAvail.afternoon && (
                              <Badge variant="outline" className="text-xs">Middag</Badge>
                            )}
                            {todayAvail.evening && (
                              <Badge variant="outline" className="text-xs">Avond</Badge>
                            )}
                            {todayAvail.night && (
                              <Badge variant="outline" className="text-xs">Nacht</Badge>
                            )}
                            {!todayAvail.morning && !todayAvail.afternoon && !todayAvail.evening && !todayAvail.night && (
                              <span className="text-xs text-muted-foreground">Geen beschikbaarheid vandaag</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Completed Jobs Tab */}
          <TabsContent value="afgerond" className="space-y-4">
            {completedJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nog geen afgeronde opdrachten
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedJobs.slice(0, 10).map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{job.service_types?.name_nl}</span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.guest_name || job.profiles?.full_name} • {format(new Date(job.created_at), "d MMM HH:mm", { locale: nl })}
                        </p>
                      </div>
                      <span className="font-bold text-success">
                        €{Number(job.final_price || 0).toFixed(0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function JobRequestCard({
  job,
  technicians,
  availability,
  onAssign,
  onToggleClaimable,
  getTimeSlotLabel,
}: {
  job: Job;
  technicians: Technician[];
  availability: TechnicianAvailability[];
  onAssign: (jobId: string, techId: string) => void;
  onToggleClaimable: (jobId: string, isOpen: boolean) => void;
  getTimeSlotLabel: (slot: string | null) => string;
}) {
  const customerName = job.guest_name || job.profiles?.full_name || "Onbekend";
  const customerPhone = job.guest_phone || job.profiles?.phone;
  const customerEmail = job.guest_email || job.profiles?.email;

  return (
    <Card className={job.urgency === "emergency" ? "border-emergency/30 bg-emergency-light" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Job Details */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-lg">{job.service_types?.name_nl}</span>
              <UrgencyBadge urgency={job.urgency} />
              {job.is_open_for_claim && (
                <Badge variant="outline" className="text-xs">Open voor claim</Badge>
              )}
            </div>

            {/* Customer Info */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {customerName}
                </p>
                {customerPhone && (
                  <a
                    href={`tel:${customerPhone}`}
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    {customerPhone}
                  </a>
                )}
                {customerEmail && (
                  <p className="text-sm text-muted-foreground">{customerEmail}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {job.address}
                    {job.postal_code && `, ${job.postal_code}`}
                    {job.city && ` ${job.city}`}
                  </span>
                </p>
                {job.scheduled_date ? (
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(job.scheduled_date), "EEEE d MMMM", { locale: nl })}
                    {job.scheduled_time_slot && ` • ${getTimeSlotLabel(job.scheduled_time_slot)}`}
                  </p>
                ) : (
                  <p className="text-sm flex items-center gap-2 text-emergency font-medium">
                    <Clock className="h-4 w-4" />
                    Zo snel mogelijk
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {job.description && (
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{job.description}</p>
            )}

            {/* Photos */}
            {job.photos && job.photos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {job.photos.map((photo, i) => (
                  <a
                    key={i}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Aangevraagd: {format(new Date(job.created_at), "d MMM HH:mm", { locale: nl })}
            </p>
          </div>

          {/* Actions */}
          <div className="lg:w-64 space-y-3">
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium mb-2">Wijs monteur toe</p>
              <Select onValueChange={(value) => onAssign(job.id, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer monteur" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.filter(t => t.is_available).map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.profiles?.full_name || "Monteur"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Open voor claim</span>
              <Button
                variant={job.is_open_for_claim ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleClaimable(job.id, !job.is_open_for_claim)}
              >
                {job.is_open_for_claim ? "Aan" : "Uit"}
              </Button>
            </div>

            {job.final_price && (
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">Prijs</p>
                <p className="text-2xl font-bold text-primary">
                  €{Number(job.final_price).toFixed(0)}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
