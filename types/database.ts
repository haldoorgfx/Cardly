// ── Phase 2: Speakers, sessions, agenda types ─────────────────────────────────
export type SpeakerType = "keynote" | "speaker" | "panelist" | "workshop" | "mc";
export type SessionType = "talk" | "keynote" | "workshop" | "panel" | "fireside" | "lightning" | "break";

export interface Track {
  id: string;
  event_id: string;
  name: string;
  color: string;
  position: number;
}

export interface Speaker {
  id: string;
  event_id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  company: string | null;
  role: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  speaker_type: SpeakerType;
  is_featured: boolean;
  position: number;
  created_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  track_id: string | null;
  title: string;
  description: string | null;
  session_type: SessionType;
  starts_at: string;
  ends_at: string;
  room: string | null;
  capacity: number | null;
  registrations_count: number;
  is_published: boolean;
  position: number;
  created_at: string;
  // joined fields
  tracks?: Track | null;
  session_speakers?: { speaker_id: string; position: number; speakers: Speaker | null }[];
}

// ── Phase 1: Event registration types ────────────────────────────────────────
export type RegistrationStatus = "pending" | "confirmed" | "checked_in" | "cancelled" | "refunded";
export type PaymentStatus = "free" | "pending" | "paid" | "refunded" | "failed";
export type PaymentProcessor = "stripe" | "flutterwave" | "waafipay" | "free";
export type FieldType = "text" | "textarea" | "select" | "checkbox" | "radio" | "phone" | "url";
export type DiscountType = "percent" | "fixed";

export interface EventPage {
  id: string;
  event_id: string;
  variant_id: string | null;
  title: string;
  tagline: string | null;
  description: string | null;
  cover_image_url: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  is_online: boolean;
  online_url: string | null;
  registration_deadline: string | null;
  max_capacity: number | null;
  is_public: boolean;
  custom_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  payment_processor: PaymentProcessor;
  organizer_name: string | null;
  organizer_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity: number | null;
  quantity_sold: number;
  sales_start: string | null;
  sales_end: string | null;
  min_per_order: number;
  max_per_order: number;
  is_visible: boolean;
  position: number;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  custom_fields: Record<string, unknown>;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  flutterwave_tx_ref: string | null;
  amount_paid: number;
  currency: string;
  qr_code_token: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  karta_card_url: string | null;
  karta_card_zone_data: Record<string, unknown> | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationFormField {
  id: string;
  event_id: string;
  label: string;
  field_type: FieldType;
  options: string[] | null;
  is_required: boolean;
  position: number;
}

export interface PromoCode {
  id: string;
  event_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  applies_to: string[] | null;
  created_at: string;
}

export interface CheckInSession {
  id: string;
  event_id: string;
  operator_id: string | null;
  started_at: string;
  check_ins_count: number;
}

export type Plan = "free" | "pro" | "studio";
export type EventStatus = "draft" | "published" | "archived";
export type ModerationStatus = "ok" | "flagged" | "removed";
export type UserRole = "user" | "studio" | "admin" | "super_admin";
export type MinPlan = "free" | "pro" | "studio";
export type ZoneType = "text" | "photo" | "custom" | "label" | "shape" | "image";
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
  align?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "center" | "bottom";
  placeholder?: string;
  sample?: string;
  options?: string[];
  // photo fields
  shape?: "circle" | "square" | "rounded" | "hexagon";
  cornerRadius?: number;
  // text styling extras
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  // text effects
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowX?: number;
  shadowY?: number;
  // appearance
  opacity?: number;
  rotation?: number;
  bgColor?: string;
  bgOpacity?: number;
  // photo extras
  photoBorderColor?: string;
  photoBorderWidth?: number;
  // shape zone
  shapeType?: 'rect' | 'ellipse' | 'triangle' | 'line';
  // image zone
  imageUrl?: string;
  // text field constraints
  maxChars?: number;
  // state flags
  required?: boolean;
  hidden?: boolean;
  locked?: boolean;
}

