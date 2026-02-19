import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DiamondDeduction } from "@/services/diamondDeductions";

interface AddToStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deduction: DiamondDeduction | null;
  orderId: string;
  onConfirm: (deduction: DiamondDeduction) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddToStockDialog({
  open,
  onOpenChange,
  deduction,
  orderId,
  onConfirm,
  onCancel,
  isLoading = false
}: AddToStockDialogProps) {
  if (!deduction) return null;

  const handleProceed = () => {
    onConfirm(deduction);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Stock</DialogTitle>
          <DialogDescription>
            This will restore the diamond inventory and mark the deduction as added to stock.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order ID</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {orderId}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Parcel ID</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {deduction.parcel_id || "N/A"}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Number of Stones</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {deduction.stones || "N/A"}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Carat Weight</Label>
            <div className="p-2 bg-muted rounded-md text-sm">
              {deduction.ct_weight || 0} ct
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProceed}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                'Proceed'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
