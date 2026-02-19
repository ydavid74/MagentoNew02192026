import { supabase } from '@/integrations/supabase/client';

export interface Order3dRelated {
  id: string;
  order_id: string;
  date_added: string;
  added_by: string;
  image_url: string;
  image_name: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrder3dRelatedData {
  order_id: string;
  image_url: string;
  image_name: string;
  comments?: string;
  added_by?: string; // Optional, will be auto-filled if not provided
}

export interface UpdateOrder3dRelatedData {
  image_url?: string;
  image_name?: string;
  comments?: string;
}

export const order3dRelatedService = {
  // Get all 3D related items for a specific order
  async getByOrderId(orderId: string): Promise<Order3dRelated[]> {
    const { data, error } = await supabase
      .from('order_3d_related' as any)
      .select('*')
      .eq('order_id', orderId)
      .order('date_added', { ascending: false });

    if (error) {
      console.error('Error fetching 3D related items:', error);
      throw error;
    }

    return (data as any[]) || [];
  },

  // Create a new 3D related item
  async create(data: CreateOrder3dRelatedData): Promise<Order3dRelated> {
    // Get current user ID if not provided
    if (!data.added_by) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      data.added_by = user.id;
    }

    console.log('Creating 3D related item with data:', data);
    console.log('Current user ID:', data.added_by);

    const { data: result, error } = await supabase
      .from('order_3d_related' as any)
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating 3D related item:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('Successfully created 3D related item:', result);
    return result;
  },

  // Update an existing 3D related item
  async update(id: string, data: UpdateOrder3dRelatedData): Promise<Order3dRelated> {
    const { data: result, error } = await supabase
      .from('order_3d_related' as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating 3D related item:', error);
      throw error;
    }

    return result as any;
  },

  // Delete a 3D related item
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('order_3d_related' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting 3D related item:', error);
      throw error;
    }
  },

  // Get 3D related item by ID
  async getById(id: string): Promise<Order3dRelated | null> {
    const { data, error } = await supabase
      .from('order_3d_related' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching 3D related item:', error);
      throw error;
    }

    return data as any;
  }
};
