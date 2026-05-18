export type Plan = "free" | "pro" | "studio";
export type EventStatus = "draft" | "published" | "archived";
export type ZoneType = "text" | "photo" | "custom";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "none";
export type BillingCycle = "monthly" | "annual" | "none";

export interface Zone {
  id: string;
  type: ZoneType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // text / custom fields
  font?: string;
  size?: number;
  weight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  placeholder?: string;
  sample?: string;
  options?: string[];
  // photo fields
  shape?: "circle" | "square" | "rounded";
  // state flags
  required?: boolean;
  hidden?: boolean;
  locked?: boolean;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          plan: Plan;
          created_at: string;
          // billing columns (added in migration 004)
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: SubscriptionStatus;
          billing_cycle: BillingCycle;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          cards_this_month: number;
          cards_month_start: string;
          // settings columns (added in migration 003)
          role: string;
          avatar_url: string | null;
          notify_downloads: boolean;
          notify_views: boolean;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          plan?: Plan;
          created_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          billing_cycle?: BillingCycle;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cards_this_month?: number;
          cards_month_start?: string;
          role?: string;
          avatar_url?: string | null;
          notify_downloads?: boolean;
          notify_views?: boolean;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          plan?: Plan;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          billing_cycle?: BillingCycle;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cards_this_month?: number;
          cards_month_start?: string;
          role?: string;
          avatar_url?: string | null;
          notify_downloads?: boolean;
          notify_views?: boolean;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          background_url: string | null;
          background_width: number | null;
          background_height: number | null;
          zones: Json;
          status: EventStatus;
          view_count: number;
          download_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          background_url?: string | null;
          background_width?: number | null;
          background_height?: number | null;
          zones?: Json;
          status?: EventStatus;
          view_count?: number;
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          background_url?: string | null;
          background_width?: number | null;
          background_height?: number | null;
          zones?: Json;
          status?: EventStatus;
          view_count?: number;
          download_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      generated_cards: {
        Row: {
          id: string;
          event_id: string;
          attendee_name: string | null;
          attendee_data: Json | null;
          output_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          attendee_name?: string | null;
          attendee_data?: Json | null;
          output_url?: string | null;
          created_at?: string;
        };
        Update: {
          attendee_name?: string | null;
          attendee_data?: Json | null;
          output_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "generated_cards_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_cards_this_month: {
        Args: { user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
