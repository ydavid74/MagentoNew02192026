import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiamondDeduction } from "@/services/diamondDeductions";

interface EditDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deduction: DiamondDeduction | null;
  onSave: (id: string, ctWeight: number, stones: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditDeductionDialog({
  open,
  onOpenChange,
  deduction,
  onSave,
  onCancel,
  isLoading = false
}: EditDeductionDialogProps) {
  if (!deduction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const ctWeight = parseFloat(formData.get('ctWeight') as string) || 0;
    const stones = formData.get('stones') as string || '';
    
    onSave(deduction.id!, ctWeight, stones);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Deduction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>CT Weight</Label>
            <Input
              name="ctWeight"
              type="number"
              step="0.01"
              placeholder="e.g., 1.25"
              defaultValue={deduction.ct_weight || ''}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Number of Stones</Label>
            <Input
              name="stones"
              placeholder="e.g., 1"
              defaultValue={deduction.stones || ''}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
