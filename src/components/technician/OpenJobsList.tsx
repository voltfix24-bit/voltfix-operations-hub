import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, UrgencyBadge } from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { 
  MapPin, 
  Clock, 
  Hand, 
  Loader2,
  AlertTriangle,
  User,
  Phone,
  Image
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenJob {
  id: string;
  status: "requested" | "confirmed";
  urgency: "emergency" | "planned";
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  address: string;
  city: string | null;
  postal_code: string | null;
  description: string | null;
  final_price: number | null;
  created_at: string;
  guest_name: string | null;
  guest_phone: string | null;
  photos: string[] | null;
  service_types: {
    name_nl: string;
  } | null;
}

interface OpenJobsListProps {
  technicianId: string;
  onJobClaimed?: () => void;
}

export function OpenJobsList({ technicianId, onJobClaimed }: OpenJobsListProps) {
  const [jobs, setJobs] = useState<OpenJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenJobs();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('open-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: 'is_open_for_claim=eq.true'
        },
        () => {
          fetchOpenJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [technicianId]);

  const fetchOpenJobs = async () => {
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
        guest_name,
        guest_phone,
        photos,
        service_types (name_nl)
      `)
      .eq("is_open_for_claim", true)
      .is("technician_id", null)
      .in("status", ["requested"])
      .order("urgency", { ascending: false })
      .order("created_at", { ascending: true });

    if (data) {
      setJobs(data as unknown as OpenJob[]);
    }
    setLoading(false);
  };

  const claimJob = async (jobId: string) => {
    setClaiming(jobId);
    
    const { error } = await supabase
      .from("jobs")
      .update({
        claimed_by: technicianId,
        claimed_at: new Date().toISOString(),
        technician_id: technicianId,
        status: "confirmed",
        is_open_for_claim: false,
      })
      .eq("id", jobId)
      .eq("is_open_for_claim", true); // Only claim if still open

    if (!error) {
      fetchOpenJobs();
      onJobClaimed?.();
    }
    
    setClaiming(null);
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

  const emergencyJobs = jobs.filter(j => j.urgency === "emergency");
  const plannedJobs = jobs.filter(j => j.urgency === "planned");

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Beschikbare Opdrachten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Hand className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Geen openstaande opdrachten op dit moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Emergency jobs first */}
      {emergencyJobs.length > 0 && (
        <Card className="border-emergency/30 bg-emergency-light">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-emergency">
              <AlertTriangle className="h-5 w-5" />
              Spoedopdrachten beschikbaar ({emergencyJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClaim={() => claimJob(job.id)}
                claiming={claiming === job.id}
                getTimeSlotLabel={getTimeSlotLabel}
                isEmergency
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Planned jobs */}
      {plannedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Hand className="h-5 w-5 text-primary" />
              Geplande opdrachten ({plannedJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plannedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClaim={() => claimJob(job.id)}
                claiming={claiming === job.id}
                getTimeSlotLabel={getTimeSlotLabel}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JobCard({
  job,
  onClaim,
  claiming,
  getTimeSlotLabel,
  isEmergency = false,
}: {
  job: OpenJob;
  onClaim: () => void;
  claiming: boolean;
  getTimeSlotLabel: (slot: string | null) => string;
  isEmergency?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isEmergency ? "bg-card border-emergency/30" : "border-border"
    )}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{job.service_types?.name_nl}</span>
            <UrgencyBadge urgency={job.urgency} />
          </div>

          {/* Customer Info */}
          {job.guest_name && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                {job.guest_name}
              </span>
              {job.guest_phone && (
                <a
                  href={`tel:${job.guest_phone}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {job.guest_phone}
                </a>
              )}
            </div>
          )}

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
          {job.scheduled_date ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(job.scheduled_date), "EEEE d MMMM", { locale: nl })}
              {job.scheduled_time_slot && ` • ${getTimeSlotLabel(job.scheduled_time_slot)}`}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emergency">
              <Clock className="h-4 w-4" />
              Zo snel mogelijk
            </div>
          )}

          {/* Description */}
          {job.description && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              {job.description}
            </p>
          )}

          {/* Photos */}
          {job.photos && job.photos.length > 0 && (
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {job.photos.length} foto{job.photos.length > 1 ? "'s" : ""} bijgevoegd
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 items-end">
          {job.final_price && (
            <span className="text-lg font-bold text-primary">
              €{Number(job.final_price).toFixed(0)}
            </span>
          )}
          <Button
            onClick={onClaim}
            disabled={claiming}
            className={cn(
              isEmergency && "bg-emergency hover:bg-emergency/90"
            )}
          >
            {claiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claimen...
              </>
            ) : (
              <>
                <Hand className="mr-2 h-4 w-4" />
                Opdracht claimen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