export interface Variant {
  id: string;
  event_id: string;
  variant_name: string;
  variant_slug: string;
  background_url: string | null;
  background_width: number | null;
  background_height: number | null;
  zones: Zone[];
  position: number;
  created_at: string;
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
          role: UserRole;
          avatar_url: string | null;
          brand_kit: Json | null;
          notify_downloads: boolean;
          notify_views: boolean;
          created_at: string;
          // billing columns (migration 004)
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: SubscriptionStatus;
          billing_cycle: BillingCycle;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          cards_this_month: number;
          cards_month_start: string;
          // suspension (migration 006)
          suspended: boolean;
          suspended_at: string | null;
          suspended_reason: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          plan?: Plan;
          role?: UserRole;
          avatar_url?: string | null;
          brand_kit?: Json | null;
          notify_downloads?: boolean;
          notify_views?: boolean;
          created_at?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          billing_cycle?: BillingCycle;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cards_this_month?: number;
          cards_month_start?: string;
          suspended?: boolean;
          suspended_at?: string | null;
          suspended_reason?: string | null;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          plan?: Plan;
          role?: UserRole;
          avatar_url?: string | null;
          brand_kit?: Json | null;
          notify_downloads?: boolean;
          notify_views?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          billing_cycle?: BillingCycle;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          cards_this_month?: number;
          cards_month_start?: string;
          suspended?: boolean;
          suspended_at?: string | null;
          suspended_reason?: string | null;
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
          moderation_status: ModerationStatus;
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
          moderation_status?: ModerationStatus;
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
          moderation_status?: ModerationStatus;
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
      event_variants: {
        Row: {
          id: string;
          event_id: string;
          variant_name: string;
          variant_slug: string;
          background_url: string | null;
          background_width: number | null;
          background_height: number | null;
          zones: Json;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          variant_name: string;
          variant_slug: string;
          background_url?: string | null;
          background_width?: number | null;
          background_height?: number | null;
          zones?: Json;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          variant_name?: string;
          variant_slug?: string;
          background_url?: string | null;
          background_width?: number | null;
          background_height?: number | null;
          zones?: Json;
          position?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_variants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      generated_cards: {
        Row: {
          id: string;
          event_id: string;
          variant_id: string | null;
          attendee_name: string | null;
          attendee_data: Json | null;
          output_url: string | null;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          variant_id?: string | null;
          attendee_name?: string | null;
          attendee_data?: Json | null;
          output_url?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          variant_id?: string | null;
          attendee_name?: string | null;
          attendee_data?: Json | null;
          output_url?: string | null;
          idempotency_key?: string | null;
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
      site_settings: {
        Row: {
          id: number;
          brand_name: string;
          logo_url: string | null;
          logo_light_url: string | null;
          favicon_url: string | null;
          colors: Json;
          fonts: Json;
          gradients: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          brand_name?: string;
          logo_url?: string | null;
          logo_light_url?: string | null;
          favicon_url?: string | null;
          colors?: Json;
          fonts?: Json;
          gradients?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          brand_name?: string;
          logo_url?: string | null;
          logo_light_url?: string | null;
          favicon_url?: string | null;
          colors?: Json;
          fonts?: Json;
          gradients?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      changelog_entries: {
        Row: {
          id: string;
          version: string | null;
          title: string;
          description: string;
          type: 'added' | 'fixed' | 'improved' | 'removed' | 'security';
          published: boolean;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          version?: string | null;
          title: string;
          description: string;
          type: 'added' | 'fixed' | 'improved' | 'removed' | 'security';
          published?: boolean;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          version?: string | null;
          title?: string;
          description?: string;
          type?: 'added' | 'fixed' | 'improved' | 'removed' | 'security';
          published?: boolean;
          published_at?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          thumbnail_url: string | null;
          background_url: string | null;
          dimensions: Json | null;
          zones: Json;
          min_plan: MinPlan;
          featured: boolean;
          published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          thumbnail_url?: string | null;
          background_url?: string | null;
          dimensions?: Json | null;
          zones?: Json;
          min_plan?: MinPlan;
          featured?: boolean;
          published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          category?: string | null;
          thumbnail_url?: string | null;
          background_url?: string | null;
          dimensions?: Json | null;
          zones?: Json;
          min_plan?: MinPlan;
          featured?: boolean;
          published?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          changes: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_email?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          changes?: Json | null;
          created_at?: string;
        };
        Update: {
          actor_id?: string | null;
          actor_email?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          changes?: Json | null;
        };
        Relationships: [];
      };
      // ── Phase 1: Event registration tables (migration 017) ─────────
      event_pages: {
        Row: {
          id: string;
          event_id: string;
          variant_id: string | null;
          title: string;
          tagline: string | null;
          description: string | null;
          cover_image_url: string | null;
          venue_name: string | null;
          venue_address: string | null;
          venue_lat: number | null;
          venue_lng: number | null;
          starts_at: string;
          ends_at: string;
          timezone: string;
          is_online: boolean;
          online_url: string | null;
          registration_deadline: string | null;
          max_capacity: number | null;
          is_public: boolean;
          custom_slug: string | null;
          seo_title: string | null;
          seo_description: string | null;
          payment_processor: PaymentProcessor;
          organizer_name: string | null;
          organizer_avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          variant_id?: string | null;
          title: string;
          tagline?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          venue_name?: string | null;
          venue_address?: string | null;
          venue_lat?: number | null;
          venue_lng?: number | null;
          starts_at: string;
          ends_at: string;
          timezone?: string;
          is_online?: boolean;
          online_url?: string | null;
          registration_deadline?: string | null;
          max_capacity?: number | null;
          is_public?: boolean;
          custom_slug?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          payment_processor?: PaymentProcessor;
          organizer_name?: string | null;
          organizer_avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          variant_id?: string | null;
          title?: string;
          tagline?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          venue_name?: string | null;
          venue_address?: string | null;
          venue_lat?: number | null;
          venue_lng?: number | null;
          starts_at?: string;
          ends_at?: string;
          timezone?: string;
          is_online?: boolean;
          online_url?: string | null;
          registration_deadline?: string | null;
          max_capacity?: number | null;
          is_public?: boolean;
          custom_slug?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          payment_processor?: PaymentProcessor;
          organizer_name?: string | null;
          organizer_avatar_url?: string | null;
          updated_at?: string;
        };
        // Note: payment_processor check constraint updated in migration 018 to include 'waafipay'
        Relationships: [
          {
            foreignKeyName: "event_pages_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      ticket_types: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          price: number;
          currency: string;
          quantity: number | null;
          quantity_sold: number;
          sales_start: string | null;
          sales_end: string | null;
          min_per_order: number;
          max_per_order: number;
          is_visible: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          price?: number;
          currency?: string;
          quantity?: number | null;
          quantity_sold?: number;
          sales_start?: string | null;
          sales_end?: string | null;
          min_per_order?: number;
          max_per_order?: number;
          is_visible?: boolean;
          position?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          quantity?: number | null;
          quantity_sold?: number;
          sales_start?: string | null;
          sales_end?: string | null;
          min_per_order?: number;
          max_per_order?: number;
          is_visible?: boolean;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          ticket_type_id: string | null;
          attendee_name: string;
          attendee_email: string;
          attendee_phone: string | null;
          custom_fields: Json;
          status: RegistrationStatus;
          payment_status: PaymentStatus;
          stripe_payment_intent_id: string | null;
          flutterwave_tx_ref: string | null;
          amount_paid: number;
          currency: string;
          qr_code_token: string;
          checked_in_at: string | null;
          checked_in_by: string | null;
          karta_card_url: string | null;
          karta_card_zone_data: Json | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          ticket_type_id?: string | null;
          attendee_name: string;
          attendee_email: string;
          attendee_phone?: string | null;
          custom_fields?: Json;
          status?: RegistrationStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          flutterwave_tx_ref?: string | null;
          amount_paid?: number;
          currency?: string;
          qr_code_token?: string;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          karta_card_url?: string | null;
          karta_card_zone_data?: Json | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          ticket_type_id?: string | null;
          attendee_name?: string;
          attendee_email?: string;
          attendee_phone?: string | null;
          custom_fields?: Json;
          status?: RegistrationStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          flutterwave_tx_ref?: string | null;
          amount_paid?: number;
          currency?: string;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          karta_card_url?: string | null;
          karta_card_zone_data?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      registration_form_fields: {
        Row: {
          id: string;
          event_id: string;
          label: string;
          field_type: FieldType;
          options: Json | null;
          is_required: boolean;
          position: number;
        };
        Insert: {
          id?: string;
          event_id: string;
          label: string;
          field_type: FieldType;
          options?: Json | null;
          is_required?: boolean;
          position?: number;
        };
        Update: {
          label?: string;
          field_type?: FieldType;
          options?: Json | null;
          is_required?: boolean;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reg_form_fields_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      promo_codes: {
        Row: {
          id: string;
          event_id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          max_uses: number | null;
          uses_count: number;
          valid_from: string | null;
          valid_until: string | null;
          applies_to: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          max_uses?: number | null;
          uses_count?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          applies_to?: Json | null;
          created_at?: string;
        };
        Update: {
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          max_uses?: number | null;
          uses_count?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          applies_to?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "promo_codes_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      check_in_sessions: {
        Row: {
          id: string;
          event_id: string;
          operator_id: string | null;
          started_at: string;
          check_ins_count: number;
        };
        Insert: {
          id?: string;
          event_id: string;
          operator_id?: string | null;
          started_at?: string;
          check_ins_count?: number;
        };
        Update: {
          check_ins_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "check_in_sessions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      // ── CMS tables (migration 007) ───────────────────────────────
      cms_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          status: 'draft' | 'published';
          seo: Json;
          published_version: number | null;
          created_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          status?: 'draft' | 'published';
          seo?: Json;
          published_version?: number | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          status?: 'draft' | 'published';
          seo?: Json;
          published_version?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_blocks: {
        Row: {
          id: string;
          page_id: string;
          type: string;
          content: Json;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          type: string;
          content?: Json;
          position?: number;
          created_at?: string;
        };
        Update: {
          type?: string;
          content?: Json;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cms_blocks_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "cms_pages";
            referencedColumns: ["id"];
          }
        ];
      };
      cms_navigation: {
        Row: {
          id: string;
          location: 'header' | 'footer';
          items: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location: 'header' | 'footer';
          items?: Json;
          updated_at?: string;
        };
        Update: {
          location?: 'header' | 'footer';
          items?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_media: {
        Row: {
          id: string;
          url: string;
          filename: string | null;
          alt: string | null;
          width: number | null;
          height: number | null;
          size_bytes: number | null;
          mime: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          filename?: string | null;
          alt?: string | null;
          width?: number | null;
          height?: number | null;
          size_bytes?: number | null;
          mime?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          url?: string;
          filename?: string | null;
          alt?: string | null;
          width?: number | null;
          height?: number | null;
          size_bytes?: number | null;
          mime?: string | null;
        };
        Relationships: [];
      };
      // ── Phase 2: Speakers, sessions, agenda (migration 020) ──────────
      tracks: {
        Row: { id: string; event_id: string; name: string; color: string; position: number };
        Insert: { id?: string; event_id: string; name: string; color?: string; position?: number };
        Update: { name?: string; color?: string; position?: number };
        Relationships: [];
      };
      speakers: {
        Row: { id: string; event_id: string; name: string; headline: string | null; bio: string | null; photo_url: string | null; company: string | null; role: string | null; linkedin_url: string | null; twitter_url: string | null; website_url: string | null; speaker_type: string; is_featured: boolean; position: number; created_at: string };
        Insert: { id?: string; event_id: string; name: string; headline?: string | null; bio?: string | null; photo_url?: string | null; company?: string | null; role?: string | null; linkedin_url?: string | null; twitter_url?: string | null; website_url?: string | null; speaker_type?: string; is_featured?: boolean; position?: number; created_at?: string };
        Update: { name?: string; headline?: string | null; bio?: string | null; photo_url?: string | null; company?: string | null; role?: string | null; linkedin_url?: string | null; twitter_url?: string | null; website_url?: string | null; speaker_type?: string; is_featured?: boolean; position?: number };
        Relationships: [];
      };
      sessions: {
        Row: { id: string; event_id: string; track_id: string | null; title: string; description: string | null; session_type: string; starts_at: string; ends_at: string; room: string | null; capacity: number | null; registrations_count: number; is_published: boolean; position: number; created_at: string };
        Insert: { id?: string; event_id: string; track_id?: string | null; title: string; description?: string | null; session_type?: string; starts_at: string; ends_at: string; room?: string | null; capacity?: number | null; registrations_count?: number; is_published?: boolean; position?: number; created_at?: string };
        Update: { track_id?: string | null; title?: string; description?: string | null; session_type?: string; starts_at?: string; ends_at?: string; room?: string | null; capacity?: number | null; is_published?: boolean; position?: number };
        Relationships: [];
      };
      session_speakers: {
        Row: { session_id: string; speaker_id: string; position: number };
        Insert: { session_id: string; speaker_id: string; position?: number };
        Update: { position?: number };
        Relationships: [];
      };
      attendee_agendas: {
        Row: { id: string; registration_id: string; session_id: string; created_at: string };
        Insert: { id?: string; registration_id: string; session_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      session_ratings: {
        Row: { id: string; registration_id: string; session_id: string; rating: number; created_at: string };
        Insert: { id?: string; registration_id: string; session_id: string; rating: number; created_at?: string };
        Update: { rating?: number };
        Relationships: [];
      };
      event_feedback: {
        Row: { id: string; registration_id: string; event_id: string; overall_rating: number | null; highlights: string[] | null; comment: string | null; created_at: string };
        Insert: { id?: string; registration_id: string; event_id: string; overall_rating?: number | null; highlights?: string[] | null; comment?: string | null; created_at?: string };
        Update: { overall_rating?: number | null; highlights?: string[] | null; comment?: string | null };
        Relationships: [];
      };
      cms_page_versions: {
        Row: {
          id: string;
          page_id: string;
          version_num: number;
          snapshot: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          version_num?: number;
          snapshot: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          snapshot?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "cms_page_versions_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "cms_pages";
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
      increment_ticket_quantity_sold: {
        Args: { ticket_id: string; qty: number };
        Returns: undefined;
      };
      increment_promo_code_uses: {
        Args: { code_id: string };
        Returns: undefined;
      };
      increment_checkin_session_count: {
        Args: { p_event_id: string };
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
