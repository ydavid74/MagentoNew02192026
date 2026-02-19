import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Diamond, Plus, X } from "lucide-react";
import { DiamondInventory } from "@/services/diamonds";
import { useToast } from "@/hooks/use-toast";

interface AddDiamondDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    newDiamond: Omit<DiamondInventory, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  parentParcels?: DiamondInventory[];
}

const shapes = [
  "Round",
  "Princess",
  "Oval",
  "Emerald",
  "Pear",
  "Marquise",
  "Cushion",
  "Radiant",
];
const polishSymmetries = ["EX", "VG", "G", "F", "P"];
const fluorescences = ["None", "Faint", "Medium", "Strong"];
const culetSizes = ["None", "Very Small", "Small", "Medium", "Large"];
const certificateTypes = ["GIA", "AGS", "IGI", "EGL", "HRD", "None"];

export function AddDiamondDialog({
  isOpen,
  onOpenChange,
  onSave,
  parentParcels = [],
}: AddDiamondDialogProps) {
  const { toast } = useToast();
  const [parcelType, setParcelType] = useState<"parent" | "sub">("parent");
  const [selectedParentParcel, setSelectedParentParcel] = useState<string>("");
  const [formData, setFormData] = useState<
    Omit<DiamondInventory, "id" | "created_at" | "updated_at">
  >({
    parcel_id: "",
    parent_parcel_id: null,
    parcel_name: "",
    total_carat: 0,
    number_of_stones: 0,
    pct: 0,
    price_per_ct: 0,
    ws_price_per_ct: 0,
    carat_category: "",
    color: "",
    shape: "",
    clarity: "",
    polish_symmetry: "",
    table_width: 0,
    depth: 0,
    girdle: "",
    fluorescence: "",
    culet: "",
    mm: 0,
    certificate_type: "",
    comments: "",
    reason: "",
    days_active: 0,
    is_editable: true,
    is_parent: true,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof DiamondInventory, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.parcel_id ||
      !formData.parcel_name ||
      !formData.total_carat ||
      !formData.number_of_stones ||
      !formData.price_per_ct ||
      !formData.color ||
      !formData.shape ||
      !formData.clarity
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate sub parcel requirements
    if (parcelType === "sub" && !selectedParentParcel) {
      toast({
        title: "Validation Error",
        description: "Please select a parent parcel for sub parcel",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare diamond data based on parcel type
      const diamondData = {
        ...formData,
        is_parent: parcelType === "parent",
        parent_parcel_id: parcelType === "sub" ? selectedParentParcel : null,
      };

      await onSave(diamondData);
      toast({
        title: "Success",
        description: `${
          parcelType === "parent" ? "Parent" : "Sub"
        } parcel added successfully`,
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        parcel_id: "",
        parent_parcel_id: null,
        parcel_name: "",
        total_carat: 0,
        number_of_stones: 0,
        pct: 0,
        price_per_ct: 0,
        ws_price_per_ct: 0,
        carat_category: "",
        color: "",
        shape: "",
        clarity: "",
        polish_symmetry: "",
        table_width: 0,
        depth: 0,
        girdle: "",
        fluorescence: "",
        culet: "",
        mm: 0,
        certificate_type: "",
        comments: "",
        reason: "",
        days_active: 0,
        is_editable: true,
        is_parent: true,
      });
      setParcelType("parent");
      setSelectedParentParcel("");
    } catch (error) {
      console.error("Error adding diamond:", error);
      toast({
        title: "Error",
        description: "Failed to add diamond",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Add New Diamond to Inventory
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parcel Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="parcel_type" className="text-sm font-medium">
                Parcel Type *
              </Label>
              <Select
                value={parcelType}
                onValueChange={(value: "parent" | "sub") => {
                  setParcelType(value);
                  if (value === "parent") {
                    setSelectedParentParcel("");
                  }
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select parcel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent Parcel</SelectItem>
                  <SelectItem value="sub">Sub Parcel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parent Parcel Selection (only for sub parcels) */}
            {parcelType === "sub" && (
              <div className="space-y-1">
                <Label htmlFor="parent_parcel" className="text-sm font-medium">
                  Parent Parcel *
                </Label>
                <Select
                  value={selectedParentParcel}
                  onValueChange={setSelectedParentParcel}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select parent parcel" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentParcels.map((parcel) => (
                      <SelectItem
                        key={parcel.parcel_id}
                        value={parcel.parcel_id}
                      >
                        {parcel.parcel_name} ({parcel.parcel_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parcel ID */}
            <div className="space-y-1">
              <Label htmlFor="parcel_id" className="text-sm font-medium">
                Parcel ID *
              </Label>
              <Input
                id="parcel_id"
                value={formData.parcel_id}
                onChange={(e) =>
                  handleInputChange("parcel_id", e.target.value)
                }
                placeholder="Enter parcel ID (e.g., 4322)"
                className="h-9"
                required
              />
            </div>

            {/* Parcel Name */}
            <div className="space-y-1">
              <Label htmlFor="parcel_name" className="text-sm font-medium">
                Parcel Name *
              </Label>
              <Input
                id="parcel_name"
                value={formData.parcel_name}
                onChange={(e) =>
                  handleInputChange("parcel_name", e.target.value)
                }
                placeholder="Enter parcel name"
                className="h-9"
                required
              />
            </div>

            {/* Total Carat Weight */}
            <div className="space-y-1">
              <Label htmlFor="total_carat" className="text-sm font-medium">
                Total Carat Weight *
              </Label>
              <Input
                id="total_carat"
                type="number"
                step="0.01"
                value={formData.total_carat || ""}
                onChange={(e) =>
                  handleInputChange(
                    "total_carat",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
                className="h-9"
                required
              />
            </div>

            {/* Number of Stones */}
            <div className="space-y-1">
              <Label htmlFor="number_of_stones" className="text-sm font-medium">
                Number of Stones *
              </Label>
              <Input
                id="number_of_stones"
                type="number"
                value={formData.number_of_stones || ""}
                onChange={(e) =>
                  handleInputChange(
                    "number_of_stones",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
                className="h-9"
                required
              />
            </div>

            {/* Price per Carat */}
            <div className="space-y-1">
              <Label htmlFor="price_per_ct" className="text-sm font-medium">
                Price per Carat *
              </Label>
              <Input
                id="price_per_ct"
                type="number"
                step="0.01"
                value={formData.price_per_ct || ""}
                onChange={(e) =>
                  handleInputChange(
                    "price_per_ct",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
                className="h-9"
                required
              />
            </div>

            {/* Carat Category */}
            <div className="space-y-1">
              <Label htmlFor="carat_category" className="text-sm font-medium">
                Carat Category *
              </Label>
              <Input
                id="carat_category"
                value={formData.carat_category}
                onChange={(e) =>
                  handleInputChange("carat_category", e.target.value)
                }
                placeholder="Enter carat category"
                className="h-9"
                required
              />
            </div>

            {/* Color */}
            <div className="space-y-1">
              <Label htmlFor="color" className="text-sm font-medium">
                Color *
              </Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) =>
                  handleInputChange("color", e.target.value)
                }
                placeholder="Enter color (e.g., D, E, F, G, H, I, J, K)"
                className="h-9"
                required
              />
            </div>

            {/* Clarity */}
            <div className="space-y-1">
              <Label htmlFor="clarity" className="text-sm font-medium">
                Clarity *
              </Label>
              <Input
                id="clarity"
                value={formData.clarity}
                onChange={(e) =>
                  handleInputChange("clarity", e.target.value)
                }
                placeholder="Enter clarity (e.g., FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2)"
                className="h-9"
                required
              />
            </div>

            {/* Shape */}
            <div className="space-y-1">
              <Label htmlFor="shape" className="text-sm font-medium">
                Shape *
              </Label>
              <Select
                value={formData.shape}
                onValueChange={(value) => handleInputChange("shape", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {shapes.map((shape) => (
                    <SelectItem key={shape} value={shape}>
                      {shape}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comments - Full Width */}
          <div className="space-y-1">
            <Label htmlFor="comments" className="text-sm font-medium">
              Comments
            </Label>
            <Textarea
              id="comments"
              value={formData.comments || ""}
              onChange={(e) => handleInputChange("comments", e.target.value)}
              placeholder="Enter any additional comments..."
              rows={2}
              className="resize-none"
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
              <Diamond className="h-4 w-4 mr-2" />
              {loading ? "Adding..." : "Add Diamond"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
