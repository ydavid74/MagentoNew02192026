import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { DiamondDeduction } from "@/services/diamondDeductions";
import { skuImageService } from "@/services/skuImages";

interface ManualDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manualDeduction: DiamondDeduction;
  setManualDeduction: (deduction: DiamondDeduction | ((prev: DiamondDeduction) => DiamondDeduction)) => void;
  skuOptions: string[];
  onSubmit: () => void;
  onCancel: () => void;
  orderId?: string;
}

export function ManualDeductionDialog({
  open,
  onOpenChange,
  manualDeduction,
  setManualDeduction,
  skuOptions,
  onSubmit,
  onCancel,
  orderId
}: ManualDeductionDialogProps) {
  const [skuImage, setSkuImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Fetch image when SKU changes
  useEffect(() => {
    const fetchSkuImage = async () => {
      if (!manualDeduction.product_sku) {
        setSkuImage(null);
        return;
      }

      setIsLoadingImage(true);
      try {
        const imageUrl = await skuImageService.getImageBySku(manualDeduction.product_sku, orderId);
        setSkuImage(imageUrl);
      } catch (error) {
        console.error('Error fetching SKU image:', error);
        setSkuImage(null);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchSkuImage();
  }, [manualDeduction.product_sku, orderId]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Deduction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU *</Label>
              {skuOptions.length > 0 ? (
                <Select 
                  value={manualDeduction.product_sku || ''} 
                  onValueChange={(value) => setManualDeduction(prev => ({ ...prev, product_sku: value }))}
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
            {manualDeduction.product_sku && (
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                  {isLoadingImage ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : skuImage ? (
                    <img
                      src={skuImage}
                      alt={manualDeduction.product_sku}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>CT Weight *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 1.25"
                value={manualDeduction.ct_weight || ''}
                onChange={(e) => setManualDeduction(prev => ({ ...prev, ct_weight: e.target.value as any }))}
                onBlur={(e) => {
                  const numericValue = parseFloat(e.target.value) || 0;
                  setManualDeduction(prev => ({ ...prev, ct_weight: numericValue }));
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Number of Stones</Label>
              <Input
                placeholder="e.g., 1"
                value={manualDeduction.stones || ''}
                onChange={(e) => setManualDeduction(prev => ({ ...prev, stones: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Price per CT</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g., 100.00"
                value={manualDeduction.price_per_ct || ''}
                onChange={(e) => setManualDeduction(prev => ({ ...prev, price_per_ct: e.target.value as any }))}
                onBlur={(e) => {
                  const numericValue = parseFloat(e.target.value) || 0;
                  setManualDeduction(prev => ({ ...prev, price_per_ct: numericValue }));
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Reduce Type</Label>
               <Select 
                 value={manualDeduction.type || ''} 
                 onValueChange={(value) => setManualDeduction(prev => ({ ...prev, type: value as 'center' | 'side' | 'manual' }))}
               >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="side">Side</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {manualDeduction.type === 'center' && (
              <div className="space-y-2">
                <Label>MM</Label>
                <Input
                  placeholder="e.g., 6.5"
                  value={manualDeduction.mm || ''}
                  onChange={(e) => setManualDeduction(prev => ({ ...prev, mm: e.target.value }))}
                />
              </div>
            )}
          </div>
          
           <div className="space-y-2">
             <Label>Comments</Label>
             <Textarea
               placeholder="Add any additional comments..."
               value={manualDeduction.comments || ''}
               onChange={(e) => setManualDeduction(prev => ({ ...prev, comments: e.target.value }))}
               rows={3}
             />
           </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              Add Deduction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
