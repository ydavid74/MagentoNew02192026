// Import API endpoints for system settings

import { API_CONFIG, createFetchOptions } from "../config/api";

export interface ImportResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface GoogleSheetsImportRequest {
  url: string;
  sheetName?: string;
  range?: string;
}

export class ImportAPI {
  private static baseUrl = `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/import`;

  static async importStatusModel(
    request: GoogleSheetsImportRequest
  ): Promise<ImportResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/status-model`,
        createFetchOptions({
          method: "POST",
          body: JSON.stringify(request),
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: "Status model imported successfully",
        data,
      };
    } catch (error) {
      console.error("Import status model API error:", error);
      return {
        success: false,
        message: "Failed to import status model",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async validateGoogleSheetsUrl(url: string): Promise<ImportResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/validate-sheets-url`,
        createFetchOptions({
          method: "POST",
          body: JSON.stringify({ url }),
        })
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: "Google Sheets URL validated successfully",
        data,
      };
    } catch (error) {
      console.error("Validate Google Sheets URL API error:", error);
      return {
        success: false,
        message: "Failed to validate Google Sheets URL",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getImportHistory(): Promise<ImportResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/history`,
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
        message: "Import history retrieved successfully",
        data,
      };
    } catch (error) {
      console.error("Get import history API error:", error);
      return {
        success: false,
        message: "Failed to get import history",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
