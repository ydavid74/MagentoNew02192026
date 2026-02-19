import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DiamondDeduction } from "@/services/diamondDeductions";

interface DeleteDeductionDialogProps {
  deduction: DiamondDeduction | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDeductionDialog({ deduction, onConfirm, onCancel }: DeleteDeductionDialogProps) {
  if (!deduction) return null;

  return (
    <ConfirmDialog
      open={!!deduction}
      onOpenChange={() => onCancel()}
      title="Delete Deduction"
      description={`Are you sure you want to delete this ${deduction.type || 'deduction'}? This action cannot be undone.`}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
