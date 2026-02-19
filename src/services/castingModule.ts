import { supabase } from "@/integrations/supabase/client";

export interface CastingOrder {
  id: string;
  order_id: string;
  order_number: string;
  status: "draft" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CastingMemo {
  id: string;
  casting_order_id: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  size: string;
  metal_type: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCastingOrderData {
  order_id: string;
  order_number: string;
  status?: "draft" | "completed";
}

export interface CreateCastingMemoData {
  casting_order_id?: string;
  order_id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  size: string;
  metal_type: string;
  comments?: string;
}

export interface UpdateCastingMemoData {
  product_id?: string;
  product_name?: string;
  product_image?: string;
  quantity?: number;
  size?: string;
  metal_type?: string;
  comments?: string;
}

export class CastingModuleService {
  // Casting Orders CRUD
  static async getAllCastingOrders(): Promise<CastingOrder[]> {
    const { data, error } = await (supabase as any)
      .from("casting_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as CastingOrder[]) || [];
  }

  static async getCastingOrderById(id: string): Promise<CastingOrder | null> {
    const { data, error } = await (supabase as any)
      .from("casting_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as CastingOrder;
  }

  static async getCastingOrderByOrderId(
    orderId: string
  ): Promise<CastingOrder | null> {
    const { data, error } = await (supabase as any)
      .from("casting_orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as CastingOrder;
  }

  static async createCastingOrder(
    data: CreateCastingOrderData
  ): Promise<CastingOrder> {
    const { data: result, error } = await (supabase as any)
      .from("casting_orders")
      .insert([
        {
          order_id: data.order_id,
          order_number: data.order_number,
          status: data.status || "draft",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return result as CastingOrder;
  }

  static async updateCastingOrder(
    id: string,
    data: Partial<CastingOrder>
  ): Promise<CastingOrder> {
    const { data: result, error } = await (supabase as any)
      .from("casting_orders")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result as CastingOrder;
  }

  static async deleteCastingOrder(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("casting_orders")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Casting Memos CRUD
  static async getAllCastingMemos(): Promise<CastingMemo[]> {
    const { data, error } = await (supabase as any)
      .from("casting_memos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as CastingMemo[]) || [];
  }

  static async getCastingMemosByOrderId(
    orderId: string
  ): Promise<CastingMemo[]> {
    const { data, error } = await (supabase as any)
      .from("casting_memos")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as CastingMemo[]) || [];
  }

  static async getCastingMemosByCastingOrderId(
    castingOrderId: string
  ): Promise<CastingMemo[]> {
    const { data, error } = await (supabase as any)
      .from("casting_memos")
      .select("*")
      .eq("casting_order_id", castingOrderId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as CastingMemo[]) || [];
  }

  static async createCastingMemo(
    data: CreateCastingMemoData
  ): Promise<CastingMemo> {
    const { data: result, error } = await (supabase as any)
      .from("casting_memos")
      .insert([
        {
          casting_order_id: data.casting_order_id,
          order_id: data.order_id,
          order_number: data.order_number,
          product_id: data.product_id,
          product_name: data.product_name,
          product_image: data.product_image,
          quantity: data.quantity,
          size: data.size,
          metal_type: data.metal_type,
          comments: data.comments,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return result as CastingMemo;
  }

  static async updateCastingMemo(
    id: string,
    data: UpdateCastingMemoData
  ): Promise<CastingMemo> {
    const { data: result, error } = await (supabase as any)
      .from("casting_memos")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return result as CastingMemo;
  }

  static async deleteCastingMemo(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("casting_memos")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Batch operations
  static async createCastingOrderWithMemos(
    orderData: CreateCastingOrderData,
    memosData: CreateCastingMemoData[]
  ): Promise<{ order: CastingOrder; memos: CastingMemo[] }> {
    // Create the casting order first
    const order = await this.createCastingOrder(orderData);

    // Create all memos with the casting order ID
    const memosWithOrderId = memosData.map((memo) => ({
      ...memo,
      casting_order_id: order.id,
    }));

    const memos: CastingMemo[] = [];
    for (const memoData of memosWithOrderId) {
      const memo = await this.createCastingMemo(memoData);
      memos.push(memo);
    }

    return { order, memos };
  }

  // Utility methods
  static async getCastingOrderWithMemos(castingOrderId: string): Promise<{
    order: CastingOrder;
    memos: CastingMemo[];
  }> {
    const order = await this.getCastingOrderById(castingOrderId);
    if (!order) throw new Error("Casting order not found");

    const memos = await this.getCastingMemosByCastingOrderId(castingOrderId);

    return { order, memos };
  }

  static async getCastingOrderWithMemosByOrderId(orderId: string): Promise<{
    order: CastingOrder | null;
    memos: CastingMemo[];
  }> {
    const order = await this.getCastingOrderByOrderId(orderId);
    const memos = await this.getCastingMemosByOrderId(orderId);

    return { order, memos };
  }
}
