import { supabase } from '@/integrations/supabase/client';
import { HighlightingConfig } from './parcelUsageAnalytics';

export interface HighlightingSettings {
  id?: string;
  user_id: string;
  settings: HighlightingConfig;
  created_at?: string;
  updated_at?: string;
}

class HighlightingSettingsService {
  /**
   * Get highlighting settings for the current user
   */
  async getSettings(): Promise<HighlightingConfig | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      const { data, error } = await supabase
        .from('highlighting_settings' as any)
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return default
          console.log('No highlighting settings found for user, returning default');
          return this.getDefaultSettings();
        }
        console.error('Error fetching highlighting settings:', error);
        return null;
      }

      console.log('📋 Loaded highlighting settings:', data.settings);
      return data.settings as HighlightingConfig;
    } catch (error) {
      console.error('Error in getSettings:', error);
      return null;
    }
  }

  /**
   * Save highlighting settings for the current user
   */
  async saveSettings(settings: HighlightingConfig): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      console.log('💾 Saving highlighting settings:', settings);

      const { error } = await supabase
        .from('highlighting_settings' as any)
        .upsert({
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving highlighting settings:', error);
        return false;
      }

      console.log('✅ Highlighting settings saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveSettings:', error);
      return false;
    }
  }

  /**
   * Get default highlighting settings
   */
  getDefaultSettings(): HighlightingConfig {
    return {
      mode: 'frequency',
      dateRange: 30,
      frequencyThresholds: {
        low: { min: 1, max: 2, color: '#fef3c7' },
        medium: { min: 3, max: 4, color: '#fde68a' },
        high: { min: 5, max: 999, color: '#f59e0b' }
      }
    };
  }

  /**
   * Clear highlighting settings for the current user
   */
  async clearSettings(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('highlighting_settings' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing highlighting settings:', error);
        return false;
      }

      console.log('🗑️ Highlighting settings cleared');
      return true;
    } catch (error) {
      console.error('Error in clearSettings:', error);
      return false;
    }
  }
}

export const highlightingSettingsService = new HighlightingSettingsService();
