import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostWidget } from "@/components/ui/CostWidget";

interface CostSectionProps {
  order: any;
  onUpdateCosts: (costs: any) => void;
}

export function CostSection({ order, onUpdateCosts }: CostSectionProps) {
  const totalValue = order.total_amount || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <CostWidget 
          orderId={order.id}
          costs={order.order_costs}
          totalAmount={totalValue}
          orderLabor={order.labor || 0}
          onUpdate={onUpdateCosts}
        />
      </CardContent>
    </Card>
  );
}
