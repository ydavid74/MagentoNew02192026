import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, Plus, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { orderCastingService, OrderCasting } from "@/services/orderCasting";
import { useParams } from "react-router-dom";
import { METAL_TYPES } from "@/constants/metalTypes";
import { supabase } from "@/integrations/supabase/client";

interface CastingItem {
  id: string;
  supplier: string;
  dateAdded: Date;
  metalType: string;
  quantity: string;
  weight: number;
  weightUnit: 'g' | 'dwt';
  price: number;
  addedBy: string;
}

export function CastingTab() {
  const { id: orderId } = useParams();
  const { toast } = useToast();
  const [castingItems, setCastingItems] = useState<CastingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeNames, setEmployeeNames] = useState<any>({});
  const [isLoadingNames, setIsLoadingNames] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<CastingItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CastingItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load casting items when component mounts
  useEffect(() => {
    if (orderId) {
      loadCastingItems();
    }
  }, [orderId]);

  // Fetch employee names when casting items change
  useEffect(() => {
    if (castingItems.length > 0) {
      fetchEmployeeNames();
    }
  }, [castingItems]);

  const loadCastingItems = async () => {
    if (!orderId) return;
    
    try {
      setIsLoading(true);
      const dbItems = await orderCastingService.getByOrderId(orderId);
      
      // Convert database items to component format
      const convertedItems: CastingItem[] = dbItems.map(dbItem => ({
        id: dbItem.id,
        supplier: dbItem.supplier,
        dateAdded: new Date(dbItem.date_added),
        metalType: dbItem.metal_type,
        quantity: dbItem.quantity,
        weight: dbItem.weight,
        weightUnit: dbItem.weight_unit as 'g' | 'dwt',
        price: dbItem.price,
        addedBy: dbItem.added_by
      }));
      
      setCastingItems(convertedItems);
    } catch (error) {
      console.error('Error loading casting items:', error);
      toast({
        title: "Error",
        description: "Failed to load casting items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeNames = async () => {
    if (castingItems.length === 0) return;

    setIsLoadingNames(true);
    try {
      // Get unique user IDs from casting items
      const userIds = [...new Set(castingItems.map(item => item.addedBy))];
      
      if (userIds.length === 0) return;
      
      // Fetch profiles for these user IDs
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds as string[]);
        
      if (error) {
        console.error('Error fetching employee profiles:', error);
        return;
      }

      // Create a mapping of user ID to full name
      const nameMap: any = {};
      (profiles as any[])?.forEach((profile: any) => {
        if (profile.first_name && profile.last_name) {
          const fullName = `${profile.first_name} ${profile.last_name}`.trim();
          nameMap[profile.user_id] = fullName;
        } else if (profile.first_name) {
          nameMap[profile.user_id] = profile.first_name;
        } else if (profile.last_name) {
          nameMap[profile.user_id] = profile.last_name;
        } else {
          nameMap[profile.user_id] = 'Unknown Employee';
        }
      });

      setEmployeeNames(nameMap);
    } catch (error) {
      console.error('Error fetching employee names:', error);
    } finally {
      setIsLoadingNames(false);
    }
  };

  // Form state for add/edit
  const [formData, setFormData] = useState({
    supplier: "",
    metalType: "",
    quantity: "",
    weight: "",
    weightUnit: "g" as 'g' | 'dwt',
    price: ""
  });

  // Custom metal types for casting tab (simplified options)
  const metalTypes = ["Silver", "14KT", "18KT", "Platinum"];

  const handleAddItem = async () => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID not found",
        variant: "destructive",
      });
      return;
    }

    if (!formData.supplier.trim() || !formData.metalType || !formData.quantity || !formData.weight || !formData.price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create item in database
      const newDbItem = await orderCastingService.create({
        order_id: orderId,
        supplier: formData.supplier.trim(),
        metal_type: formData.metalType,
        quantity: formData.quantity,
        weight: parseFloat(formData.weight),
        weight_unit: formData.weightUnit,
        price: parseFloat(formData.price)
      });

      // Convert to component format and add to state
      const newItem: CastingItem = {
        id: newDbItem.id,
        supplier: newDbItem.supplier,
        dateAdded: new Date(newDbItem.date_added),
        metalType: newDbItem.metal_type,
        quantity: newDbItem.quantity,
        weight: newDbItem.weight,
        weightUnit: newDbItem.weight_unit as 'g' | 'dwt',
        price: newDbItem.price,
        addedBy: newDbItem.added_by
      };

      setCastingItems(prev => [newItem, ...prev]);
      setShowAddDialog(false);
      resetForm();

      toast({
        title: "Success",
        description: "Casting item added successfully",
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add casting item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !formData.supplier.trim() || !formData.metalType || !formData.quantity || !formData.weight || !formData.price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update item in database
      await orderCastingService.update(editingItem.id, {
        supplier: formData.supplier.trim(),
        metal_type: formData.metalType,
        quantity: formData.quantity,
        weight: parseFloat(formData.weight),
        weight_unit: formData.weightUnit,
        price: parseFloat(formData.price)
      });

      // Update local state
      const updatedItem: CastingItem = {
        ...editingItem,
        supplier: formData.supplier.trim(),
        metalType: formData.metalType,
        quantity: formData.quantity,
        weight: parseFloat(formData.weight),
        weightUnit: formData.weightUnit,
        price: parseFloat(formData.price)
      };

      setCastingItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
      setEditingItem(null);
      resetForm();

      toast({
        title: "Success",
        description: "Casting item updated successfully",
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update casting item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      // Delete from database
      await orderCastingService.delete(itemToDelete.id);
      
      // Update local state
      setCastingItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
      
      toast({
        title: "Success",
        description: "Casting item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting casting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete casting item",
        variant: "destructive",
      });
    }
  };

  const startEdit = (item: CastingItem) => {
    setEditingItem(item);
    setFormData({
      supplier: item.supplier,
      metalType: item.metalType,
      quantity: item.quantity.toString(),
      weight: item.weight.toString(),
      weightUnit: item.weightUnit,
      price: item.price.toString()
    });
  };

  const resetForm = () => {
    setFormData({
      supplier: "",
      metalType: "",
      quantity: "",
      weight: "",
      weightUnit: "g",
      price: ""
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatWeight = (weight: number, unit: 'g' | 'dwt') => {
    return `${weight}${unit}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Casting</h1>
          <p className="text-muted-foreground">Casting materials and inventory</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Manually
        </Button>
      </div>

      {/* Casting Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Casting Items ({castingItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-left p-3 font-medium">Date Added</th>
                  <th className="text-left p-3 font-medium">Metal Type</th>
                  <th className="text-left p-3 font-medium">Quantity</th>
                  <th className="text-left p-3 font-medium">Weight</th>
                  <th className="text-left p-3 font-medium">Price</th>
                  <th className="text-left p-3 font-medium">Added By</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {castingItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{item.supplier}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{item.dateAdded.toLocaleDateString()}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{item.metalType}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{item.quantity}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{formatWeight(item.weight, item.weightUnit)}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">{formatCurrency(item.price)}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">
                        {isLoadingNames ? (
                          <span className="text-muted-foreground">Loading...</span>
                        ) : (
                          employeeNames[item.addedBy] || "Unknown Employee"
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
                <p>Loading casting items...</p>
            </div>
            ) : castingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No casting items yet</p>
                <p className="text-sm">Add your first casting item using the "Add Manually" button</p>
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
                {editingItem ? 'Edit Casting Item' : 'Add New Casting Item'}
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
                <Label>Supplier *</Label>
                <Input
                  placeholder="Enter supplier name"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                />
                </div>
                
              <div className="space-y-2">
                <Label>Metal Type *</Label>
                <Select value={formData.metalType} onValueChange={(value) => setFormData(prev => ({ ...prev, metalType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {metalTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
          </div>
              
              <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    min="0"
                    step="0.01"
              />
            </div>
                
            <div className="space-y-2">
                  <Label>Weight *</Label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    min="0"
                    step="0.1"
              />
            </div>
                
              <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={formData.weightUnit} onValueChange={(value: 'g' | 'dwt') => setFormData(prev => ({ ...prev, weightUnit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="dwt">Pennyweight (dwt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  min="0"
                  step="0.01"
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingItem ? 'Update Item' : 'Add Item'}
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
        title="Delete Casting Item"
        description={`Are you sure you want to delete the casting item from ${itemToDelete?.supplier}? This action cannot be undone.`}
        onConfirm={handleDeleteItem}
      />
    </div>
  );
}
