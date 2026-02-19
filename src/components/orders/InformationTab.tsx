import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomizationNotesSection } from "./sections/CustomizationNotesSection";
import { LazyOrderInformationSection } from "./sections/LazyOrderInformationSection";
import { AddressSection } from "./sections/AddressSection";
import { ItemsOrderedSection } from "./sections/ItemsOrderedSection";
import { CustomerNotesSection } from "./sections/CustomerNotesSection";
import { CostSection } from "./sections/CostSection";
import { LazySection } from "@/components/ui/LazySection";

interface InformationTabProps {
  order: any;
  onUpdateOrder: (data: any) => Promise<void>;
  onUpdateCosts: (costs: any) => void;
  onRefreshOrder?: () => void;
}

export function InformationTab({ order, onUpdateOrder, onUpdateCosts, onRefreshOrder }: InformationTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize data when order loads
  useEffect(() => {
    if (order) {
      console.log('InformationTab: Order data received:', {
        id: order.id,
        customization_notes: order.customization_notes,
        hasCustomizationNotes: !!order.customization_notes,
        orderKeys: Object.keys(order)
      });
    }
  }, [order]);

  // Debug effect to track order data changes
  useEffect(() => {
    console.log('InformationTab: Order data changed:', {
      orderId: order?.id,
      customizationNotes: order?.customization_notes,
      orderKeys: Object.keys(order || {}),
      timestamp: new Date().toISOString()
    });
  }, [order]);

  const handleStatusUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Customization Notes Section - Load immediately */}
      <CustomizationNotesSection 
        order={order}
        onUpdateOrder={onUpdateOrder}
        onRefreshOrder={onRefreshOrder}
      />

      {/* Order Information and Account Information Section - Lazy loaded */}
      <LazyOrderInformationSection 
        order={order}
        onUpdateOrder={onUpdateOrder}
        onRefreshOrder={onRefreshOrder}
        navigate={navigate}
        refreshTrigger={refreshTrigger}
      />

      {/* Billing and Shipping Addresses Section - Lazy loaded */}
      <LazySection>
        <AddressSection 
          order={order}
          onRefreshOrder={onRefreshOrder}
        />
      </LazySection>

      {/* Items Ordered Section - Lazy loaded */}
      <LazySection>
        <ItemsOrderedSection 
          order={order}
          onRefreshOrder={onRefreshOrder}
        />
      </LazySection>

      {/* Customer Notes Section - Lazy loaded */}
      <LazySection>
        <CustomerNotesSection 
          order={order}
          onRefreshOrder={onRefreshOrder}
          onStatusUpdate={handleStatusUpdate}
        />
      </LazySection>

      {/* Cost Section - Lazy loaded */}
      <LazySection>
        <CostSection 
          order={order}
          onUpdateCosts={onUpdateCosts}
        />
      </LazySection>
    </div>
  );
}
