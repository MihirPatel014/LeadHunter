export const TEMPLATE_CHANNEL_VALUES = ['EMAIL', 'WHATSAPP'] as const;
export type TemplateChannel = (typeof TEMPLATE_CHANNEL_VALUES)[number];

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example: string;
}

export const SUPPORTED_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: '{{business_name}}', label: 'Business Name', description: 'Name of the business lead', example: 'Apex Salon & Spa' },
  { key: '{{contact_name}}', label: 'Contact Name', description: 'Owner or contact person name', example: 'Alex Smith' },
  { key: '{{city}}', label: 'City', description: 'Location city of the business', example: 'Surat' },
  { key: '{{category}}', label: 'Category', description: 'Business category/industry', example: 'Salon' },
  { key: '{{website}}', label: 'Website', description: 'Business website URL', example: 'https://apexsalon.com' },
  { key: '{{rating}}', label: 'Rating', description: 'Google rating score out of 5', example: '4.8' },
  { key: '{{review_count}}', label: 'Review Count', description: 'Total review count', example: '124' },
  { key: '{{sender_name}}', label: 'Sender Name', description: 'Your name or agency name', example: 'Mihir Patel' },
];
