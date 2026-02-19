// Google Sheets integration service for importing status models

export interface StatusModelRow {
  status: string;
  new_status: string;
  wait_time_business_days: number;
  description: string;
  private_email?: string;
  email_subject?: string;
  email_custom_message?: string;
  additional_recipients?: string[];
  is_active: boolean;
}

export interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  range: string;
}

export class GoogleSheetsService {
  private static readonly GOOGLE_SHEETS_API_BASE =
    "https://sheets.googleapis.com/v4/spreadsheets";

  /**
   * Extract spreadsheet ID from Google Sheets URL
   */
  static extractSpreadsheetId(url: string): string | null {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Import status model from Google Sheets
   */
  static async importStatusModel(
    url: string,
    apiKey: string,
    range: string = "A1:H100"
  ): Promise<{ success: boolean; data?: StatusModelRow[]; error?: string }> {
    try {
      const spreadsheetId = this.extractSpreadsheetId(url);
      if (!spreadsheetId) {
        throw new Error("Invalid Google Sheets URL");
      }

      const response = await fetch(
        `${this.GOOGLE_SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length < 2) {
        throw new Error("No data found in the specified range");
      }

      // Skip header row and parse data
      const statusModelData: StatusModelRow[] = rows
        .slice(1)
        .map((row: any[], index: number) => {
          return {
            status: row[0] || "",
            new_status: row[1] || "",
            wait_time_business_days: parseInt(row[2]) || 0,
            description: row[3] || "",
            private_email: row[4] || null,
            email_subject: row[5] || null,
            email_custom_message: row[6] || null,
            additional_recipients: row[7]
              ? row[7].split(",").map((email: string) => email.trim())
              : [],
            is_active: true,
          };
        })
        .filter((row: StatusModelRow) => row.status && row.new_status);

      return {
        success: true,
        data: statusModelData,
      };
    } catch (error) {
      console.error("Google Sheets import error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate Google Sheets URL format
   */
  static validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);

      if (!urlObj.hostname.includes("docs.google.com")) {
        return {
          valid: false,
          error: "URL must be from Google Sheets (docs.google.com)",
        };
      }

      if (!url.includes("/spreadsheets/d/")) {
        return {
          valid: false,
          error: "URL must be a Google Sheets URL",
        };
      }

      const spreadsheetId = this.extractSpreadsheetId(url);
      if (!spreadsheetId) {
        return {
          valid: false,
          error: "Could not extract spreadsheet ID from URL",
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: "Invalid URL format",
      };
    }
  }

  /**
   * Get expected column headers for status model
   */
  static getExpectedHeaders(): string[] {
    return [
      "Status",
      "New Status",
      "Wait Time (Business Days)",
      "Description",
      "Private Email",
      "Email Subject",
      "Email Custom Message",
      "Additional Recipients",
    ];
  }

  /**
   * Create a template Google Sheets URL
   */
  static createTemplateUrl(): string {
    // This would create a template spreadsheet with the correct headers
    // For now, return a placeholder
    return "https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit#gid=0";
  }
}
