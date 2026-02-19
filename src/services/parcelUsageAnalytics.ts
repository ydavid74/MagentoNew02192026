import { supabase } from '@/integrations/supabase/client';

export interface ParcelUsageData {
  parcel_id: string;
  usage_count: number;
  last_used: string | null;
  first_used: string | null;
}

export interface ParcelUsageHighlight {
  parcel_id: string;
  color: string;
  usage_count: number;
  last_used: string | null;
}

export interface HighlightingConfig {
  mode: 'frequency' | 'date';
  dateRange: number; // days
  // Frequency mode settings
  frequencyThresholds?: {
    low: { min: number; max: number; color: string };
    medium: { min: number; max: number; color: string };
    high: { min: number; max: number; color: string };
  };
  // Date mode settings
  dateColor?: string;
}

class ParcelUsageAnalyticsService {
  /**
   * Get parcel usage data within a date range
   */
  async getParcelUsageData(dateRangeDays: number): Promise<ParcelUsageData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRangeDays);
      const startDateISO = startDate.toISOString();

      console.log(`📊 Fetching parcel usage data from ${startDateISO} (last ${dateRangeDays} days)`);

      const { data, error } = await supabase
        .from('diamond_history' as any)
        .select('parcel_id, date')
        .gte('date', startDateISO)
        .order('parcel_id')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching parcel usage data:', error);
        throw error;
      }

      // Group by parcel_id and calculate usage statistics
      const usageMap = new Map<string, ParcelUsageData>();

      (data as any[] || []).forEach(entry => {
        const parcelId = entry.parcel_id;
        const usageDate = entry.date;

        if (!usageMap.has(parcelId)) {
          usageMap.set(parcelId, {
            parcel_id: parcelId,
            usage_count: 0,
            last_used: null,
            first_used: null
          });
        }

        const usageData = usageMap.get(parcelId)!;
        usageData.usage_count += 1;
        
        if (!usageData.last_used || usageDate > usageData.last_used) {
          usageData.last_used = usageDate;
        }
        
        if (!usageData.first_used || usageDate < usageData.first_used) {
          usageData.first_used = usageDate;
        }
      });

      const result = Array.from(usageMap.values());
      console.log(`📈 Found usage data for ${result.length} parcels`);
      
      return result;
    } catch (error) {
      console.error('Error in getParcelUsageData:', error);
      throw error;
    }
  }

  /**
   * Generate highlighting data based on configuration
   */
  async generateHighlightingData(config: HighlightingConfig): Promise<ParcelUsageHighlight[]> {
    try {
      const usageData = await this.getParcelUsageData(config.dateRange);
      
      if (config.mode === 'frequency') {
        return this.generateFrequencyBasedHighlights(usageData, config);
      } else {
        return this.generateDateBasedHighlights(usageData, config);
      }
    } catch (error) {
      console.error('Error generating highlighting data:', error);
      throw error;
    }
  }

  /**
   * Generate frequency-based highlighting
   */
  private generateFrequencyBasedHighlights(
    usageData: ParcelUsageData[], 
    config: HighlightingConfig
  ): ParcelUsageHighlight[] {
    const { frequencyThresholds } = config;
    
    if (!frequencyThresholds) {
      throw new Error('Frequency thresholds not configured');
    }

    return usageData.map(parcel => {
      let color = '#ffffff'; // Default white (no highlight)
      
      if (parcel.usage_count >= frequencyThresholds.high.min) {
        color = frequencyThresholds.high.color;
      } else if (parcel.usage_count >= frequencyThresholds.medium.min) {
        color = frequencyThresholds.medium.color;
      } else if (parcel.usage_count >= frequencyThresholds.low.min) {
        color = frequencyThresholds.low.color;
      }

      return {
        parcel_id: parcel.parcel_id,
        color,
        usage_count: parcel.usage_count,
        last_used: parcel.last_used
      };
    });
  }

  /**
   * Generate date-based highlighting
   */
  private generateDateBasedHighlights(
    usageData: ParcelUsageData[], 
    config: HighlightingConfig
  ): ParcelUsageHighlight[] {
    const { dateColor = '#3b82f6' } = config;

    return usageData.map(parcel => ({
      parcel_id: parcel.parcel_id,
      color: dateColor,
      usage_count: parcel.usage_count,
      last_used: parcel.last_used
    }));
  }

  /**
   * Get all unique parcel IDs from diamond_inventory for complete coverage
   */
  async getAllParcelIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('diamond_inventory' as any)
        .select('parcel_id');

      if (error) {
        console.error('Error fetching parcel IDs:', error);
        throw error;
      }

      return (data as any[] || []).map(item => item.parcel_id);
    } catch (error) {
      console.error('Error in getAllParcelIds:', error);
      throw error;
    }
  }

  /**
   * Generate complete highlighting data including unused parcels
   */
  async generateCompleteHighlightingData(config: HighlightingConfig): Promise<ParcelUsageHighlight[]> {
    try {
      const [usageHighlights, allParcelIds] = await Promise.all([
        this.generateHighlightingData(config),
        this.getAllParcelIds()
      ]);

      // Create a map of usage highlights for quick lookup
      const usageMap = new Map(
        usageHighlights.map(highlight => [highlight.parcel_id, highlight])
      );

      // Generate complete list including unused parcels
      const completeHighlights: ParcelUsageHighlight[] = allParcelIds.map(parcelId => {
        const usageHighlight = usageMap.get(parcelId);
        
        if (usageHighlight) {
          return usageHighlight;
        } else {
          // Parcel not used in the date range - show white
          return {
            parcel_id: parcelId,
            color: '#ffffff',
            usage_count: 0,
            last_used: null
          };
        }
      });

      console.log(`🎨 Generated highlighting for ${completeHighlights.length} parcels`);
      return completeHighlights;
    } catch (error) {
      console.error('Error generating complete highlighting data:', error);
      throw error;
    }
  }
}

export const parcelUsageAnalyticsService = new ParcelUsageAnalyticsService();
