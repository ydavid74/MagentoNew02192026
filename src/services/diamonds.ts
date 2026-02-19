import { supabase } from "@/integrations/supabase/client";

export interface DiamondInventory {
  id: string;
  parcel_id: string;
  parent_parcel_id: string | null;
  parcel_name: string;
  total_carat: number;
  number_of_stones: number;
  pct: number;
  price_per_ct: number;
  ws_price_per_ct: number;
  carat_category: string;
  color: string;
  shape: string;
  clarity: string;
  polish_symmetry: string;
  table_width: number;
  depth: number;
  girdle: string;
  fluorescence: string;
  culet: string;
  mm: number;
  certificate_type: string;
  comments?: string;
  reason?: string;
  days_active: number;
  is_editable: boolean;
  is_parent: boolean;
  created_at: string;
  updated_at: string;
  // Additional properties for table display
  total_ct_weight?: number;
  minimum_level?: number;
  cpi?: number;
  total_price?: number;
}

export interface DiamondHistory {
  id: string;
  parcel_id: string;
  website?: string;
  date: string;
  employee?: string;
  type: string;
  stones: number;
  carat_group: string;
  ct_weight: number;
  ct_price: number;
  order_id?: string;
  comments?: string;
  image_url?: string;
  total_weight: number;
  deduction_id?: string;
  created_at: string;
}

export interface DiamondWithSubParcels extends DiamondInventory {
  sub_parcels?: DiamondInventory[];
}

export interface DiamondSearchParams {
  parcel_id?: string;
  stone_id?: string;
  parcel_name?: string;
  products_id?: string;
  shape?: string;
  carat_weight?: string;
  color?: string;
  clarity?: string;
  price_range?: string;
  sort_by?: string;
  minimum_level?: boolean;
  edit_check?: boolean;
}

class DiamondService {
  async getDiamonds(): Promise<DiamondInventory[]> {
    try {
      const { data, error } = await supabase
        .from("diamond_inventory" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching diamonds:", error);
        throw error;
      }

      return (data as unknown as DiamondInventory[]) || [];
    } catch (error) {
      console.error("Error in getDiamonds:", error);
      throw error;
    }
  }

  async getDiamondsHierarchical(): Promise<DiamondWithSubParcels[]> {
    try {
      const allDiamonds = await this.getDiamonds();

      // Separate parent and sub parcels
      const parentParcels = allDiamonds.filter((d) => d.is_parent === true);
      const subParcels = allDiamonds.filter((d) => d.is_parent === false);

      // Create hierarchical structure
      const hierarchicalData = parentParcels.map((parent) => ({
        ...parent,
        sub_parcels: subParcels.filter(
          (sub) => sub.parent_parcel_id === parent.parcel_id
        ),
      }));

      return hierarchicalData;
    } catch (error) {
      console.error("Error in getDiamondsHierarchical:", error);
      throw error;
    }
  }

  async getDiamondHistory(parcelId: string): Promise<DiamondHistory[]> {
    try {
      console.log("🔍 Fetching diamond history for parcel_id:", parcelId);
      const { data, error } = await supabase
        .from("diamond_history" as any)
        .select("*")
        .eq("parcel_id", parcelId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching diamond history:", error);
        throw error;
      }

      console.log("📊 Diamond history data retrieved:", data);
      return (data as unknown as DiamondHistory[]) || [];
    } catch (error) {
      console.error("Error in getDiamondHistory:", error);
      throw error;
    }
  }

  async createDiamondHistory(
    historyData: Omit<DiamondHistory, "id" | "created_at">
  ): Promise<DiamondHistory> {
    try {
      console.log("💾 Creating diamond history entry:", historyData);
      const { data, error } = await supabase
        .from("diamond_history" as any)
        .insert([historyData])
        .select()
        .single();

      if (error) {
        console.error("Error creating diamond history:", error);
        throw error;
      }

      console.log("✅ Diamond history entry created successfully:", data);
      return data as unknown as DiamondHistory;
    } catch (error) {
      console.error("Error in createDiamondHistory:", error);
      throw error;
    }
  }

  async deleteDiamondHistory(historyId: string): Promise<void> {
    try {
      console.log("🗑️ Deleting diamond history entry:", historyId);
      const { error } = await supabase
        .from("diamond_history" as any)
        .delete()
        .eq("id", historyId);

      if (error) {
        console.error("Error deleting diamond history:", error);
        throw error;
      }

      console.log("✅ Successfully deleted diamond history entry:", historyId);
    } catch (error) {
      console.error("Error in deleteDiamondHistory:", error);
      throw error;
    }
  }

