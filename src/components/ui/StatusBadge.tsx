import { cn } from "@/lib/utils";
import { Clock, CheckCircle, Truck, Wrench, XCircle, AlertCircle } from "lucide-react";

type JobStatus = "requested" | "confirmed" | "on_the_way" | "in_progress" | "completed" | "cancelled";

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<JobStatus, { 
  label: string; 
  labelNl: string;
  className: string; 
  icon: typeof Clock;
}> = {
  requested: {
    label: "Requested",
    labelNl: "Aangevraagd",
    className: "status-requested",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    labelNl: "Bevestigd",
    className: "status-confirmed",
    icon: CheckCircle,
  },
  on_the_way: {
    label: "On the Way",
    labelNl: "Onderweg",
    className: "status-on-the-way",
    icon: Truck,
  },
  in_progress: {
    label: "In Progress",
    labelNl: "Bezig",
    className: "status-in-progress",
    icon: Wrench,
  },
  completed: {
    label: "Completed",
    labelNl: "Voltooid",
    className: "status-completed",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    labelNl: "Geannuleerd",
    className: "status-cancelled",
    icon: XCircle,
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      config.className,
      className
    )}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.labelNl}
    </span>
  );
}

export function UrgencyBadge({ 
  urgency, 
  className 
}: { 
  urgency: "emergency" | "planned"; 
  className?: string;
}) {
  const isEmergency = urgency === "emergency";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
      isEmergency 
        ? "bg-emergency text-emergency-foreground animate-pulse-subtle" 
        : "bg-secondary text-secondary-foreground",
      className
    )}>
      {isEmergency && <AlertCircle className="h-3.5 w-3.5" />}
      {isEmergency ? "SPOED" : "Gepland"}
    </span>
  );
}
