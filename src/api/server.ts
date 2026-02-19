// Simple API server for system settings
// This would typically be a separate Express.js server

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export class SystemAPIServer {
  private static shopifySyncPath = path.join(
    process.cwd(),
    "../shopify-database-sync"
  );

  // Sync endpoints
  static async runSyncOnce() {
    try {
      const { stdout, stderr } = await execAsync("npm run sync:once", {
        cwd: this.shopifySyncPath,
      });

      return {
        success: true,
        message: "Sync completed successfully",
        output: stdout,
        error: stderr,
      };
    } catch (error) {
      return {
        success: false,
        message: "Sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getSyncStatus() {
    try {
      // Check if sync process is running
      const { stdout } = await execAsync(
        'ps aux | grep "sync" | grep -v grep',
        {
          cwd: this.shopifySyncPath,
        }
      );

      return {
        success: true,
        message: "Sync status retrieved",
        data: {
          isRunning: stdout.length > 0,
          lastRun: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get sync status",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Automation endpoints
  static async runAutomationOnce() {
    try {
      const { stdout, stderr } = await execAsync(
        "npm run automation:run-once",
        {
          cwd: this.shopifySyncPath,
        }
      );

      return {
        success: true,
        message: "Automation completed successfully",
        output: stdout,
        error: stderr,
      };
    } catch (error) {
      return {
        success: false,
        message: "Automation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getAutomationStatus() {
    try {
      // Check if automation process is running
      const { stdout } = await execAsync(
        'ps aux | grep "automation" | grep -v grep',
        {
          cwd: this.shopifySyncPath,
        }
      );

      return {
        success: true,
        message: "Automation status retrieved",
        data: {
          isRunning: stdout.length > 0,
          lastRun: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to get automation status",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Email test endpoint
  static async testEmail() {
    try {
      const { stdout, stderr } = await execAsync("npm run test:email-fix", {
        cwd: this.shopifySyncPath,
      });

      return {
        success: true,
        message: "Test email sent successfully",
        output: stdout,
        error: stderr,
      };
    } catch (error) {
      return {
        success: false,
        message: "Email test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Google Sheets import endpoint
  static async importStatusModel(url: string) {
    try {
      // This would integrate with Google Sheets API
      // For now, return a mock response
      return {
        success: true,
        message: "Status model imported successfully from Google Sheets",
        data: {
          url,
          importedAt: new Date().toISOString(),
          recordsImported: 10, // Mock data
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to import status model",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