  async deleteDiamondHistoryByDeduction(
    parcelId: string,
    orderId: string,
    deductionType: string,
    deductionId: string
  ): Promise<void> {
    try {
      console.log("🗑️ Deleting diamond history entries for deduction:", {
        parcelId,
        orderId,
        deductionType,
        deductionId,
      });

      // Now we can precisely target the history entries by deduction_id
      console.log(
        "🔄 Looking for history entries linked to this specific deduction..."
      );

      const { data: historyEntries, error: recentError } = await supabase
        .from("diamond_history" as any)
        .select(
          "id, type, order_id, date, employee, ct_weight, stones, deduction_id"
        )
        .eq("deduction_id", deductionId);

      if (recentError) {
        console.error(
          "Error fetching history entries by deduction_id:",
          recentError
        );
        return;
      }

      if (historyEntries && historyEntries.length > 0) {
        console.log(
          `🔍 Found ${historyEntries.length} history entries linked to deduction ${deductionId}:`,
          historyEntries
        );

        // Delete all history entries linked to this specific deduction
        for (const entry of historyEntries) {
          console.log(`🗑️ Deleting history entry linked to deduction:`, entry);
          await this.deleteDiamondHistory(entry.id);
        }

        console.log(
          `✅ Successfully deleted ${historyEntries.length} history entries for deduction ${deductionId}`
        );
      } else {
        console.log("ℹ️ No history entries found linked to this deduction");
      }
    } catch (error) {
      console.error("Error in deleteDiamondHistoryByDeduction:", error);
      throw error;
    }
  }

  // Helper function to log diamond actions to history
  async logDiamondAction(action: {
    parcel_id: string;
    type: string;
    stones?: number;
    ct_weight?: number; // This should be the variation (change amount)
    ct_price?: number;
    comments?: string;
    employee?: string;
    current_total_weight?: number; // This should be the current parcel's total weight
  }): Promise<void> {
    try {
      // Get current user info for employee name
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let employeeName = action.employee || "System";

      console.log("🔍 logDiamondAction: Current User ID:", user?.id);
      console.log("🔍 logDiamondAction: Current User Email:", user?.email);

      if (user?.id) {
        try {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", user.id)
            .single();

          console.log("📊 logDiamondAction: Profile query result:", {
            profileData,
            error,
          });

          if (!error && profileData) {
            const profile = profileData as any; // Type assertion to handle missing columns
            console.log("👤 logDiamondAction: First Name:", profile.first_name);
            console.log("👤 logDiamondAction: Last Name:", profile.last_name);

            if (profile.first_name && profile.last_name) {
              employeeName = `${profile.first_name} ${profile.last_name}`;
              console.log(
                "✅ logDiamondAction: Using full name:",
                employeeName
              );
            } else if (profile.first_name) {
              employeeName = profile.first_name;
              console.log(
                "✅ logDiamondAction: Using first name only:",
                employeeName
              );
            }
          } else {
            console.log(
              "❌ logDiamondAction: Could not fetch profile data:",
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
                "⚠️ logDiamondAction: Using email-based name:",
                employeeName
              );
            }
          }
        } catch (profileError) {
          console.log(
            "❌ logDiamondAction: Error fetching profile:",
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
              "⚠️ logDiamondAction: Using email-based name (fallback):",
              employeeName
            );
          }
        }
      }

      const historyData: Omit<DiamondHistory, "id" | "created_at"> = {
        parcel_id: action.parcel_id,
        date: new Date().toISOString(),
        type: action.type,
        stones: action.stones || 0,
        carat_group: "", // Will be filled based on ct_weight
        ct_weight: action.ct_weight || 0, // This is the variation (change amount)
        ct_price: action.ct_price || 0,
        total_weight: action.current_total_weight || 0, // This is the current parcel's total weight
        comments: action.comments || "",
        employee: employeeName,
      };

      // Determine carat group based on ct_weight
      if (historyData.ct_weight > 0) {
        if (historyData.ct_weight < 0.5) {
          historyData.carat_group = "0-0.5";
        } else if (historyData.ct_weight < 1.0) {
          historyData.carat_group = "0.5-1.0";
        } else if (historyData.ct_weight < 1.5) {
          historyData.carat_group = "1.0-1.5";
        } else if (historyData.ct_weight < 2.0) {
          historyData.carat_group = "1.5-2.0";
        } else {
          historyData.carat_group = "2.0+";
        }
      }

