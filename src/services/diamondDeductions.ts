import { supabase } from "@/integrations/supabase/client";
import { diamondService } from "./diamonds";

export interface DiamondDeduction {
  id?: string;
  order_id: string;
  date_added?: string;
  type: "center" | "side" | "manual";
  product_sku?: string;
  parcel_id?: string;
  ct_weight?: number;
  stones?: string;
  price_per_ct?: number;
  total_price?: number;
  mm?: string;
  comments?: string;
  include_in_item_cost?: boolean;
  added_to_stock?: boolean;
  deduction_type?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DiamondDeductionWithProfile extends DiamondDeduction {
  profile?: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateDiamondDeductionData {
  order_id: string;
  type: "center" | "side" | "manual";
  product_sku?: string;
  parcel_id?: string;
  ct_weight?: number;
  stones?: string;
  price_per_ct?: number;
  total_price?: number;
  mm?: string;
  comments?: string;
  include_in_item_cost?: boolean;
  added_to_stock?: boolean;
  deduction_type?: string;
}

export interface UpdateDiamondDeductionData {
  type?: "center" | "side" | "manual";
  product_sku?: string;
  parcel_id?: string;
  ct_weight?: number;
  stones?: string;
  price_per_ct?: number;
  total_price?: number;
  mm?: string;
  comments?: string;
  include_in_item_cost?: boolean;
  added_to_stock?: boolean;
}

class DiamondDeductionsService {
  /**
   * Log diamond deduction action to history
   */
  private async logDeductionHistory(data: {
    parcel_id: string;
    action:
      | "create"
      | "edit"
      | "delete"
      | "include_cost"
      | "exclude_cost"
      | "add_to_stock";
    deduction: DiamondDeduction;
    order_id: string;
    order_number?: string;
    employee_name?: string;
    changes?: string;
  }): Promise<void> {
    console.log(
      `🔄 Logging deduction history: ${data.action} for parcel ${data.parcel_id}`
    );
    try {
      // Get current user info for employee name
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let employeeName = "System";

      console.log("🔍 logDeductionHistory: Current User ID:", user?.id);
      console.log("🔍 logDeductionHistory: Current User Email:", user?.email);

      if (user?.id) {
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", user.id)
            .single();

          console.log("📊 logDeductionHistory: Profile query result:", {
            profileData,
            error,
          });

          if (!error && profileData) {
            const profile = profileData as any; // Type assertion to handle missing columns
            console.log(
              "👤 logDeductionHistory: First Name:",
              profile.first_name
            );
            console.log(
              "👤 logDeductionHistory: Last Name:",
              profile.last_name
            );

            if (profile.first_name && profile.last_name) {
              employeeName = `${profile.first_name} ${profile.last_name}`;
              console.log(
                "✅ logDeductionHistory: Using full name:",
                employeeName
              );
            } else if (profile.first_name) {
              employeeName = profile.first_name;
              console.log(
                "✅ logDeductionHistory: Using first name only:",
                employeeName
              );
            }
          } else {
            console.log(
              "❌ logDeductionHistory: Could not fetch profile data:",
              error
            );
            // Fallback to email-based name
            if (user?.email) {
              const emailName = user.email.split("@")[0];
              employeeName = emailName
                .replace(/[._]/g, " ")
                .split(" ")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
              console.log(
                "⚠️ logDeductionHistory: Using email-based name:",
                employeeName
              );
            }
          }
        } catch (profileError) {
          console.log(
            "❌ logDeductionHistory: Error fetching profile:",
            profileError
          );
          // Fallback to email-based name
          if (user?.email) {
            const emailName = user.email.split("@")[0];
            employeeName = emailName
              .replace(/[._]/g, " ")
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ");
            console.log(
              "⚠️ logDeductionHistory: Using email-based name (fallback):",
              employeeName
            );
          }
        }
      }

      // Map action to history type and description
      const actionMap = {
        create: {
          type: "Deduction",
          description: `Created ${data.deduction.type} deduction`,
        },
        edit: {
          type: "Edit",
          description: `Edited ${data.deduction.type} deduction${
            data.changes ? `: ${data.changes}` : ""
          }`,
        },
        delete: {
          type: "Delete",
          description: `Deleted ${data.deduction.type} deduction`,
        },
        include_cost: {
          type: "Adjustment",
          description: `Included ${data.deduction.type} deduction in item cost`,
        },
        exclude_cost: {
          type: "Adjustment",
          description: `Excluded ${data.deduction.type} deduction from item cost`,
        },
        add_to_stock: {
          type: "Restoration",
          description: `Added ${data.deduction.type} deduction back to stock`,
        },
      };

      const actionInfo = actionMap[data.action];

      // Get current parcel's total weight and stones count AFTER inventory deduction
      let currentParcelTotalWeight = 0;
      let currentParcelStones = 0;
      try {
        const currentParcel = await diamondService.getDiamondById(
          data.parcel_id
        );
        currentParcelTotalWeight = currentParcel?.total_carat || 0;
        currentParcelStones = currentParcel?.number_of_stones || 0;
        console.log(
          "📊 logDeductionHistory: Current parcel total weight after deduction:",
          currentParcelTotalWeight
        );
        console.log(
          "📊 logDeductionHistory: Current parcel stones count after deduction:",
          currentParcelStones
        );
        console.log("📊 logDeductionHistory: Parcel details:", {
          parcel_id: currentParcel?.parcel_id,
          total_carat: currentParcel?.total_carat,
          number_of_stones: currentParcel?.number_of_stones,
        });
      } catch (error) {
        console.warn(
          "❌ logDeductionHistory: Could not get current parcel data:",
          error
        );
        // Fallback to deduction values if we can't get parcel data
        currentParcelTotalWeight = data.deduction.ct_weight || 0;
        currentParcelStones = parseInt(data.deduction.stones || "0") || 0;
        console.log("⚠️ logDeductionHistory: Using fallback values:", {
          total_weight: currentParcelTotalWeight,
          stones: currentParcelStones,
        });
      }

      const historyEntry = {
        parcel_id: data.parcel_id,
        date: new Date().toISOString(),
        employee: employeeName,
        type: actionInfo.type,
        stones: parseInt(data.deduction.stones || "0") || 0, // Use deduction amount, not current parcel total
        carat_group: `${data.deduction.ct_weight || 0}ct`,
        ct_weight: data.deduction.ct_weight || 0,
        ct_price: data.deduction.price_per_ct || 0,
        order_id: data.order_number || data.order_id, // Use order number if available, fallback to UUID
        comments: data.deduction.comments ? data.deduction.comments.trim() : "",
        total_weight: currentParcelTotalWeight,
        deduction_id: data.deduction.id, // Link to the specific deduction
      };

      console.log(
        "📝 logDeductionHistory: Creating history entry with data:",
        historyEntry
      );
      console.log("📝 logDeductionHistory: Key values being saved:", {
        total_weight: historyEntry.total_weight,
        stones: historyEntry.stones,
        ct_weight: historyEntry.ct_weight,
        employee: historyEntry.employee,
        type: historyEntry.type,
      });
      await diamondService.createDiamondHistory(historyEntry);

      console.log(
        `✅ Successfully logged ${data.action} action to diamond history for parcel ${data.parcel_id}`
      );
    } catch (error) {
      console.warn("❌ Could not log deduction history:", error);
      // Don't throw here as this is just for history tracking
    }
  }
  async getByOrderId(orderId: string): Promise<DiamondDeductionWithProfile[]> {
    const { data, error } = await supabase
      .from("diamond_deductions" as any)
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching diamond deductions:", error);
      throw error;
    }

    // Handle manual joins for profiles since the foreign key relationship might not work
    const deductionsWithProfiles = await Promise.all(
      ((data as any) || []).map(async (deduction: any) => {
        try {
          if (deduction.created_by) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("user_id", deduction.created_by)
              .single();

            return {
              ...deduction,
              profile: profileData || {
                first_name: "Unknown",
                last_name: "Employee",
              },
            };
          }
          return {
            ...deduction,
            profile: { first_name: "Unknown", last_name: "Employee" },
          };
        } catch (profileError) {
          console.warn(
            "Could not fetch profile for deduction:",
            deduction.id,
            profileError
          );
          return {
            ...deduction,
            profile: { first_name: "Unknown", last_name: "Employee" },
          };
        }
      })
    );

