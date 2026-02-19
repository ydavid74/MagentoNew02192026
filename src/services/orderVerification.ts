import { supabase } from '@/integrations/supabase/client';

export interface OrderVerification {
  id: string;
  order_id: string;
  date_added: string;
  added_by: string;
  comment: string;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateOrderVerificationData {
  order_id: string;
  comment: string;
}

export interface UpdateOrderVerificationData {
  comment: string;
}

export const orderVerificationService = {
  // Get all verification records for an order
  async getByOrderId(orderId: string): Promise<OrderVerification[]> {
    const { data, error } = await supabase
      .from('order_verification')
      .select('*')
      .eq('order_id', orderId)
      .order('date_added', { ascending: false });

    if (error) {
      console.error('Error fetching order verification records:', error);
      throw error;
    }

    // Manually join with profiles to get user names
    const verificationsWithProfiles = await Promise.all(
      (data || []).map(async (verification) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', verification.added_by)
          .single();

        return {
          ...verification,
          profile: profile || null
        };
      })
    );

    return verificationsWithProfiles;
  },

  // Get the latest verification record for an order
  async getLatestByOrderId(orderId: string): Promise<OrderVerification | null> {
    const { data, error } = await supabase
      .from('order_verification')
      .select('*')
      .eq('order_id', orderId)
      .order('date_added', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No records found
        return null;
      }
      console.error('Error fetching latest order verification:', error);
      throw error;
    }

    // Manually join with profiles to get user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', data.added_by)
      .single();

    return {
      ...data,
      profile: profile || null
    };
  },

  // Create a new verification record
  async create(data: CreateOrderVerificationData): Promise<OrderVerification> {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data: newRecord, error } = await supabase
      .from('order_verification')
      .insert({
        order_id: data.order_id,
        added_by: user.user.id,
        comment: data.comment.trim(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating order verification:', error);
      throw error;
    }

    // Manually join with profiles to get user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', newRecord.added_by)
      .single();

    return {
      ...newRecord,
      profile: profile || null
    };
  },

  // Update an existing verification record
  async update(id: string, data: UpdateOrderVerificationData): Promise<OrderVerification> {
    const { data: updatedRecord, error } = await supabase
      .from('order_verification')
      .update({
        comment: data.comment.trim(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating order verification:', error);
      throw error;
    }

    // Manually join with profiles to get user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', updatedRecord.added_by)
      .single();

    return {
      ...updatedRecord,
      profile: profile || null
    };
  },

  // Delete a verification record
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('order_verification')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order verification:', error);
      throw error;
    }
  },

  // Get verification record by ID
  async getById(id: string): Promise<OrderVerification | null> {
    const { data, error } = await supabase
      .from('order_verification')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching order verification by ID:', error);
      throw error;
    }

    // Manually join with profiles to get user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', data.added_by)
      .single();

    return {
      ...data,
      profile: profile || null
    };
  }
};
