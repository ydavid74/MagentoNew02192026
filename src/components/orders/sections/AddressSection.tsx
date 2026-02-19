import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddressSectionProps {
  order: any;
  onRefreshOrder?: () => void;
}

// Memoized AddressForm component to prevent unnecessary re-renders
const AddressForm = memo(
  ({
    isEditing,
    addressData,
    setAddressData,
    onSave,
    onCancel,
    title,
    order,
    onBillingAddressChange,
    onShippingAddressChange,
  }: {
    isEditing: boolean;
    addressData: any;
    setAddressData: (data: any) => void;
    onSave: () => void;
    onCancel: () => void;
    title: string;
    order: any;
    onBillingAddressChange: (field: string, value: string) => void;
    onShippingAddressChange: (field: string, value: string) => void;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={
                title.includes("Billing")
                  ? () => onBillingAddressChange("edit", "")
                  : () => onShippingAddressChange("edit", "")
              }
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">
              First Name:
            </Label>
            {isEditing ? (
              <Input
                placeholder="First Name"
                value={addressData.first_name}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("first_name", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.first_name || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">
              Last Name:
            </Label>
            {isEditing ? (
              <Input
                placeholder="Last Name"
                value={addressData.last_name}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("last_name", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.last_name || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">
              Company:
            </Label>
            {isEditing ? (
              <Input
                placeholder="Company"
                value={addressData.company}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("company", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.company || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">
              Street 1:
            </Label>
            {isEditing ? (
              <Input
                placeholder="Street Address"
                value={addressData.street1}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("street1", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.street1 || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">
              Street 2:
            </Label>
            {isEditing ? (
              <Input
                placeholder="Apartment, suite, etc."
                value={addressData.street2}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("street2", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.street2 || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">City:</Label>
            {isEditing ? (
              <Input
                placeholder="City"
                value={addressData.city}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("city", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.city || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">Region:</Label>
            {isEditing ? (
              <Input
                placeholder="State"
                value={addressData.region}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("region", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.region || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">
              Postcode:
            </Label>
            {isEditing ? (
              <Input
                placeholder="ZIP"
                value={addressData.postcode}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("postcode", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.postcode || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">
              Country:
            </Label>
            {isEditing ? (
              <Input
                placeholder="Country"
                value={addressData.country}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("country", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.country || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">Phone:</Label>
            {isEditing ? (
              <Input
                placeholder="Phone"
                value={addressData.phone}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("phone", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.phone || "Not specified"}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-medium min-w-[100px] text-sm">Email:</Label>
            {isEditing ? (
              <Input
                placeholder="Email"
                value={addressData.email}
                onChange={(e) => {
                  const changeHandler = title.includes("Billing")
                    ? onBillingAddressChange
                    : onShippingAddressChange;
                  changeHandler("email", e.target.value);
                }}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            ) : (
              <div className="py-1 px-2 bg-muted rounded-md flex-1 max-w-[300px] text-sm">
                {order[
                  title.toLowerCase().includes("billing")
                    ? "billing_address"
                    : "shipping_address"
                ]?.email || "Not specified"}
              </div>
            )}
          </div>

          {title.includes("Billing") && (
            <div className="flex items-center justify-between">
              <Label className="font-medium min-w-[100px] text-sm">
                How did you hear?
              </Label>
              <Input
                placeholder="Source of information"
                defaultValue={order.how_did_you_hear || ""}
                className="flex-1 max-w-[300px] h-8 text-sm"
              />
            </div>
          )}

          {/* Edit mode buttons */}
          {isEditing && (
            <div className="flex gap-2 pt-2 justify-end">
              <Button onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Address
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
);

export function AddressSection({ order, onRefreshOrder }: AddressSectionProps) {
  const { toast } = useToast();

  // Address editing states
  const [isEditingBillingAddress, setIsEditingBillingAddress] = useState(false);
  const [isEditingShippingAddress, setIsEditingShippingAddress] =
    useState(false);
  const [billingAddressData, setBillingAddressData] = useState({
    first_name: "",
    last_name: "",
    company: "",
    street1: "",
    street2: "",
    city: "",
    region: "",
    postcode: "",
    country: "USA",
    phone: "",
    email: "",
  });
  const [shippingAddressData, setShippingAddressData] = useState({
    first_name: "",
    last_name: "",
    company: "",
    street1: "",
    street2: "",
    city: "",
    region: "",
    postcode: "",
    country: "USA",
    phone: "",
    email: "",
  });

  // Initialize address data when order loads or changes (but not when editing)
  useEffect(() => {
    if (order && !isEditingBillingAddress && !isEditingShippingAddress) {
      setBillingAddressData({
        first_name: order.billing_address?.first_name || "",
        last_name: order.billing_address?.last_name || "",
        company: order.billing_address?.company || "",
        street1: order.billing_address?.street1 || "",
        street2: order.billing_address?.street2 || "",
        city: order.billing_address?.city || "",
        region: order.billing_address?.region || "",
        postcode: order.billing_address?.postcode || "",
        country: order.billing_address?.country || "USA",
        phone: order.billing_address?.phone || "",
        email: order.billing_address?.email || "",
      });

      setShippingAddressData({
        first_name: order.shipping_address?.first_name || "",
        last_name: order.shipping_address?.last_name || "",
        company: order.shipping_address?.company || "",
        street1: order.shipping_address?.street1 || "",
        street2: order.shipping_address?.street2 || "",
        city: order.shipping_address?.city || "",
        region: order.shipping_address?.region || "",
        postcode: order.shipping_address?.postcode || "",
        country: order.shipping_address?.country || "USA",
        phone: order.shipping_address?.phone || "",
        email: order.shipping_address?.email || "",
      });
    }
  }, [order?.id, isEditingBillingAddress, isEditingShippingAddress]);

  // Reset address data when editing is cancelled
  useEffect(() => {
    if (!isEditingBillingAddress && order) {
      setBillingAddressData({
        first_name: order.billing_address?.first_name || "",
        last_name: order.billing_address?.last_name || "",
        company: order.billing_address?.company || "",
        street1: order.billing_address?.street1 || "",
        street2: order.billing_address?.street2 || "",
        city: order.billing_address?.city || "",
        region: order.billing_address?.region || "",
        postcode: order.billing_address?.postcode || "",
        country: order.billing_address?.country || "USA",
        phone: order.billing_address?.phone || "",
        email: order.billing_address?.email || "",
      });
    }
  }, [isEditingBillingAddress, order?.billing_address]);

  useEffect(() => {
    if (!isEditingShippingAddress && order) {
      setShippingAddressData({
        first_name: order.shipping_address?.first_name || "",
        last_name: order.shipping_address?.last_name || "",
        company: order.shipping_address?.company || "",
        street1: order.shipping_address?.street1 || "",
        street2: order.shipping_address?.street2 || "",
        city: order.shipping_address?.city || "",
        region: order.shipping_address?.region || "",
        postcode: order.shipping_address?.postcode || "",
        country: order.shipping_address?.country || "USA",
        phone: order.shipping_address?.phone || "",
        email: order.shipping_address?.email || "",
      });
    }
  }, [isEditingShippingAddress, order?.shipping_address]);

  const handleSaveBillingAddress = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { orderService } = await import("@/services/orders");
      await orderService.upsertBillingAddress(order.id, billingAddressData);

      setIsEditingBillingAddress(false);
      toast({
        title: "Success",
        description: "Billing address saved successfully",
      });

      if (onRefreshOrder) {
        onRefreshOrder();
      }
    } catch (error) {
      console.error("Error saving billing address:", error);
      toast({
        title: "Error",
        description: "Failed to save billing address",
        variant: "destructive",
      });
    }
  }, [order.id, billingAddressData, onRefreshOrder, toast]);

  const handleSaveShippingAddress = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { orderService } = await import("@/services/orders");
      await orderService.upsertShippingAddress(order.id, shippingAddressData);

      setIsEditingShippingAddress(false);
      toast({
        title: "Success",
        description: "Shipping address saved successfully",
      });

      if (onRefreshOrder) {
        onRefreshOrder();
      }
    } catch (error) {
      console.error("Error saving shipping address:", error);
      toast({
        title: "Error",
        description: "Failed to save shipping address",
        variant: "destructive",
      });
    }
  }, [order.id, shippingAddressData, onRefreshOrder, toast]);

  const handleCancelBillingAddress = useCallback(() => {
    setIsEditingBillingAddress(false);
    setBillingAddressData({
      first_name: order.billing_address?.first_name || "",
      last_name: order.billing_address?.last_name || "",
      company: order.billing_address?.company || "",
      street1: order.billing_address?.street1 || "",
      street2: order.billing_address?.street2 || "",
      city: order.billing_address?.city || "",
      region: order.billing_address?.region || "",
      postcode: order.billing_address?.postcode || "",
      country: order.billing_address?.country || "USA",
      phone: order.billing_address?.phone || "",
      email: order.billing_address?.email || "",
    });
  }, [order.billing_address]);

  const handleCancelShippingAddress = useCallback(() => {
    setIsEditingShippingAddress(false);
    setShippingAddressData({
      first_name: order.shipping_address?.first_name || "",
      last_name: order.shipping_address?.last_name || "",
      company: order.shipping_address?.company || "",
      street1: order.shipping_address?.street1 || "",
      street2: order.shipping_address?.street2 || "",
      city: order.shipping_address?.city || "",
      region: order.shipping_address?.region || "",
      postcode: order.shipping_address?.postcode || "",
      country: order.shipping_address?.country || "USA",
      phone: order.shipping_address?.phone || "",
      email: order.shipping_address?.email || "",
    });
  }, [order.shipping_address]);

  const handleEditBillingAddress = useCallback(() => {
    setIsEditingBillingAddress(true);
  }, []);

  const handleEditShippingAddress = useCallback(() => {
    setIsEditingShippingAddress(true);
  }, []);

  // Memoized change handlers for billing address
  const handleBillingAddressChange = useCallback(
    (field: string, value: string) => {
      if (field === "edit") {
        setIsEditingBillingAddress(true);
      } else {
        setBillingAddressData((prev) => ({ ...prev, [field]: value }));
      }
    },
    []
  );

  // Memoized change handlers for shipping address
  const handleShippingAddressChange = useCallback(
    (field: string, value: string) => {
      if (field === "edit") {
        setIsEditingShippingAddress(true);
      } else {
        setShippingAddressData((prev) => ({ ...prev, [field]: value }));
      }
    },
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Billing Address */}
      <AddressForm
        isEditing={isEditingBillingAddress}
        addressData={billingAddressData}
        setAddressData={setBillingAddressData}
        onSave={handleSaveBillingAddress}
        onCancel={handleCancelBillingAddress}
        title="Billing Address"
        order={order}
        onBillingAddressChange={handleBillingAddressChange}
        onShippingAddressChange={handleShippingAddressChange}
      />

      {/* Shipping Address */}
      <AddressForm
        isEditing={isEditingShippingAddress}
        addressData={shippingAddressData}
        setAddressData={setShippingAddressData}
        onSave={handleSaveShippingAddress}
        onCancel={handleCancelShippingAddress}
        title="Shipping Address"
        order={order}
        onBillingAddressChange={handleBillingAddressChange}
        onShippingAddressChange={handleShippingAddressChange}
      />
    </div>
  );
}
