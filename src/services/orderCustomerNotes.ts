import { supabase } from "@/integrations/supabase/client";

export interface OrderCustomerNote {
  id: string;
  order_id: string;
  content: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrderCustomerNoteWithProfile extends OrderCustomerNote {
  profile?: {
    first_name?: string;
    last_name?: string;
  } | null;
}

export interface CreateOrderCustomerNoteData {
  order_id: string;
  content: string;
  status: string;
  created_by: string;
}

export interface UpdateOrderCustomerNoteData {
  content?: string;
  status?: string;
}

export const orderCustomerNotesService = {
  // Get all customer notes for an order
  async getByOrderId(orderId: string): Promise<OrderCustomerNoteWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from("order_customer_notes")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profile data for each note
      const notesWithProfiles = await Promise.all(
        (data || []).map(async (note) => {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("user_id", note.created_by)
              .single();

            return {
              ...note,
              profile: profile || null,
            };
          } catch (profileError) {
            console.warn(
              `Failed to fetch profile for user ${note.created_by}:`,
              profileError
            );
            return {
              ...note,
              profile: null,
            };
          }
        })
      );

      return notesWithProfiles;
    } catch (error) {
      console.error("Error fetching customer notes:", error);
      throw error;
    }
  },

  // Get the latest customer note for an order (for status)
  async getLatestByOrderId(
    orderId: string
  ): Promise<OrderCustomerNoteWithProfile | null> {
    try {
      const { data, error } = await supabase
        .from("order_customer_notes")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return null;
        }
        throw error;
      }

      // Fetch profile data
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", data.created_by)
          .single();

        return {
          ...data,
          profile: profile || null,
        };
      } catch (profileError) {
        console.warn(
          `Failed to fetch profile for user ${data.created_by}:`,
          profileError
        );
        return {
          ...data,
          profile: null,
        };
      }
    } catch (error) {
      console.error("Error fetching latest customer note:", error);
      throw error;
    }
  },

  // Create a new customer note
  async create(
    noteData: CreateOrderCustomerNoteData
  ): Promise<OrderCustomerNote> {
    try {
      const { data, error } = await supabase
        .from("order_customer_notes")
        .insert([noteData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating customer note:", error);
      throw error;
    }
  },

  // Update a customer note
  async update(
    id: string,
    updateData: UpdateOrderCustomerNoteData
  ): Promise<OrderCustomerNote> {
    try {
      const { data, error } = await supabase
        .from("order_customer_notes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating customer note:", error);
      throw error;
    }
  },

  // Delete a customer note
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("order_customer_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting customer note:", error);
      throw error;
    }
  },

  // Get customer note by ID
  async getById(id: string): Promise<OrderCustomerNoteWithProfile | null> {
    try {
      const { data, error } = await supabase
        .from("order_customer_notes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      // Fetch profile data
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", data.created_by)
          .single();

        return {
          ...data,
          profile: profile || null,
        };
      } catch (profileError) {
        console.warn(
          `Failed to fetch profile for user ${data.created_by}:`,
          profileError
        );
        return {
          ...data,
          profile: null,
        };
      }
    } catch (error) {
      console.error("Error fetching customer note by ID:", error);
      throw error;
    }
  },
};
