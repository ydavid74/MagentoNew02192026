// Sync API endpoints for system settings

import { API_CONFIG, createFetchOptions } from "../config/api";

export interface SyncResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class SyncAPI {
  private static baseUrl = `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/sync`;

  static async runOnce(): Promise<SyncResponse> {
    try {
      // This would call the shopify-database-sync service
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
        message: "Sync completed successfully",
        data,
      };
    } catch (error) {
      console.error("Sync API error:", error);
      return {
        success: false,
        message: "Failed to run sync",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getStatus(): Promise<SyncResponse> {
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
        message: "Status retrieved successfully",
        data,
      };
    } catch (error) {
      console.error("Sync status API error:", error);
      return {
        success: false,
        message: "Failed to get sync status",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async enableCronJob(intervalMinutes: number): Promise<SyncResponse> {
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
        message: "Cron job enabled successfully",
        data,
      };
    } catch (error) {
      console.error("Enable cron job API error:", error);
      return {
        success: false,
        message: "Failed to enable cron job",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async disableCronJob(): Promise<SyncResponse> {
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
        message: "Cron job disabled successfully",
        data,
      };
    } catch (error) {
      console.error("Disable cron job API error:", error);
      return {
        success: false,
        message: "Failed to disable cron job",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
