import { supabase } from "@/integrations/supabase/client";

export interface StatusOption {
  value: string;
  label: string;
}

export class StatusService {
  /**
   * Get all unique statuses from the statuses_model table
   */
  static async getAllStatuses(): Promise<StatusOption[]> {
    try {
      const { data, error } = await supabase
        .from("statuses_model")
        .select("status, new_status")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching statuses:", error);
        throw error;
      }

      // Get all unique statuses from both status and new_status columns
      const allStatuses = new Set<string>();

      data?.forEach((rule) => {
        if (rule.status) allStatuses.add(rule.status);
        if (rule.new_status) allStatuses.add(rule.new_status);
      });

      // Convert to options array and sort alphabetically
      const statusOptions: StatusOption[] = Array.from(allStatuses)
        .map((status) => ({
          value: status,
          label: status,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      return statusOptions;
    } catch (error) {
      console.error("Error in getAllStatuses:", error);
      // Return fallback statuses if database query fails
      return [
        { value: "Casting Order", label: "Casting Order" },
        { value: "Casting Received", label: "Casting Received" },
        { value: "Polishing & Finishing", label: "Polishing & Finishing" },
        { value: "Item Shipped", label: "Item Shipped" },
        {
          value: "Return For Refund Instructions",
          label: "Return For Refund Instructions",
        },
        {
          value: "Return for replacement instructions",
          label: "Return for replacement instructions",
        },
        {
          value: "Return For Refund Received",
          label: "Return For Refund Received",
        },
        {
          value: "Return for replacement received",
          label: "Return for replacement received",
        },
        {
          value: "Casting Order Email Sent",
          label: "Casting Order Email Sent",
        },
        {
          value: "Casting Order Delay - Jenny",
          label: "Casting Order Delay - Jenny",
        },
        {
          value: "Casting Order Delay - David",
          label: "Casting Order Delay - David",
        },
        {
          value: "Casting Received Email Sent",
          label: "Casting Received Email Sent",
        },
        {
          value: "Polishing & Finishing Email Sent",
          label: "Polishing & Finishing Email Sent",
        },
        {
          value: "Return For Refund Instructions Email Sent",
          label: "Return For Refund Instructions Email Sent",
        },
        {
          value: "Return for replacement instructions Email Sent",
          label: "Return for replacement instructions Email Sent",
        },
        {
          value: "Return For Refund Received Email Sent",
          label: "Return For Refund Received Email Sent",
        },
        {
          value: "Return for replacement received Email Sent",
          label: "Return for replacement received Email Sent",
        },
        { value: "Item Shipped Email Sent", label: "Item Shipped Email Sent" },
      ];
    }
  }

  /**
   * Get all status rules for automation
   */
  static async getStatusRules() {
    try {
      const { data, error } = await supabase
        .from("statuses_model")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching status rules:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error in getStatusRules:", error);
      return [];
    }
  }
}