    return deductionsWithProfiles;
  }

  async create(
    deductionData: CreateDiamondDeductionData,
    orderNumber?: string
  ): Promise<DiamondDeduction> {
    console.log("DiamondDeductionsService.create called with:", deductionData);

    // Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("diamond_deductions" as any)
      .insert([
        {
          ...deductionData,
          created_by: user?.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating diamond deduction:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    // Log to history if parcel_id exists
    if ((data as any).parcel_id) {
      await this.logDeductionHistory({
        parcel_id: (data as any).parcel_id,
        action: "create",
        deduction: data as any,
        order_id: (data as any).order_id,
        order_number: orderNumber,
      });
    }

    return data as any;
  }

  async update(
    id: string,
    updateData: UpdateDiamondDeductionData,
    orderNumber?: string
  ): Promise<DiamondDeduction> {
    // Get the original deduction to compare changes
    const originalDeduction = await this.getById(id);

    const { data, error } = await supabase
      .from("diamond_deductions" as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating diamond deduction:", error);
      throw error;
    }

    // Log to history if parcel_id exists
    console.log("🔍 Update method - data.parcel_id:", (data as any).parcel_id);
    console.log("🔍 Update method - originalDeduction:", originalDeduction);

    if ((data as any).parcel_id) {
      // Generate changes description
      const changes = [];
      if (originalDeduction) {
        if (originalDeduction.ct_weight !== (data as any).ct_weight) {
          changes.push(
            `CT weight: ${originalDeduction.ct_weight} → ${
              (data as any).ct_weight
            }`
          );
        }
        if (originalDeduction.stones !== (data as any).stones) {
          changes.push(
            `Stones: ${originalDeduction.stones} → ${(data as any).stones}`
          );
        }
        if (originalDeduction.comments !== (data as any).comments) {
          changes.push(`Comments updated`);
        }
      }

      console.log("🔍 Update method - changes detected:", changes);

      await this.logDeductionHistory({
        parcel_id: (data as any).parcel_id,
        action: "edit",
        deduction: data as any,
        order_id: (data as any).order_id,
        order_number: orderNumber,
        changes: changes.join(", "),
      });
    } else {
      console.warn(
        "⚠️ Update method - No parcel_id found in updated deduction data"
      );
    }

    return data as any;
  }

  async delete(id: string, orderNumber?: string): Promise<void> {
    // Get the deduction before deleting to log to history
    const deduction = await this.getById(id);

    const { error } = await supabase
      .from("diamond_deductions" as any)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting diamond deduction:", error);
      throw error;
    }

    // Log to history if parcel_id exists
    if (deduction && (deduction as any).parcel_id) {
      await this.logDeductionHistory({
        parcel_id: (deduction as any).parcel_id,
        action: "delete",
        deduction: deduction as any,
        order_id: (deduction as any).order_id,
        order_number: orderNumber,
      });
    }
  }

  async getById(id: string): Promise<DiamondDeduction | null> {
    const { data, error } = await supabase
      .from("diamond_deductions" as any)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching diamond deduction:", error);
      throw error;
    }

    return data as any;
  }

  /**
   * Toggle include in item cost and log to history
   */
  async toggleIncludeInCost(
    id: string,
    includeInCost: boolean,
    orderNumber?: string
  ): Promise<DiamondDeduction> {
    const deduction = await this.getById(id);
    if (!deduction) {
      throw new Error("Deduction not found");
    }

    const { data, error } = await supabase
      .from("diamond_deductions" as any)
      .update({ include_in_item_cost: includeInCost })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating include in cost:", error);
      throw error;
    }

    // Log to history if parcel_id exists
    if ((data as any).parcel_id) {
      await this.logDeductionHistory({
        parcel_id: (data as any).parcel_id,
        action: includeInCost ? "include_cost" : "exclude_cost",
        deduction: data as any,
        order_id: (data as any).order_id,
        order_number: orderNumber,
      });
    }

    return data as any;
  }

  /**
   * Mark as added to stock and log to history
   */
  async markAsAddedToStock(
    id: string,
    orderNumber?: string
  ): Promise<DiamondDeduction> {
    const deduction = await this.getById(id);
    if (!deduction) {
      throw new Error("Deduction not found");
    }

    const { data, error } = await supabase
      .from("diamond_deductions" as any)
      .update({ added_to_stock: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error marking as added to stock:", error);
      throw error;
    }

    // Delete corresponding deduction history entries before logging the restoration
    if ((data as any).parcel_id) {
      try {
        console.log("🗑️ Deleting corresponding deduction history entries...");
        await diamondService.deleteDiamondHistoryByDeduction(
          (data as any).parcel_id,
          (data as any).order_id,
          (data as any).type,
          (data as any).id // Pass the deduction ID
        );
        console.log(
          "✅ Successfully deleted corresponding deduction history entries"
        );
      } catch (historyError) {
        console.warn(
          "⚠️ Could not delete deduction history entries:",
          historyError
        );
        // Don't throw here as the main operation should still succeed
      }

      // Log the restoration to history
      await this.logDeductionHistory({
        parcel_id: (data as any).parcel_id,
        action: "add_to_stock",
        deduction: data as any,
        order_id: (data as any).order_id,
        order_number: orderNumber,
      });
    }

    return data as any;
  }
}

export const diamondDeductionsService = new DiamondDeductionsService();
