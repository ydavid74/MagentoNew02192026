import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiamondDeduction } from "@/services/diamondDeductions";
import { skuImageService } from "@/services/skuImages";
import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

interface CenterDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDeduction: DiamondDeduction;
  setCurrentDeduction: (deduction: DiamondDeduction | ((prev: DiamondDeduction) => DiamondDeduction)) => void;
  skuOptions: string[];
  parcelValidation: { exists: boolean; loading: boolean; details?: any };
  onSave: () => void;
  onCancel: () => void;
  orderId?: string;
  isSubmitting?: boolean;
}

export function CenterDeductionDialog({
  open,
  onOpenChange,
  currentDeduction,
  setCurrentDeduction,
  skuOptions,
  parcelValidation,
  onSave,
  onCancel,
  orderId,
  isSubmitting = false
}: CenterDeductionDialogProps) {
  const [skuImage, setSkuImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Fetch image when SKU changes
  useEffect(() => {
    const fetchSkuImage = async () => {
      if (!currentDeduction.product_sku) {
        setSkuImage(null);
        return;
      }

      setIsLoadingImage(true);
      try {
        const imageUrl = await skuImageService.getImageBySku(currentDeduction.product_sku, orderId);
        setSkuImage(imageUrl);
      } catch (error) {
        console.error('Error fetching SKU image:', error);
        setSkuImage(null);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchSkuImage();
  }, [currentDeduction.product_sku, orderId]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Center Deduction</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              {skuOptions.length > 0 ? (
                <Select 
                  value={currentDeduction.product_sku || ''} 
                  onValueChange={(value) => setCurrentDeduction(prev => ({ ...prev, product_sku: value }))}
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
            {currentDeduction.product_sku && (
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
                      alt={currentDeduction.product_sku}
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
              <Label>Parcel ID</Label>
              <Input
                placeholder="e.g., PAR-001"
                value={currentDeduction.parcel_id || ''}
                onChange={(e) => {
                  console.log('Input changed:', e.target.value);
                  setCurrentDeduction(prev => {
                    const updated = { ...prev, parcel_id: e.target.value };
                    console.log('Updated currentDeduction:', updated);
                    return updated;
                  });
                }}
                className={parcelValidation.loading ? 'animate-pulse' : ''}
              />
              
              {/* Parcel ID Validation Status */}
              {parcelValidation.loading && (
                <div className="text-sm text-muted-foreground">Checking parcel ID...</div>
              )}
              {!parcelValidation.loading && currentDeduction.parcel_id && (
                <div className={`text-sm ${parcelValidation.exists ? 'text-green-600' : 'text-red-600'}`}>
                  {parcelValidation.exists ? '✓ Parcel ID found' : '✗ Parcel ID not found'}
                  {parcelValidation.details && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {parcelValidation.details.parcel_name} - {parcelValidation.details.total_carat}ct
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
                value={currentDeduction.ct_weight || ''}
                onChange={(e) => setCurrentDeduction(prev => ({ ...prev, ct_weight: e.target.value as any }))}
                onBlur={(e) => {
                  const numericValue = parseFloat(e.target.value) || 0;
                  setCurrentDeduction(prev => ({ ...prev, ct_weight: numericValue }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Stones</Label>
              <Input
                placeholder="e.g., 1"
                value={currentDeduction.stones || ''}
                onChange={(e) => setCurrentDeduction(prev => ({ ...prev, stones: e.target.value }))}
              />
            </div>



            <div className="space-y-2">
              <Label>MM</Label>
              <Input
                placeholder="e.g., 6.5"
                value={currentDeduction.mm || ''}
                onChange={(e) => setCurrentDeduction(prev => ({ ...prev, mm: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea
              placeholder="Add any additional comments..."
                              value={currentDeduction.comments || ''}
                onChange={(e) => setCurrentDeduction(prev => ({ ...prev, comments: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Deduction'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
