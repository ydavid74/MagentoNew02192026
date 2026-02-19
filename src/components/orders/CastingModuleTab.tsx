import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { orderService } from "@/services/orders";

export function CastingModuleTab() {
  const { id: orderId } = useParams();
  const { toast } = useToast();

  // State management
  const [searchOrderId, setSearchOrderId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Casting Order</h1>
          <p className="text-muted-foreground">
            Create and manage casting order memos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View Casting Order List
          </Button>
        </div>
      </div>

      {/* Order Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Order Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="order-search">Order ID</Label>
              <Input
                id="order-search"
                placeholder="Enter order number"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearchOrder()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearchOrder} disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Submit"}
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Manually
              </Button>
              <Button variant="link" className="text-orange-600">
                Add new item manually
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      {orderData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Order Details - {orderData.shopify_order_number}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Customer</Label>
                <p className="text-sm font-medium">
                  {orderData.customers?.name}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant="outline">{orderData.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground text-sm">
            Casting module is under development. Basic functionality is working.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
