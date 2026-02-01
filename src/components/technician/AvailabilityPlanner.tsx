import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, Check, Sun, Sunset, Moon, MoonStar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilityPlannerProps {
  technicianId: string;
}

interface DayAvailability {
  date: Date;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
}

const timeSlots = [
  { key: "morning" as const, label: "Ochtend", time: "08:00 - 12:00", icon: Sun },
  { key: "afternoon" as const, label: "Middag", time: "12:00 - 17:00", icon: Sunset },
  { key: "evening" as const, label: "Avond", time: "17:00 - 21:00", icon: Moon },
  { key: "night" as const, label: "Nacht", time: "21:00 - 08:00", icon: MoonStar },
];

export function AvailabilityPlanner({ technicianId }: AvailabilityPlannerProps) {
  const [startDate, setStartDate] = useState(startOfToday());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedDates, setSavedDates] = useState<Set<string>>(new Set());

  // Generate 7 days starting from startDate
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  useEffect(() => {
    fetchAvailability();
  }, [technicianId, startDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    const dateFrom = format(startDate, "yyyy-MM-dd");
    const dateTo = format(addDays(startDate, 6), "yyyy-MM-dd");

    const { data } = await supabase
      .from("technician_availability")
      .select("*")
      .eq("technician_id", technicianId)
      .gte("date", dateFrom)
      .lte("date", dateTo);

    // Initialize availability for all 7 days
    const newAvailability = days.map((day) => {
      const existing = data?.find((d) => d.date === format(day, "yyyy-MM-dd"));
      return {
        date: day,
        morning: existing?.morning ?? false,
        afternoon: existing?.afternoon ?? false,
        evening: existing?.evening ?? false,
        night: existing?.night ?? false,
      };
    });

    setAvailability(newAvailability);
    setLoading(false);
  };

  const toggleSlot = (dayIndex: number, slot: "morning" | "afternoon" | "evening" | "night") => {
    setAvailability((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        [slot]: !updated[dayIndex][slot],
      };
      return updated;
    });
    
    // Remove from saved set when changed
    const dateStr = format(availability[dayIndex].date, "yyyy-MM-dd");
    setSavedDates((prev) => {
      const next = new Set(prev);
      next.delete(dateStr);
      return next;
    });
  };

  const toggleAllDay = (dayIndex: number, value: boolean) => {
    setAvailability((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        morning: value,
        afternoon: value,
        evening: value,
        night: false, // Night shift is opt-in
      };
      return updated;
    });
    
    const dateStr = format(availability[dayIndex].date, "yyyy-MM-dd");
    setSavedDates((prev) => {
      const next = new Set(prev);
      next.delete(dateStr);
      return next;
    });
  };

  const saveDay = async (dayIndex: number) => {
    const day = availability[dayIndex];
    const dateStr = format(day.date, "yyyy-MM-dd");
    
    setSaving(true);
    
    const { error } = await supabase
      .from("technician_availability")
      .upsert({
        technician_id: technicianId,
        date: dateStr,
        morning: day.morning,
        afternoon: day.afternoon,
        evening: day.evening,
        night: day.night,
      }, {
        onConflict: "technician_id,date"
      });

    if (!error) {
      setSavedDates((prev) => new Set(prev).add(dateStr));
    }
    
    setSaving(false);
  };

  const saveAll = async () => {
    setSaving(true);
    
    const upserts = availability.map((day) => ({
      technician_id: technicianId,
      date: format(day.date, "yyyy-MM-dd"),
      morning: day.morning,
      afternoon: day.afternoon,
      evening: day.evening,
      night: day.night,
    }));

    const { error } = await supabase
      .from("technician_availability")
      .upsert(upserts, { onConflict: "technician_id,date" });

    if (!error) {
      setSavedDates(new Set(upserts.map((u) => u.date)));
    }
    
    setSaving(false);
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">Mijn Beschikbaarheid</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setStartDate(addDays(startDate, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(startDate, "d MMM", { locale: nl })} - {format(addDays(startDate, 6), "d MMM", { locale: nl })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setStartDate(addDays(startDate, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header */}
                <div className="grid grid-cols-8 gap-2 mb-4">
                  <div className="p-2" />
                  {availability.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        "text-center p-2 rounded-lg",
                        isToday(day.date) && "bg-primary/10"
                      )}
                    >
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(day.date, "EEE", { locale: nl })}
                      </p>
                      <p className={cn(
                        "font-semibold",
                        isToday(day.date) && "text-primary"
                      )}>
                        {format(day.date, "d")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                {timeSlots.map((slot) => (
                  <div key={slot.key} className="grid grid-cols-8 gap-2 mb-2">
                    <div className="flex items-center gap-2 p-2 text-sm">
                      <slot.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="hidden sm:inline">{slot.label}</span>
                    </div>
                    {availability.map((day, i) => (
                      <button
                        key={i}
                        onClick={() => toggleSlot(i, slot.key)}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all text-xs",
                          day[slot.key]
                            ? "bg-success/10 border-success text-success"
                            : "bg-muted/50 border-transparent text-muted-foreground hover:border-border"
                        )}
                      >
                        {day[slot.key] ? (
                          <Check className="h-4 w-4 mx-auto" />
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}

                {/* Quick actions */}
                <div className="grid grid-cols-8 gap-2 mt-4 pt-4 border-t border-border">
                  <div className="p-2 text-sm text-muted-foreground">Hele dag</div>
                  {availability.map((day, i) => {
                    const allSelected = day.morning && day.afternoon && day.evening;
                    return (
                      <Button
                        key={i}
                        variant={allSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAllDay(i, !allSelected)}
                        className="text-xs"
                      >
                        {allSelected ? "Aan" : "Uit"}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={saveAll} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Beschikbaarheid opslaan
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
