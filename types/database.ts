// ── Phase 3: Networking, Q&A, Polls types ────────────────────────────────────
export type ConnectionStatus = "pending" | "accepted" | "declined";
export type QAStatus = "pending" | "answered" | "hidden";
export type LeaderboardAction = "session_attend" | "connection_made" | "question_asked" | "poll_voted" | "feedback_given" | "card_shared";

export interface QAQuestion {
  id: string;
  event_id: string;
  session_id: string | null;
  registration_id: string | null;
  question: string;
  is_anonymous: boolean;
  upvotes_count: number;
  status: QAStatus;
  is_featured: boolean;
  created_at: string;
  // joined
  registrations?: { attendee_name: string } | null;
}

export interface Poll {
  id: string;
  event_id: string;
  session_id: string | null;
  question: string;
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
  poll_options?: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes_count: number;
  position: number;
}

export interface LeaderboardEntry {
  registration_id: string;
  attendee_name: string;
  total_points: number;
  rank: number;
}

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
export type RegistrationStatus = "pending" | "confirmed" | "checked_in" | "cancelled" | "refunded" | "pending_approval";
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
  min_price: number | null;
  access_code: string | null;
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
  referral_code: string | null;
  utm_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromoterCode {
  id: string;
  event_id: string;
  code: string;
  label: string | null;
  created_at: string;
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
          // preferences (migration 026)
          organization: string | null;
          timezone: string | null;
          language: string | null;
          currency: string | null;
          date_format: string | null;
          notify_registrations: boolean;
          notify_daily_summary: boolean;
          notify_card_shares: boolean;
          notify_product_updates: boolean;
          // attendee columns (migration 010)
          account_type: string;
          interests: string[] | null;
          city: string | null;
          phone: string | null;
          whatsapp_verified: boolean;
          notification_prefs: Json | null;
          onboarding_done: boolean;
          // discovery columns (migration 011)
          bio: string | null;
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
          organization?: string | null;
          timezone?: string | null;
          language?: string | null;
          currency?: string | null;
          date_format?: string | null;
          notify_registrations?: boolean;
          notify_daily_summary?: boolean;
          notify_card_shares?: boolean;
          notify_product_updates?: boolean;
          account_type?: string;
          interests?: string[] | null;
          city?: string | null;
          phone?: string | null;
          whatsapp_verified?: boolean;
          notification_prefs?: Json | null;
          onboarding_done?: boolean;
          bio?: string | null;
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
          organization?: string | null;
          timezone?: string | null;
          language?: string | null;
          currency?: string | null;
          date_format?: string | null;
          notify_registrations?: boolean;
          notify_daily_summary?: boolean;
          notify_card_shares?: boolean;
          notify_product_updates?: boolean;
          account_type?: string;
          interests?: string[] | null;
          city?: string | null;
          phone?: string | null;
          whatsapp_verified?: boolean;
          notification_prefs?: Json | null;
          onboarding_done?: boolean;
          bio?: string | null;
        };
        Relationships: [];
      };
      waitlist_entries: {
        Row: {
          id: string;
          event_page_id: string;
          email: string;
          name: string;
          status: 'waiting' | 'invited' | 'registered' | 'expired';
          position: number | null;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_page_id: string;
          email: string;
          name: string;
          status?: 'waiting' | 'invited' | 'registered' | 'expired';
          position?: number | null;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'waiting' | 'invited' | 'registered' | 'expired';
          position?: number | null;
          notified_at?: string | null;
        };
        Relationships: [];
      };
      event_series: {
        Row: {
          id: string;
          organizer_id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      ticket_transfers: {
        Row: {
          id: string;
          registration_id: string;
          from_name: string;
          from_email: string;
          to_name: string;
          to_email: string;
          transferred_at: string;
        };
        Insert: {
          registration_id: string;
          from_name: string;
          from_email: string;
          to_name: string;
          to_email: string;
          transferred_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      saved_events: {
        Row: {
          id: string;
          user_id: string;
          event_page_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_page_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          event_page_id?: string;
        };
        Relationships: [];
      };
      organizer_follows: {
        Row: {
          id: string;
          follower_id: string;
          organizer_id: string;
          notify_new_events: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          organizer_id: string;
          notify_new_events?: boolean;
          created_at?: string;
        };
        Update: {
          notify_new_events?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          type: 'registration' | 'card_download' | 'ticket_sale' | 'milestone' | 'sponsor' | 'system' | 'waitlist_spot' | 'new_event_from_follow' | 'reminder' | 'agenda_change' | 'card_ready' | 'receipt';
          title: string;
          body: string | null;
          action_url: string | null;
          icon: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id?: string | null;
          type: 'registration' | 'card_download' | 'ticket_sale' | 'milestone' | 'sponsor' | 'system' | 'waitlist_spot' | 'new_event_from_follow' | 'reminder' | 'agenda_change' | 'card_ready' | 'receipt';
          title: string;
          body?: string | null;
          action_url?: string | null;
          icon?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
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
          checkout_collect_details: boolean;
          checkout_require_approval: boolean;
          checkout_show_remaining: boolean;
          checkout_apply_vat: boolean;
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
          checkout_collect_details?: boolean;
          checkout_require_approval?: boolean;
          checkout_show_remaining?: boolean;
          checkout_apply_vat?: boolean;
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
          checkout_collect_details?: boolean;
          checkout_require_approval?: boolean;
          checkout_show_remaining?: boolean;
          checkout_apply_vat?: boolean;
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
          city: string | null;
          country: string | null;
          category: string | null;
          price_from: number | null;
          series_id: string | null;
          series_name: string | null;
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
          city?: string | null;
          country?: string | null;
          category?: string | null;
          price_from?: number | null;
          series_id?: string | null;
          series_name?: string | null;
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
          city?: string | null;
          country?: string | null;
          category?: string | null;
          price_from?: number | null;
          series_id?: string | null;
          series_name?: string | null;
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
          min_price: number | null;
          access_code: string | null;
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
          min_price?: number | null;
          access_code?: string | null;
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
          min_price?: number | null;
          access_code?: string | null;
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
          referral_code: string | null;
          utm_source: string | null;
          user_id: string | null;
          chosen_price: number | null;
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
          referral_code?: string | null;
          utm_source?: string | null;
          user_id?: string | null;
          chosen_price?: number | null;
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
          referral_code?: string | null;
          utm_source?: string | null;
          user_id?: string | null;
          chosen_price?: number | null;
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
      promoter_codes: {
        Row: {
          id: string;
          event_id: string;
          code: string;
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          code: string;
          label?: string | null;
          created_at?: string;
        };
        Update: {
          code?: string;
          label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "promoter_codes_event_id_fkey";
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
      // ── Phase 3: Networking, Q&A, Polls (migration 021) ─────────────
      attendee_connections: {
        Row: { id: string; event_id: string; requester_id: string; recipient_id: string; status: string; created_at: string; updated_at: string };
        Insert: { id?: string; event_id: string; requester_id: string; recipient_id: string; status?: string; created_at?: string; updated_at?: string };
        Update: { status?: string; updated_at?: string };
        Relationships: [];
      };
      message_threads: {
        Row: { id: string; event_id: string; participant_a: string; participant_b: string; last_message_at: string | null; created_at: string };
        Insert: { id?: string; event_id: string; participant_a: string; participant_b: string; last_message_at?: string | null; created_at?: string };
        Update: { last_message_at?: string | null };
        Relationships: [];
      };
      messages: {
        Row: { id: string; thread_id: string; sender_id: string; content: string; read_at: string | null; created_at: string };
        Insert: { id?: string; thread_id: string; sender_id: string; content: string; read_at?: string | null; created_at?: string };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      qa_questions: {
        Row: { id: string; event_id: string; session_id: string | null; registration_id: string | null; question: string; is_anonymous: boolean; upvotes_count: number; status: string; is_featured: boolean; created_at: string };
        Insert: { id?: string; event_id: string; session_id?: string | null; registration_id?: string | null; question: string; is_anonymous?: boolean; upvotes_count?: number; status?: string; is_featured?: boolean; created_at?: string };
        Update: { status?: string; is_featured?: boolean; upvotes_count?: number };
        Relationships: [];
      };
      qa_upvotes: {
        Row: { question_id: string; registration_id: string; created_at: string };
        Insert: { question_id: string; registration_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      polls: {
        Row: { id: string; event_id: string; session_id: string | null; organizer_id: string | null; question: string; is_active: boolean; is_closed: boolean; created_at: string };
        Insert: { id?: string; event_id: string; session_id?: string | null; organizer_id?: string | null; question: string; is_active?: boolean; is_closed?: boolean; created_at?: string };
        Update: { question?: string; is_active?: boolean; is_closed?: boolean };
        Relationships: [];
      };
      poll_options: {
        Row: { id: string; poll_id: string; text: string; votes_count: number; position: number };
        Insert: { id?: string; poll_id: string; text: string; votes_count?: number; position?: number };
        Update: { text?: string; votes_count?: number; position?: number };
        Relationships: [];
      };
      poll_votes: {
        Row: { poll_id: string; option_id: string; registration_id: string; created_at: string };
        Insert: { poll_id: string; option_id: string; registration_id: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      leaderboard_points: {
        Row: { id: string; event_id: string; registration_id: string; action_type: string; points: number; ref_id: string | null; created_at: string };
        Insert: { id?: string; event_id: string; registration_id: string; action_type: string; points?: number; ref_id?: string | null; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      match_suggestions: {
        Row: { id: string; event_id: string; registration_id: string; matched_registration_id: string; score: number; reason: string; created_at: string };
        Insert: { id?: string; event_id: string; registration_id: string; matched_registration_id: string; score?: number; reason?: string; created_at?: string };
        Update: { score?: number; reason?: string };
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
      sponsors: {
        Row: {
          id: string;
          event_id: string;
          company_name: string;
          tagline: string | null;
          description: string | null;
          logo_url: string | null;
          cover_url: string | null;
          website_url: string | null;
          contact_email: string | null;
          meeting_url: string | null;
          booth_location: string | null;
          booth_hours: string | null;
          offerings: Json;
          team_members: Json;
          tier: string;
          position: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          company_name: string;
          tagline?: string | null;
          description?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          website_url?: string | null;
          contact_email?: string | null;
          meeting_url?: string | null;
          booth_location?: string | null;
          booth_hours?: string | null;
          offerings?: Json;
          team_members?: Json;
          tier?: string;
          position?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_name?: string;
          tagline?: string | null;
          description?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          website_url?: string | null;
          contact_email?: string | null;
          meeting_url?: string | null;
          booth_location?: string | null;
          booth_hours?: string | null;
          offerings?: Json;
          team_members?: Json;
          tier?: string;
          position?: number;
          is_visible?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sponsors_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      sponsor_leads: {
        Row: {
          id: string;
          sponsor_id: string;
          event_id: string;
          registration_id: string | null;
          attendee_name: string | null;
          attendee_email: string | null;
          note: string | null;
          rating: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sponsor_id: string;
          event_id: string;
          registration_id?: string | null;
          attendee_name?: string | null;
          attendee_email?: string | null;
          note?: string | null;
          rating?: string | null;
          created_at?: string;
        };
        Update: {
          attendee_name?: string | null;
          attendee_email?: string | null;
          note?: string | null;
          rating?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sponsor_leads_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          }
        ];
      };
      call_for_papers: {
        Row: {
          id: string;
          event_id: string;
          is_open: boolean;
          deadline_at: string | null;
          categories: string[];
          max_words: number;
          allow_pdf: boolean;
          instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          is_open?: boolean;
          deadline_at?: string | null;
          categories?: string[];
          max_words?: number;
          allow_pdf?: boolean;
          instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          is_open?: boolean;
          deadline_at?: string | null;
          categories?: string[];
          max_words?: number;
          allow_pdf?: boolean;
          instructions?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "call_for_papers_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      abstracts: {
        Row: {
          id: string;
          event_id: string;
          cfp_id: string | null;
          title: string;
          body: string;
          authors: string | null;
          authors_json: Json;
          keywords: string[];
          category: string | null;
          pdf_url: string | null;
          status: string;
          review_notes: string | null;
          assigned_session: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          cfp_id?: string | null;
          title: string;
          body: string;
          authors?: string | null;
          authors_json?: Json;
          keywords?: string[];
          category?: string | null;
          pdf_url?: string | null;
          status?: string;
          review_notes?: string | null;
          assigned_session?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          authors?: string | null;
          authors_json?: Json;
          keywords?: string[];
          category?: string | null;
          pdf_url?: string | null;
          status?: string;
          review_notes?: string | null;
          assigned_session?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "abstracts_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      feature_flags: {
        Row: {
          flag: string;
          label: string;
          description: string | null;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          flag: string;
          label: string;
          description?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          flag?: string;
          label?: string;
          description?: string | null;
          enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_flag_overrides: {
        Row: {
          flag: string;
          user_id: string;
          enabled: boolean;
        };
        Insert: {
          flag: string;
          user_id: string;
          enabled: boolean;
        };
        Update: {
          flag?: string;
          user_id?: string;
          enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "feature_flag_overrides_flag_fkey";
            columns: ["flag"];
            isOneToOne: false;
            referencedRelation: "feature_flags";
            referencedColumns: ["flag"];
          },
          {
            foreignKeyName: "feature_flag_overrides_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      white_label_settings: {
        Row: {
          user_id: string;
          brand_name: string | null;
          primary_color: string;
          logo_url: string | null;
          favicon_url: string | null;
          custom_domain: string | null;
          domain_verified: boolean;
          from_name: string | null;
          reply_to_email: string | null;
          hide_powered_by: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          brand_name?: string | null;
          primary_color?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
          from_name?: string | null;
          reply_to_email?: string | null;
          hide_powered_by?: boolean;
          updated_at?: string;
        };
        Update: {
          brand_name?: string | null;
          primary_color?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          custom_domain?: string | null;
          domain_verified?: boolean;
          from_name?: string | null;
          reply_to_email?: string | null;
          hide_powered_by?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "white_label_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
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
      toggle_qa_upvote: {
        Args: { p_question_id: string; p_registration_id: string };
        Returns: boolean;
      };
      cast_poll_vote: {
        Args: { p_poll_id: string; p_option_id: string; p_registration_id: string };
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
