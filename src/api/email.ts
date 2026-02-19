// Email API endpoints for system settings

import { API_CONFIG, createFetchOptions } from "../config/api";

export interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class EmailAPI {
  private static baseUrl = `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/email`;

  static async testEmail(emailAddress: string): Promise<EmailResponse> {
    try {
      console.log("🔍 EmailAPI.testEmail called with:", {
        emailAddress,
        baseUrl: this.baseUrl,
        fullUrl: `${this.baseUrl}/test`
      });
      
      // This would call the shopify-database-sync email service
      const response = await fetch(
        `${this.baseUrl}/test`,
        createFetchOptions({
          method: "POST",
          body: JSON.stringify({ email: emailAddress }),
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: `Test email sent successfully to ${emailAddress}`,
        data,
      };
    } catch (error) {
      console.error("Email test API error:", error);
      return {
        success: false,
        message: "Failed to send test email",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getEmailStatus(): Promise<EmailResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/status`,
        createFetchOptions({
          method: "GET",
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: "Email status retrieved successfully",
        data,
      };
    } catch (error) {
      console.error("Email status API error:", error);
      return {
        success: false,
        message: "Failed to get email status",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
