import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Edit, Save, X, RefreshCw } from "lucide-react";
import { costCalculationService, OrderCosts as CalculatedOrderCosts } from "@/services/costCalculation";

interface OrderCosts {
  casting?: number;
  diamond?: number;
  labor?: number;
  updated_at?: string;
}

interface CostWidgetProps {
  orderId: string;
  costs?: OrderCosts | null;
  totalAmount?: number;
  orderLabor?: number; // Labor from orders table
  onUpdate?: (costs: OrderCosts) => void;
  className?: string;
}

export function CostWidget({ orderId, costs, totalAmount = 0, orderLabor = 0, onUpdate, className }: CostWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedCosts, setCalculatedCosts] = useState<CalculatedOrderCosts | null>(null);
  const [editCosts, setEditCosts] = useState<OrderCosts>({
    casting: 0,
    diamond: 0,
    labor: 0,
  });

  // Calculate costs from correct sources when component mounts or orderId changes
  useEffect(() => {
    const calculateCosts = async () => {
      setIsCalculating(true);
      try {
        const result = await costCalculationService.calculateOrderCosts(orderId);
        setCalculatedCosts(result.costs);
        
        // Update edit costs with calculated values
        setEditCosts({
          casting: result.costs.casting,
          diamond: result.costs.diamond,
          labor: result.costs.labor,
          updated_at: result.lastUpdated
        });
      } catch (error) {
        console.error('Error calculating costs:', error);
        // On error, fall back to stored costs
        setCalculatedCosts(null);
      } finally {
        setIsCalculating(false);
      }
    };

    if (orderId) {
      calculateCosts();
    }
  }, [orderId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalCosts = isEditing 
    ? (editCosts.casting || 0) + (editCosts.diamond || 0) + (editCosts.labor || 0)
    : calculatedCosts 
      ? calculatedCosts.casting + calculatedCosts.diamond + calculatedCosts.labor
      : 0;

  const handleRefresh = async () => {
    setIsCalculating(true);
    try {
      const result = await costCalculationService.updateOrderCosts(orderId);
      setCalculatedCosts(result.costs);
      
      // Update edit costs with calculated values
      setEditCosts({
        casting: result.costs.casting,
        diamond: result.costs.diamond,
        labor: result.costs.labor,
        updated_at: result.lastUpdated
      });
      
      // Notify parent component of updated costs
      onUpdate?.({
        casting: result.costs.casting,
        diamond: result.costs.diamond,
        labor: result.costs.labor,
        updated_at: result.lastUpdated
      });
    } catch (error) {
      console.error('Error refreshing costs:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = () => {
    onUpdate?.(editCosts);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditCosts({
      casting: calculatedCosts?.casting || 0,
      diamond: calculatedCosts?.diamond || 0,
      labor: calculatedCosts?.labor || 0,
    });
    setIsEditing(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Breakdown
            {calculatedCosts && (
              <span className="text-xs text-muted-foreground ml-2">
                (Auto-calculated)
              </span>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={isCalculating}
              title="Refresh costs from data sources"
            >
              <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
            </Button>
            {!isEditing ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Casting</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">$</span>
                <Input
                  type="number"
                  value={editCosts.casting || 0}
                  onChange={(e) => setEditCosts(prev => ({ ...prev, casting: parseFloat(e.target.value) || 0 }))}
                  className="w-20 h-8 text-sm"
                />
              </div>
            ) : (
              <span className="font-medium">
                {isCalculating ? (
                  <span className="text-muted-foreground">Calculating...</span>
                ) : calculatedCosts ? (
                  formatCurrency(calculatedCosts.casting)
                ) : (
                  formatCurrency(0)
                )}
              </span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Diamond</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">$</span>
                <Input
                  type="number"
                  value={editCosts.diamond || 0}
                  onChange={(e) => setEditCosts(prev => ({ ...prev, diamond: parseFloat(e.target.value) || 0 }))}
                  className="w-20 h-8 text-sm"
                />
              </div>
            ) : (
              <span className="font-medium">
                {isCalculating ? (
                  <span className="text-muted-foreground">Calculating...</span>
                ) : calculatedCosts ? (
                  formatCurrency(calculatedCosts.diamond)
                ) : (
                  formatCurrency(0)
                )}
              </span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Labor</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">$</span>
                <Input
                  type="number"
                  value={editCosts.labor || 0}
                  onChange={(e) => setEditCosts(prev => ({ ...prev, labor: parseFloat(e.target.value) || 0 }))}
                  className="w-20 h-8 text-sm"
                />
              </div>
            ) : (
              <span className="font-medium">
                {isCalculating ? (
                  <span className="text-muted-foreground">Calculating...</span>
                ) : calculatedCosts ? (
                  formatCurrency(calculatedCosts.labor)
                ) : (
                  formatCurrency(0)
                )}
              </span>
            )}
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Costs</span>
            <span className="font-semibold">
              {isCalculating ? (
                <span className="text-muted-foreground">Calculating...</span>
              ) : (
                formatCurrency(totalCosts)
              )}
            </span>
          </div>
        </div>

        {(calculatedCosts || costs?.updated_at) && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            {isCalculating ? (
              <span className="flex items-center justify-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Calculating costs...
              </span>
            ) : (
              <>
                {calculatedCosts ? (
                  <span>Auto-calculated from data sources</span>
                ) : (
                  <span>Last updated: {new Date(costs?.updated_at || '').toLocaleDateString()}</span>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}