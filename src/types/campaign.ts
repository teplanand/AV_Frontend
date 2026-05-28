export interface StartCampaignRequest {
  name: string;
  sender_id: number;
  contact_ids: number[];
  prompt_id: number; // 🆕 added
}

export interface StartCampaignResponse {
  status: string;
  campaign_id: number;
  contacts_processed: number;
}

export interface Campaign {
  id: number;
  name: string;
  created_at: string;
}

export interface CampaignDetails extends Campaign {
  contacts: any[]; // (you can type this more strictly if needed)
  emails: any[];
}
