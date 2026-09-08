/**
 * Fetches public slot availability (available / limited / full) per time slot
 * category for a given date via the `get_public_slot_availability` RPC.
 *
 * Falls back to "no data" (all slots treated as available) when the RPC is not
 * yet deployed or fails, so the booking flow never blocks on availability.
 */

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { SlotAvailability } from "@/hooks/useSlotPricing";
import type { TimeSlotCategory, TimeSlotStatus } from "@/types/booking";

interface AvailabilityRow {
  slot: TimeSlotCategory;
  status: TimeSlotStatus;
}

export function useSlotAvailability(date: Date | undefined) {
  const [availability, setAvailability] = useState<SlotAvailability | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const dateKey = date ? format(date, "yyyy-MM-dd") : null;

  useEffect(() => {
    if (!dateKey) {
      setAvailability(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // RPC is added by the backend hardening migration; typed loosely until types are regenerated.
    const rpc = (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => PromiseLike<{ data: AvailabilityRow[] | null; error: unknown }>);

    Promise.resolve(rpc("get_public_slot_availability", { p_date: dateKey }))
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setAvailability(undefined);
          return;
        }
        const map: SlotAvailability = {};
        for (const row of data) {
          if (row?.slot && row?.status) map[row.slot] = row.status;
        }
        setAvailability(map);
      })
      .catch(() => {
        if (!cancelled) setAvailability(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  return { availability, loading };
}
