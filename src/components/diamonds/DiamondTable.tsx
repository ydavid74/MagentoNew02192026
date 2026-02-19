import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  ChevronDown,
  ChevronRight,
  Loader2,
  Edit,
  History,
  Plus,
  Minus,
  FolderPlus,
  Trash2,
} from "lucide-react";
import { Diamond } from "lucide-react";
import { DiamondInventory, DiamondWithSubParcels } from "@/services/diamonds";
import { ParcelUsageHighlight } from "@/services/parcelUsageAnalytics";
import { EditDiamondDialog } from "./EditDiamondDialog";
import { HistoryDialog } from "./HistoryDialog";
import { AddReduceDialog } from "./AddReduceDialog";
import { AddSubcategoryDialog } from "./AddSubcategoryDialog";
import { DeleteDiamondDialog } from "./DeleteDiamondDialog";
import {
  getStatusColor,
  getHoverColor,
  formatCurrency,
  formatNumber,
} from "./utils";

// Function to determine carat range based on total carat weight
const getCaratRange = (totalCarat: number): string => {
  if (totalCarat < 0.5) return "0-0.5";
  if (totalCarat < 1.0) return "0.5-1.0";
  if (totalCarat < 1.5) return "1.0-1.5";
  if (totalCarat < 2.0) return "1.5-2.0";
  if (totalCarat < 3.0) return "2.0-3.0";
  return "3.0+";
};

interface DiamondTableProps {
  diamonds: DiamondInventory[];
  hierarchicalDiamonds: DiamondWithSubParcels[];
  loading: boolean;
  stats: { totalDiamonds: number; totalValue: number; totalWeight: number };
  expandedParcels: Set<string>;
  onToggleExpansion: (parcelId: string) => void;
  expandedDetails: Set<string>;
  onToggleDetails: (parcelId: string) => void;
  onSaveDiamond: (updatedDiamond: Partial<DiamondInventory>) => Promise<void>;
  onAddReduceDiamond: (
    diamondId: string,
    mode: "add" | "reduce",
    data: { stones: number; ctWeight: number; comment: string }
  ) => Promise<void>;
  onAddSubcategory: (
    parentDiamond: DiamondInventory,
    subcategoryData: Partial<DiamondInventory>
  ) => Promise<void>;
  onDeleteDiamond: (diamondId: string) => Promise<void>;
  parcelHighlights?: ParcelUsageHighlight[];
}

