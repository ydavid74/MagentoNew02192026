import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Scale, MessageSquare, Edit, Trash2, Plus, User } from "lucide-react";
import { DiamondDeductionWithProfile } from "@/services/diamondDeductions";

interface DiamondDeductionsTableProps {
  deductions: DiamondDeductionWithProfile[];
  onEdit: (deduction: DiamondDeductionWithProfile) => void;
  onDelete: (deduction: DiamondDeductionWithProfile) => void;
  onBatchDelete: (deductionIds: string[]) => void;
  onAddToStock: (deduction: DiamondDeductionWithProfile) => void;
  onToggleIncludeInCost: (deduction: DiamondDeductionWithProfile) => void;
  isTogglingIncludeInCost?: boolean;
  isDeleting?: boolean;
  isBatchDeleting?: boolean;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function DiamondDeductionsTable({ 
  deductions, 
  onEdit, 
  onDelete, 
  onBatchDelete, 
  onAddToStock, 
  onToggleIncludeInCost, 
  isTogglingIncludeInCost = false, 
  isDeleting = false, 
  isBatchDeleting = false,
  selectedItems,
  onSelectionChange
}: DiamondDeductionsTableProps) {
  // Helper functions for selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(deductions.map(d => d.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (deductionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, deductionId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== deductionId));
    }
  };

  const isAllSelected = deductions.length > 0 && selectedItems.length === deductions.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < deductions.length;

  if (deductions.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
           <thead>
             <tr className="border-b">
               <th className="text-left p-2 font-medium w-12"></th>
               <th className="text-left p-2 font-medium text-sm">Date Added</th>
               <th className="text-left p-2 font-medium text-sm">Type</th>
               <th className="text-left p-2 font-medium text-sm">Product (SKU)</th>
               <th className="text-left p-2 font-medium text-sm">Parcel ID</th>
               <th className="text-left p-2 font-medium text-sm">CT Weight</th>
               <th className="text-left p-2 font-medium text-sm">Stones</th>
               <th className="text-left p-2 font-medium text-sm">Price per CT</th>
               <th className="text-left p-2 font-medium text-sm">Total Price</th>
               <th className="text-left p-2 font-medium text-sm">MM</th>
               <th className="text-left p-2 font-medium text-sm">Comments</th>
               <th className="text-left p-2 font-medium text-sm">Added By</th>
               <th className="text-left p-2 font-medium text-sm">Include in Cost</th>
               <th className="text-left p-2 font-medium text-sm">Actions</th>
             </tr>
           </thead>
          <tbody>
            <tr>
              <td colSpan={14} className="text-center py-8 text-muted-foreground">
                No deductions added yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onBatchDelete(selectedItems)}
            disabled={isBatchDeleting}
          >
            {isBatchDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
         <thead>
           <tr className="border-b">
             <th className="text-left p-2 font-medium w-12">
               <Checkbox
                 checked={isAllSelected}
                 onCheckedChange={handleSelectAll}
                 ref={(el) => {
                   if (el && el instanceof HTMLInputElement) {
                     el.indeterminate = isIndeterminate;
                   }
                 }}
               />
             </th>
             <th className="text-left p-2 font-medium text-sm">Date Added</th>
             <th className="text-left p-2 font-medium text-sm">Type</th>
             <th className="text-left p-2 font-medium text-sm">Product (SKU)</th>
             <th className="text-left p-2 font-medium text-sm">Parcel ID</th>
             <th className="text-left p-2 font-medium text-sm">CT Weight</th>
             <th className="text-left p-2 font-medium text-sm">Stones</th>
             <th className="text-left p-2 font-medium text-sm">Price per CT</th>
             <th className="text-left p-2 font-medium text-sm">Total Price</th>
             <th className="text-left p-2 font-medium text-sm">MM</th>
             <th className="text-left p-2 font-medium text-sm">Comments</th>
             <th className="text-left p-2 font-medium text-sm">Added By</th>
             <th className="text-left p-2 font-medium text-sm">Include in Cost</th>
             <th className="text-left p-2 font-medium text-sm">Actions</th>
           </tr>
         </thead>
        <tbody>
          {deductions.map((deduction) => (
            <tr key={deduction.id} className="border-b hover:bg-muted/50">
              <td className="p-2">
                <Checkbox
                  checked={selectedItems.includes(deduction.id)}
                  onCheckedChange={(checked) => handleSelectItem(deduction.id, checked as boolean)}
                />
              </td>
               <td className="p-2">
                 <span className="text-sm">{deduction.created_at ? new Date(deduction.created_at).toLocaleDateString() : 'N/A'}</span>
               </td>
               <td className="p-2">
                 <Badge variant="outline" className="text-xs">
                   {deduction.deduction_type === 's' ? 'Side' : deduction.deduction_type === 'c' ? 'Center' : deduction.type === 'side' ? 'Side' : deduction.type === 'center' ? 'Center' : deduction.type === 'manual' ? 'Manual' : 'N/A'}
                 </Badge>
               </td>
               <td className="p-2 whitespace-nowrap">
                 <span className="text-sm">{deduction.product_sku || "N/A"}</span>
               </td>
               <td className="p-2 whitespace-nowrap">
                 <div className="flex items-center gap-1">
                   <Package className="h-3 w-3 text-muted-foreground" />
                   <span className="text-sm">{deduction.parcel_id || "N/A"}</span>
                 </div>
               </td>
              <td className="p-2">
                <div className="flex items-center gap-1">
                  <Scale className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{deduction.ct_weight || 0} ct</span>
                </div>
              </td>
              <td className="p-2">
                <span className="text-sm">{deduction.stones || "N/A"}</span>
              </td>
              <td className="p-2">
                <span className="text-sm">{deduction.price_per_ct ? `$${deduction.price_per_ct}` : "N/A"}</span>
              </td>
              <td className="p-2">
                <span className="text-sm">{deduction.total_price ? `$${deduction.total_price}` : "N/A"}</span>
              </td>
               <td className="p-2 whitespace-nowrap">
                 <span className="text-sm">{deduction.mm || "N/A"}</span>
               </td>
              <td className="p-2">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[120px]" title={deduction.comments}>
                    {deduction.comments || "No comments"}
                  </span>
                </div>
              </td>
              <td className="p-2 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">
                    {deduction.profile ? `${deduction.profile.first_name} ${deduction.profile.last_name}` : 'Unknown Employee'}
                  </span>
                </div>
              </td>
              <td className="p-2">
                 {deduction.added_to_stock ? (
                   <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                     Added to Stock
                   </Badge>
                 ) : (
                   <div className="flex gap-1">
                     <Button
                       variant={deduction.include_in_item_cost !== false ? "default" : "outline"}
                       size="sm"
                       onClick={() => onToggleIncludeInCost({...deduction, include_in_item_cost: true})}
                       className="h-5 px-1 text-xs"
                       disabled={isTogglingIncludeInCost}
                     >
                       Yes
                     </Button>
                     <Button
                       variant={deduction.include_in_item_cost === false ? "default" : "outline"}
                       size="sm"
                       onClick={() => onToggleIncludeInCost({...deduction, include_in_item_cost: false})}
                       className="h-5 px-1 text-xs"
                       disabled={isTogglingIncludeInCost}
                     >
                       No
                     </Button>
                   </div>
                 )}
                 {deduction.include_in_item_cost === false && !deduction.added_to_stock && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => onAddToStock(deduction)}
                     className="h-5 px-1 text-xs mt-1 text-green-600 border-green-600 hover:bg-green-700"
                   >
                     <Plus className="h-3 w-3 mr-1" />
                     Add to Stock
                   </Button>
                 )}
               </td>
               <td className="p-2">
                 <div className="flex items-center gap-1">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => onEdit(deduction)}
                     className="h-6 w-6 p-0"
                     title="Edit"
                   >
                     <Edit className="h-3 w-3" />
                   </Button>
                   
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => onDelete(deduction)}
                     className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                     title="Delete"
                     disabled={isDeleting}
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                 </div>
               </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
