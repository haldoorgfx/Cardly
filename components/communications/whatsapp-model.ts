/** Shared types for the WhatsApp communications surfaces (W01–W04). */

export type WAConnectionStatus = 'connected' | 'pending' | 'disconnected';
export type TemplateCategory = 'utility' | 'marketing' | 'authentication';
export type TemplateApproval = 'approved' | 'pending' | 'rejected';

export interface WAConnection {
  id: string;
  phone_number: string;
  waba_id: string | null;
  status: WAConnectionStatus;
  event_id: string | null;
  created_at: string;
}

export interface WATemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  approval_status: TemplateApproval;
  body: string | null;
  event_id: string | null;
}

export interface TemplateInput {
  name: string;
  category: TemplateCategory;
  body: string;
}

export type JourneyStep = 'registration' | 'd7' | 'd1' | 'h1' | 'during' | 'post';

export interface AutomationRow {
  step: JourneyStep;
  enabled: boolean;
  channels: { email: boolean; whatsapp: boolean; sms: boolean };
}
