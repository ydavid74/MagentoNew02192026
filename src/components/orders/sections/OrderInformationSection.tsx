import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  History,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  orderVerificationService,
  OrderVerification,
} from "@/services/orderVerification";
import {
  orderCustomerNotesService,
  OrderCustomerNoteWithProfile,
} from "@/services/orderCustomerNotes";
import { VerificationModal } from "../modals/VerificationModal";
import {
  VerificationHistoryModal,
  VerificationHistoryModalRef,
} from "../modals/VerificationHistoryModal";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
  { value: "ready", label: "Ready" },
  // PrimeStyle specific statuses
  { value: "Casting Order", label: "Casting Order" },
  { value: "Casting Order Email Sent", label: "Casting Order Email Sent" },
  { value: "Casting Received", label: "Casting Received" },
  {
    value: "Casting Received Email Sent",
    label: "Casting Received Email Sent",
  },
  { value: "Polishing & Finishing", label: "Polishing & Finishing" },
  {
    value: "Polishing & Finishing Email Sent",
    label: "Polishing & Finishing Email Sent",
  },
  {
    value: "Return For Refund Instructions",
    label: "Return For Refund Instructions",
  },
  {
    value: "Return For Refund Instructions Email Sent",
    label: "Return For Refund Instructions Email Sent",
  },
  {
    value: "Return for replacement instructions",
    label: "Return for replacement instructions",
  },
  {
    value: "Return for replacement instructions Email Sent",
    label: "Return for replacement instructions Email Sent",
  },
  { value: "Return For Refund Received", label: "Return For Refund Received" },
  {
    value: "Return For Refund Received Email Sent",
    label: "Return For Refund Received Email Sent",
  },
  {
    value: "Return for replacement received",
    label: "Return for replacement received",
  },
  {
    value: "Return for replacement received Email Sent",
    label: "Return for replacement received Email Sent",
  },
  { value: "Item Shipped", label: "Item Shipped" },
  { value: "Item Shipped Email Sent", label: "Item Shipped Email Sent" },
  {
    value: "Casting Order Delay - Jenny",
    label: "Casting Order Delay - Jenny",
  },
  {
    value: "Casting Order Delay - David",
    label: "Casting Order Delay - David",
  },
];

interface OrderInformationSectionProps {
  order: any;
  onUpdateOrder: (data: any) => Promise<void>;
  onRefreshOrder?: () => void;
  navigate: any;
  refreshTrigger?: number;
}

