import { supabase } from '@/integrations/supabase/client';
import { orderCastingService } from './orderCasting';
import { diamondDeductionsService } from './diamondDeductions';

export interface OrderCosts {
  casting: number;
  diamond: number;
  labor: number;
  total: number;
}

export interface CostCalculationResult {
  costs: OrderCosts;
  lastUpdated: string;
}

export const costCalculationService = {
  /**
   * Calculate total casting cost from order_casting table
   */
  async calculateCastingCost(orderId: string): Promise<number> {
    try {
      const castingItems = await orderCastingService.getByOrderId(orderId);
      return castingItems.reduce((total, item) => total + (item.price || 0), 0);
    } catch (error) {
      console.error('Error calculating casting cost:', error);
      return 0;
    }
  },

  /**
   * Calculate total diamond cost from diamond_deductions table
   * Only includes deductions that are included in item cost
   */
  async calculateDiamondCost(orderId: string): Promise<number> {
    try {
      const deductions = await diamondDeductionsService.getByOrderId(orderId);
      return deductions
        .filter(deduction => deduction.include_in_item_cost === true)
        .reduce((total, deduction) => total + (deduction.total_price || 0), 0);
    } catch (error) {
      console.error('Error calculating diamond cost:', error);
      return 0;
    }
  },

  /**
   * Calculate labor cost based on diamond deductions and fixed costs
   * Formula: $35 + (number of side diamonds × $1) + $5 (if there is center stone)
   */
  async calculateLaborCost(orderId: string): Promise<number> {
    try {
      // Get diamond deductions to count side and center stones
      const deductions = await diamondDeductionsService.getByOrderId(orderId);
      
      // Count side stones and center stones based on deduction_type field
      let sideStonesCount = 0;
      let hasCenterStone = false;
      
      deductions.forEach(deduction => {
        const stones = parseInt(deduction.stones || '0');
        // Use deduction_type field first, fallback to type field
        const deductionType = deduction.deduction_type || deduction.type;
        
        if (deductionType === 's' || deductionType === 'side') {
          sideStonesCount += stones;
        } else if ((deductionType === 'c' || deductionType === 'center') && stones > 0) {
          hasCenterStone = true;
        }
      });
      
      // Calculate labor cost: $35 + (side stones × $1) + $5 (if center stone exists)
      const baseCost = 35; // CAD $15 + General $20
      const sideStonesCost = sideStonesCount * 1;
      const centerStoneCost = hasCenterStone ? 5 : 0; // $5 only if there is any center stone
      
      const totalLaborCost = baseCost + sideStonesCost + centerStoneCost;
      
      console.log('Labor cost calculation:', {
        orderId,
        sideStonesCount,
        hasCenterStone,
        sideStonesCost,
        centerStoneCost,
        baseCost,
        totalLaborCost
      });
      
      return totalLaborCost;
    } catch (error) {
      console.error('Error calculating labor cost:', error);
      return 0;
    }
  },

  /**
   * Get labor cost from orders table (legacy method - kept for backward compatibility)
   */
  async getLaborCost(orderId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('labor')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching labor cost:', error);
        return 0;
      }

      return data?.labor || 0;
    } catch (error) {
      console.error('Error fetching labor cost:', error);
      return 0;
    }
  },

  /**
   * Calculate all costs for an order from their respective sources
   */
  async calculateOrderCosts(orderId: string): Promise<CostCalculationResult> {
    try {
      const [castingCost, diamondCost, laborCost] = await Promise.all([
        this.calculateCastingCost(orderId),
        this.calculateDiamondCost(orderId),
        this.calculateLaborCost(orderId) // Use new calculation method
      ]);

      const total = castingCost + diamondCost + laborCost;

      const costs: OrderCosts = {
        casting: castingCost,
        diamond: diamondCost,
        labor: laborCost,
        total
      };

      return {
        costs,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating order costs:', error);
      return {
        costs: {
          casting: 0,
          diamond: 0,
          labor: 0,
          total: 0
        },
        lastUpdated: new Date().toISOString()
      };
    }
  },

  /**
   * Update the order_costs table with calculated costs
   */
  async updateOrderCosts(orderId: string): Promise<CostCalculationResult> {
    try {
      const calculationResult = await this.calculateOrderCosts(orderId);
      
      // Update the order_costs table
      const { data, error } = await supabase
        .from('order_costs')
        .upsert({
          order_id: orderId,
          casting: calculationResult.costs.casting,
          diamond: calculationResult.costs.diamond,
          labor: calculationResult.costs.labor,
          updated_at: calculationResult.lastUpdated
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating order costs:', error);
        throw error;
      }

      return calculationResult;
    } catch (error) {
      console.error('Error updating order costs:', error);
      throw error;
    }
  }
};
