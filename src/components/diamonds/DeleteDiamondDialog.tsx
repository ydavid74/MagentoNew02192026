import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { DiamondInventory } from "@/services/diamonds";
import { useToast } from "@/hooks/use-toast";

interface DeleteDiamondDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  diamond: DiamondInventory | null;
  hasSubParcels: boolean;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteDiamondDialog({
  isOpen,
  onOpenChange,
  diamond,
  hasSubParcels,
  onConfirmDelete
}: DeleteDiamondDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!diamond) return;

    setLoading(true);
    try {
      await onConfirmDelete();
      toast({
        title: "Success",
        description: "Diamond deleted successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting diamond:", error);
      toast({
        title: "Error",
        description: "Failed to delete diamond",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!diamond) return null;

  const isParent = diamond.is_parent;
  const title = isParent ? 'Delete Parcel and All Sub-parcels' : 'Delete Sub-parcel';
  const description = isParent 
    ? `Are you sure you want to delete "${diamond.parcel_name}" and all its sub-parcels? This action cannot be undone.`
    : `Are you sure you want to delete "${diamond.parcel_name}"? This action cannot be undone.`;

  const warningText = isParent && hasSubParcels
    ? `⚠️ This will permanently delete ${diamond.parcel_name} and all ${hasSubParcels ? 'its sub-parcels' : 'associated data'}.`
    : `⚠️ This will permanently delete ${diamond.parcel_name}.`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
                Warning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {description}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {warningText}
              </p>
            </CardContent>
          </Card>

          {/* Diamond Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Parcel ID:</span>
                  <span className="font-mono">{diamond.parcel_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Parcel Name:</span>
                  <span>{diamond.parcel_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Carat:</span>
                  <span>{diamond.total_carat} ct</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Stones:</span>
                  <span>{diamond.number_of_stones}</span>
                </div>
                {isParent && (
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="text-blue-600 dark:text-blue-400">Parent Parcel</span>
                  </div>
                )}
                {!isParent && (
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="text-green-600 dark:text-green-400">Sub-parcel</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {loading ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
