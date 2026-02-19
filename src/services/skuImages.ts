import { supabase } from '@/integrations/supabase/client';

export interface SkuImage {
  sku: string;
  image: string;
}

export const skuImageService = {
  /**
   * Get image URL for a specific SKU from order items
   */
  async getImageBySku(sku: string, orderId?: string): Promise<string | null> {
    try {
      let query = supabase
        .from('order_items')
        .select('image')
        .eq('sku', sku)
        .not('image', 'is', null)
        .limit(1);

      // If orderId is provided, filter by order
      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching SKU image:', error);
        return null;
      }

      return data?.image || null;
    } catch (error) {
      console.error('Exception fetching SKU image:', error);
      return null;
    }
  },

  /**
   * Get images for multiple SKUs
   */
  async getImagesBySkus(skus: string[], orderId?: string): Promise<Record<string, string>> {
    try {
      let query = supabase
        .from('order_items')
        .select('sku, image')
        .in('sku', skus)
        .not('image', 'is', null);

      // If orderId is provided, filter by order
      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching SKU images:', error);
        return {};
      }

      // Convert array to object with SKU as key
      const imageMap: Record<string, string> = {};
      data?.forEach((item: any) => {
        if (item.image) {
          imageMap[item.sku] = item.image;
        }
      });

      return imageMap;
    } catch (error) {
      console.error('Exception fetching SKU images:', error);
      return {};
    }
  }
};