export function DiamondTable({
  diamonds,
  hierarchicalDiamonds,
  loading,
  stats,
  expandedParcels,
  onToggleExpansion,
  expandedDetails,
  onToggleDetails,
  onSaveDiamond,
  onAddReduceDiamond,
  onAddSubcategory,
  onDeleteDiamond,
  parcelHighlights = [],
}: DiamondTableProps) {
  // Dialog states
  const [editDiamond, setEditDiamond] = useState<DiamondInventory | null>(null);
  const [historyDiamond, setHistoryDiamond] = useState<DiamondInventory | null>(
    null
  );
  const [addReduceDiamond, setAddReduceDiamond] = useState<{
    diamond: DiamondInventory;
    mode: "add" | "reduce";
  } | null>(null);
  const [addSubcategoryDiamond, setAddSubcategoryDiamond] =
    useState<DiamondInventory | null>(null);
  const [deleteDiamond, setDeleteDiamond] = useState<DiamondInventory | null>(
    null
  );

  // Helper function to get highlight color for a parcel
  const getHighlightColor = (parcelId: string): string => {
    const highlight = parcelHighlights.find((h) => h.parcel_id === parcelId);
    return highlight?.color || "#ffffff";
  };

  const handleAddReduce = (
    diamond: DiamondInventory,
    mode: "add" | "reduce"
  ) => {
    setAddReduceDiamond({ diamond, mode });
  };

  const handleAddSubcategory = (diamond: DiamondInventory) => {
    setAddSubcategoryDiamond(diamond);
  };

  const handleDelete = (diamond: DiamondInventory) => {
    setDeleteDiamond(diamond);
  };

  const handleAddReduceSubmit = async (data: {
    stones: number;
    ctWeight: number;
    comment: string;
  }) => {
    if (addReduceDiamond) {
      await onAddReduceDiamond(
        addReduceDiamond.diamond.parcel_id,
        addReduceDiamond.mode,
        data
      );
      setAddReduceDiamond(null);
    }
  };

  const handleAddSubcategorySubmit = async (
    subcategoryData: Partial<DiamondInventory>
  ) => {
    if (addSubcategoryDiamond) {
      await onAddSubcategory(addSubcategoryDiamond, subcategoryData);
      setAddSubcategoryDiamond(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteDiamond) {
      await onDeleteDiamond(deleteDiamond.parcel_id);
      setDeleteDiamond(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span>Loading diamonds...</span>
        </CardContent>
      </Card>
    );
  }

  if (hierarchicalDiamonds.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Diamond className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            No diamonds found
          </p>
          <p className="text-sm text-muted-foreground">
            {diamonds.length === 0
              ? "No diamonds match your search criteria. Try adjusting your search parameters."
              : "No hierarchical data available. Please check your data structure."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Parcel ID</th>
                  <th className="text-left p-3 font-medium">Parcel Name</th>
                  <th className="text-left p-3 font-medium">Shape</th>
                  <th className="text-left p-3 font-medium">Carat Range</th>
                  <th className="text-left p-3 font-medium">Stones</th>
                  <th className="text-left p-3 font-medium">Minimum Level</th>
                  <th className="text-left p-3 font-medium">Total Carat</th>
                  <th className="text-left p-3 font-medium">Color</th>
                  <th className="text-left p-3 font-medium">Clarity</th>
                  <th className="text-left p-3 font-medium">Price/CT</th>
                  <th className="text-left p-3 font-medium">Total Price</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hierarchicalDiamonds.map((diamond, diamondIndex) => {
                  const isExpanded = expandedParcels.has(diamond.parcel_id);
                  const isDetailsExpanded = expandedDetails.has(
                    diamond.parcel_id
                  );
                  const hasSubParcels =
                    diamond.sub_parcels && diamond.sub_parcels.length > 0;
                  const statusColor = getStatusColor(diamond.days_active || 0);
                  const hoverColor = getHoverColor(diamond.days_active || 0);

                  return (
                    <React.Fragment key={diamond.parcel_id}>
                      {/* Parent Parcel Row */}
                      <tr
                        className={`border-b cursor-pointer ${statusColor} ${hoverColor}`}
                        style={{
                          backgroundColor: getHighlightColor(diamond.parcel_id),
                        }}
                        onClick={() => onToggleExpansion(diamond.parcel_id)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {hasSubParcels && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleExpansion(diamond.parcel_id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <span className="font-mono text-sm">
                              {diamond.parcel_id}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-medium">
                          {diamond.parcel_name}
                        </td>
                        <td className="p-3">{diamond.shape}</td>
                        <td className="p-3">{diamond.carat_category}</td>
                        <td className="p-3">{diamond.number_of_stones}</td>
                        <td className="p-3">{diamond.minimum_level || "-"}</td>
                        <td className="p-3">
                          {formatNumber(diamond.total_carat)}
                        </td>
                        <td className="p-3">{diamond.color}</td>
                        <td className="p-3">{diamond.clarity}</td>
                        <td className="p-3">
                          {formatCurrency(diamond.price_per_ct)}
                        </td>
                        <td className="p-3 font-medium">
                          {formatCurrency(
                            diamond.total_price ||
                              diamond.price_per_ct * diamond.total_carat
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleDetails(diamond.parcel_id);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isDetailsExpanded && (
                        <tr className="bg-muted/30">
                          <td colSpan={12} className="p-4">
                            <div className="space-y-4">
                              {/* Basic Info */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Color:
                                  </span>
                                  <span className="ml-2">{diamond.color}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Clarity:
                                  </span>
                                  <span className="ml-2">
                                    {diamond.clarity}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Polish & Symmetry:
                                  </span>
                                  <span className="ml-2">
                                    {diamond.polish_symmetry}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    MM:
                                  </span>
                                  <span className="ml-2">{diamond.mm}</span>
                                </div>
                              </div>

                              {/* Comments */}
                              {diamond.comments && (
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Comments:
                                  </span>
                                  <p className="mt-1 text-sm">
                                    {diamond.comments}
                                  </p>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => setEditDiamond(diamond)}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => setHistoryDiamond(diamond)}
                                >
                                  <History className="h-4 w-4" />
                                  History
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() =>
                                    handleAddReduce(diamond, "add")
                                  }
                                >
                                  <Plus className="h-4 w-4" />
                                  Add
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() =>
                                    handleAddReduce(diamond, "reduce")
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                  Reduce
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => handleAddSubcategory(diamond)}
                                >
                                  <FolderPlus className="h-4 w-4" />
                                  Add Subcategory
                                </Button>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => handleDelete(diamond)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Parcel
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Sub-parcels */}
                      {isExpanded &&
                        hasSubParcels &&
                        diamond.sub_parcels?.map((subParcel, subIndex) => {
                          const subStatusColor = getStatusColor(
                            subParcel.days_active || 0
                          );
                          const subHoverColor = getHoverColor(
                            subParcel.days_active || 0
                          );
                          const isSubDetailsExpanded = expandedDetails.has(
                            subParcel.parcel_id
                          );

                          return (
                            <React.Fragment key={subParcel.parcel_id}>
                              {/* Sub-parcel Row */}
                              <tr
                                className={`border-b ${subStatusColor} ${subHoverColor}`}
                                style={{
                                  backgroundColor: getHighlightColor(
                                    subParcel.parcel_id
                                  ),
                                }}
                              >
                                <td className="p-3 pl-8">
                                  <span className="font-mono text-sm">
                                    {subParcel.parcel_id}
                                  </span>
                                </td>
                                <td className="p-3 font-medium">
                                  {subParcel.parcel_name}
                                </td>
                                <td className="p-3">{subParcel.shape}</td>
                                <td className="p-3">
                                  {getCaratRange(subParcel.total_carat)}
                                </td>
                                <td className="p-3">
                                  {subParcel.number_of_stones}
                                </td>
                                <td className="p-3">
                                  {subParcel.minimum_level || "-"}
                                </td>
                                <td className="p-3">
                                  {formatNumber(subParcel.total_carat)}
                                </td>
                                <td className="p-3">{subParcel.color}</td>
                                <td className="p-3">{subParcel.clarity}</td>
                                <td className="p-3">
                                  {formatCurrency(subParcel.price_per_ct)}
                                </td>
                                <td className="p-3 font-medium">
                                  {formatCurrency(
                                    subParcel.total_price ||
                                      subParcel.price_per_ct *
                                        subParcel.total_carat
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleDetails(subParcel.parcel_id);
                                      }}
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>

                              {/* Sub-parcel Expandable Details Row */}
                              {isSubDetailsExpanded && (
                                <tr className="bg-muted/20">
                                  <td colSpan={12} className="p-4 pl-8">
                                    <div className="space-y-4">
                                      {/* Basic Info */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            Color:
                                          </span>
                                          <span className="ml-2">
                                            {subParcel.color}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            Clarity:
                                          </span>
                                          <span className="ml-2">
                                            {subParcel.clarity}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            Polish & Symmetry:
                                          </span>
                                          <span className="ml-2">
                                            {subParcel.polish_symmetry}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            MM:
                                          </span>
                                          <span className="ml-2">
                                            {subParcel.mm}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Comments */}
                                      {subParcel.comments && (
                                        <div>
                                          <span className="font-medium text-muted-foreground">
                                            Comments:
                                          </span>
                                          <p className="mt-1 text-sm">
                                            {subParcel.comments}
                                          </p>
                                        </div>
                                      )}

                                      {/* Action Buttons */}
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            setEditDiamond(subParcel)
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                          Edit
                                        </Button>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            setHistoryDiamond(subParcel)
                                          }
                                        >
                                          <History className="h-4 w-4" />
                                          History
                                        </Button>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            handleAddReduce(subParcel, "add")
                                          }
                                        >
                                          <Plus className="h-4 w-4" />
                                          Add
                                        </Button>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            handleAddReduce(subParcel, "reduce")
                                          }
                                        >
                                          <Minus className="h-4 w-4" />
                                          Reduce
                                        </Button>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            handleAddSubcategory(subParcel)
                                          }
                                        >
                                          <FolderPlus className="h-4 w-4" />
                                          Add Subcategory
                                        </Button>

                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            handleDelete(subParcel)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Delete Parcel
                                        </Button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditDiamondDialog
        isOpen={!!editDiamond}
        onOpenChange={(open) => !open && setEditDiamond(null)}
        diamond={editDiamond}
        onSave={onSaveDiamond}
      />

      <HistoryDialog
        isOpen={!!historyDiamond}
        onOpenChange={(open) => !open && setHistoryDiamond(null)}
        diamond={historyDiamond}
      />

      <AddReduceDialog
        isOpen={!!addReduceDiamond}
        onOpenChange={(open) => !open && setAddReduceDiamond(null)}
        diamond={addReduceDiamond?.diamond || null}
        mode={addReduceDiamond?.mode || "add"}
        onSubmit={handleAddReduceSubmit}
      />

      <AddSubcategoryDialog
        isOpen={!!addSubcategoryDiamond}
        onOpenChange={(open) => !open && setAddSubcategoryDiamond(null)}
        parentDiamond={addSubcategoryDiamond}
        onSubmit={handleAddSubcategorySubmit}
      />

      <DeleteDiamondDialog
        isOpen={!!deleteDiamond}
        onOpenChange={(open) => !open && setDeleteDiamond(null)}
        diamond={deleteDiamond}
        hasSubParcels={
          deleteDiamond
            ? deleteDiamond.is_parent &&
              ((deleteDiamond as any).sub_parcels?.length || 0) > 0
            : false
        }
        onConfirmDelete={handleDeleteConfirm}
      />
    </>
  );
}
