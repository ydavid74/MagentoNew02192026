import { Suspense, lazy } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Lazy load the heavy OrderInformationSection
const OrderInformationSection = lazy(() => 
  import("./OrderInformationSection").then(module => ({ 
    default: module.OrderInformationSection 
  }))
);

interface LazyOrderInformationSectionProps {
  order: any;
  onUpdateOrder: (data: any) => Promise<void>;
  onRefreshOrder?: () => void;
  navigate: any;
  refreshTrigger?: number;
}

export function LazyOrderInformationSection(props: LazyOrderInformationSectionProps) {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading order details...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    }>
      <OrderInformationSection {...props} />
    </Suspense>
  );
}
