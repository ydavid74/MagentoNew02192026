import { supabase } from '@/integrations/supabase/client';

export interface DiamondInventoryItem {
  id?: string;
  parcel_id: string;
  parcel_name?: string;
  total_carat?: number;
  number_of_stones?: number;
  price_per_ct?: number;
  shape?: string;
  color?: string;
  clarity?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryDeductionData {
  parcel_id: string;
  ct_weight: number;
  stones: number;
  order_id: string;
  deduction_type: 'center' | 'side' | 'manual';
}

export interface InventoryRestorationData {
  parcel_id: string;
  ct_weight: number;
  stones: number;
  order_id: string;
}

class DiamondInventoryService {
  /**
   * Get inventory item by parcel ID
   */
  async getByParcelId(parcelId: string): Promise<DiamondInventoryItem | null> {
    const { data, error } = await supabase
      .from('diamond_inventory' as any)
      .select('*')
      .eq('parcel_id', parcelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching diamond inventory item:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Check if there's sufficient inventory for deduction
   */
  async validateSufficientInventory(parcelId: string, requiredCtWeight: number, requiredStones: number): Promise<boolean> {
    const inventoryItem = await this.getByParcelId(parcelId);
    
    if (!inventoryItem) {
      return false;
    }

    const availableCtWeight = inventoryItem.total_carat || 0;
    const availableStones = inventoryItem.number_of_stones || 0;

    return availableCtWeight >= requiredCtWeight && availableStones >= requiredStones;
  }

  /**
   * Deduct inventory when creating a deduction
   */
  async deductInventory(deductionData: InventoryDeductionData): Promise<void> {
    const { parcel_id, ct_weight, stones, order_id, deduction_type } = deductionData;

    console.log('🔍 deductInventory: Starting deduction for parcel:', parcel_id);
    console.log('🔍 deductInventory: Deduction data:', { ct_weight, stones, order_id, deduction_type });

    // First, validate sufficient inventory
    const hasSufficientInventory = await this.validateSufficientInventory(parcel_id, ct_weight, stones);
    console.log('🔍 deductInventory: Has sufficient inventory:', hasSufficientInventory);
    
    if (!hasSufficientInventory) {
      throw new Error(`Insufficient inventory for parcel ${parcel_id}. Required: ${ct_weight}ct, ${stones} stones`);
    }

    // Get current inventory
    const inventoryItem = await this.getByParcelId(parcel_id);
    if (!inventoryItem) {
      throw new Error(`Inventory item not found for parcel ${parcel_id}`);
    }

    console.log('🔍 deductInventory: Current inventory item:', {
      parcel_id: inventoryItem.parcel_id,
      total_carat: inventoryItem.total_carat,
      number_of_stones: inventoryItem.number_of_stones
    });

    // Calculate new quantities
    const oldCtWeight = inventoryItem.total_carat || 0;
    const oldStones = inventoryItem.number_of_stones || 0;
    const newCtWeight = oldCtWeight - ct_weight;
    const newStones = oldStones - stones;

    console.log('🔍 deductInventory: Calculation:', {
      old_total_carat: oldCtWeight,
      old_stones: oldStones,
      deduct_ct_weight: ct_weight,
      deduct_stones: stones,
      new_total_carat: newCtWeight,
      new_stones: newStones
    });

    // Update inventory
    console.log('🔍 deductInventory: Updating inventory with new values:', {
      total_carat: newCtWeight,
      number_of_stones: newStones
    });

    const { data: updateData, error } = await supabase
      .from('diamond_inventory' as any)
      .update({
        total_carat: newCtWeight,
        number_of_stones: newStones,
        updated_at: new Date().toISOString()
      })
      .eq('parcel_id', parcel_id)
      .select();

    if (error) {
      console.error('❌ deductInventory: Error deducting inventory:', error);
      if (error.code === '42501') {
        throw new Error(`Permission denied: You don't have permission to update diamond inventory. This may be due to Row Level Security policies. Error: ${error.message}`);
      }
      throw error;
    }

    console.log('✅ deductInventory: Inventory deduction result:', updateData);

    // Verify the update was successful
    if (updateData && updateData.length > 0) {
      const updatedItem = updateData[0] as any; // Type assertion to handle missing columns
      console.log('✅ deductInventory: Verified update - new values:', {
        parcel_id: updatedItem.parcel_id,
        total_carat: updatedItem.total_carat,
        number_of_stones: updatedItem.number_of_stones
      });
    } else {
      console.warn('⚠️ deductInventory: No data returned from update operation');
    }

    console.log(`✅ deductInventory: Successfully deducted ${ct_weight}ct, ${stones} stones from parcel ${parcel_id}`);
  }

  /**
   * Restore inventory when adding back to stock
   */
  async restoreInventory(restorationData: InventoryRestorationData): Promise<void> {
    const { parcel_id, ct_weight, stones, order_id } = restorationData;

    console.log('Starting inventory restoration for:', { parcel_id, ct_weight, stones, order_id });

    // Get current inventory
    const inventoryItem = await this.getByParcelId(parcel_id);
    if (!inventoryItem) {
      throw new Error(`Inventory item not found for parcel ${parcel_id}`);
    }

    console.log('Current inventory item:', inventoryItem);

    // Calculate new quantities
    const currentCtWeight = inventoryItem.total_carat || 0;
    const currentStones = inventoryItem.number_of_stones || 0;
    const newCtWeight = currentCtWeight + ct_weight;
    const newStones = currentStones + stones;

    console.log('Inventory calculation:', {
      currentCtWeight,
      currentStones,
      addingCtWeight: ct_weight,
      addingStones: stones,
      newCtWeight,
      newStones
    });

    // Update inventory
    console.log('Updating inventory for parcel:', parcel_id, 'with new values:', {
      total_carat: newCtWeight,
      number_of_stones: newStones
    });

    const { data: updateData, error } = await supabase
      .from('diamond_inventory' as any)
      .update({
        total_carat: newCtWeight,
        number_of_stones: newStones,
        updated_at: new Date().toISOString()
      })
      .eq('parcel_id', parcel_id)
      .select();

    if (error) {
      console.error('Error restoring inventory:', error);
      if (error.code === '42501') {
        throw new Error(`Permission denied: You don't have permission to update diamond inventory. This may be due to Row Level Security policies. Error: ${error.message}`);
      }
      throw error;
    }

    console.log('Inventory update result:', updateData);

    // History logging is handled by the diamondDeductionsService to avoid duplicates

    console.log(`Successfully restored ${ct_weight}ct, ${stones} stones to parcel ${parcel_id}`);
  }

  /**
   * Log inventory movement for history tracking
   */
  private async logInventoryMovement(data: {
    parcel_id: string;
    movement_type: 'deduction' | 'restoration';
    ct_weight: number;
    stones: number;
    order_id: string;
    deduction_type: string;
    notes: string;
  }): Promise<void> {
    try {
      // Get current parcel's total weight
      let currentParcelTotalWeight = 0;
      try {
        const currentParcel = await this.getByParcelId(data.parcel_id);
        currentParcelTotalWeight = currentParcel?.total_carat || 0;
      } catch (error) {
        console.warn('Could not get current parcel total weight:', error);
        // Fallback to movement ct_weight if we can't get parcel data
        currentParcelTotalWeight = data.ct_weight;
      }

      // For now, we'll use the diamond_history table which has the right structure
      // and is designed for tracking diamond movements
      const { error } = await supabase
        .from('diamond_history' as any)
        .insert([{
          parcel_id: data.parcel_id,
          date: new Date().toISOString(),
          employee: 'System', // We could get this from auth if needed
          type: data.movement_type === 'deduction' ? 'Deduction' : 'Restoration',
          stones: data.stones,
          ct_weight: data.ct_weight,
          order_id: data.order_id,
          comments: data.notes,
          total_weight: currentParcelTotalWeight
        }]);

      if (error) {
        console.warn('Could not log inventory movement to history (RLS policy restriction):', error.message);
        // Don't throw here as this is just for history tracking
        // The main inventory operation should still succeed
      } else {
        console.log('Successfully logged inventory movement to history');
      }
    } catch (error) {
      console.warn('Error logging inventory movement:', error);
      // Don't throw here as this is just for history tracking
    }
  }

  /**
   * Get inventory movements for a specific parcel
   */
  async getInventoryMovements(parcelId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('diamond_history' as any)
      .select('*')
      .eq('parcel_id', parcelId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching inventory movements:', error);
      throw error;
    }

    return data || [];
  }
}

export const diamondInventoryService = new DiamondInventoryService();
