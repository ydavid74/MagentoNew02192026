// Shopify API endpoints for fetching order data

import { API_CONFIG, createFetchOptions } from "../config/api";

export interface ShopifyOrderResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ShopifyAPI {
  private static baseUrl = `${API_CONFIG.SHOPIFY_SYNC_BASE_URL}/shopify`;

  static async getOrder(orderId: string): Promise<ShopifyOrderResponse> {
    try {
      const url = `${this.baseUrl}/order/${orderId}`;
      console.log(`🛍️ Fetching from Shopify API: ${url}`);
      console.log(`🔧 Base URL: ${this.baseUrl}`);
      console.log(`🌍 Environment: ${import.meta.env.MODE}`);

      const response = await fetch(
        url,
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
        message: "Order fetched successfully",
        data: data.data,
      };
    } catch (error) {
      console.error("Shopify API error:", error);
      return {
        success: false,
        message: "Failed to fetch order from Shopify",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
