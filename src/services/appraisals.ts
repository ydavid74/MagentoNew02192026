import { supabase } from '@/integrations/supabase/client';

export interface Appraisal {
  id?: string;
  order_id: string;
  stock_number: string;
  customer_name?: string;
  type?: string;
  diamond_type?: string;
  shape?: string;
  measurement?: string;
  color?: string;
  clarity?: string;
  polish_symmetry?: string;
  precious_metal?: string;
  description?: string;
  image_url?: string;
  diamond_weight?: string;
  replacement_value?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAppraisalData {
  order_id: string;
  stock_number: string;
  customer_name?: string;
  type?: string;
  diamond_type?: string;
  shape?: string;
  measurement?: string;
  color?: string;
  clarity?: string;
  polish_symmetry?: string;
  precious_metal?: string;
  description?: string;
  image_url?: string;
  diamond_weight?: string;
  replacement_value?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
}

export const appraisalService = {
  // Get all appraisals for an order
  async getAppraisalsByOrderId(orderId: string): Promise<Appraisal[]> {
    console.log('🔍 AppraisalService.getAppraisalsByOrderId called with orderId:', orderId);
    
    try {
      const { data: appraisals, error } = await supabase
        .from('appraisals' as any)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching appraisals:', error);
        throw error;
      }

      console.log('📋 Appraisals fetched from database:', appraisals);
      return (appraisals as unknown as Appraisal[]) || [];

    } catch (error) {
      console.error('❌ Error in getAppraisalsByOrderId:', error);
      throw error;
    }
  },

  // Search for appraisal by stock number
  async searchAppraisalByStockNumber(stockNumber: string): Promise<Appraisal | null> {
    console.log('🔍 AppraisalService.searchAppraisalByStockNumber called with stockNumber:', stockNumber);
    
    try {
      const { data: appraisals, error } = await supabase
        .from('appraisals' as any)
        .select('*')
        .ilike('stock_number', stockNumber.trim())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error searching appraisal:', error);
        throw error;
      }

      if (!appraisals || appraisals.length === 0) {
        console.log('❌ No appraisal found for stock number:', stockNumber);
        return null;
      }

      console.log('✅ Appraisal found:', appraisals[0]);
      return appraisals[0] as unknown as Appraisal;

    } catch (error) {
      console.error('❌ Error in searchAppraisalByStockNumber:', error);
      throw error;
    }
  },

  // Create a new appraisal
  async createAppraisal(appraisalData: CreateAppraisalData): Promise<Appraisal> {
    console.log('➕ AppraisalService.createAppraisal called with data:', appraisalData);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const appraisalWithUser = {
        ...appraisalData,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('appraisals' as any)
        .insert([appraisalWithUser])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating appraisal:', error);
        throw error;
      }

      console.log('✅ Appraisal created successfully:', data);
      return data as unknown as Appraisal;

    } catch (error) {
      console.error('❌ Error in createAppraisal:', error);
      throw error;
    }
  },

  // Update an existing appraisal
  async updateAppraisal(id: string, updates: Partial<CreateAppraisalData>): Promise<Appraisal> {
    console.log('🔄 AppraisalService.updateAppraisal called with id:', id, 'updates:', updates);
    
    try {
      const { data, error } = await supabase
        .from('appraisals' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating appraisal:', error);
        throw error;
      }

      console.log('✅ Appraisal updated successfully:', data);
      return data as unknown as Appraisal;

    } catch (error) {
      console.error('❌ Error in updateAppraisal:', error);
      throw error;
    }
  },

  // Delete an appraisal
  async deleteAppraisal(id: string): Promise<void> {
    console.log('🗑️ AppraisalService.deleteAppraisal called with id:', id);
    
    try {
      const { error } = await supabase
        .from('appraisals' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting appraisal:', error);
        throw error;
      }

      console.log('✅ Appraisal deleted successfully');

    } catch (error) {
      console.error('❌ Error in deleteAppraisal:', error);
      throw error;
    }
  },

  // Generate PDF for an appraisal
  async generateAppraisalPDF(appraisalId: string): Promise<{ pdf_url: string; pdf_generated_at: string }> {
    console.log('📄 AppraisalService.generateAppraisalPDF called with id:', appraisalId);
    
    try {
      // Call the Supabase Edge Function to generate PDF
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-appraisal-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          appraisal_id: appraisalId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate PDF');
      }

      console.log('✅ PDF generated successfully:', result);

      // Update the appraisal record with PDF URL and generation timestamp
      const { data, error } = await supabase
        .from('appraisals' as any)
        .update({
          pdf_url: result.pdf_url,
          pdf_generated_at: result.pdf_generated_at
        })
        .eq('id', appraisalId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating appraisal with PDF URL:', error);
        throw error;
      }

      return {
        pdf_url: result.pdf_url,
        pdf_generated_at: result.pdf_generated_at
      };

    } catch (error) {
      console.error('❌ Error in generateAppraisalPDF:', error);
      throw error;
    }
  }
};
