import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Save, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { METAL_TYPES, getMetalTypeColor } from "@/constants/metalTypes";

interface ItemsOrderedSectionProps {
  order: any;
  onRefreshOrder?: () => void;
}

export function ItemsOrderedSection({
  order,
  onRefreshOrder,
}: ItemsOrderedSectionProps) {
  const { toast } = useToast();

  // Use global metal types constant
  const metalTypeOptions = METAL_TYPES.map((type) => ({
    value: type,
    label: type,
    color: getMetalTypeColor(type),
  }));

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: "",
    size: "",
    metal_type: "",
    details: "",
    price: 0,
    qty: 1,
    image: "",
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState({
    sku: "",
    size: "",
    metal_type: "",
    details: "",
    price: 0,
    qty: 1,
    image: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean;
    imageUrl: string;
    imageAlt: string;
  }>({
    isOpen: false,
    imageUrl: "",
    imageAlt: "",
  });

  const handleAddItem = async () => {
    if (!newItem.sku.trim() || newItem.price <= 0) {
      toast({
        title: "Error",
        description: "Please fill in SKU and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData = {
        order_id: order.id,
        sku: newItem.sku.trim(),
        size: newItem.size.trim(),
        metal_type: newItem.metal_type.trim(),
        details: newItem.details.trim(),
        price: newItem.price,
        qty: newItem.qty,
        image: newItem.image,
      };

      const { orderService } = await import("@/services/orders");
      await orderService.createOrderItem(order.id, itemData);

      toast({
        title: "Success",
        description: "Item added successfully",
      });

      setNewItem({
        sku: "",
        size: "",
        metal_type: "",
        details: "",
        price: 0,
        qty: 1,
        image: "",
      });
      setIsAddingItem(false);

      if (onRefreshOrder) {
        onRefreshOrder();
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditingItem({
      sku: item.sku || "",
      size: item.size || "",
      metal_type: item.metal_type || "",
      details: item.details || "",
      price: item.price || 0,
      qty: item.qty || 1,
      image: item.image || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem.sku.trim() || editingItem.price <= 0) {
      toast({
        title: "Error",
        description: "Please fill in SKU and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData = {
        sku: editingItem.sku.trim(),
        size: editingItem.size.trim(),
        metal_type: editingItem.metal_type.trim(),
        details: editingItem.details.trim(),
        price: editingItem.price,
        qty: editingItem.qty,
        image: editingItem.image,
      };

      const { orderService } = await import("@/services/orders");
      await orderService.updateOrderItem(editingItemId!, itemData);

      toast({
        title: "Success",
        description: "Item updated successfully",
      });

      setEditingItemId(null);
      setEditingItem({
        sku: "",
        size: "",
        metal_type: "",
        details: "",
        price: 0,
        qty: 1,
        image: "",
      });
      setIsEditModalOpen(false);

      if (onRefreshOrder) {
        onRefreshOrder();
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { orderService } = await import("@/services/orders");
      await orderService.deleteOrderItem(itemId);

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      if (onRefreshOrder) {
        onRefreshOrder();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleCancelItemEdit = () => {
    setEditingItemId(null);
    setEditingItem({
      sku: "",
      size: "",
      metal_type: "",
      details: "",
      price: 0,
      qty: 1,
      image: "",
    });
    setIsEditModalOpen(false);
  };

  const handleImagePreview = (imageUrl: string, imageAlt: string) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      imageAlt,
    });
  };

  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
      imageAlt: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Items Ordered</CardTitle>
          <Button onClick={() => setIsAddingItem(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add New Item Form */}
        {isAddingItem && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-4">Add New Item</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  placeholder="Product SKU"
                  value={newItem.sku}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, sku: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Size</Label>
                <Input
                  placeholder="Product size"
                  value={newItem.size}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, size: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Metal Type</Label>
                <Select
                  value={newItem.metal_type}
                  onValueChange={(value) =>
                    setNewItem((prev) => ({ ...prev, metal_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {metalTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Details</Label>
                <Input
                  placeholder="Product details"
                  value={newItem.details}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, details: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={newItem.qty}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      qty: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="mt-4">
              <Label className="block mb-2">Product Image</Label>
              <ImageUpload
                value={newItem.image}
                onChange={(imageUrl) =>
                  setNewItem((prev) => ({ ...prev, image: imageUrl }))
                }
                placeholder="Upload product image"
                className="w-32"
                orderId={order.id}
                sku={newItem.sku}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {order.order_items && order.order_items.length > 0 ? (
            <>
              {order.order_items.map((item: any, index: number) => (
                <div
                  key={item.id || index}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 flex-shrink-0">
                      {item.image ? (
                        <button
                          onClick={() =>
                            handleImagePreview(item.image, item.sku)
                          }
                          className="w-full h-full hover:opacity-80 transition-opacity cursor-pointer group relative"
                          title="Click to preview image"
                        >
                          <img
                            src={item.image}
                            alt={item.sku}
                            className="w-full h-full object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="font-semibold text-lg">
                            {item.sku}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {item.size && (
                              <span className="bg-muted px-2 py-1 rounded text-xs">
                                Size: {item.size}
                              </span>
                            )}
                            {item.metal_type && (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getMetalTypeColor(
                                  item.metal_type
                                )}`}
                              >
                                {item.metal_type}
                              </span>
                            )}
                          </div>
                          {item.details && (
                            <div className="text-sm text-muted-foreground">
                              {item.details}
                            </div>
                          )}
                        </div>

                        {/* Price and Actions */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold">
                              ${item.price?.toFixed(2) || "0.00"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.qty || 1}
                            </div>
                            <div className="text-sm font-medium text-primary">
                              Total: $
                              {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              className="h-9"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total Amount Summary */}
              <div className="border-t pt-4 mt-6">
                <div className="flex justify-end">
                  <div className="bg-muted/50 rounded-lg p-4 min-w-[300px]">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          Subtotal ({order.order_items.length} item
                          {order.order_items.length !== 1 ? "s" : ""}):
                        </span>
                        <span className="font-medium">
                          $
                          {order.order_items
                            .reduce(
                              (sum: number, item: any) =>
                                sum + (item.price || 0) * (item.qty || 1),
                              0
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                      {/* Discount Line (uses orders.discount_amount) */}
                      {(Number(order.discount_amount) !== 0) && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="font-medium text-destructive">-
                            ${Math.abs(Number(order.discount_amount)).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                        <span>Total Amount:</span>
                        <span className="text-primary">
                          $
                          {(
                            order.order_items.reduce(
                              (sum: number, item: any) => sum + (item.price || 0) * (item.qty || 1),
                              0
                            ) - (Number(order.discount_amount) || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-lg font-medium">No items in this order</div>
              <div className="text-sm">Add items to get started</div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        onClose={closeImagePreview}
        imageUrl={imagePreview.imageUrl}
        imageAlt={imagePreview.imageAlt}
      />

      {/* Edit Item Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Product Image</Label>
              <div className="flex items-center gap-4">
                <ImageUpload
                  value={editingItem.image}
                  onChange={(imageUrl) =>
                    setEditingItem((prev) => ({ ...prev, image: imageUrl }))
                  }
                  placeholder="Upload product image"
                  className="w-24 h-24"
                  orderId={order.id}
                  sku={editingItem.sku}
                />
                <div className="text-sm text-muted-foreground">
                  Click to upload or drag and drop an image
                </div>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">SKU *</Label>
                <Input
                  placeholder="Enter product SKU"
                  value={editingItem.sku}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Size</Label>
                <Input
                  placeholder="Enter product size"
                  value={editingItem.size}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      size: e.target.value,
                    }))
                  }
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Metal Type</Label>
                <Select
                  value={editingItem.metal_type}
                  onValueChange={(value) =>
                    setEditingItem((prev) => ({ ...prev, metal_type: value }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select metal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {metalTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editingItem.price}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={editingItem.qty}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      qty: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="h-10"
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Additional Details</Label>
              <Input
                placeholder="Enter any additional product details"
                value={editingItem.details}
                onChange={(e) =>
                  setEditingItem((prev) => ({
                    ...prev,
                    details: e.target.value,
                  }))
                }
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelItemEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} className="min-w-[100px]">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
