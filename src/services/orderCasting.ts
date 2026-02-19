import { supabase } from '@/integrations/supabase/client';

export interface OrderCasting {
  id: string;
  order_id: string;
  supplier: string;
  date_added: string;
  metal_type: string;
  quantity: string;
  weight: number;
  weight_unit: string;
  price: number;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderCastingData {
  order_id: string;
  supplier: string;
  metal_type: string;
  quantity: string;
  weight: number;
  weight_unit: string;
  price: number;
  added_by?: string;
}

export interface UpdateOrderCastingData {
  supplier?: string;
  metal_type?: string;
  quantity?: string;
  weight?: number;
  weight_unit?: string;
  price?: number;
}

export const orderCastingService = {
  // Get all casting items for a specific order
  async getByOrderId(orderId: string): Promise<OrderCasting[]> {
    const { data, error } = await supabase
      .from('order_casting' as any)
      .select('*')
      .eq('order_id', orderId)
      .order('date_added', { ascending: false });

    if (error) {
      console.error('Error fetching casting items:', error);
      throw error;
    }

    return (data as any[]) || [];
  },

  // Create a new casting item
  async create(data: CreateOrderCastingData): Promise<OrderCasting> {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = {
      ...data,
      added_by: data.added_by || user?.id
    };

    const { data: result, error } = await supabase
      .from('order_casting' as any)
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating casting item:', error);
      throw error;
    }

    return result as any;
  },

  // Update an existing casting item
  async update(id: string, data: UpdateOrderCastingData): Promise<OrderCasting> {
    const { data: result, error } = await supabase
      .from('order_casting' as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating casting item:', error);
      throw error;
    }

    return result as any;
  },

  // Delete a casting item
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('order_casting' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting casting item:', error);
      throw error;
    }
  },

  // Get casting item by ID
  async getById(id: string): Promise<OrderCasting | null> {
    const { data, error } = await supabase
      .from('order_casting' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching casting item:', error);
      throw error;
    }

    return data as any;
  }
};