      // Only create history entry if there are comments OR if it's an Add/Reduce/Manual Edition operation
      if (
        historyData.comments ||
        action.type === "Add" ||
        action.type === "Reduce" ||
        action.type === "Manual Edition"
      ) {
        await this.createDiamondHistory(historyData);
      }
    } catch (error) {
      console.error("Error logging diamond action:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async searchDiamonds(
    params: DiamondSearchParams
  ): Promise<DiamondInventory[]> {
    try {
      console.log("🔍 Diamond search params:", params);
      let query = supabase.from("diamond_inventory" as any).select("*");

      // Apply filters
      if (params.parcel_id) {
        query = query.ilike("parcel_id", `%${params.parcel_id}%`);
      }
      if (params.stone_id) {
        // Search for subparcels by parcel_id (subparcels have parent_parcel_id set)
        // This will find records where parcel_id contains the search term AND it's a subparcel
        console.log("🔍 Searching for subparcel ID:", params.stone_id);
        query = query
          .ilike("parcel_id", `%${params.stone_id}%`)
          .not("parent_parcel_id", "is", null);
      }
      if (params.parcel_name) {
        query = query.ilike("parcel_name", `%${params.parcel_name}%`);
      }
      if (params.products_id) {
        query = query.ilike("parcel_id", `%${params.products_id}%`); // Assuming products_id maps to parcel_id
      }
      if (params.shape) {
        query = query.eq("shape", params.shape);
      }
      if (params.color) {
        query = query.eq("color", params.color);
      }
      if (params.clarity) {
        query = query.eq("clarity", params.clarity);
      }

      // Carat weight range filtering
      if (params.carat_weight) {
        switch (params.carat_weight) {
          case "0.5-1.0":
            query = query.gte("total_carat", 0.5).lt("total_carat", 1.0);
            break;
          case "1.0-1.5":
            query = query.gte("total_carat", 1.0).lt("total_carat", 1.5);
            break;
          case "1.5-2.0":
            query = query.gte("total_carat", 1.5).lt("total_carat", 2.0);
            break;
          case "2.0-3.0":
            query = query.gte("total_carat", 2.0).lt("total_carat", 3.0);
            break;
          case "3.0+":
            query = query.gte("total_carat", 3.0);
            break;
        }
      }

      // Price range filtering
      if (params.price_range) {
        switch (params.price_range) {
          case "$0-$1000":
            query = query.lt("price_per_ct", 1000);
            break;
          case "$1000-$5000":
            query = query.gte("price_per_ct", 1000).lt("price_per_ct", 5000);
            break;
          case "$5000-$10000":
            query = query.gte("price_per_ct", 5000).lt("price_per_ct", 10000);
            break;
          case "$10000-$25000":
            query = query.gte("price_per_ct", 10000).lt("price_per_ct", 25000);
            break;
          case "$25000+":
            query = query.gte("price_per_ct", 25000);
            break;
        }
      }

      // Minimum level filter
      if (params.minimum_level) {
        query = query.gte("minimum_level", 0); // Filter for items with minimum_level >= 0
      }

      // Edit check filter - filter for editable items
      if (params.edit_check) {
        query = query.eq("is_editable", true);
      }

      // Apply sorting
      if (params.sort_by) {
        switch (params.sort_by) {
          case "Price: Low to High":
            query = query.order("price_per_ct", { ascending: true });
            break;
          case "Price: High to Low":
            query = query.order("price_per_ct", { ascending: false });
            break;
          case "Carat: Low to High":
            query = query.order("total_carat", { ascending: true });
            break;
          case "Carat: High to Low":
            query = query.order("total_carat", { ascending: false });
            break;
          case "Date Added":
            query = query.order("created_at", { ascending: false });
            break;
          default:
            query = query.order("created_at", { ascending: false });
        }
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error searching diamonds:", error);
        throw error;
      }

      return (data as unknown as DiamondInventory[]) || [];
    } catch (error) {
      console.error("Error in searchDiamonds:", error);
      throw error;
    }
  }

  async getDiamondById(parcelId: string): Promise<DiamondInventory | null> {
    try {
      const { data, error } = await supabase
        .from("diamond_inventory" as any)
        .select("*")
        .eq("parcel_id", parcelId)
        .single();

      if (error) {
        console.error("Error fetching diamond by parcel ID:", error);
        throw error;
      }

      return data as unknown as DiamondInventory;
    } catch (error) {
      console.error("Error in getDiamondById:", error);
      throw error;
    }
  }

  async createDiamond(
    diamond: Omit<DiamondInventory, "id" | "created_at" | "updated_at">,
    employee?: string
  ): Promise<DiamondInventory> {
    try {
      // Generate a unique parcel_id if not provided
      const diamondData = {
        ...diamond,
        parcel_id:
          diamond.parcel_id ||
          `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      const { data, error } = await supabase
        .from("diamond_inventory" as any)
        .insert([diamondData])
        .select()
        .single();

      if (error) {
        console.error("Error creating diamond:", error);
        throw error;
      }

      // Log the creation action to history - only if there are user comments
      const actionType = diamondData.is_parent ? "Create" : "Subcategory";
      if (diamondData.comments && diamondData.comments.trim()) {
        await this.logDiamondAction({
          parcel_id: diamondData.parcel_id,
          type: actionType,
          stones: diamondData.number_of_stones,
          ct_weight: diamondData.total_carat,
          ct_price: diamondData.price_per_ct,
          comments: diamondData.comments.trim(), // Only save user-written comments
          employee: employee,
        });
      }

      return data as unknown as DiamondInventory;
    } catch (error) {
      console.error("Error in createDiamond:", error);
      throw error;
    }
  }

  async updateDiamond(
    parcelId: string,
    updates: Partial<DiamondInventory>,
    actionType: string = "Edit",
    comments?: string,
    employee?: string,
    ctWeightVariation?: number,
    currentTotalWeight?: number,
    stonesVariation?: number
  ): Promise<DiamondInventory> {
    try {
      const { data, error } = await supabase
        .from("diamond_inventory" as any)
        .update(updates)
        .eq("parcel_id", parcelId)
        .select()
        .single();

      if (error) {
        console.error("Error updating diamond:", error);
        throw error;
      }

      // Log the action to history - always for Add/Reduce operations, always for Edit operations (Manual Edition)
      const shouldLogHistory =
        actionType === "Add" ||
        actionType === "Reduce" ||
        actionType === "Edit" ||
        (comments && comments.trim());


      if (shouldLogHistory) {
        await this.logDiamondAction({
          parcel_id: parcelId,
          type: actionType === "Edit" ? "Manual Edition" : actionType,
          stones: actionType === "Edit" ? 0 : (stonesVariation || 0), // For manual edits, show 0 stones change
          ct_weight: actionType === "Edit" ? (currentTotalWeight || 0) : (ctWeightVariation || 0), // For manual edits, show current weight
          ct_price: updates.price_per_ct,
          comments: comments ? comments.trim() : "", // Only save user-written comments
          employee: employee,
          current_total_weight: currentTotalWeight, // This is the current parcel's total weight
        });
      }

      return data as unknown as DiamondInventory;
    } catch (error) {
      console.error("Error in updateDiamond:", error);
      throw error;
    }
  }

  async deleteDiamond(parcelId: string, employee?: string): Promise<void> {
    try {
      // Get diamond data before deletion for history logging
      const diamond = await this.getDiamondById(parcelId);

      const { error } = await supabase
        .from("diamond_inventory" as any)
        .delete()
        .eq("parcel_id", parcelId);

      if (error) {
        console.error("Error deleting diamond:", error);
        throw error;
      }

      // Log the deletion action to history - only if there are user comments
      if (diamond && diamond.comments && diamond.comments.trim()) {
        await this.logDiamondAction({
          parcel_id: parcelId,
          type: "Delete",
          stones: diamond.number_of_stones,
          ct_weight: diamond.total_carat,
          ct_price: diamond.price_per_ct,
          comments: diamond.comments.trim(), // Only save user-written comments
          employee: employee,
        });
      }
    } catch (error) {
      console.error("Error in deleteDiamond:", error);
      throw error;
    }
  }

  async getDiamondStats(): Promise<{
    total: number;
    totalValue: number;
    averagePrice: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("diamond_inventory" as any)
        .select("total_carat, price_per_ct");

      if (error) {
        console.error("Error fetching diamond stats:", error);
        throw error;
      }

      const total = data?.length || 0;
      const totalValue =
        (data as unknown as DiamondInventory[])?.reduce(
          (sum, d) => sum + (d.total_carat || 0) * (d.price_per_ct || 0),
          0
        ) || 0;
      const averagePrice = total > 0 ? totalValue / total : 0;

      return { total, totalValue, averagePrice };
    } catch (error) {
      console.error("Error in getDiamondStats:", error);
      throw error;
    }
  }
}

export const diamondService = new DiamondService();
