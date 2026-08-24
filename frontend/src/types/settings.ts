export interface AppSettingItem {
  key: string;
  value: string | null;
  category: string;
  label?: string | null;
}

export interface SenderProfileSettings {
  sender_name: string;
  sender_agency: string;
  sender_calendly_url: string;
  sender_email_signature: string;
}

export interface ScoringRuleSettings {
  score_no_website: number;
  score_broken_website: number;
  score_no_phone: number;
  score_low_rating: number;
  score_few_reviews: number;
}

export interface OutreachPreferenceSettings {
  daily_email_limit: number;
  daily_whatsapp_limit: number;
  working_hours_start: string;
  working_hours_end: string;
}
