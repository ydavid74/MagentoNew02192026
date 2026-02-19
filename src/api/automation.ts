// Automation API endpoints for system settings

import { API_CONFIG, createFetchOptions } from "../config/api";

export interface AutomationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class AutomationAPI {
  private static baseUrl = `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/automation`;

  static async runOnce(): Promise<AutomationResponse> {
    try {
      // This would call the shopify-database-sync automation service
      const response = await fetch(
        `${this.baseUrl}/run-once`,
        createFetchOptions({
          method: "POST",
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: "Automation completed successfully",
        data,
      };
    } catch (error) {
      console.error("Automation API error:", error);
      return {
        success: false,
        message: "Failed to run automation",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getStatus(): Promise<AutomationResponse> {
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
        message: "Automation status retrieved successfully",
        data,
      };
    } catch (error) {
      console.error("Automation status API error:", error);
      return {
        success: false,
        message: "Failed to get automation status",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async enableCronJob(
    intervalMinutes: number
  ): Promise<AutomationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cron/enable`,
        createFetchOptions({
          method: "POST",
          body: JSON.stringify({ intervalMinutes }),
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: "Automation cron job enabled successfully",
        data,
      };
    } catch (error) {
      console.error("Enable automation cron job API error:", error);
      return {
        success: false,
        message: "Failed to enable automation cron job",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async disableCronJob(): Promise<AutomationResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cron/disable`,
        createFetchOptions({
          method: "POST",
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: "Automation cron job disabled successfully",
        data,
      };
    } catch (error) {
      console.error("Disable automation cron job API error:", error);
      return {
        success: false,
        message: "Failed to disable automation cron job",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
