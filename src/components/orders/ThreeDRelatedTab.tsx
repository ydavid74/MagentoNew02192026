import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, Trash2, Plus, Video, Image, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/storage";
import { useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  order3dRelatedService,
  Order3dRelated,
} from "@/services/order3dRelated";
import { supabase } from "@/integrations/supabase/client";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";

interface ThreeDItem {
  id: string;
  addedBy: string;
  imageUrl: string;
  imageName: string;
  comments?: string;
  dateAdded: Date;
}

// Database interface for compatibility
interface DbThreeDItem {
  id: string;
  order_id: string;
  date_added: string;
  added_by: string;
  image_url: string;
  image_name: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export function ThreeDRelatedTab() {
  const { id: orderId } = useParams();
  const { toast } = useToast();
  const [threeDItems, setThreeDItems] = useState<ThreeDItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ThreeDItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ThreeDItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Form state for add/edit - removed addedBy as it will be auto-filled
  const [formData, setFormData] = useState({
    comments: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Load 3D items when component mounts
  useEffect(() => {
    if (orderId) {
      loadThreeDItems();
    }
  }, [orderId]);

  const loadThreeDItems = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      const dbItems = await order3dRelatedService.getByOrderId(orderId);

      // Convert database items to component format
      const convertedItems: ThreeDItem[] = await Promise.all(
        dbItems.map(async (dbItem) => {
          // Get user profile for the added_by field
          let userName = "Unknown User";
          if (dbItem.added_by) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name")
                .eq("user_id", dbItem.added_by)
                .single();

              if (profile) {
                const profileData = profile as any;
                userName =
                  `${profileData.first_name} ${profileData.last_name}`.trim() ||
                  "Unknown User";
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            }
          }

          return {
            id: dbItem.id,
            addedBy: userName,
            imageUrl: dbItem.image_url,
            imageName: dbItem.image_name,
            comments: dbItem.comments,
            dateAdded: new Date(dbItem.date_added),
          };
        })
      );

      setThreeDItems(convertedItems);
    } catch (error) {
      console.error("Error loading 3D items:", error);
      toast({
        title: "Error",
        description: "Failed to load 3D items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedImage(files[0]);
    }
  };

  const handleAddItem = async () => {
    if (!selectedImage) {
      toast({
        title: "Missing information",
        description: "Please select an image",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      // Upload image
      if (selectedImage.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      const timestamp = Date.now();
      const fileExtension = selectedImage.name.split(".").pop();
      const fileName = `3d_${timestamp}_${Math.random()
        .toString(36)
        .substr(2, 9)}.${fileExtension}`;
      const path = `3d-related/${orderId}/${fileName}`;

      const result = await uploadFile(selectedImage, path);
      if (result.error) {
        throw new Error(result.error);
      }

      // Create item in database (added_by will be auto-filled by the service)
      const newDbItem = await order3dRelatedService.create({
        order_id: orderId!,
        image_url: result.url,
        image_name: selectedImage.name,
        comments: formData.comments || undefined,
      });

      // Convert to component format and add to state
      const newItem: ThreeDItem = {
        id: newDbItem.id,
        addedBy: "Current User", // Will be updated when data is reloaded
        imageUrl: newDbItem.image_url,
        imageName: newDbItem.image_name,
        comments: newDbItem.comments,
        dateAdded: new Date(newDbItem.date_added),
      };

      setThreeDItems((prev) => [newItem, ...prev]);
      setShowAddDialog(false);
      resetForm();

      toast({
        title: "Success",
        description: "3D item added successfully",
      });

      // Reload data to get the updated user name
      await loadThreeDItems();
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: "Failed to add 3D item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) {
      toast({
        title: "Missing information",
        description: "Please select an item to edit",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = editingItem.imageUrl;
      let imageName = editingItem.imageName;

      // Upload new image if selected
      if (selectedImage) {
        setIsUploading(true);

        if (selectedImage.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an image smaller than 10MB",
            variant: "destructive",
          });
          return;
        }

        const timestamp = Date.now();
        const fileExtension = selectedImage.name.split(".").pop();
        const fileName = `3d_${timestamp}_${Math.random()
          .toString(36)
          .substr(2, 9)}.${fileExtension}`;
        const path = `3d-related/${orderId}/${fileName}`;

        const result = await uploadFile(selectedImage, path);
        if (result.error) {
          throw new Error(result.error);
        }

        imageUrl = result.url;
        imageName = selectedImage.name;
      }

      // Update item in database
      await order3dRelatedService.update(editingItem.id, {
        image_url: imageUrl,
        image_name: imageName,
        comments: formData.comments || undefined,
      });

      // Update local state
      const updatedItem: ThreeDItem = {
        ...editingItem,
        imageUrl,
        imageName,
        comments: formData.comments || undefined,
      };

      setThreeDItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
      );
      setEditingItem(null);
      resetForm();

      toast({
        title: "Success",
        description: "3D item updated successfully",
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update 3D item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      // Delete from database
      await order3dRelatedService.delete(itemToDelete.id);

      // Update local state
      setThreeDItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete.id)
      );
      setItemToDelete(null);

      toast({
        title: "Success",
        description: "3D item deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting 3D item:", error);
      toast({
        title: "Error",
        description: "Failed to delete 3D item",
        variant: "destructive",
      });
    }
  };

  const startEdit = (item: ThreeDItem) => {
    setEditingItem(item);
    setFormData({
      comments: item.comments || "",
    });
    setSelectedImage(null);
  };

  const resetForm = () => {
    setFormData({
      comments: "",
    });
    setSelectedImage(null);
  };

  const openImagePreview = (imageUrl: string, imageName: string) => {
    // Handle PDF files differently - open in new tab
    if (imageUrl.includes(".pdf")) {
      window.open(imageUrl, "_blank");
      return;
    }

    // For images, use the enhanced preview modal
    setImagePreview({ url: imageUrl, name: imageName });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">3D Related</h1>
          <p className="text-muted-foreground">
            3D models, renders, and design files
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* 3D Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            3D Items ({threeDItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Date Added</th>
                  <th className="text-left p-3 font-medium">Added By</th>
                  <th className="text-left p-3 font-medium">Image</th>
                  <th className="text-left p-3 font-medium">Comments</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {threeDItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="text-sm">
                        {item.dateAdded.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{item.addedBy}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {item.imageUrl.includes(".pdf") ? (
                            <div
                              className="text-xs text-center p-1 cursor-pointer hover:bg-muted/50 transition-colors rounded"
                              onClick={() =>
                                openImagePreview(item.imageUrl, item.imageName)
                              }
                              title="Click to open PDF"
                            >
                              PDF
                            </div>
                          ) : (
                            <img
                              src={item.imageUrl}
                              alt={item.imageName}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() =>
                                openImagePreview(item.imageUrl, item.imageName)
                              }
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground max-w-20 truncate">
                          {item.imageName}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm max-w-xs">
                        {item.comments ? (
                          <div className="truncate" title={item.comments}>
                            {item.comments}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setItemToDelete(item)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading 3D items...</p>
              </div>
            ) : threeDItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No 3D items yet</p>
                <p className="text-sm">
                  Add your first 3D item using the "Add Item" button
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      {(showAddDialog || editingItem) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingItem ? "Edit 3D Item" : "Add New 3D Item"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Image/File Upload {editingItem ? "(Optional)" : "*"}
                </Label>
                <Input
                  type="file"
                  onChange={handleImageSelect}
                  accept="image/*,.pdf,.stl,.obj,.fbx,.dwg"
                  className="max-w-xs"
                />
                {selectedImage && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedImage.name}
                  </div>
                )}
                {editingItem && !selectedImage && (
                  <div className="text-sm text-muted-foreground">
                    Current: {editingItem.imageName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea
                  placeholder="Add any comments or notes about this 3D item..."
                  value={formData.comments || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comments: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingItem ? handleEditItem : handleAddItem}
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting || isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title="Delete 3D Item"
        description={`Are you sure you want to delete this 3D item? This action cannot be undone.`}
        onConfirm={handleDeleteItem}
      />

      {/* Enhanced Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!imagePreview}
        onClose={() => setImagePreview(null)}
        imageUrl={imagePreview?.url || ""}
        imageAlt={imagePreview?.name || ""}
      />
    </div>
  );
}
