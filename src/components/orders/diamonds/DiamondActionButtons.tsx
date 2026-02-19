import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface DiamondActionButtonsProps {
  onCenterDeduction: () => void;
  onSideDeduction: () => void;
  onManualAdd: () => void;
}

export function DiamondActionButtons({ 
  onCenterDeduction, 
  onSideDeduction, 
  onManualAdd 
}: DiamondActionButtonsProps) {
  return (
    <div className="flex gap-4">
      <Button 
        onClick={onCenterDeduction}
        className="flex-1"
        variant="outline"
      >
        <Minus className="h-4 w-4 mr-2" />
        Center Deduction
      </Button>
      <Button 
        onClick={onSideDeduction}
        className="flex-1"
        variant="outline"
      >
        <Minus className="h-4 w-4 mr-2" />
        Side Deduction
      </Button>
      <Button 
        onClick={onManualAdd}
        className="flex-1"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Manually
      </Button>
    </div>
  );
}
