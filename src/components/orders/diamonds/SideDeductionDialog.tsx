import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus, ImageIcon } from "lucide-react";
import { DiamondDeduction } from "@/services/diamondDeductions";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { skuImageService } from "@/services/skuImages";

interface SideDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sideDeductionItems: DiamondDeduction[];
  skuOptions: string[];
  onAddItem: () => void;
  onUpdateItem: (id: string, field: keyof DiamondDeduction, value: string) => void;
  onRemoveItem: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  orderId?: string;
  orderData?: any;
  isSubmitting?: boolean;
}

export function SideDeductionDialog({
  open,
  onOpenChange,
  sideDeductionItems,
  skuOptions,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onSubmit,
  onCancel,
  orderId,
  orderData,
  isSubmitting = false
}: SideDeductionDialogProps) {
  // State for parcel validation for each side deduction item
  const [parcelValidations, setParcelValidations] = useState<Record<string, { exists: boolean; loading: boolean; details?: any }>>({});
  
  // State for SKU images
  const [skuImages, setSkuImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  // Function to check parcel ID for a specific item
  const checkParcelId = async (itemId: string, parcelId: string) => {
    if (!parcelId.trim()) {
      setParcelValidations(prev => ({ ...prev, [itemId]: { exists: false, loading: false } }));
      return;
    }

    setParcelValidations(prev => ({ ...prev, [itemId]: { exists: false, loading: true } }));
    console.log('Checking parcel ID for side deduction:', parcelId.trim());
    
    try {
      const { data, error } = await supabase
        .from('diamond_inventory' as any)
        .select('parcel_id, parcel_name, total_carat, shape, color, clarity')
        .eq('parcel_id', parcelId.trim())
        .single();

      console.log('Side deduction query result:', { data, error });

      if (error) {
        console.log('Side deduction error details:', error);
        if (error.code === 'PGRST116') {
          // No rows returned - parcel not found
          setParcelValidations(prev => ({ ...prev, [itemId]: { exists: false, loading: false } }));
        } else {
          // Other error
          setParcelValidations(prev => ({ ...prev, [itemId]: { exists: false, loading: false } }));
        }
      } else if (data) {
        // Parcel found
        setParcelValidations(prev => ({ 
          ...prev, 
          [itemId]: { 
            exists: true, 
            loading: false, 
            details: data 
          } 
        }));
      }
    } catch (error) {
      console.error('Exception in side deduction checkParcelId:', error);
      setParcelValidations(prev => ({ ...prev, [itemId]: { exists: false, loading: false } }));
    }
  };

  // Debug function to check diamond_inventory table
  const debugDiamondInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('diamond_inventory' as any)
        .select('parcel_id, parcel_name, total_carat')
        .limit(10);
      
      console.log('Side deduction - Diamond inventory sample data:', { data, error });
      
      if (data && data.length > 0) {
        console.log('Side deduction - Available parcel IDs:', data.map((item: any) => item.parcel_id));
      }
    } catch (error) {
      console.error('Side deduction - Error fetching diamond inventory:', error);
    }
  };

  // Call debug function when dialog opens
  useEffect(() => {
    if (open) {
      debugDiamondInventory();
    }
  }, [open]);

  // Function to fetch SKU image
  const fetchSkuImage = async (itemId: string, sku: string) => {
    if (!sku) {
      setSkuImages(prev => ({ ...prev, [itemId]: '' }));
      return;
    }

    setLoadingImages(prev => ({ ...prev, [itemId]: true }));
    try {
      const imageUrl = await skuImageService.getImageBySku(sku, orderId);
      setSkuImages(prev => ({ ...prev, [itemId]: imageUrl || '' }));
    } catch (error) {
      console.error('Error fetching SKU image:', error);
      setSkuImages(prev => ({ ...prev, [itemId]: '' }));
    } finally {
      setLoadingImages(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Debounced parcel ID validation for each item
  useEffect(() => {
    const timeouts: Record<string, NodeJS.Timeout> = {};
    
    sideDeductionItems.forEach(item => {
      if (item.parcel_id) {
        timeouts[item.id] = setTimeout(() => {
          checkParcelId(item.id, item.parcel_id);
        }, 500); // 500ms delay
      }
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [sideDeductionItems.map(item => item.parcel_id).join(',')]);

  // Fetch SKU images when SKUs change
  useEffect(() => {
    const timeouts: Record<string, NodeJS.Timeout> = {};
    
    sideDeductionItems.forEach(item => {
      if (item.product_sku) {
        timeouts[`image-${item.id}`] = setTimeout(() => {
          fetchSkuImage(item.id, item.product_sku);
        }, 300); // 300ms delay
      }
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [sideDeductionItems.map(item => item.product_sku).join(',')]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Side Deductions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {sideDeductionItems.map((item, index) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-lg">Side {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order ID</Label>
                    <Input
                      placeholder="Order ID"
                      value={orderData?.order_id || orderId || ''}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    {skuOptions.length > 0 ? (
                      <Select 
                        value={item.product_sku || ''} 
                        onValueChange={(value) => onUpdateItem(item.id, 'product_sku', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select SKU" />
                        </SelectTrigger>
                        <SelectContent>
                          {skuOptions.map((sku) => (
                            <SelectItem key={sku} value={sku}>
                              {sku}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                        No SKUs available for this order
                      </div>
                    )}
                  </div>

                  {/* SKU Image Display */}
                  {item.product_sku && (
                    <div className="space-y-2">
                      <Label>Product Image</Label>
                      <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted">
                        {loadingImages[item.id] ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          </div>
                        ) : skuImages[item.id] ? (
                          <img
                            src={skuImages[item.id]}
                            alt={item.product_sku}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Parcel ID</Label>
                    <Input
                      placeholder="e.g., PAR-001"
                      value={item.parcel_id || ''}
                      onChange={(e) => onUpdateItem(item.id, 'parcel_id', e.target.value)}
                      className={parcelValidations[item.id]?.loading ? 'animate-pulse' : ''}
                    />
                    
                    {/* Parcel ID Validation Status */}
                    {parcelValidations[item.id]?.loading && (
                      <div className="text-sm text-muted-foreground">Checking parcel ID...</div>
                    )}
                    {!parcelValidations[item.id]?.loading && item.parcel_id && (
                      <div className={`text-sm ${parcelValidations[item.id]?.exists ? 'text-green-600' : 'text-red-600'}`}>
                        {parcelValidations[item.id]?.exists ? '✓ Parcel ID found' : '✗ Parcel ID not found'}
                        {parcelValidations[item.id]?.details && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {parcelValidations[item.id]?.details.parcel_name} - {parcelValidations[item.id]?.details.total_carat}ct
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>CT Weight</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.25"
                      value={item.ct_weight || ''}
                      onChange={(e) => onUpdateItem(item.id, 'ct_weight', e.target.value)}
                      onBlur={(e) => {
                        const numericValue = parseFloat(e.target.value) || 0;
                        onUpdateItem(item.id, 'ct_weight', numericValue.toString());
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stones</Label>
                    <Input
                      placeholder="e.g., 1"
                      value={item.stones || ''}
                      onChange={(e) => onUpdateItem(item.id, 'stones', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Comments</Label>
                    <Textarea
                      placeholder="Additional notes about the deduction..."
                      value={item.comments || ''}
                      onChange={(e) => onUpdateItem(item.id, 'comments', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                
                {sideDeductionItems.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-center">
            <Button onClick={onAddItem} variant="outline" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              Add Side
            </Button>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Side Deductions'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
