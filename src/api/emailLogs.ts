import { API_CONFIG, createFetchOptions } from "../config/api";

const baseUrl = API_CONFIG.SHOPIFY_SYNC_BASE_URL;

export interface EmailLog {
  id: string;
  sent_at: string;
  recipient_email: string;
  subject: string;
  status: "sent" | "failed" | "pending";
  email_type?: string;
  error_message?: string;
  order_id?: string;
  status_rule_id?: string;
  message?: string;
  shopify_email_id?: string;
  created_at?: string;
}

export interface EmailLogsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    logs: EmailLog[];
  };
}

export class EmailLogsAPI {
  static async getLogs(): Promise<EmailLogsResponse> {
    const response = await fetch(
      `${baseUrl}/email/logs`,
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
