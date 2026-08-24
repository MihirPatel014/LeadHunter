export interface MessagePreviewRequest {
  leadId: number;
  templateId: number;
}

export interface RenderedMessage {
  subject: string | null;
  body: string;
}

export interface MessagePreviewResponse {
  lead: {
    id: number;
    businessName: string;
    category: string | null;
    city: string | null;
  };
  template: {
    id: number;
    name: string;
    channel: string;
  };
  rendered: RenderedMessage;
}
