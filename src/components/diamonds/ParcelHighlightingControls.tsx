import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Palette, BarChart3, Calendar, Settings, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { HighlightingConfig } from '@/services/parcelUsageAnalytics';
import { highlightingSettingsService } from '@/services/highlightingSettings';

interface ParcelHighlightingControlsProps {
  config: HighlightingConfig;
  onConfigChange: (config: HighlightingConfig) => void;
  onApplyHighlighting: () => void;
  isLoading?: boolean;
}

const dateRangeOptions = [
  { value: 7, label: 'Last 7 days' },
  { value: 15, label: 'Last 15 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 45, label: 'Last 45 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' }
];

const defaultColors = {
  low: '#fef3c7',    // Light yellow
  medium: '#fde68a', // Medium yellow
  high: '#f59e0b',   // Orange
  date: '#3b82f6'    // Blue
};

export function ParcelHighlightingControls({
  config,
  onConfigChange,
  onApplyHighlighting,
  isLoading = false
}: ParcelHighlightingControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const saveSettings = async (newConfig: HighlightingConfig) => {
    try {
      await highlightingSettingsService.saveSettings(newConfig);
    } catch (error) {
      console.error('Failed to save highlighting settings:', error);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = highlightingSettingsService.getDefaultSettings();
    onConfigChange(defaultSettings);
    saveSettings(defaultSettings);
  };

  const handleModeChange = (mode: 'frequency' | 'date') => {
    const newConfig = {
      ...config,
      mode,
      frequencyThresholds: mode === 'frequency' ? {
        low: { min: 1, max: 2, color: defaultColors.low },
        medium: { min: 3, max: 4, color: defaultColors.medium },
        high: { min: 5, max: 999, color: defaultColors.high }
      } : undefined,
      dateColor: mode === 'date' ? defaultColors.date : undefined
    };
    onConfigChange(newConfig);
    saveSettings(newConfig);
  };

  const handleDateRangeChange = (value: string) => {
    const newConfig = {
      ...config,
      dateRange: parseInt(value)
    };
    onConfigChange(newConfig);
    saveSettings(newConfig);
  };

  const handleFrequencyThresholdChange = (threshold: 'low' | 'medium' | 'high', field: 'min' | 'max' | 'color', value: string) => {
    if (!config.frequencyThresholds) return;

    const newThresholds = {
      ...config.frequencyThresholds,
      [threshold]: {
        ...config.frequencyThresholds[threshold],
        [field]: field === 'min' || field === 'max' ? parseInt(value) : value
      }
    };

    const newConfig = {
      ...config,
      frequencyThresholds: newThresholds
    };
    onConfigChange(newConfig);
    saveSettings(newConfig);
  };

  const handleDateColorChange = (color: string) => {
    const newConfig = {
      ...config,
      dateColor: color
    };
    onConfigChange(newConfig);
    saveSettings(newConfig);
  };

  return (
    <div className="relative flex items-center gap-3">
      {/* Configuration Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2"
      >
        <Palette className="h-4 w-4" />
        Highlighting
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Advanced Configuration Panel */}
      {isExpanded && (
        <Card className="absolute top-full right-0 z-50 mt-2 w-96">
          <CardContent className="p-4 space-y-3">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Highlighting Mode:</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant={config.mode === 'frequency' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('frequency')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Frequency
                </Button>
                <Button
                  variant={config.mode === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('date')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Date
                </Button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range:</Label>
              <Select value={config.dateRange.toString()} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Frequency Mode Configuration */}
            {config.mode === 'frequency' && config.frequencyThresholds && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Frequency Thresholds</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefaults}
                    className="flex items-center gap-1 text-xs h-6 px-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Set Default
                  </Button>
                </div>
                
                {/* Color Legend */}
                <div className="flex items-center gap-4 p-2 bg-white dark:bg-gray-700 rounded border">
                  <span className="text-xs font-medium">Preview:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: config.frequencyThresholds.low.color }}
                    />
                    <span className="text-xs">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: config.frequencyThresholds.medium.color }}
                    />
                    <span className="text-xs">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: config.frequencyThresholds.high.color }}
                    />
                    <span className="text-xs">High</span>
                  </div>
                </div>
                
                {/* Low Usage */}
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="w-16 justify-center text-xs">Low</Badge>
                  <Input
                    type="number"
                    min="1"
                    value={config.frequencyThresholds.low.min}
                    onChange={(e) => handleFrequencyThresholdChange('low', 'min', e.target.value)}
                    className="w-12 h-7 text-xs"
                  />
                  <span className="text-xs">-</span>
                  <Input
                    type="number"
                    min="1"
                    value={config.frequencyThresholds.low.max}
                    onChange={(e) => handleFrequencyThresholdChange('low', 'max', e.target.value)}
                    className="w-12 h-7 text-xs"
                  />
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: config.frequencyThresholds.low.color }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = config.frequencyThresholds.low.color;
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          handleFrequencyThresholdChange('low', 'color', target.value);
                        };
                        input.click();
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {config.frequencyThresholds.low.color}
                    </span>
                  </div>
                </div>

                {/* Medium Usage */}
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="w-16 justify-center text-xs">Medium</Badge>
                  <Input
                    type="number"
                    min="1"
                    value={config.frequencyThresholds.medium.min}
                    onChange={(e) => handleFrequencyThresholdChange('medium', 'min', e.target.value)}
                    className="w-12 h-7 text-xs"
                  />
                  <span className="text-xs">-</span>
                  <Input
                    type="number"
                    min="1"
                    value={config.frequencyThresholds.medium.max}
                    onChange={(e) => handleFrequencyThresholdChange('medium', 'max', e.target.value)}
                    className="w-12 h-7 text-xs"
                  />
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: config.frequencyThresholds.medium.color }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = config.frequencyThresholds.medium.color;
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          handleFrequencyThresholdChange('medium', 'color', target.value);
                        };
                        input.click();
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {config.frequencyThresholds.medium.color}
                    </span>
                  </div>
                </div>

                {/* High Usage */}
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="w-16 justify-center text-xs">High</Badge>
                  <Input
                    type="number"
                    min="1"
                    value={config.frequencyThresholds.high.min}
                    onChange={(e) => handleFrequencyThresholdChange('high', 'min', e.target.value)}
                    className="w-12 h-7 text-xs"
                  />
                  <span className="text-xs">+ uses</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: config.frequencyThresholds.high.color }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = config.frequencyThresholds.high.color;
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          handleFrequencyThresholdChange('high', 'color', target.value);
                        };
                        input.click();
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {config.frequencyThresholds.high.color}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Date Mode Configuration */}
            {config.mode === 'date' && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Date-Based Highlighting</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefaults}
                    className="flex items-center gap-1 text-xs h-6 px-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Set Default
                  </Button>
                </div>
                
                {/* Color Preview */}
                <div className="flex items-center gap-4 p-2 bg-white dark:bg-gray-700 rounded border">
                  <span className="text-xs font-medium">Preview:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: config.dateColor || defaultColors.date }}
                    />
                    <span className="text-xs">Used in date range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border bg-white dark:bg-gray-800" />
                    <span className="text-xs">Not used</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-xs">Color:</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: config.dateColor || defaultColors.date }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = config.dateColor || defaultColors.date;
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          handleDateColorChange(target.value);
                        };
                        input.click();
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {config.dateColor || defaultColors.date}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Apply Button */}
            <div className="flex justify-end pt-3 border-t">
              <Button
                onClick={onApplyHighlighting}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Applying...
                  </>
                ) : (
                  <>
                    <Palette className="h-4 w-4" />
                    Apply Highlighting
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
