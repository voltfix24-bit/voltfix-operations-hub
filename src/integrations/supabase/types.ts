export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customer_notes: {
        Row: {
          admin_id: string | null
          created_at: string
          customer_id: string
          id: string
          note: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          note: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          note?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          job_id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          job_id: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          job_id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          base_price: number | null
          city: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_id: string | null
          customer_notes: string | null
          description: string | null
          dispatcher_notes: string | null
          final_price: number | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_open_for_claim: boolean | null
          photos: string[] | null
          postal_code: string | null
          preferred_time_slot: Database["public"]["Enums"]["time_slot"] | null
          price_breakdown: Json | null
          scheduled_date: string | null
          scheduled_time_slot: Database["public"]["Enums"]["time_slot"] | null
          service_type_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          technician_id: string | null
          technician_notes: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["job_urgency"]
        }
        Insert: {
          address: string
          base_price?: number | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notes?: string | null
          description?: string | null
          dispatcher_notes?: string | null
          final_price?: number | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_open_for_claim?: boolean | null
          photos?: string[] | null
          postal_code?: string | null
          preferred_time_slot?: Database["public"]["Enums"]["time_slot"] | null
          price_breakdown?: Json | null
          scheduled_date?: string | null
          scheduled_time_slot?: Database["public"]["Enums"]["time_slot"] | null
          service_type_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          technician_id?: string | null
          technician_notes?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["job_urgency"]
        }
        Update: {
          address?: string
          base_price?: number | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notes?: string | null
          description?: string | null
          dispatcher_notes?: string | null
          final_price?: number | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_open_for_claim?: boolean | null
          photos?: string[] | null
          postal_code?: string | null
          preferred_time_slot?: Database["public"]["Enums"]["time_slot"] | null
          price_breakdown?: Json | null
          scheduled_date?: string | null
          scheduled_time_slot?: Database["public"]["Enums"]["time_slot"] | null
          service_type_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          technician_id?: string | null
          technician_notes?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["job_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          applies_to_emergency: boolean
          applies_to_planned: boolean
          created_at: string
          description: string | null
          flat_fee: number
          id: string
          is_active: boolean
          is_weekend: boolean | null
          multiplier: number
          name: string
          time_slot: Database["public"]["Enums"]["time_slot"] | null
        }
        Insert: {
          applies_to_emergency?: boolean
          applies_to_planned?: boolean
          created_at?: string
          description?: string | null
          flat_fee?: number
          id?: string
          is_active?: boolean
          is_weekend?: boolean | null
          multiplier?: number
          name: string
          time_slot?: Database["public"]["Enums"]["time_slot"] | null
        }
        Update: {
          applies_to_emergency?: boolean
          applies_to_planned?: boolean
          created_at?: string
          description?: string | null
          flat_fee?: number
          id?: string
          is_active?: boolean
          is_weekend?: boolean | null
          multiplier?: number
          name?: string
          time_slot?: Database["public"]["Enums"]["time_slot"] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          preferred_time_slot: Database["public"]["Enums"]["time_slot"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          preferred_time_slot?: Database["public"]["Enums"]["time_slot"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          preferred_time_slot?: Database["public"]["Enums"]["time_slot"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_types: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          id: string
          is_emergency_eligible: boolean
          name: string
          name_nl: string
          skill_required: string | null
        }
        Insert: {
          base_price: number
          created_at?: string
          description?: string | null
          id?: string
          is_emergency_eligible?: boolean
          name: string
          name_nl: string
          skill_required?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_emergency_eligible?: boolean
          name?: string
          name_nl?: string
          skill_required?: string | null
        }
        Relationships: []
      }
      technician_availability: {
        Row: {
          afternoon: boolean | null
          created_at: string
          date: string
          evening: boolean | null
          id: string
          morning: boolean | null
          night: boolean | null
          notes: string | null
          technician_id: string
          updated_at: string
        }
        Insert: {
          afternoon?: boolean | null
          created_at?: string
          date: string
          evening?: boolean | null
          id?: string
          morning?: boolean | null
          night?: boolean | null
          notes?: string | null
          technician_id: string
          updated_at?: string
        }
        Update: {
          afternoon?: boolean | null
          created_at?: string
          date?: string
          evening?: boolean | null
          id?: string
          morning?: boolean | null
          night?: boolean | null
          notes?: string | null
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_availability_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          location_lat: number | null
          location_lng: number | null
          max_daily_jobs: number | null
          profile_id: string | null
          skill_tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          location_lat?: number | null
          location_lng?: number | null
          max_daily_jobs?: number | null
          profile_id?: string | null
          skill_tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          location_lat?: number | null
          location_lng?: number | null
          max_daily_jobs?: number | null
          profile_id?: string | null
          skill_tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technicians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "technician" | "admin"
      job_status:
        | "requested"
        | "confirmed"
        | "on_the_way"
        | "in_progress"
        | "completed"
        | "cancelled"
      job_urgency: "emergency" | "planned"
      time_slot: "morning" | "afternoon" | "evening" | "night"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "technician", "admin"],
      job_status: [
        "requested",
        "confirmed",
        "on_the_way",
        "in_progress",
        "completed",
        "cancelled",
      ],
      job_urgency: ["emergency", "planned"],
      time_slot: ["morning", "afternoon", "evening", "night"],
    },
  },
} as const