export function OrderInformationSection({
  order,
  onUpdateOrder,
  onRefreshOrder,
  navigate,
  refreshTrigger,
}: OrderInformationSectionProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    purchase_from: "",
    order_date: "",
  });
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountEditData, setAccountEditData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    tax_id: "",
  });
  const [showAllPreviousOrders, setShowAllPreviousOrders] = useState(false);

  // Verification states
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingVerification, setEditingVerification] =
    useState<OrderVerification | null>(null);

  // Customer note status is now handled by the order data itself

  const historyModalRef = useRef<VerificationHistoryModalRef | null>(null);

  // Initialize edit data when order loads
  useEffect(() => {
    if (order) {
      setEditData({
        purchase_from: order.purchase_from || "",
        order_date: order.order_date || "",
      });
      setAccountEditData({
        name: order.customers?.name || "",
        email: order.customers?.email || "",
        phone: order.customers?.phone || "",
        company: order.customers?.company || "",
        tax_id: order.customers?.tax_id || "",
      });
      
      // Debug logging
      console.log("🔍 OrderInformationSection received order:", {
        id: order.id,
        shopify_order_number: order.shopify_order_number,
        latest_customer_note_status: order.latest_customer_note_status,
        has_casting_memo: order.has_casting_memo,
        casting_memo_timestamp: order.casting_memo_timestamp,
        latest_note_timestamp: order.latest_note_timestamp
      });
    }
  }, [order]);

  // Refresh customer note status when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && order?.id) {
      // Status is now handled by the order data itself
    }
  }, [refreshTrigger, order?.id]);

  // Define fetch functions BEFORE useQuery hooks to avoid hoisting issues
  const fetchPreviousOrders = async () => {
    if (!order?.customers?.email) return [];

    try {
      // Use only email address for finding related orders
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id, 
          order_id,
          order_date, 
          total_amount, 
          purchase_from,
          customers!inner(
            email
          )
        `
        )
        .neq("id", order.id)
        .eq("customers.email", order.customers.email)
        .order("order_date", { ascending: false });

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching previous orders:", error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching previous orders:", error);
      return [];
    }
  };

  const handlePreviousOrderClick = (orderId: string) => {
    window.open(`/orders/${orderId}`, "_blank");
  };

  const fetchAllVerifications = async () => {
    if (!order?.id) return [];

    try {
      const verifications = await orderVerificationService.getByOrderId(
        order.id
      );
      return verifications;
    } catch (error) {
      console.error("Error fetching verifications:", error);
      return [];
    }
  };

  // OPTIMIZED: Use React Query for better caching and performance
  const { data: previousOrders = [], isLoading: isLoadingPreviousOrders } = useQuery({
    queryKey: ['previous-orders', order?.customers?.email],
    queryFn: fetchPreviousOrders,
    enabled: !!order?.customers?.email,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: allVerifications = [], isLoading: isLoadingVerification, refetch: refetchVerifications } = useQuery({
    queryKey: ['order-verifications', order?.id],
    queryFn: fetchAllVerifications,
    enabled: !!order?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  const handleEditVerification = (verification: OrderVerification) => {
    setEditingVerification(verification);
    setIsVerificationModalOpen(true);
  };

  const handleVerificationSuccess = (verification?: OrderVerification) => {
    // Refetch verifications using React Query
    refetchVerifications();
    if (onRefreshOrder) {
      onRefreshOrder();
    }
    // Update history modal with specific verification if available
    if (historyModalRef.current && verification) {
      if (editingVerification) {
        // Update existing verification
        historyModalRef.current.updateVerification(verification);
      } else {
        // Add new verification
        historyModalRef.current.addVerification(verification);
      }
    } else if (historyModalRef.current) {
      // Fallback to refresh if no specific verification provided
      historyModalRef.current.refresh();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUserDisplayName = (verification: OrderVerification) => {
    if (verification.profile) {
      return `${verification.profile.first_name} ${verification.profile.last_name}`;
    }
    return "Unknown User";
  };

  const handleSave = async () => {
    try {
      await onUpdateOrder(editData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (order) {
      setEditData({
        purchase_from: order.purchase_from || "",
        order_date: order.order_date || "",
      });
    }
    setIsEditing(false);
  };

  const handleAccountSave = async () => {
    try {
      const customerId = order.customers?.id;
      if (!customerId) {
        toast({ title: "Error", description: "No customer linked to this order", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("customers")
        .update({
          name: accountEditData.name || null,
          email: accountEditData.email || null,
          phone: accountEditData.phone || null,
          company: accountEditData.company || null,
          tax_id: accountEditData.tax_id || null,
        })
        .eq("id", customerId);
      if (error) throw error;
      setIsEditingAccount(false);
      toast({ title: "Success", description: "Account information updated successfully" });
      if (onRefreshOrder) onRefreshOrder();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update account information", variant: "destructive" });
    }
  };

  const handleAccountCancel = () => {
    if (order) {
      setAccountEditData({
        name: order.customers?.name || "",
        email: order.customers?.email || "",
        phone: order.customers?.phone || "",
        company: order.customers?.company || "",
        tax_id: order.customers?.tax_id || "",
      });
    }
    setIsEditingAccount(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Order Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Information</CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-medium">Purchase From:</Label>
              {isEditing ? (
                <Input
                  value={editData.purchase_from}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      purchase_from: e.target.value,
                    }))
                  }
                  className="w-48"
                />
              ) : (
                <span className="text-primary font-medium">
                  {order.purchase_from || "Not specified"}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Order Date:</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.order_date}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      order_date: e.target.value,
                    }))
                  }
                  className="w-48"
                />
              ) : (
                <span>
                  {order.order_date
                    ? new Date(order.order_date).toLocaleDateString()
                    : "Not set"}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Order Status:</Label>
              <StatusBadge status={order.latest_customer_note_status || "pending"} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">
                  Previous Orders{" "}
                  {previousOrders.length > 0 && `(${previousOrders.length})`}:
                </Label>
                {previousOrders.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowAllPreviousOrders(!showAllPreviousOrders)
                    }
                    className="h-6 px-2 text-xs"
                  >
                    {showAllPreviousOrders ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show All
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="text-sm">
                {isLoadingPreviousOrders ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : previousOrders.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                      {(showAllPreviousOrders
                        ? previousOrders
                        : previousOrders.slice(0, 8)
                      ).map((prevOrder) => (
                        <button
                          key={prevOrder.id}
                          onClick={() => handlePreviousOrderClick(prevOrder.id)}
                          className="text-primary hover:text-primary/80 hover:underline cursor-pointer font-medium text-xs p-2 rounded-md border border-border hover:bg-muted/50 transition-colors text-center"
                          title={`Order ${
                            prevOrder.order_id ||
                            `#${prevOrder.id.slice(-8).toUpperCase()}`
                          } - ${
                            prevOrder.order_date
                              ? new Date(
                                  prevOrder.order_date
                                ).toLocaleDateString()
                              : "No date"
                          }`}
                        >
                          {prevOrder.order_id ||
                            `#${prevOrder.id.slice(-8).toUpperCase()}`}
                        </button>
                      ))}
                    </div>
                    {!showAllPreviousOrders && previousOrders.length > 8 && (
                      <div className="text-xs text-muted-foreground text-center">
                        Showing 8 of {previousOrders.length} orders
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {order.customers?.email
                      ? "No previous orders found"
                      : "No customer email"}
                  </span>
                )}
              </div>
            </div>

            {/* Verification Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">
                  Verification{" "}
                  {allVerifications.length > 0 &&
                    `(${allVerifications.length})`}
                  :
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <History className="h-3 w-3 mr-1" />
                    History
                  </Button>
                </div>
              </div>
              <div className="text-sm">
                {isLoadingVerification ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : allVerifications.length > 0 ? (
                  <div className="space-y-3">
                    {/* Show only the latest verification */}
                    {(() => {
                      const latestVerification = allVerifications[0]; // Assuming they're sorted by date descending
                      const isUpdated =
                        latestVerification.updated_at !==
                        latestVerification.created_at;
                      const isNew = !isUpdated; // New verification if not updated

                      return (
                        <div
                          className="border rounded-md p-3 space-y-2"
                          style={{
                            backgroundColor: isNew
                              ? "hsl(var(--success) / 0.1)"
                              : "hsl(var(--destructive) / 0.1)",
                            borderColor: isNew
                              ? "hsl(var(--success) / 0.3)"
                              : "hsl(var(--destructive) / 0.3)",
                          }}
                        >
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {getUserDisplayName(latestVerification)}
                            </span>
                            <span>
                              {formatDate(latestVerification.date_added)}
                            </span>
                          </div>
                          <p
                            className="text-sm whitespace-pre-wrap font-medium"
                            style={{
                              color: isNew
                                ? "hsl(var(--success))"
                                : "hsl(var(--destructive))",
                            }}
                          >
                            {latestVerification.comment}
                          </p>
                          {isUpdated && (
                            <div
                              className="text-xs font-medium"
                              style={{ color: "hsl(var(--destructive))" }}
                            >
                              ⚠ Updated
                            </div>
                          )}
                          {isNew && (
                            <div
                              className="text-xs font-medium"
                              style={{ color: "hsl(var(--success))" }}
                            >
                              ✓ New
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-medium">
                      No verification added yet
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="h-7 px-2 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Account Information</CardTitle>
            {!isEditingAccount && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingAccount(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-medium">Customer ID:</Label>
              <span className="text-primary font-medium">
                {order.customers?.customer_id || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Customer Name:</Label>
              {isEditingAccount ? (
                <Input
                  value={accountEditData.name}
                  onChange={(e) => setAccountEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-48"
                />
              ) : (
                <span className="text-primary font-medium">
                  {order.customers?.name || "Not specified"}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Email:</Label>
              {isEditingAccount ? (
                <Input
                  type="email"
                  value={accountEditData.email}
                  onChange={(e) => setAccountEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-48"
                />
              ) : (
                <span>{order.customers?.email || "Not specified"}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Phone:</Label>
              {isEditingAccount ? (
                <Input
                  value={accountEditData.phone}
                  onChange={(e) => setAccountEditData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-48"
                />
              ) : (
                <span>{order.customers?.phone || "Not specified"}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Company:</Label>
              {isEditingAccount ? (
                <Input
                  value={accountEditData.company}
                  onChange={(e) => setAccountEditData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-48"
                />
              ) : (
                <span>{order.customers?.company || "Not specified"}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <Label className="font-medium">Tax ID:</Label>
              {isEditingAccount ? (
                <Input
                  value={accountEditData.tax_id}
                  onChange={(e) => setAccountEditData(prev => ({ ...prev, tax_id: e.target.value }))}
                  className="w-48"
                />
              ) : (
                <span>{order.customers?.tax_id || "Not specified"}</span>
              )}
            </div>
            {isEditingAccount && (
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" onClick={handleAccountSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleAccountCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => {
          setIsVerificationModalOpen(false);
          setEditingVerification(null);
        }}
        orderId={order.id}
        verification={editingVerification}
        onSuccess={handleVerificationSuccess}
      />

      {/* Verification History Modal */}
      <VerificationHistoryModal
        ref={historyModalRef}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        orderId={order.id}
        onEdit={handleEditVerification}
        onRefresh={handleVerificationSuccess}
      />
    </div>
  );
}
