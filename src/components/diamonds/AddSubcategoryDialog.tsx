import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderPlus, Save, X } from "lucide-react";
import { DiamondInventory } from "@/services/diamonds";
import { useToast } from "@/hooks/use-toast";

interface AddSubcategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  parentDiamond: DiamondInventory | null;
  onSubmit: (data: Partial<DiamondInventory>) => Promise<void>;
}

const shapes = ["Round", "Princess", "Oval", "Emerald", "Pear", "Marquise", "Cushion", "Radiant"];
const polishSymmetries = ["EX/EX", "EX/VG", "VG/EX", "VG/VG", "G/EX", "G/VG", "F/EX", "F/VG"];
const girdles = ["Thin", "Thin to Medium", "Medium", "Medium to Slightly Thick", "Slightly Thick", "Thick"];
const fluorescences = ["None", "Faint", "Medium", "Strong", "Very Strong"];
const culetSizes = ["None", "Very Small", "Small", "Medium", "Large"];
const certificateTypes = ["GIA", "IGI", "AGS", "EGL", "HRD", "Other"];

export function AddSubcategoryDialog({
  isOpen,
  onOpenChange,
  parentDiamond,
  onSubmit
}: AddSubcategoryDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<DiamondInventory>>({
    parcel_name: '',
    total_carat: 0,
    number_of_stones: 1,
    pct: 0,
    price_per_ct: 0,
    ws_price_per_ct: 0,
    carat_category: '',
    color: 'D',
    shape: 'Round',
    clarity: 'VS1',
    polish_symmetry: 'VG/VG',
    table_width: 58.0,
    depth: 62.0,
    girdle: 'Medium',
    fluorescence: 'None',
    culet: 'None',
    mm: 6.5,
    certificate_type: 'GIA',
    comments: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (parentDiamond) {
      // Pre-fill some fields based on parent diamond
      setFormData(prev => ({
        ...prev,
        color: parentDiamond.color,
        shape: parentDiamond.shape,
        clarity: parentDiamond.clarity,
        polish_symmetry: parentDiamond.polish_symmetry,
        table_width: parentDiamond.table_width,
        depth: parentDiamond.depth,
        girdle: parentDiamond.girdle,
        fluorescence: parentDiamond.fluorescence,
        culet: parentDiamond.culet,
        certificate_type: parentDiamond.certificate_type,
        price_per_ct: parentDiamond.price_per_ct,
        ws_price_per_ct: parentDiamond.ws_price_per_ct
      }));
    }
  }, [parentDiamond]);

  const handleInputChange = (field: keyof DiamondInventory, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentDiamond) return;

    if (!formData.parcel_name || !formData.total_carat || !formData.number_of_stones) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Generate a unique parcel_id for the subcategory
      const subcategoryParcelId = `SUB-${parentDiamond.parcel_id}-${Date.now()}`;
      
      const subcategoryData = {
        ...formData,
        parcel_id: subcategoryParcelId,
        parent_parcel_id: parentDiamond.parcel_id,
        is_parent: false,
        days_active: 0,
        is_editable: true
      };

      await onSubmit(subcategoryData);
      toast({
        title: "Success",
        description: "Subcategory created successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      toast({
        title: "Error",
        description: "Failed to create subcategory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!parentDiamond) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            Add Subcategory to {parentDiamond.parcel_name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="parcel_name">Parcel Name *</Label>
                  <Input
                    id="parcel_name"
                    value={formData.parcel_name || ''}
                    onChange={(e) => handleInputChange('parcel_name', e.target.value)}
                    placeholder="e.g., Premium Round A"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total_carat">Total Carat *</Label>
                  <Input
                    id="total_carat"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.total_carat || ''}
                    onChange={(e) => handleInputChange('total_carat', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_stones">Number of Stones *</Label>
                  <Input
                    id="number_of_stones"
                    type="number"
                    min="1"
                    value={formData.number_of_stones || ''}
                    onChange={(e) => handleInputChange('number_of_stones', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pct">PCT</Label>
                  <Input
                    id="pct"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.pct || ''}
                    onChange={(e) => handleInputChange('pct', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_ct">Price per CT</Label>
                  <Input
                    id="price_per_ct"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_ct || ''}
                    onChange={(e) => handleInputChange('price_per_ct', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="ws_price_per_ct">WS Price per CT</Label>
                  <Input
                    id="ws_price_per_ct"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ws_price_per_ct || ''}
                    onChange={(e) => handleInputChange('ws_price_per_ct', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="carat_category">Carat Category</Label>
                  <Input
                    id="carat_category"
                    value={formData.carat_category || ''}
                    onChange={(e) => handleInputChange('carat_category', e.target.value)}
                    placeholder="e.g., 1.0-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diamond Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Diamond Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color || ''}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="Enter color (e.g., D, E, F, G, H, I, J, K)"
                  />
                </div>
                <div>
                  <Label htmlFor="shape">Shape</Label>
                  <Select value={formData.shape || ''} onValueChange={(value) => handleInputChange('shape', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shapes.map(shape => (
                        <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="clarity">Clarity</Label>
                  <Input
                    id="clarity"
                    value={formData.clarity || ''}
                    onChange={(e) => handleInputChange('clarity', e.target.value)}
                    placeholder="Enter clarity (e.g., FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2)"
                  />
                </div>
                <div>
                  <Label htmlFor="polish_symmetry">Polish & Symmetry</Label>
                  <Select value={formData.polish_symmetry || ''} onValueChange={(value) => handleInputChange('polish_symmetry', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {polishSymmetries.map(ps => (
                        <SelectItem key={ps} value={ps}>{ps}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="table_width">Table Width (%)</Label>
                  <Input
                    id="table_width"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.table_width || ''}
                    onChange={(e) => handleInputChange('table_width', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="depth">Depth (%)</Label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.depth || ''}
                    onChange={(e) => handleInputChange('depth', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="girdle">Girdle</Label>
                  <Select value={formData.girdle || ''} onValueChange={(value) => handleInputChange('girdle', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {girdles.map(girdle => (
                        <SelectItem key={girdle} value={girdle}>{girdle}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fluorescence">Fluorescence</Label>
                  <Select value={formData.fluorescence || ''} onValueChange={(value) => handleInputChange('fluorescence', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fluorescences.map(fluorescence => (
                        <SelectItem key={fluorescence} value={fluorescence}>{fluorescence}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="culet">Culet</Label>
                  <Select value={formData.culet || ''} onValueChange={(value) => handleInputChange('culet', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {culetSizes.map(culet => (
                        <SelectItem key={culet} value={culet}>{culet}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mm">MM</Label>
                  <Input
                    id="mm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.mm || ''}
                    onChange={(e) => handleInputChange('mm', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="certificate_type">Certificate Type</Label>
                  <Select value={formData.certificate_type || ''} onValueChange={(value) => handleInputChange('certificate_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {certificateTypes.map(cert => (
                        <SelectItem key={cert} value={cert}>{cert}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments || ''}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    rows={3}
                    placeholder="Additional comments about this subcategory..."
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason || ''}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    rows={3}
                    placeholder="Reason for creating this subcategory..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Subcategory'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
