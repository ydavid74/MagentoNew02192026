import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Search, Plus, Eye, Package, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orderService } from "@/services/orders";
import { CastingOrderList } from "@/components/orders/CastingOrderList";
import { CastingModuleService } from "@/services/castingModule";
// Metal types specific to casting module (matching appraisal popup)
const CASTING_METAL_TYPES = [
  "Silver",
  "14KT White",
  "14KT Rose",
  "14KT Yellow",
  "18KT White",
  "18KT Rose",
  "18KT Yellow",
  "Platinum",
] as const;
import { orderCustomerNotesService } from "@/services/orderCustomerNotes";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Robust helper function to create casting order note with retry logic
async function createCastingOrderNoteWithRetry(
  orderId: string,
  itemCount: number,
  contextUser: any,
  queryClient: any,
  maxRetries = 3
): Promise<void> {
  // Validate order_id is a valid UUID format (not "manual" or empty)
  if (!orderId || orderId === "manual" || orderId.trim() === "") {
    const error = new Error(`Invalid order_id for note creation: ${orderId}`);
    console.error('CastingModulePage: Invalid order_id, cannot create note:', orderId);
    throw error; // Throw instead of return to ensure caller knows it failed
  }

  // UUID validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    const error = new Error(`order_id is not a valid UUID: ${orderId}`);
    console.error('CastingModulePage: order_id is not a valid UUID:', orderId);
    throw error; // Throw instead of return to ensure caller knows it failed
  }

  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get authenticated user - try context first, then supabase
      let authUser = contextUser;
      if (!authUser) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`);
        }
        authUser = authData?.user;
      }

      if (!authUser || !authUser.id) {
        throw new Error('User not authenticated - unable to create customer note');
      }

      // Attempt to create the note with detailed logging
      console.log(`CastingModulePage: Attempting to create note (attempt ${attempt}/${maxRetries}) for order ${orderId}...`, {
        order_id: orderId,
        content: `Casting order created with ${itemCount} item(s)`,
        status: "Casting Order",
        created_by: authUser.id,
      });

      let note;
      try {
        note = await orderCustomerNotesService.create({
          order_id: orderId,
          content: `Casting order created with ${itemCount} item(s)`,
          status: "Casting Order",
          created_by: authUser.id,
        });
      } catch (createError: any) {
        // Log detailed error information
        console.error(`CastingModulePage: Note creation failed (attempt ${attempt}/${maxRetries}):`, {
          error: createError,
          message: createError?.message,
          code: createError?.code,
          details: createError?.details,
          hint: createError?.hint,
          orderId: orderId,
          userId: authUser.id,
        });
        throw createError; // Re-throw to trigger retry
      }

      // Verify the note was created
      if (!note || !note.id) {
        console.error(`CastingModulePage: Note creation returned invalid response:`, note);
        throw new Error('Note creation returned invalid response - no note ID returned');
      }

      console.log(`CastingModulePage: ✅ Note created with ID ${note.id} for order ${orderId}, verifying in database...`, {
        noteId: note.id,
        noteStatus: note.status,
        noteContent: note.content,
        noteCreatedAt: note.created_at,
      });

      // CRITICAL: Wait a moment for database commit to be fully visible
      // This prevents race condition where verification happens before commit is visible
      await new Promise(resolve => setTimeout(resolve, 500));

      // CRITICAL: Verify note exists in DATABASE (not just cache)
      // This ensures the email automation system will find it
      let verificationAttempts = 0;
      const maxVerificationAttempts = 5;
      let noteVerified = false;
      
      while (verificationAttempts < maxVerificationAttempts && !noteVerified) {
        try {
          // Direct database query to verify note exists
          const verifiedNote = await orderCustomerNotesService.getById(note.id);
          
          if (verifiedNote && verifiedNote.id === note.id && verifiedNote.status === "Casting Order") {
            noteVerified = true;
            console.log(`CastingModulePage: ✅ Note verified in database for order ${orderId}`);
            break;
          } else {
            console.warn(`CastingModulePage: Note verification failed (attempt ${verificationAttempts + 1}/${maxVerificationAttempts}): Note exists but status mismatch or missing`);
          }
        } catch (verifyError: any) {
          console.warn(`CastingModulePage: Note verification error (attempt ${verificationAttempts + 1}/${maxVerificationAttempts}):`, verifyError?.message || verifyError);
        }
        
        verificationAttempts++;
        
        if (!noteVerified && verificationAttempts < maxVerificationAttempts) {
          // Wait longer between retries (exponential backoff)
          const delay = Math.min(500 * Math.pow(2, verificationAttempts), 2000);
          console.log(`CastingModulePage: Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // If verification failed, throw error to trigger retry
      if (!noteVerified) {
        throw new Error(`Note created but could not be verified in database after ${maxVerificationAttempts} attempts. Note ID: ${note.id}`);
      }

      // FINAL VERIFICATION: Query all notes for this order to ensure "Casting Order" note exists
      // This is what the email automation system will actually query
      console.log(`CastingModulePage: Performing final verification - querying all notes for order ${orderId}...`);
      let finalVerificationAttempts = 0;
      const maxFinalVerificationAttempts = 3;
      let finalVerificationPassed = false;

      while (finalVerificationAttempts < maxFinalVerificationAttempts && !finalVerificationPassed) {
        try {
          // Query all notes for this order (same query the email automation uses)
          const allNotes = await orderCustomerNotesService.getByOrderId(orderId);
          
          // Check if a "Casting Order" note exists
          const castingOrderNote = allNotes.find((n: any) => n.status === "Casting Order");
          
          if (castingOrderNote) {
            finalVerificationPassed = true;
            console.log(`CastingModulePage: ✅ Final verification passed - "Casting Order" note found in order ${orderId} (Note ID: ${castingOrderNote.id})`);
            break;
          } else {
            console.warn(`CastingModulePage: Final verification failed (attempt ${finalVerificationAttempts + 1}/${maxFinalVerificationAttempts}): No "Casting Order" note found in order notes. Found ${allNotes.length} note(s) total.`);
            if (allNotes.length > 0) {
              console.warn(`CastingModulePage: Existing notes have statuses:`, allNotes.map((n: any) => n.status));
            }
          }
        } catch (finalVerifyError: any) {
          console.warn(`CastingModulePage: Final verification error (attempt ${finalVerificationAttempts + 1}/${maxFinalVerificationAttempts}):`, finalVerifyError?.message || finalVerifyError);
        }

        finalVerificationAttempts++;

        if (!finalVerificationPassed && finalVerificationAttempts < maxFinalVerificationAttempts) {
          const delay = 1000 * finalVerificationAttempts;
          console.log(`CastingModulePage: Waiting ${delay}ms before final verification retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // If final verification failed, throw error to trigger retry
      if (!finalVerificationPassed) {
        throw new Error(`Note created and verified by ID, but final verification failed: No "Casting Order" note found when querying all notes for order ${orderId} after ${maxFinalVerificationAttempts} attempts. Note ID: ${note.id}`);
      }

      // Clear sessionStorage cache for this order to prevent stale data
      // This is CRITICAL because useOrderQuery uses initialData from sessionStorage
      try {
        sessionStorage.removeItem(`orders:${orderId}`);
        // Also clear the list cache
        const listCacheKeys = Object.keys(sessionStorage).filter(key => key.startsWith('orders:list:'));
        listCacheKeys.forEach(key => sessionStorage.removeItem(key));
      } catch (e) {
        console.warn('Failed to clear sessionStorage cache:', e);
      }

      // Force immediate refetch to update UI (after database verification)
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: ['orders', orderId],
          exact: true 
        }),
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      ]);

      console.log(`CastingModulePage: ✅✅✅ ALL VERIFICATIONS PASSED - "Casting Order" note confirmed in database for order ${orderId}`);
      return; // Success - exit retry loop
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors (authentication, validation)
      if (error?.message?.includes('Authentication') || 
          error?.message?.includes('validation') ||
          error?.code === 'PGRST301') {
        console.error('CastingModulePage: Non-retryable error:', error);
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.warn(`CastingModulePage: Note creation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted - log and throw
  console.error('CastingModulePage: Failed to create customer note after', maxRetries, 'attempts:', lastError);
  throw lastError;
}

export function CastingModulePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [searchOrderId, setSearchOrderId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [showOrderList, setShowOrderList] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [castingMemos, setCastingMemos] = useState<any[]>([]);
  const [isCreatingMemo, setIsCreatingMemo] = useState(false);

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    product_id: "",
    product_name: "",
    product_image: "",
    quantity: 1,
    size: "",
    metal_type: "",
    comments: "",
  });

  // Search for order by number
  const handleSearchOrder = async () => {
    if (!searchOrderId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const order = await orderService.getOrderByNumber(searchOrderId.trim());
      if (order) {
        setOrderData(order);
        toast({
          title: "Success",
          description: "Order found",
        });
      } else {
        toast({
          title: "Not Found",
          description: "Order not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching order:", error);
      toast({
        title: "Error",
        description: "Failed to search order",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle creating casting memo from order item
  const handleCreateCastingMemo = async (item: any) => {
    if (!orderData) return;

    const memoData = {
      order_id: orderData.id,
      order_number: orderData.shopify_order_number,
      product_id: item.sku || item.product_id || "",
      product_name: item.name || item.details || "",
      product_image: item.image || "", // Use the correct field name from order items
      quantity: item.quantity || item.qty || 1,
      size: item.size || "", // Pre-fill size if available
      metal_type: item.metal_type || "", // Pre-fill metal type if available
      comments: "",
    };

    setCastingMemos([...castingMemos, { ...memoData, id: Date.now() }]);
    toast({
      title: "Added to Memo",
      description: "Item added to casting memo list",
    });
  };

  // Handle manual form submission
  const handleManualSubmit = () => {
    if (
      !manualForm.product_name ||
      !manualForm.size ||
      !manualForm.metal_type
    ) {
      toast({
        title: "Error",
        description: "Product name, size, and metal type are required",
        variant: "destructive",
      });
      return;
    }

    const memoData = {
      ...manualForm,
      order_id: "manual",
      order_number: "Manual Entry",
      id: Date.now(),
    };

    setCastingMemos([...castingMemos, memoData]);
    setManualForm({
      product_id: "",
      product_name: "",
      product_image: "",
      quantity: 1,
      size: "",
      metal_type: "",
      comments: "",
    });
    setShowAddManual(false);
    toast({
      title: "Added to Memo",
      description: "Manual item added to casting memo list",
    });
  };

  // Handle creating the final casting order
  const handleCreateCastingOrder = async () => {
    if (castingMemos.length === 0) {
      toast({
        title: "Error",
        description: "No items in casting memo list",
        variant: "destructive",
      });
      return;
    }

    // Check if all memos have required fields
    const incompleteMemos = castingMemos.filter(
      (memo) => !memo.size || !memo.metal_type
    );
    if (incompleteMemos.length > 0) {
      toast({
        title: "Error",
        description: "All items must have size and metal type",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingMemo(true);
    try {
      const orderData = {
        order_id: castingMemos[0].order_id,
        order_number: castingMemos[0].order_number,
        status: "draft" as const,
      };

      const memosData = castingMemos.map((memo) => ({
        order_id: memo.order_id,
        order_number: memo.order_number,
        product_id: memo.product_id,
        product_name: memo.product_name,
        product_image: memo.product_image,
        quantity: memo.quantity,
        size: memo.size,
        metal_type: memo.metal_type,
        comments: memo.comments,
      }));

      await CastingModuleService.createCastingOrderWithMemos(
        orderData,
        memosData
      );

      // Create a customer note with "Casting Order" status if it's a real order
      // Use robust retry mechanism to ensure it always succeeds
      // CRITICAL: This note triggers the email automation, so failure must be visible
      if (orderData.order_id !== "manual") {
        try {
          await createCastingOrderNoteWithRetry(
            orderData.order_id,
            memosData.length,
            user,
            queryClient
          );
          console.log(`✅ CastingModulePage: Successfully created and verified "Casting Order" note for order ${orderData.order_id}`);
        } catch (noteError: any) {
          // CRITICAL ERROR: Note creation failed - email will NOT be sent
          const errorMessage = noteError?.message || 'Unknown error';
          console.error(`❌ CastingModulePage: CRITICAL - Failed to create customer note for order ${orderData.order_id} after all retries:`, errorMessage);
          
          // Show prominent error to user with order ID
          toast({
            title: "⚠️ Status Update Failed",
            description: `Order ${orderData.order_number || orderData.order_id}: Failed to create "Casting Order" status. Email will NOT be sent. Please manually update the order status.`,
            variant: "destructive",
            duration: 10000, // Show for 10 seconds
          });
          
          // Also log to console with full details for debugging
          console.error("CastingModulePage: Full error details:", {
            orderId: orderData.order_id,
            orderNumber: orderData.order_number,
            error: noteError,
            stack: noteError?.stack
          });
        }
      }

      setCastingMemos([]);
      setOrderData(null);
      setSearchOrderId("");
      
      toast({
        title: "Success",
        description: "Casting order created successfully",
      });
    } catch (error) {
      console.error("Error creating casting order:", error);
      toast({
        title: "Error",
        description: "Failed to create casting order",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMemo(false);
    }
  };

  // Handle removing item from memo list
  const handleRemoveMemo = (id: number) => {
    setCastingMemos(castingMemos.filter((memo) => memo.id !== id));
  };

  // Handle updating memo item
  const handleUpdateMemo = (id: number, field: string, value: any) => {
    setCastingMemos(
      castingMemos.map((memo) =>
        memo.id === id ? { ...memo, [field]: value } : memo
      )
    );
  };

  if (showOrderList) {
    return <CastingOrderList />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Casting Module</h1>
          <p className="text-muted-foreground">
            Create and manage casting order memos for any order
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowOrderList(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Casting Order List
          </Button>
        </div>
      </div>

      {/* Order Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="w-80">
              <Label htmlFor="order-search">Order Number</Label>
              <Input
                id="order-search"
                placeholder="Enter order number"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchOrder()}
              />
            </div>
            <Button onClick={handleSearchOrder} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddManual(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Manually
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Items - Direct to Table */}
      {orderData &&
        orderData.order_items &&
        orderData.order_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items - {orderData.shopify_order_number}
                <Badge variant="outline">
                  {orderData.order_items.length} item
                  {orderData.order_items.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.order_items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || item.details || "Product"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log(
                                "Image failed to load:",
                                e.currentTarget.src
                              );
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                        <div
                          className="text-muted-foreground text-xs flex items-center justify-center"
                          style={{
                            display: item.image ? "none" : "flex",
                          }}
                        >
                          📷
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.details || item.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {item.sku} | Qty: {item.qty || item.quantity} |
                          Price: ${item.price || "0.00"}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCreateCastingMemo(item)}
                      size="sm"
                      variant="outline"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add to Memo
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Manual Entry Dialog */}
      <Dialog open={showAddManual} onOpenChange={setShowAddManual}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Item Manually
            </DialogTitle>
            <DialogDescription>
              Enter product details manually to add to the casting memo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                value={manualForm.product_name}
                onChange={(e) =>
                  setManualForm({
                    ...manualForm,
                    product_name: e.target.value,
                  })
                }
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="product-id">Product ID</Label>
              <Input
                id="product-id"
                value={manualForm.product_id}
                onChange={(e) =>
                  setManualForm({ ...manualForm, product_id: e.target.value })
                }
                placeholder="Enter product ID/SKU"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={manualForm.quantity}
                onChange={(e) =>
                  setManualForm({
                    ...manualForm,
                    quantity: Number(e.target.value),
                  })
                }
                min="1"
                step="0.0001"
              />
            </div>
            <div>
              <Label htmlFor="size">Size *</Label>
              <Input
                id="size"
                value={manualForm.size}
                onChange={(e) =>
                  setManualForm({ ...manualForm, size: e.target.value })
                }
                placeholder="Enter size"
              />
            </div>
            <div>
              <Label htmlFor="metal-type">Metal Type *</Label>
              <select
                id="metal-type"
                value={manualForm.metal_type}
                onChange={(e) =>
                  setManualForm({ ...manualForm, metal_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Select Metal Type</option>
                {CASTING_METAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="product-image">Product Image</Label>
              <div className="space-y-2">
                <ImageUpload
                  value={manualForm.product_image}
                  onChange={(imageUrl) =>
                    setManualForm({
                      ...manualForm,
                      product_image: imageUrl,
                    })
                  }
                  onRemove={() =>
                    setManualForm({
                      ...manualForm,
                      product_image: "",
                    })
                  }
                  placeholder="Upload product image"
                  orderId={manualForm.product_id || "manual"}
                  sku={manualForm.product_id || "manual"}
                />
                <div className="text-xs text-muted-foreground">
                  Drag & drop an image or click to upload. You can also paste an
                  image URL below.
                </div>
                <Input
                  id="product-image-url"
                  value={manualForm.product_image}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      product_image: e.target.value,
                    })
                  }
                  placeholder="Or enter image URL directly"
                  className="text-xs"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={manualForm.comments}
                onChange={(e) =>
                  setManualForm({ ...manualForm, comments: e.target.value })
                }
                placeholder="Enter any additional comments"
                className="min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddManual(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleManualSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Add to Memo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Casting Memo List */}
      {castingMemos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Casting Memo List
              <Badge variant="outline">
                {castingMemos.length} item{castingMemos.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {castingMemos.map((memo) => (
                <div
                  key={memo.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50"
                >
                  <div className="w-48 h-48 bg-muted rounded border flex items-center justify-center overflow-hidden flex-shrink-0">
                    {memo.product_image ? (
                      <img
                        src={memo.product_image}
                        alt={memo.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                          const nextElement = e.currentTarget
                            .nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="text-muted-foreground text-sm flex items-center justify-center"
                      style={{
                        display: memo.product_image ? "none" : "flex",
                      }}
                    >
                      📷
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Product ID
                      </Label>
                      <Input
                        value={memo.product_id}
                        onChange={(e) =>
                          handleUpdateMemo(
                            memo.id,
                            "product_id",
                            e.target.value
                          )
                        }
                        placeholder="Product ID"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Size *
                      </Label>
                      <Input
                        value={memo.size}
                        onChange={(e) =>
                          handleUpdateMemo(memo.id, "size", e.target.value)
                        }
                        placeholder="Size"
                        className="h-8 text-xs"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Metal Type *
                      </Label>
                      <select
                        value={memo.metal_type}
                        onChange={(e) =>
                          handleUpdateMemo(
                            memo.id,
                            "metal_type",
                            e.target.value
                          )
                        }
                        className="w-full h-8 px-2 text-xs border border-input rounded bg-background"
                        required
                      >
                        <option value="">Select</option>
                        {CASTING_METAL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Comments
                      </Label>
                      <Input
                        value={memo.comments || ""}
                        onChange={(e) =>
                          handleUpdateMemo(memo.id, "comments", e.target.value)
                        }
                        placeholder="Add comments..."
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMemo(memo.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Total: {castingMemos.length} item
                {castingMemos.length !== 1 ? "s" : ""}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCastingMemos([])}
                  size="sm"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleCreateCastingOrder}
                  disabled={isCreatingMemo}
                  size="sm"
                >
                  {isCreatingMemo ? "Creating..." : "Create Casting Order"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!orderData && castingMemos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Ready to Create Casting Memos
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Search for an order above to add items to the casting memo table,
              or add products manually.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
