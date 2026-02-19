import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { METAL_TYPES } from "@/constants/metalTypes";

export interface CastingProductData {
  id?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  model_number?: string;
  style_number?: string;
  quantity: number;
  size: string;
  metal_type: string;
  comments?: string;
  isSelected?: boolean;
}

interface CastingProductRowProps {
  product: CastingProductData;
  onUpdate: (product: CastingProductData) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  isEditing?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function CastingProductRow({
  product,
  onUpdate,
  onDelete,
  onSelect,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
}: CastingProductRowProps) {
  const [formData, setFormData] = useState<CastingProductData>(product);

  const handleInputChange = (
    field: keyof CastingProductData,
    value: string | number | boolean
  ) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const handleSave = () => {
    if (onSave && product.id) {
      onSave(product.id);
    }
  };

  const handleCancel = () => {
    setFormData(product);
    if (onCancel && product.id) {
      onCancel(product.id);
    }
  };

  const handleDelete = () => {
    if (product.id) {
      onDelete(product.id);
    }
  };

  return (
    <tr className="border-b hover:bg-muted/50">
      {/* Products Column */}
      <td className="p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={product.isSelected || false}
            onCheckedChange={(checked) => {
              if (product.id) {
                onSelect(product.id, checked as boolean);
              }
            }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {formData.quantity.toFixed(4)} x {formData.product_name}
            </span>
            <div className="w-48 h-48 bg-muted rounded border flex items-center justify-center">
              {formData.product_image ? (
                <img
                  src={formData.product_image}
                  alt={formData.product_name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="text-muted-foreground text-sm">📷</div>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Product ID Column */}
      <td className="p-3">
        <Input
          value={formData.product_id}
          onChange={(e) => handleInputChange("product_id", e.target.value)}
          placeholder="Product ID"
          className="w-full"
          disabled={!isEditing}
        />
      </td>

      {/* Model Number Column */}
      <td className="p-3">
        <Input
          value={formData.model_number || ""}
          onChange={(e) => handleInputChange("model_number", e.target.value)}
          placeholder="Model Number"
          className="w-full"
          disabled={!isEditing}
        />
      </td>

      {/* Style Number Column */}
      <td className="p-3">
        <Input
          value={formData.style_number || ""}
          onChange={(e) => handleInputChange("style_number", e.target.value)}
          placeholder="Style Number"
          className="w-full"
          disabled={!isEditing}
        />
      </td>

      {/* Size Column */}
      <td className="p-3">
        <Input
          value={formData.size}
          onChange={(e) => handleInputChange("size", e.target.value)}
          placeholder="Size"
          className="w-full"
          disabled={!isEditing}
          required
        />
      </td>

      {/* Metal Type Column */}
      <td className="p-3">
        <select
          value={formData.metal_type}
          onChange={(e) => handleInputChange("metal_type", e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          disabled={!isEditing}
          required
        >
          <option value="">Select Metal Type</option>
          {METAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </td>

      {/* Comments Column */}
      <td className="p-3">
        <Textarea
          value={formData.comments || ""}
          onChange={(e) => handleInputChange("comments", e.target.value)}
          placeholder="Comments"
          className="w-full min-h-[60px] resize-none"
          disabled={!isEditing}
        />
      </td>

      {/* Actions Column */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(product.id!)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
