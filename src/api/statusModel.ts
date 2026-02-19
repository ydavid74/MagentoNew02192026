import { API_CONFIG, createFetchOptions } from "../config/api";

const baseUrl = API_CONFIG.SHOPIFY_SYNC_BASE_URL;

export interface StatusModelRecord {
  id: string;
  status: string;
  new_status: string;
  wait_time_business_days: number;
  description: string;
  private_email: string | null;
  email_subject: string | null;
  email_custom_message: string | null;
  additional_recipients: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatusModelResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    records: StatusModelRecord[];
  };
}

export class StatusModelAPI {
  static async getCurrentData(): Promise<StatusModelResponse> {
    const response = await fetch(
      `${baseUrl}/status-model/current`,
      createFetchOptions({
        method: "GET",
      })
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}
