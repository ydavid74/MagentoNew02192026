import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Diamond, Save, X } from "lucide-react";
import { DiamondInventory } from "@/services/diamonds";
import { useToast } from "@/hooks/use-toast";

interface EditDiamondDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  diamond: DiamondInventory | null;
  onSave: (updatedDiamond: Partial<DiamondInventory>) => Promise<void>;
}

const shapes = ["Round", "Princess", "Oval", "Emerald", "Pear", "Marquise", "Cushion", "Radiant"];

export function EditDiamondDialog({
  isOpen,
  onOpenChange,
  diamond,
  onSave
}: EditDiamondDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<DiamondInventory>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (diamond) {
      setFormData({
        parcel_id: diamond.parcel_id, // Include parcel_id for identification
        parcel_name: diamond.parcel_name,
        total_carat: diamond.total_carat,
        number_of_stones: diamond.number_of_stones,
        price_per_ct: diamond.price_per_ct,
        carat_category: diamond.carat_category,
        color: diamond.color,
        shape: diamond.shape,
        clarity: diamond.clarity,
        reason: diamond.reason
      });
    }
  }, [diamond]);

  const handleInputChange = (field: keyof DiamondInventory, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diamond) return;

    setLoading(true);
    try {
      await onSave(formData);
      toast({
        title: "Success",
        description: "Diamond updated successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating diamond:", error);
      toast({
        title: "Error",
        description: "Failed to update diamond",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!diamond) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Diamond className="h-5 w-5" />
            Edit Diamond: {diamond.parcel_id}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parcel Name */}
            <div className="space-y-2">
              <Label htmlFor="parcel_name">Parcel Name *</Label>
              <Input
                id="parcel_name"
                value={formData.parcel_name || ''}
                onChange={(e) => handleInputChange('parcel_name', e.target.value)}
                placeholder="Enter parcel name"
                required
              />
            </div>

            {/* Total Carat Weight */}
            <div className="space-y-2">
              <Label htmlFor="total_carat">Total Carat Weight *</Label>
              <Input
                id="total_carat"
                type="number"
                step="0.01"
                value={formData.total_carat || ''}
                onChange={(e) => handleInputChange('total_carat', parseFloat(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>

            {/* Number of Stones */}
            <div className="space-y-2">
              <Label htmlFor="number_of_stones">Number of Stones *</Label>
              <Input
                id="number_of_stones"
                type="number"
                value={formData.number_of_stones || ''}
                onChange={(e) => handleInputChange('number_of_stones', parseInt(e.target.value))}
                placeholder="0"
                required
              />
            </div>

            {/* Price per Carat */}
            <div className="space-y-2">
              <Label htmlFor="price_per_ct">Price per Carat *</Label>
              <Input
                id="price_per_ct"
                type="number"
                step="0.01"
                value={formData.price_per_ct || ''}
                onChange={(e) => handleInputChange('price_per_ct', parseFloat(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Enter color (e.g., D, E, F, G, H, I, J, K)"
                required
              />
            </div>

            {/* Clarity */}
            <div className="space-y-2">
              <Label htmlFor="clarity">Clarity *</Label>
              <Input
                id="clarity"
                value={formData.clarity || ''}
                onChange={(e) => handleInputChange('clarity', e.target.value)}
                placeholder="Enter clarity (e.g., FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2)"
                required
              />
            </div>

            {/* Shape */}
            <div className="space-y-2">
              <Label htmlFor="shape">Shape *</Label>
              <Select value={formData.shape || ''} onValueChange={(value) => handleInputChange('shape', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {shapes.map(shape => (
                    <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Carat Category */}
            <div className="space-y-2">
              <Label htmlFor="carat_category">Carat Category *</Label>
              <Input
                id="carat_category"
                value={formData.carat_category || ''}
                onChange={(e) => handleInputChange('carat_category', e.target.value)}
                placeholder="Enter carat category"
                required
              />
            </div>
          </div>

          {/* Reason for Edit */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Edit *</Label>
            <Textarea
              id="reason"
              value={formData.reason || ''}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please provide a reason for editing this diamond..."
              rows={3}
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
