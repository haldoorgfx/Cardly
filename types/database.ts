export type Plan = "free" | "pro" | "studio";
export type EventStatus = "draft" | "published" | "archived";
export type ZoneType = "text" | "photo" | "custom" | "label" | "shape" | "image";

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
  // text styling extras
  lineHeight?: number;     // 0.8 – 2.5, default 1.2
  letterSpacing?: number;  // px, -5 – 20, default 0
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  // text effects
  strokeColor?: string;    // outline/stroke color
  strokeWidth?: number;    // outline width px, default 0
  shadowColor?: string;    // drop shadow color
  shadowBlur?: number;     // shadow blur px, default 0
  shadowX?: number;        // shadow offset X px, default 0
  shadowY?: number;        // shadow offset Y px, default 0
  // appearance
  opacity?: number;        // 0 – 100, default 100
  rotation?: number;       // degrees, default 0
  bgColor?: string;        // background rect behind text
  bgOpacity?: number;      // 0 – 100, default 60
  // photo extras
  photoBorderColor?: string;
  photoBorderWidth?: number;  // px, default 0
  // shape zone
  shapeType?: 'rect' | 'ellipse' | 'triangle' | 'line';  // for type === 'shape'
  // image zone
  imageUrl?: string;  // for type === 'image' — designer-uploaded static image
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
          brand_kit: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          plan?: Plan;
          brand_kit?: Json | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          plan?: Plan;
          brand_kit?: Json | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
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
          status?: EventStatus;
          view_count?: number;
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
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
        };
        Update: {
          variant_name?: string;
          variant_slug?: string;
          background_url?: string | null;
          background_width?: number | null;
          background_height?: number | null;
          zones?: Json;
          position?: number;
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
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          variant_id?: string | null;
          attendee_name?: string | null;
          attendee_data?: Json | null;
          output_url?: string | null;
          created_at?: string;
        };
        Update: {
          variant_id?: string | null;
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
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
