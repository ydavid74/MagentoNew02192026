import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const OrderFilterSchema = z.object({
  status: z.string().optional(),
  customer: z.string().optional(),
  purchase_from: z.string().optional(),
  bill_to_name: z.string().optional(),
  ship_to_name: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type OrderFilter = z.infer<typeof OrderFilterSchema>;

export interface OrderListItem {
  id: string;
  order_id?: string;
  order_date: string;
  created_at: string;
  total_amount: number;
  purchase_from: string;
  bill_to_name?: string;
  ship_to_name?: string;
  delivery_method?: string;
  shopify_order_number?: string;
  customers: {
    name: string;
    email: string;
  };
  order_items: Array<{
    sku: string;
    details: string;
  }>;
  latest_customer_note_status?: string;
}

export interface OrderDetail {
  id: string;
  order_id?: string;
  shopify_order_number?: string;
  note?: string;
  customer_id: string;
  purchase_from: string;
  order_date: string;
  total_amount: number;
  discount_amount?: number;
  discount_codes?: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
  shipping_cost?: number;
  delivery_method?: string;
  created_at: string;
  bill_to_name?: string;
  ship_to_name?: string;
  customization_notes?: string;
  previous_order_id?: string;
  how_did_you_hear?: string;
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    tax_id?: string;
    notes?: string;
  };
  billing_address?: {
    id: string;
    first_name: string;
    last_name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    region: string;
    postcode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  shipping_address?: {
    id: string;
    first_name: string;
    last_name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    region: string;
    postcode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  order_items: Array<{
    id: string;
    sku: string;
    size: string;
    metal_type: string;
    details: string;
    price: number;
    qty: number;
    image?: string;
  }>;
  order_costs: {
    casting: number;
    diamond: number;
    labor: number;
    updated_at: string;
  } | null;
  order_customer_notes?: Array<{
    id: string;
    content: string;
    status: string;
    is_important: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>;
}

export const OrderCreateSchema = z.object({
  customer_id: z.string().uuid(),
  order_id: z.string().min(1),
  purchase_from: z.string().optional(),
  order_date: z.string(),
  total_amount: z.number().default(0),
  bill_to_name: z.string().optional(),
  ship_to_name: z.string().optional(),
});

export const OrderUpdateSchema = z.object({
  purchase_from: z.string().optional(),
  order_date: z.string().optional(),
  total_amount: z.number().optional(),
  customization_notes: z.string().optional(),
  bill_to_name: z.string().optional(),
  ship_to_name: z.string().optional(),
  how_did_you_hear: z.string().optional(),
});

export const OrderCostsSchema = z.object({
  casting: z.number().optional(),
  diamond: z.number().optional(),
  labor: z.number().optional(),
});

export interface OrderService {
  listOrders(filter?: OrderFilter, pagination?: { page: number; limit: number }): Promise<{ data: OrderListItem[]; total: number; page: number; limit: number }>;
  getOrder(id: string): Promise<OrderDetail | null>;
  getOrderByNumber(orderNumber: string): Promise<OrderDetail | null>;
  createOrder(input: z.infer<typeof OrderCreateSchema>): Promise<any>;
  updateOrderInfo(
    id: string,
    input: z.infer<typeof OrderUpdateSchema>
  ): Promise<any>;
  upsertOrderCosts(
    orderId: string,
    costs: z.infer<typeof OrderCostsSchema>
  ): Promise<any>;
  listStatusHistory(orderId: string): Promise<any[]>;
  appendStatus(orderId: string, status: string, comment?: string): Promise<any>;
  listOrderComments(orderId: string): Promise<any[]>;
  createComment(
    orderId: string,
    content: string,
    isImportant?: boolean,
    status?: string
  ): Promise<any>;
  updateOrderComment(
    commentId: string,
    content: string,
    status?: string
  ): Promise<any>;
  deleteComment(commentId: string): Promise<void>;
  upsertBillingAddress(orderId: string, addressData: any): Promise<any>;
  upsertShippingAddress(orderId: string, addressData: any): Promise<any>;
  // Order items management
  createOrderItem(orderId: string, itemData: any): Promise<any>;
  updateOrderItem(itemId: string, itemData: any): Promise<any>;
  deleteOrderItem(itemId: string): Promise<void>;
  // Order management
  deleteOrder(id: string): Promise<void>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
}

export const orderService: OrderService = {
  async listOrders(filter?: OrderFilter, pagination?: { page: number; limit: number }) {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 50, 1000); // Cap individual page size at 1000
    const offset = (page - 1) * limit;

    // First, get the total count for pagination
    let countQuery = supabase
      .from("orders")
      .select("id", { count: "exact", head: true });

    // Apply filters to count query
    if (filter?.purchase_from) {
      countQuery = countQuery.ilike("purchase_from", `%${filter.purchase_from}%`);
    }
    if (filter?.bill_to_name) {
      // Search in multiple fields using OR
      const searchTerm = filter.bill_to_name;
      countQuery = countQuery.or(`bill_to_name.ilike.%${searchTerm}%,ship_to_name.ilike.%${searchTerm}%,shopify_order_number.ilike.%${searchTerm}%`);
    }
    if (filter?.ship_to_name) {
      countQuery = countQuery.ilike("ship_to_name", `%${filter.ship_to_name}%`);
    }
    if (filter?.customer) {
      // For customer filtering, we need to use a different approach
      // First get customer IDs that match the search term
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .or(`email.ilike.%${filter.customer}%,name.ilike.%${filter.customer}%`);
      
      if (customerError) throw customerError;
      
      if (customers && customers.length > 0) {
        const customerIds = customers.map(c => c.id);
        countQuery = countQuery.in("customer_id", customerIds);
      } else {
        // No customers found, return empty result
        return {
          data: [],
          total: 0,
          page,
          limit
        };
      }
    }
    if (filter?.dateFrom) {
      countQuery = countQuery.gte("order_date", filter.dateFrom);
    }
    if (filter?.dateTo) {
      countQuery = countQuery.lte("order_date", filter.dateTo);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // For very large datasets, we need to handle pagination differently
    // If the offset is beyond what Supabase can handle efficiently, we'll cap it
    if (offset >= 100000) {
      // For very large offsets, return empty results to prevent performance issues
      return {
        data: [],
        total: Math.min(count || 0, 100000), // Cap at 100,000 for performance
        page,
        limit
      };
    }

    // Now get the paginated data with optimized query
    let query = supabase
      .from("orders")
      .select(
        `
        id,
        order_id,
        order_date,
        created_at,
        total_amount,
        purchase_from,
        delivery_method,
        bill_to_name,
        ship_to_name,
        shopify_order_number,
        customers (
          name,
          email
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .limit(limit);

    // Apply filters
    if (filter?.purchase_from) {
      query = query.ilike("purchase_from", `%${filter.purchase_from}%`);
    }
    if (filter?.bill_to_name) {
      // Search in multiple fields using OR
      const searchTerm = filter.bill_to_name;
      query = query.or(`bill_to_name.ilike.%${searchTerm}%,ship_to_name.ilike.%${searchTerm}%,shopify_order_number.ilike.%${searchTerm}%`);
    }
    if (filter?.ship_to_name) {
      query = query.ilike("ship_to_name", `%${filter.ship_to_name}%`);
    }
    if (filter?.customer) {
      // Get customer IDs that match the search term (same as count query)
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .or(`email.ilike.%${filter.customer}%,name.ilike.%${filter.customer}%`);
      
      if (customerError) throw customerError;
      
      if (customers && customers.length > 0) {
        const customerIds = customers.map(c => c.id);
        query = query.in("customer_id", customerIds);
      } else {
        // No customers found, return empty result
        return {
          data: [],
          total: count || 0,
          page,
          limit
        };
      }
    }
    if (filter?.dateFrom) {
      query = query.gte("order_date", filter.dateFrom);
    }
    if (filter?.dateTo) {
      query = query.lte("order_date", filter.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get all order IDs for batch status lookup
    const orderIds = (data || []).map((order: any) => order.id);
    
    // Fetch latest customer note status and timestamps, plus casting memo timestamps for all orders
    let latestStatuses: { [orderId: string]: string } = {};
    let latestNoteTimestamps: { [orderId: string]: string } = {};
    let castingMemoTimestamps: { [orderId: string]: string } = {};
    
    if (orderIds.length > 0) {
      try {
        // Get latest customer note status and timestamp for each order
        const { data: latestNotes } = await supabase
          .from("order_customer_notes")
          .select("order_id, status, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false });
        
        // Group by order_id and get the latest status and timestamp for each order
        if (latestNotes) {
          const statusMap = new Map<string, string>();
          const timestampMap = new Map<string, string>();
          (latestNotes as any[]).forEach((note: any) => {
            if (!statusMap.has(note.order_id)) {
              statusMap.set(note.order_id, note.status);
              timestampMap.set(note.order_id, note.created_at);
            }
          });
          latestStatuses = Object.fromEntries(statusMap);
          latestNoteTimestamps = Object.fromEntries(timestampMap);
        }

        // Get casting memo timestamps for each order
        // Casting memos use order_id (UUID) that matches orders.id
        const { data: castingMemos } = await supabase
          .from("casting_memos" as any)
          .select("order_id, created_at")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false });
      
        // Group by order_id and get the latest casting memo timestamp for each order
        if (castingMemos) {
          const castingMap = new Map<string, string>();
          (castingMemos as any[]).forEach((memo: any) => {
            if (!castingMap.has(memo.order_id)) {
              castingMap.set(memo.order_id, memo.created_at);
            }
          });
          castingMemoTimestamps = Object.fromEntries(castingMap);
        }
      } catch (error) {
        console.warn("Error fetching latest customer note statuses or casting memo timestamps:", error);
      }
    }

    // Process orders with status logic that considers casting memos
    // OPTIMIZED: Use string comparison instead of Date objects for better performance
    const ordersWithStatus = (data || []).map((order: any) => {
      const latestStatus = latestStatuses[order.id] || "pending";
      const latestNoteTimestamp = latestNoteTimestamps[order.id];
      const castingMemoTimestamp = castingMemoTimestamps[order.id];
      
      // Determine final status based on casting memo vs customer notes timestamps
      let finalStatus = latestStatus;
      
      if (castingMemoTimestamp) {
        // OPTIMIZED: ISO date strings can be compared directly without Date objects
        // This is much faster than creating Date objects for every comparison
        if (!latestNoteTimestamp || castingMemoTimestamp > latestNoteTimestamp) {
          // Casting memo is more recent than latest customer note, or no customer notes exist
          finalStatus = "Casting Order";
        }
        // If customer note is more recent, keep the customer note status
      }

      return {
        ...order,
        // Ensure customer data exists, provide defaults if not
        customers: order.customers || { name: 'Unknown Customer', email: 'No Email' },
        latest_customer_note_status: finalStatus,
        has_casting_memo: !!castingMemoTimestamp,
        casting_memo_timestamp: castingMemoTimestamp,
        latest_note_timestamp: latestNoteTimestamp,
      };
    });

    // OPTIMIZED: Pre-parse order IDs once instead of on every comparison
    // Sort by order_id numerically (descending - highest order number first)
    ordersWithStatus.sort((a, b) => {
      // OPTIMIZED: Cache parsed values during sort to avoid repeated parsing
      const aOrderId = parseInt(a.order_id || '0', 10);
      const bOrderId = parseInt(b.order_id || '0', 10);
      return bOrderId - aOrderId; // Descending order
    });

    // Apply status filter if provided
    let filteredOrders = ordersWithStatus;
    if (filter?.status) {
      filteredOrders = ordersWithStatus.filter(
        (order) => order.latest_customer_note_status === filter.status
      );
    }

    return {
      data: filteredOrders,
      total: count || 0, // Return the actual count
      page,
      limit
    };
  },

  async getOrder(id: string) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_id,
        shopify_order_number,
        customer_id,
        purchase_from,
        order_date,
        total_amount,
        discount_amount,
        delivery_method,
        created_at,
        customization_notes,
        how_did_you_hear,
        customers (*),
        order_items (*),
        order_billing_address (*),
        order_shipping_address (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    // Transform the data to match our interface
    if (data) {
      // Get the first billing and shipping address (should be one per order)
      const billingAddress = (data as any).order_billing_address?.[0] || null;
      const shippingAddress = (data as any).order_shipping_address?.[0] || null;

      // OPTIMIZED: Fetch all related data in parallel instead of sequentially
      const [costsResult, notesResult, memoResult] = await Promise.allSettled([
      // Fetch order_costs separately (due to missing foreign key relationship)
        supabase
        .from('order_costs')
        .select('*')
        .eq('order_id', (data as any).id)
          .single(),

      // Fetch order_customer_notes separately (due to missing foreign key relationship)
        supabase
        .from('order_customer_notes')
        .select('*')
          .eq('order_id', (data as any).id),
        
        // Check for casting memo using order ID (UUID)
        supabase
          .from('casting_memos' as any)
          .select('created_at')
          .eq('order_id', (data as any).id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      ]);

      // Extract data from results
      const orderCosts = costsResult.status === 'fulfilled' ? costsResult.value.data : null;
      const customerNotes = notesResult.status === 'fulfilled' ? notesResult.value.data : [];
      const castingMemo = memoResult.status === 'fulfilled' ? memoResult.value.data : null;

      // Apply casting memo status logic
      let finalStatus = "pending";
      let hasCastingMemo = false;
      let castingMemoTimestamp = null;
      let latestNoteTimestamp = null;

      if (customerNotes && customerNotes.length > 0) {
        // OPTIMIZED: Use string comparison instead of Date objects
        // ISO date strings can be compared directly - much faster
        const latestNote = (customerNotes as any[]).sort((a: any, b: any) => 
          b.created_at.localeCompare(a.created_at)
        )[0];
        finalStatus = latestNote.status;
        latestNoteTimestamp = latestNote.created_at;
      }

        if (castingMemo) {
          hasCastingMemo = true;
          castingMemoTimestamp = (castingMemo as any).created_at;
          
        // OPTIMIZED: Use string comparison instead of Date objects
        // ISO date strings can be compared directly - much faster
        if (!latestNoteTimestamp || (castingMemo as any).created_at > latestNoteTimestamp) {
            finalStatus = "Casting Order";
          }
      }

      const result = Object.assign({}, data, {
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        order_costs: orderCosts || null,
        order_customer_notes: customerNotes || [],
        latest_customer_note_status: finalStatus,
        has_casting_memo: hasCastingMemo,
        casting_memo_timestamp: castingMemoTimestamp,
        latest_note_timestamp: latestNoteTimestamp,
        // Remove the arrays since we only need one address each
        order_billing_address: undefined,
        order_shipping_address: undefined,
      }) as any;
      
      // Debug logging
      console.log(`🔍 getOrder for ${(data as any).shopify_order_number}:`, {
        finalStatus,
        hasCastingMemo,
        castingMemoTimestamp,
        latestNoteTimestamp,
        customerNotesCount: customerNotes?.length || 0
      });
      
      return result;
    }

    return data as any; // Type assertion to handle missing database columns
  },

  async createOrder(input: z.infer<typeof OrderCreateSchema>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const validatedFields = OrderCreateSchema.parse(input);

    const { data, error } = await supabase
      .from("orders")
      .insert(validatedFields)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderInfo(id: string, input: z.infer<typeof OrderUpdateSchema>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const validatedFields = OrderUpdateSchema.parse(input);

    const { data, error } = await supabase
      .from("orders")
      .update(validatedFields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async upsertOrderCosts(
    orderId: string,
    costs: z.infer<typeof OrderCostsSchema>
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const validatedCosts = OrderCostsSchema.parse(costs);

    const { data, error } = await supabase
      .from("order_costs")
      .upsert({ order_id: orderId, ...validatedCosts })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listStatusHistory(orderId: string) {
    const { data, error } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async appendStatus(orderId: string, status: string, comment?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        status,
        comment,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listOrderComments(orderId: string) {
    const { data, error } = await supabase
      .from("order_customer_notes")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createComment(
    orderId: string,
    content: string,
    isImportant = false,
    status = "pending"
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("order_customer_notes")
      .insert({
        order_id: orderId,
        content,
        is_important: isImportant,
        status,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderComment(
    commentId: string,
    content: string,
    status?: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: any = { content };
    if (status) {
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from("order_customer_notes")
      .update(updateData)
      .eq("id", commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("order_customer_notes")
      .delete()
      .eq("id", commentId);

    if (error) throw error;
  },

  // Address management functions
  async upsertBillingAddress(orderId: string, addressData: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      // Check if billing address already exists
      const { data: existingAddress } = await (supabase as any)
        .from("order_billing_address")
        .select("id")
        .eq("order_id", orderId)
        .single();

      if (existingAddress) {
        // Update existing address
        const { data, error } = await (supabase as any)
          .from("order_billing_address")
          .update(addressData)
          .eq("id", existingAddress.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new address
        const { data, error } = await (supabase as any)
          .from("order_billing_address")
          .insert({ order_id: orderId, ...addressData })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error saving billing address:", error);
      throw error;
    }
  },

  async upsertShippingAddress(orderId: string, addressData: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      // Check if shipping address already exists
      const { data: existingAddress } = await (supabase as any)
        .from("order_shipping_address")
        .select("id")
        .eq("order_id", orderId)
        .single();

      if (existingAddress) {
        // Update existing address
        const { data, error } = await (supabase as any)
          .from("order_shipping_address")
          .update(addressData)
          .eq("id", existingAddress.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new address
        const { data, error } = await (supabase as any)
          .from("order_shipping_address")
          .insert({ order_id: orderId, ...addressData })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error saving shipping address:", error);
      throw error;
    }
  },

  // Order items management
  async createOrderItem(orderId: string, itemData: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Clean up the item data
    const cleanItemData = {
      order_id: orderId,
      sku: itemData.sku?.trim() || "",
      size: itemData.size?.trim() || "",
      metal_type: itemData.metal_type?.trim() || "",
      details: itemData.details?.trim() || "",
      price: itemData.price || 0,
      qty: itemData.qty || 1,
      image: itemData.image || null,
    };

    const { data, error } = await supabase
      .from("order_items")
      .insert(cleanItemData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrderItem(itemId: string, itemData: any) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Clean up the item data
    const cleanItemData = {
      sku: itemData.sku?.trim() || "",
      size: itemData.size?.trim() || "",
      metal_type: itemData.metal_type?.trim() || "",
      details: itemData.details?.trim() || "",
      price: itemData.price || 0,
      qty: itemData.qty || 1,
      image: itemData.image || null,
    };

    const { data, error } = await supabase
      .from("order_items")
      .update(cleanItemData)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOrderItem(itemId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;
  },

  async deleteOrder(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from("orders").delete().eq("id", id);

    if (error) throw error;
  },

  async getOrderByNumber(orderNumber: string): Promise<OrderDetail | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers!inner(*),
        order_items(*)
      `
      )
      .eq("shopify_order_number", orderNumber)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }

    return data;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) throw error;
  },
};
